import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchGoogleAdsApiData, isGoogleAdsApiConfigured } from "@/lib/google-ads-api";
import { writeBQAdsRows, isBQConfigured } from "@/lib/bigquery";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const refreshToken: string | undefined = user.user_metadata?.google_ads_refresh_token;
  let customerId: string | undefined = user.user_metadata?.google_ads_customer_id;

  if (!refreshToken) {
    return NextResponse.json({ error: "Google Ads not connected" }, { status: 400 });
  }

  if (!customerId) {
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      });
      const { access_token } = await tokenRes.json();
      customerId = await getGoogleAdsCustomerId(access_token);
      await supabase.auth.updateUser({ data: { google_ads_customer_id: customerId } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get Google Ads customer ID";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (!isGoogleAdsApiConfigured()) {
    return NextResponse.json({ error: "Google Ads API not configured (missing Developer Token)" }, { status: 503 });
  }

  if (!isBQConfigured()) {
    return NextResponse.json({ error: "BigQuery not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as Record<string, string>;
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dateFrom = body.date_from ?? thirtyDaysAgo;
  const dateTo = body.date_to ?? today;
  const groupBy = (body.group_by ?? "date,campaign") as "date" | "campaign" | "date,campaign";

  try {
    const rows = await fetchGoogleAdsApiData(dateFrom, dateTo, groupBy, refreshToken, customerId);
    await writeBQAdsRows(user.id, rows);
    return NextResponse.json({ synced: rows.length, date_from: dateFrom, date_to: dateTo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
