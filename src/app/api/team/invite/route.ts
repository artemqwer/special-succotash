import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 503 });
  }

  const { email } = await req.json() as { email: string };
  if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const teamOwnerId = (user.user_metadata?.team_id as string | undefined) ?? user.id;
  const client = adminClient();

  // Get fresh owner metadata for the name
  const { data: { user: owner } } = await client.auth.admin.getUserById(teamOwnerId);
  const ownerMeta = owner?.user_metadata ?? {};
  const ownerName = (ownerMeta.full_name as string | undefined) ?? (ownerMeta.name as string | undefined) ?? owner?.email ?? "Someone";

  // Check if user already exists
  const { data: { users: all } } = await client.auth.admin.listUsers({ perPage: 1000 });
  const existing = all.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());

  if (existing) {
    // In-app invite — add to pending_team_invites
    const pending: { from_id: string; from_name: string; from_email: string; created_at: string }[] =
      (existing.user_metadata?.pending_team_invites as typeof pending | undefined) ?? [];

    if (!pending.find(p => p.from_id === teamOwnerId)) {
      pending.push({
        from_id: teamOwnerId,
        from_name: ownerName,
        from_email: owner?.email ?? "",
        created_at: new Date().toISOString(),
      });
      const { error } = await client.auth.admin.updateUserById(existing.id, {
        user_metadata: { ...existing.user_metadata, pending_team_invites: pending },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, pending: true });
  }

  // New user — send email invite
  const { error } = await client.auth.admin.inviteUserByEmail(email.trim(), {
    data: { team_id: teamOwnerId },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
