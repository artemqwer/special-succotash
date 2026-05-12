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

  const params = new URLSearchParams({
    api_key: windsorKey,
    date_from: dateFrom,
    date_to: dateTo,
    fields: "date,campaign,clicks,impressions,spend,conversions,conversion_value",
  });

  const url = `https://connectors.windsor.ai/all?${params}`;
  const res = await fetch(url);
  const text = await res.text();

  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* not json */ }

  return NextResponse.json({
    status: res.status,
    hasKey: true,
    keyLength: windsorKey.length,
    rawPreview: text.slice(0, 500),
    parsed: parsed ? (Array.isArray(parsed) ? parsed.slice(0, 2) : { keys: Object.keys(parsed), dataPreview: parsed?.data?.slice?.(0, 2) }) : null,
  });
}
