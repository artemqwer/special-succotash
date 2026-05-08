import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://data-rocks.vercel.app";
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/data-sources?error=oauth_cancelled`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${appUrl}/api/auth/google-ads/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/data-sources?error=token_exchange`);
  }

  const tokens = await tokenRes.json();
  const refresh_token: string | undefined = tokens.refresh_token;

  if (!refresh_token) {
    return NextResponse.redirect(`${appUrl}/data-sources?error=no_refresh_token`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { error: updateError } = await supabase.auth.updateUser({
    data: { google_ads_refresh_token: refresh_token },
  });

  if (updateError) {
    return NextResponse.redirect(`${appUrl}/data-sources?error=save_failed`);
  }

  return NextResponse.redirect(`${appUrl}/data-sources?connected=true`);
}
