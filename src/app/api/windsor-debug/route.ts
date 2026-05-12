import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const windsorKey: string | undefined = user.user_metadata?.windsor_api_key;
  if (!windsorKey) return NextResponse.json({ error: "No Windsor key in user_metadata" });

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from") ?? "2026-05-01";
  const dateTo = searchParams.get("date_to") ?? "2026-05-12";

  // Try 1: with our fields
  const params1 = new URLSearchParams({ api_key: windsorKey, date_from: dateFrom, date_to: dateTo, fields: "date,campaign,clicks,impressions,spend,conversions,conversion_value" });
  const res1 = await fetch(`https://connectors.windsor.ai/all?${params1}`);
  const json1 = await res1.json().catch(() => null);

  // Try 2: without fields (get all)
  const params2 = new URLSearchParams({ api_key: windsorKey, date_from: dateFrom, date_to: dateTo });
  const res2 = await fetch(`https://connectors.windsor.ai/all?${params2}`);
  const json2 = await res2.json().catch(() => null);

  // Try 3: wider date range without fields
  const params3 = new URLSearchParams({ api_key: windsorKey, date_from: "2026-01-01", date_to: dateTo });
  const res3 = await fetch(`https://connectors.windsor.ai/all?${params3}`);
  const json3 = await res3.json().catch(() => null);

  const preview = (j: unknown) => {
    if (!j) return null;
    const arr = Array.isArray((j as Record<string,unknown>)?.data) ? (j as Record<string,unknown[]>).data : Array.isArray(j) ? j as unknown[] : null;
    if (!arr) return { raw: j };
    if (arr.length === 0) return { count: 0, sample: null };
    return { count: arr.length, fields: Object.keys(arr[0] as object), sample: arr[0] };
  };

  return NextResponse.json({
    withFields: { status: res1.status, result: preview(json1) },
    withoutFields: { status: res2.status, result: preview(json2) },
    widerRange: { status: res3.status, result: preview(json3) },
  });
}
