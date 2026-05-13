import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  hasWindsor: boolean;
  role: "owner" | "member";
}

const COLORS = ["#4F46E5","#3B82F6","#7C3AED","#2563EB","#0EA5E9","#059669","#F59E0B","#EC4899","#10B981","#EF4444"];

function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
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

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { users: all } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const myTeamId = user.user_metadata?.team_id as string | undefined;
  const members: TeamMember[] = [];

  // My members (I am owner)
  for (const u of all.filter(u => (u.user_metadata?.team_id as string | undefined) === user.id)) {
    const m = u.user_metadata ?? {};
    members.push({
      id: u.id,
      name: (m.full_name as string) || u.email?.split("@")[0] || "Unknown",
      email: u.email ?? "",
      avatarColor: avatarColor(u.id),
      hasWindsor: !!(m.windsor_api_key as string | undefined),
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
        avatarColor: avatarColor(owner.id),
        hasWindsor: !!(m.windsor_api_key as string | undefined),
        role: "owner",
      });
      for (const u of all.filter(u => u.id !== user.id && (u.user_metadata?.team_id as string | undefined) === myTeamId)) {
        const m2 = u.user_metadata ?? {};
        members.push({
          id: u.id,
          name: (m2.full_name as string) || u.email?.split("@")[0] || "Unknown",
          email: u.email ?? "",
          avatarColor: avatarColor(u.id),
          hasWindsor: !!(m2.windsor_api_key as string | undefined),
          role: "member",
        });
      }
    }
  }

  return NextResponse.json({ members });
}
