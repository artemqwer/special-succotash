import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const groupBy = searchParams.get("group_by") ?? "date";

  if (!dateFrom || !dateTo) {
    return NextResponse.json({ error: "Missing date_from or date_to" }, { status: 400 });
  }

  // Get user session server-side to retrieve their Windsor API key
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windsorApiKey: string | undefined = user.user_metadata?.windsor_api_key;
  if (!windsorApiKey) {
    return NextResponse.json({ error: "Windsor API key not configured. Add it in Profile → Connected Accounts." }, { status: 400 });
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
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to reach Windsor.ai" }, { status: 502 });
  }
}
