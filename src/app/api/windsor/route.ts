import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isBQConfigured, fetchBQAdsData } from "@/lib/bigquery";

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

  if (!isBQConfigured()) {
    return NextResponse.json({ error: "BigQuery not configured" }, { status: 503 });
  }

  try {
    const data = await fetchBQAdsData(dateFrom, dateTo, groupBy, user.id);
    return NextResponse.json({ data, source: "bigquery" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "BigQuery error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
