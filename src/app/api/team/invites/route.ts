import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface PendingInvite {
  from_id: string;
  from_name: string;
  from_email: string;
  created_at: string;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invites: PendingInvite[] =
    (user.user_metadata?.pending_team_invites as PendingInvite[] | undefined) ?? [];

  return NextResponse.json({ invites });
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  const { from_id, action } = await req.json() as { from_id: string; action: "accept" | "decline" };
  if (!from_id || !action) return NextResponse.json({ error: "Missing from_id or action" }, { status: 400 });

  const pending: PendingInvite[] =
    (user.user_metadata?.pending_team_invites as PendingInvite[] | undefined) ?? [];
  const filtered = pending.filter(p => p.from_id !== from_id);

  const newMeta: Record<string, unknown> = {
    ...user.user_metadata,
    pending_team_invites: filtered,
  };

  if (action === "accept") {
    newMeta.team_id = from_id;
  }

  const { error } = await adminClient().auth.admin.updateUserById(user.id, {
    user_metadata: newMeta,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
