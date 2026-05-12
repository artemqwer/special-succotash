import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isBQConfigured, fetchBQAdsData } from "@/lib/bigquery";

async function fetchFromWindsor(
  apiKey: string,
  dateFrom: string,
  dateTo: string,
  groupBy: "date" | "campaign" | "date,campaign"
) {
  const fieldsByGroup = {
    "date": "date,clicks,impressions,spend,conversions,conversion_value",
    "campaign": "campaign,clicks,impressions,spend,conversions,conversion_value",
    "date,campaign": "date,campaign,clicks,impressions,spend,conversions,conversion_value",
  };

  const params = new URLSearchParams({
    api_key: apiKey,
    date_from: dateFrom,
    date_to: dateTo,
    fields: fieldsByGroup[groupBy],
  });

  const res = await fetch(`https://connectors.windsor.ai/all?${params}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Windsor.ai ${res.status}: ${body.replace(/<[^>]*>/g, "").trim().slice(0, 200)}`);
  }

  const json = await res.json();
  const rows: Record<string, unknown>[] = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json)
    ? json
    : [];

  return rows.map((r) => ({
    date: (r.date ?? r.day ?? null) as string | null,
    campaign: (r.campaign ?? r.campaign__name ?? r.campaign_name ?? null) as string | null,
    clicks: Number(r.clicks) || 0,
    impressions: Number(r.impressions) || 0,
    spend: Number(r.spend ?? r.cost ?? 0),
    conversions: Number(r.conversions) || 0,
    conversion_value: Number(r.conversion_value ?? r.revenue ?? r.conversionValue ?? 0),
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const groupBy = (searchParams.get("group_by") ?? "date") as "date" | "campaign" | "date,campaign";

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "Missing date_from or date_to" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const windsorKey: string | undefined = user.user_metadata?.windsor_api_key;

  if (windsorKey) {
    try {
      const data = await fetchFromWindsor(windsorKey, dateFrom, dateTo, groupBy);
      return NextResponse.json({ data, source: "windsor" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Windsor.ai error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  if (!isBQConfigured()) {
    return NextResponse.json({ error: "No data source configured" }, { status: 503 });
  }

  try {
    const data = await fetchBQAdsData(dateFrom, dateTo, groupBy, user.id);
    return NextResponse.json({ data, source: "bigquery" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "BigQuery error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
