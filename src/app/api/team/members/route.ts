import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { listAllUsers, makeAvatarColor } from "@/lib/supabase-admin";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  hasWindsor: boolean;
  isPending: boolean;
  role: "owner" | "member";
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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ members: [] });
  }

  const all = await listAllUsers();
  const myTeamId = user.user_metadata?.team_id as string | undefined;
  const members: TeamMember[] = [];

  type PendingInvite = { from_id: string };

  // My members (accepted) + pending invitees
  for (const u of all) {
    if (u.id === user.id) continue;
    const m = u.user_metadata ?? {};
    const isAccepted = (m.team_id as string | undefined) === user.id;
    const isPending = ((m.pending_team_invites as PendingInvite[] | undefined) ?? [])
      .some(p => p.from_id === user.id);
    if (!isAccepted && !isPending) continue;
    members.push({
      id: u.id,
      name: (m.full_name as string) || u.email?.split("@")[0] || "Unknown",
      email: u.email ?? "",
      avatarColor: makeAvatarColor(u.id),
      hasWindsor: !!(m.windsor_api_key as string | undefined),
      isPending,
      role: "member",
    });
  }

  // If I'm a member — add owner and siblings
  if (myTeamId) {
    const owner = all.find(u => u.id === myTeamId);
    if (owner) {
      const m = owner.user_metadata ?? {};
      members.unshift({
        id: owner.id,
        name: (m.full_name as string) || owner.email?.split("@")[0] || "Unknown",
        email: owner.email ?? "",
        avatarColor: makeAvatarColor(owner.id),
        hasWindsor: !!(m.windsor_api_key as string | undefined),
        isPending: false,
        role: "owner",
      });
      for (const u of all.filter(u => u.id !== user.id && (u.user_metadata?.team_id as string | undefined) === myTeamId)) {
        const m2 = u.user_metadata ?? {};
        members.push({
          id: u.id,
          name: (m2.full_name as string) || u.email?.split("@")[0] || "Unknown",
          email: u.email ?? "",
          avatarColor: makeAvatarColor(u.id),
          hasWindsor: !!(m2.windsor_api_key as string | undefined),
          isPending: false,
          role: "member",
        });
      }
    }
  }

  return NextResponse.json({ members });
}
