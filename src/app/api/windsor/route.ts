import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isBQConfigured, fetchBQAdsData } from "@/lib/bigquery";
import { isGoogleAdsApiConfigured, fetchGoogleAdsApiData } from "@/lib/google-ads-api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const groupBy = (searchParams.get("group_by") ?? "date") as "date" | "campaign" | "date,campaign";

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "Missing date_from or date_to" }, { status: 400 });
  }

  // Auth check
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Priority 1: BigQuery (server-level service account) ────────────────────
  if (isBQConfigured()) {
    try {
      const data = await fetchBQAdsData(dateFrom, dateTo, groupBy);
      return NextResponse.json({ data, source: "bigquery" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "BigQuery error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── Priority 2: Google Ads API (per-user OAuth token) ─────────────────────
  const googleAdsToken: string | undefined = user.user_metadata?.google_ads_refresh_token;
  if (isGoogleAdsApiConfigured() && googleAdsToken) {
    try {
      const data = await fetchGoogleAdsApiData(dateFrom, dateTo, groupBy, googleAdsToken);
      return NextResponse.json({ data, source: "google-ads-api" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google Ads API error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── Priority 3: Windsor.ai (per-user API key) ──────────────────────────────
  const windsorApiKey: string | undefined = user.user_metadata?.windsor_api_key;
  if (!windsorApiKey) {
    return NextResponse.json(
      { error: "No data source configured. Add Windsor API key in Profile or configure BigQuery." },
      { status: 400 }
    );
  }

  const fields = ["clicks", "impressions", "spend", "conversions", "conversion_value"];
  if (groupBy.includes("date")) fields.push("date");
  if (groupBy.includes("campaign")) fields.push("campaign");

  const params = new URLSearchParams({
    api_key: windsorApiKey,
    date_from: dateFrom,
    date_to: dateTo,
    fields: fields.join(","),
    _renderer: "json",
  });

  try {
    const res = await fetch(`https://connectors.windsor.ai/google_ads?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Windsor API error: ${res.status} ${text}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ ...data, source: "windsor" });
  } catch {
    return NextResponse.json({ error: "Failed to reach Windsor.ai" }, { status: 502 });
  }
}
