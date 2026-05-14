import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { adminClient, listAllUsers, makeAvatarColor } from "@/lib/supabase-admin";

export type Plan = "Enterprise" | "Business" | "Professional" | "Starter";
export type UserStatus = "Active" | "Trial" | "Inactive" | "Suspended";

export interface AdminUser {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  avatarUrl: string | null;
  email: string;
  phone: string;
  company: string;
  plan: Plan;
  status: UserStatus;
  lastLogin: string;
  lastLoginMins: number;
  registered: string;
  expiry: string;
  expiryStatus: "expired" | "soon" | "ok";
  expiryNote?: string;
  revenueMonthly: number;
  revenueTotal: number;
}

const PLAN_PRICE: Record<Plan, number> = {
  Enterprise: 499, Business: 299, Professional: 199, Starter: 49,
};

function makeInitials(name: string) {
  return name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "??";
}

function parseLoginTime(iso: string | null | undefined): { label: string; mins: number } {
  if (!iso) return { label: "Never", mins: 9999999 };
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return { label: `${mins} min ago`, mins };
  if (mins < 1440) return { label: `${Math.floor(mins / 60)}h ago`, mins };
  const days = Math.floor(mins / 1440);
  return { label: `${days} day${days > 1 ? "s" : ""} ago`, mins };
}

function parseExpiry(iso: string | null | undefined) {
  if (!iso) return { expiry: "—", expiryStatus: "ok" as const };
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.floor(diff / 86400000);
  const label = new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (diff < 0) return { expiry: label, expiryStatus: "expired" as const };
  if (days <= 7) return { expiry: label, expiryStatus: "soon" as const, expiryNote: `${days} day${days !== 1 ? "s" : ""} left` };
  return { expiry: label, expiryStatus: "ok" as const };
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 503 });
  }

  const users = await listAllUsers();

  type PendingInvite = { from_id: string };
  const ownTeam = users.filter(u =>
    u.id === admin.id ||
    (u.user_metadata?.team_id as string | undefined) === admin.id ||
    ((u.user_metadata?.pending_team_invites as PendingInvite[] | undefined) ?? []).some(p => p.from_id === admin.id)
  );

  const mapped: AdminUser[] = ownTeam.map(u => {
    const m = u.user_metadata ?? {};
    const plan = (m.plan as Plan) || "Starter";
    const status = (m.status as UserStatus) || "Active";
    const name = (m.full_name as string) || (m.name as string) || u.email?.split("@")[0] || "Unknown";
    const { label: lastLogin, mins: lastLoginMins } = parseLoginTime(u.last_sign_in_at);
    const { expiry, expiryStatus, expiryNote } = parseExpiry(m.plan_expires_at as string | undefined);
    const monthlyRate = status === "Trial" || status === "Inactive" || status === "Suspended" ? 0 : PLAN_PRICE[plan];
    const monthsActive = Math.max(1, Math.floor((Date.now() - new Date(u.created_at).getTime()) / (30 * 86400000)));

    return {
      id: u.id,
      name,
      initials: makeInitials(name),
      avatarColor: makeAvatarColor(u.id),
      avatarUrl: (m.avatar_url as string | undefined) ?? (m.picture as string | undefined) ?? null,
      email: u.email ?? "",
      phone: (m.phone as string) ?? "",
      company: (m.company as string) ?? "",
      plan,
      status,
      lastLogin,
      lastLoginMins,
      registered: new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      expiry,
      expiryStatus,
      expiryNote,
      revenueMonthly: monthlyRate,
      revenueTotal: monthlyRate * monthsActive,
    };
  });

  return NextResponse.json({ users: mapped });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 503 });
  }

  const { email, plan = "Starter" } = await req.json() as { email: string; plan?: string };
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const client = adminClient();
  const all = await listAllUsers();
  const existing = all.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    const pending: { from_id: string; from_name: string; from_email: string; created_at: string }[] =
      (existing.user_metadata?.pending_team_invites as typeof pending | undefined) ?? [];
    if (!pending.find(p => p.from_id === admin.id)) {
      const adminMeta = admin.user_metadata ?? {};
      pending.push({
        from_id: admin.id,
        from_name: (adminMeta.full_name as string | undefined) ?? (adminMeta.name as string | undefined) ?? admin.email ?? "Someone",
        from_email: admin.email ?? "",
        created_at: new Date().toISOString(),
      });
      const { error: updateErr } = await client.auth.admin.updateUserById(existing.id, {
        user_metadata: { ...existing.user_metadata, pending_team_invites: pending },
      });
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, pending: true });
  }

  const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
    data: { plan, status: "Trial", team_id: admin.id },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data.user });
}
