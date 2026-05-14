import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { adminClient } from "@/lib/supabase-admin";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  const { id } = await params;
  const client = adminClient();

  const { data: { user: target } } = await client.auth.admin.getUserById(id);
  const targetTeamId = target?.user_metadata?.team_id as string | undefined;
  if (id !== me.id && targetTeamId !== me.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;
  const { error } = await client.auth.admin.updateUserById(id, {
    user_metadata: { ...target?.user_metadata, ...body },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 503 });
  }

  const { id } = await params;

  if (id === me.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  const client = adminClient();

  const { data: { user: target } } = await client.auth.admin.getUserById(id);
  const targetTeamId = target?.user_metadata?.team_id as string | undefined;
  const pendingInvites = (target?.user_metadata?.pending_team_invites ?? []) as { from_id: string }[];
  const isPending = pendingInvites.some(p => p.from_id === me.id);

  if (targetTeamId !== me.id && !isPending) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isPending && targetTeamId !== me.id) {
    // Only remove the pending invite — don't delete the user's account
    const filtered = pendingInvites.filter(p => p.from_id !== me.id);
    const { error } = await client.auth.admin.updateUserById(id, {
      user_metadata: { ...target?.user_metadata, pending_team_invites: filtered },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Accepted member — remove team_id from their metadata (kick from team)
  const { error } = await client.auth.admin.updateUserById(id, {
    user_metadata: { ...target?.user_metadata, team_id: null },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
