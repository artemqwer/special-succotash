import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { fetchFromWindsor, WindsorGroupBy } from "@/app/api/windsor/route";

export interface PerfRow {
  dimension: string;
  impr: number;
  clicks: number;
  ctr: number;
  cpc: number;
  convRate: number;
  conv: number;
  cpa: number;
  revenue: number;
  cost: number;
  profit: number;
  roasVal: number;
  roas: string;
  roasColor: "green" | "orange" | "red" | "gray";
}

const VALID_DIMENSIONS: WindsorGroupBy[] = [
  "ad_group", "keyword", "match_type", "device", "network", "search_term",
];

function computeRow(dimension: string, spend: number, convVal: number, clicks: number, impr: number, convs: number): PerfRow {
  const roasVal   = spend > 0 ? convVal / spend : 0;
  const revenue   = convVal / 1000;
  const cost      = spend / 1000;
  const profit    = (convVal - spend) / 1000;
  return {
    dimension,
    impr,
    clicks,
    ctr:      impr   > 0 ? (clicks / impr) * 100 : 0,
    cpc:      clicks > 0 ? spend / clicks : 0,
    convRate: clicks > 0 ? (convs / clicks) * 100 : 0,
    conv: convs,
    cpa:  convs > 0 ? spend / convs : 0,
    revenue,
    cost,
    profit,
    roasVal,
    roas:      spend > 0 ? `${roasVal.toFixed(2)}x` : "—",
    roasColor: spend === 0 ? "gray" : roasVal >= 1.5 ? "green" : roasVal >= 1.0 ? "orange" : "red",
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dimension: string }> }
) {
  const { dimension } = await params;
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo   = searchParams.get("date_to");

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "Missing date_from or date_to" }, { status: 400 });
  }

  if (!VALID_DIMENSIONS.includes(dimension as WindsorGroupBy)) {
    return NextResponse.json({ data: [], source: "unsupported" });
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
  if (!windsorKey) {
    return NextResponse.json({ error: "No data source configured" }, { status: 503 });
  }

  try {
    const raw = await fetchFromWindsor(windsorKey, dateFrom, dateTo, dimension as WindsorGroupBy);

    // Aggregate by dimension value
    const map = new Map<string, { spend: number; convVal: number; clicks: number; impr: number; convs: number }>();
    for (const r of raw) {
      const key = r.dimension || "Unknown";
      const cur = map.get(key) ?? { spend: 0, convVal: 0, clicks: 0, impr: 0, convs: 0 };
      map.set(key, {
        spend:   cur.spend   + r.spend,
        convVal: cur.convVal + r.conversion_value,
        clicks:  cur.clicks  + r.clicks,
        impr:    cur.impr    + r.impressions,
        convs:   cur.convs   + r.conversions,
      });
    }

    const data: PerfRow[] = Array.from(map.entries())
      .map(([dim, v]) => computeRow(dim, v.spend, v.convVal, v.clicks, v.impr, v.convs))
      .sort((a, b) => b.cost - a.cost);

    return NextResponse.json({ data, source: "windsor" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
