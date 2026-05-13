import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type Plan = "Enterprise" | "Business" | "Professional" | "Starter";
export type UserStatus = "Active" | "Trial" | "Inactive" | "Suspended";

export interface AdminUser {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
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
const COLORS = ["#4F46E5","#3B82F6","#7C3AED","#2563EB","#0EA5E9","#059669","#F59E0B","#EC4899","#10B981","#EF4444"];

function makeInitials(name: string) {
  return name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "??";
}

function makeAvatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
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
  const isGoogle = user.app_metadata?.provider === "google" || (user.app_metadata?.providers as string[] | undefined)?.includes("google");
  if (!user.user_metadata?.is_admin && !isGoogle) return null;
  return user;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 503 });
  }

  const { data: { users }, error } = await adminClient().auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Only show users belonging to this admin's team (invited by them) + themselves
  const ownTeam = users.filter(u =>
    u.id === admin.id ||
    (u.user_metadata?.team_id as string | undefined) === admin.id
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

  const { email, plan = "Starter" } = await req.json() as { email: string; plan?: string };
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const client = adminClient();

  // Check if user already exists first
  const { data: { users: all } } = await client.auth.admin.listUsers({ perPage: 1000 });
  const existing = all.find(u => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    // Already has an account — just add to team, no email sent
    const { data: updated, error: updateErr } = await client.auth.admin.updateUserById(existing.id, {
      user_metadata: { ...existing.user_metadata, team_id: admin.id },
    });
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    return NextResponse.json({ user: updated.user, added: true });
  }

  // New user — send email invite
  const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
    data: { plan, status: "Trial", team_id: admin.id },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data.user });
}
