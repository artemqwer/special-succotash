import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isBQConfigured, fetchBQAdsData } from "@/lib/bigquery";

export type WindsorGroupBy =
  | "date"
  | "campaign"
  | "date,campaign"
  | "ad_group"
  | "keyword"
  | "match_type"
  | "device"
  | "network"
  | "search_term";

const FIELDS_BY_GROUP: Record<WindsorGroupBy, string> = {
  date:           "date,clicks,impressions,spend,conversions,conversion_value",
  campaign:       "campaign,clicks,impressions,spend,conversions,conversion_value",
  "date,campaign":"date,campaign,clicks,impressions,spend,conversions,conversion_value",
  ad_group:       "ad_group_name,clicks,impressions,spend,conversions,conversion_value",
  keyword:        "keyword,clicks,impressions,spend,conversions,conversion_value",
  match_type:     "match_type,clicks,impressions,spend,conversions,conversion_value",
  device:         "device,clicks,impressions,spend,conversions,conversion_value",
  network:        "network,clicks,impressions,spend,conversions,conversion_value",
  search_term:    "search_term,clicks,impressions,spend,conversions,conversion_value",
};

function normalizeDimension(r: Record<string, unknown>, groupBy: WindsorGroupBy): string {
  switch (groupBy) {
    case "campaign":
    case "date,campaign":
      return String(r.campaign ?? r.campaign_name ?? r.campaign__name ?? "Unknown");
    case "ad_group":
      return String(r.ad_group_name ?? r.ad_group ?? "Unknown");
    case "keyword":
      return String(r.keyword ?? r.keyword_text ?? "Unknown");
    case "match_type":
      return String(r.match_type ?? "Unknown");
    case "device":
      return String(r.device ?? "Unknown");
    case "network":
      return String(r.network ?? "Unknown");
    case "search_term":
      return String(r.search_term ?? "Unknown");
    default:
      return String(r.date ?? "Unknown");
  }
}

export async function fetchFromWindsor(
  apiKey: string,
  dateFrom: string,
  dateTo: string,
  groupBy: WindsorGroupBy
) {
  const fields = FIELDS_BY_GROUP[groupBy];
  const params = new URLSearchParams({ api_key: apiKey, date_from: dateFrom, date_to: dateTo, fields });
  const res = await fetch(`https://connectors.windsor.ai/all?${params}`);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Windsor.ai ${res.status}: ${body.replace(/<[^>]*>/g, "").trim().slice(0, 200)}`);
  }

  const json = await res.json();
  const rows: Record<string, unknown>[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

  return rows.map((r) => ({
    date:             (r.date ?? r.day ?? null) as string | null,
    campaign:         (r.campaign ?? r.campaign_name ?? null) as string | null,
    dimension:        normalizeDimension(r, groupBy),
    clicks:           Number(r.clicks) || 0,
    impressions:      Number(r.impressions) || 0,
    spend:            Number(r.spend ?? r.cost ?? 0),
    conversions:      Number(r.conversions) || 0,
    conversion_value: Number(r.conversion_value ?? r.revenue ?? r.conversionValue ?? 0),
  }));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo   = searchParams.get("date_to");
  const groupBy  = (searchParams.get("group_by") ?? "date") as WindsorGroupBy;

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

  const viewAs = searchParams.get("view_as");
  let windsorKey: string | undefined = user.user_metadata?.windsor_api_key;

  if (viewAs && viewAs !== user.id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user: target } } = await admin.auth.admin.getUserById(viewAs);
    if (target) {
      const targetTeamId = target.user_metadata?.team_id as string | undefined;
      const myTeamId = user.user_metadata?.team_id as string | undefined;
      const authorized =
        targetTeamId === user.id ||
        myTeamId === viewAs ||
        (myTeamId && myTeamId === targetTeamId);
      if (authorized) windsorKey = target.user_metadata?.windsor_api_key as string | undefined;
    }
  }

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

  const bqGroupBy = (groupBy === "date" || groupBy === "campaign" || groupBy === "date,campaign")
    ? groupBy
    : ("date" as const);

  try {
    const data = await fetchBQAdsData(dateFrom, dateTo, bqGroupBy, user.id);
    return NextResponse.json({ data, source: "bigquery" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "BigQuery error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
