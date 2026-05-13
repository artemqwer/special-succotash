"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { AdminUser, Plan, UserStatus } from "@/app/api/admin/users/route";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANS: Plan[] = ["Enterprise", "Business", "Professional", "Starter"];
const STATUSES: UserStatus[] = ["Active", "Trial", "Inactive", "Suspended"];
const PLAN_PRICE: Record<Plan, number> = { Enterprise: 499, Business: 299, Professional: 199, Starter: 49 };

const MRR_DATA = [
  { month: "Nov", mrr: 2100, new: 380 }, { month: "Dec", mrr: 2340, new: 420 },
  { month: "Jan", mrr: 2580, new: 390 }, { month: "Feb", mrr: 2720, new: 440 },
  { month: "Mar", mrr: 2900, new: 480 }, { month: "Apr", mrr: 3089, new: 520 },
];
const CHURN_DATA = [
  { month: "Nov", rate: 4.2 }, { month: "Dec", rate: 3.8 },
  { month: "Jan", rate: 3.4 }, { month: "Feb", rate: 3.1 },
  { month: "Mar", rate: 4.2 }, { month: "Apr", rate: 2.8 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: Plan }) {
  const s: Record<Plan, string> = {
    Enterprise: "bg-purple-100 text-purple-700",
    Business: "bg-pink-100 text-pink-600",
    Professional: "bg-blue-100 text-blue-700",
    Starter: "bg-gray-100 text-gray-500",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium whitespace-nowrap ${s[plan]}`}>{plan}</span>;
}

function StatusBadge({ status }: { status: UserStatus }) {
  const s: Record<UserStatus, { cls: string; dot: string }> = {
    Active:    { cls: "bg-green-50 text-green-700 border border-green-200",  dot: "bg-green-500" },
    Trial:     { cls: "bg-amber-50 text-amber-600 border border-amber-200",  dot: "bg-amber-400" },
    Inactive:  { cls: "bg-gray-50 text-gray-500 border border-gray-200",     dot: "bg-gray-400" },
    Suspended: { cls: "bg-red-50 text-red-600 border border-red-200",        dot: "bg-red-500" },
  };
  const { cls, dot } = s[status];
  return (
    <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium whitespace-nowrap ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {status}
    </span>
  );
}

function ExpiryCell({ user }: { user: AdminUser }) {
  if (user.expiry === "—") return <span className="text-[13px] text-gray-400">—</span>;
  if (user.expiryStatus === "expired") return (
    <div><p className="text-[13px] text-red-500 font-semibold">{user.expiry}</p><p className="text-[11px] text-red-400">Expired</p></div>
  );
  if (user.expiryStatus === "soon") return (
    <div><p className="text-[13px] text-amber-500 font-semibold">{user.expiry}</p><p className="text-[11px] text-amber-400">{user.expiryNote}</p></div>
  );
  return <p className="text-[13px] text-gray-700">{user.expiry}</p>;
}

function KpiCard({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-3 sm:px-4 py-3 sm:py-3.5 flex items-center gap-2 sm:gap-3 min-w-0">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] sm:text-[20px] font-bold text-gray-900 leading-none truncate">{value}</p>
        <p className="text-[10px] sm:text-[12px] text-gray-400 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-[10px] text-gray-300 truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

interface EditModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (id: string, data: Partial<AdminUser>) => Promise<void>;
}

function EditModal({ user, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company);
  const [phone, setPhone] = useState(user.phone);
  const [plan, setPlan] = useState<Plan>(user.plan);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [expiry, setExpiry] = useState(
    user.expiry !== "—" ? new Date(user.expiry).toISOString().split("T")[0] : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave(user.id, {
        name,
        company,
        phone,
        plan,
        status,
        expiry: expiry ? new Date(expiry).toISOString() : undefined,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">Edit User</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-[12px] font-medium text-gray-500 block mb-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-500 block mb-1">Company</label>
            <input value={company} onChange={e => setCompany(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-500 block mb-1">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-gray-500 block mb-1">Plan</label>
              <select value={plan} onChange={e => setPlan(e.target.value as Plan)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-blue-400 bg-white cursor-pointer">
                {PLANS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-500 block mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as UserStatus)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-blue-400 bg-white cursor-pointer">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-500 block mb-1">Plan Expiry</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-blue-400" />
          </div>
        </div>

        {error && <p className="text-[12px] text-red-500 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-[13px] font-medium border border-gray-200 text-gray-600 py-2 rounded-xl hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

interface InviteModalProps {
  onClose: () => void;
  onInvite: (email: string, plan: Plan) => Promise<void>;
}

function InviteModal({ onClose, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<Plan>("Starter");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleInvite = async () => {
    if (!email.trim()) { setError("Enter an email address"); return; }
    setSaving(true);
    setError("");
    try {
      await onInvite(email.trim(), plan);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send invite");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-bold text-gray-900">Invite User</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="text-[12px] font-medium text-gray-500 block mb-1">Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
              placeholder="user@example.com"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-blue-400"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-500 block mb-1">Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value as Plan)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700 outline-none focus:border-blue-400 bg-white cursor-pointer">
              {PLANS.map(p => <option key={p}>{p} — ${PLAN_PRICE[p]}/mo</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-[12px] text-red-500 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 text-[13px] font-medium border border-gray-200 text-gray-600 py-2 rounded-xl hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleInvite} disabled={saving} className="flex-1 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition disabled:opacity-50">
            {saving ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDelete }: { user: AdminUser; onClose: () => void; onDelete: (id: string) => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setDeleting(true);
    try { await onDelete(user.id); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-[16px] font-bold text-gray-900 mb-2">Delete User?</h2>
        <p className="text-[13px] text-gray-500 mb-5">
          This will permanently delete <span className="font-semibold text-gray-700">{user.name}</span> ({user.email}) and all their data. This cannot be undone.
        </p>
        {error && <p className="text-[12px] text-red-500 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 text-[13px] font-medium border border-gray-200 text-gray-600 py-2 rounded-xl hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handle} disabled={deleting} className="flex-1 text-[13px] font-medium bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl transition disabled:opacity-50">
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All Plans");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sortCol, setSortCol] = useState<"lastLoginMins" | "name" | "revenueTotal" | null>("lastLoginMins");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json() as { users?: AdminUser[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load users");
      setUsers(json.users ?? []);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setOpenMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const handleSave = async (id: string, data: Partial<AdminUser>) => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: data.name,
        company: data.company,
        phone: data.phone,
        plan: data.plan,
        status: data.status,
        plan_expires_at: data.expiry,
      }),
    });
    if (!res.ok) {
      const j = await res.json() as { error?: string };
      throw new Error(j.error ?? "Save failed");
    }
    showToast("success", "User updated");
    await loadUsers();
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json() as { error?: string };
      throw new Error(j.error ?? "Delete failed");
    }
    showToast("success", "User deleted");
    await loadUsers();
  };

  const handleInvite = async (email: string, plan: Plan) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan }),
    });
    if (!res.ok) {
      const j = await res.json() as { error?: string };
      throw new Error(j.error ?? "Invite failed");
    }
    showToast("success", `Invite sent to ${email}`);
    await loadUsers();
  };

  const handleExportCSV = () => {
    const headers = ["Name","Email","Company","Phone","Plan","Status","Registered","Expiry","Monthly Revenue","Total Revenue"];
    const rows = filtered.map(u => [u.name, u.email, u.company, u.phone, u.plan, u.status, u.registered, u.expiry, `$${u.revenueMonthly}`, `$${u.revenueTotal}`]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filtered = useMemo(() => {
    let rows = [...users];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.company.toLowerCase().includes(q));
    }
    if (planFilter !== "All Plans") rows = rows.filter(u => u.plan === planFilter);
    if (statusFilter !== "All Statuses") rows = rows.filter(u => u.status === statusFilter);
    if (sortCol && sortDir) {
      rows.sort((a, b) => {
        const av = a[sortCol]; const bv = b[sortCol];
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [users, search, planFilter, statusFilter, sortCol, sortDir]);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(col); setSortDir("asc");
    }
  };

  // KPIs from real data
  const mrr = users.filter(u => u.status === "Active").reduce((s, u) => s + u.revenueMonthly, 0);
  const activeCount = users.filter(u => u.status === "Active").length;
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);
  const newMrr = users
    .filter(u => u.status === "Active" && new Date(u.registered).getTime() >= thisMonth.getTime())
    .reduce((s, u) => s + u.revenueMonthly, 0);

  // Plan distribution
  const planDist = PLANS.map(p => ({
    plan: p,
    count: users.filter(u => u.plan === p).length,
    pct: users.length ? Math.round((users.filter(u => u.plan === p).length / users.length) * 100) : 0,
  }));
  const planColors: Record<Plan, { bar: string; light: string }> = {
    Enterprise:   { bar: "bg-purple-500", light: "bg-purple-100 text-purple-700" },
    Business:     { bar: "bg-pink-500",   light: "bg-pink-100 text-pink-600" },
    Professional: { bar: "bg-blue-500",   light: "bg-blue-100 text-blue-700" },
    Starter:      { bar: "bg-gray-400",   light: "bg-gray-100 text-gray-600" },
  };

  return (
    <div className="px-4 sm:px-6 py-6 bg-[#f4f6fb] min-h-screen">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-500 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium ${
          toast.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {toast.type === "success"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
          {toast.text}
        </div>
      )}

      {/* Modals */}
      {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} onSave={handleSave} />}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />}
      {deleteUser && <DeleteModal user={deleteUser} onClose={() => setDeleteUser(null)} onDelete={handleDelete} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-[19px] sm:text-[22px] font-bold text-gray-900">Admin Panel</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-400 mt-0.5 hidden sm:block">Manage users, subscriptions and analytics</p>
        </div>
        <button onClick={handleExportCSV}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] sm:text-[14px] font-semibold px-3 sm:px-4 py-2 rounded-xl transition shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {["User Management", "Analytics"].map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium border-b-2 transition -mb-px ${
              activeTab === i ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {i === 0 ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            )}
            {t}
          </button>
        ))}
      </div>

      {/* ── User Management Tab ── */}
      {activeTab === 0 && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              value={`$${mrr.toLocaleString()}`} label="Monthly Recurring"
            />
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              value={`$${newMrr.toLocaleString()}`} label="Net New MRR" sub="This month"
            />
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              value={`$${(mrr * 12).toLocaleString()}`} label="Annual Run Rate"
            />
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              value={String(activeCount)} label="Active Subscriptions"
            />
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
              value={String(users.length)} label="Registered Users"
            />
          </div>

          {/* Table card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3 sm:flex-wrap">
              <div className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-[200px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or company..."
                  className="text-[13px] bg-transparent outline-none w-full placeholder-gray-400 text-gray-700" />
                {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                  className="text-[13px] border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 bg-white text-gray-700 cursor-pointer w-full sm:w-auto">
                  <option>All Plans</option>
                  {PLANS.map(p => <option key={p}>{p}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="text-[13px] border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 bg-white text-gray-700 cursor-pointer w-full sm:w-auto">
                  <option>All Statuses</option>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Loading / Error */}
            {loading && (
              <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-[14px]">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading users…
              </div>
            )}
            {!loading && fetchError && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-[14px]">
                <p className="text-red-500">{fetchError}</p>
                {fetchError.includes("SUPABASE_SERVICE_ROLE_KEY") && (
                  <p className="text-[12px] text-gray-400">Add <code className="bg-gray-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to your .env.local</p>
                )}
                {fetchError.includes("Forbidden") && (
                  <p className="text-[12px] text-gray-400">Add <code className="bg-gray-100 px-1 rounded">ADMIN_EMAIL=your@email.com</code> to your .env.local</p>
                )}
                <button onClick={loadUsers} className="text-[12px] text-blue-600 hover:underline mt-1">Try again</button>
              </div>
            )}

            {/* Table */}
            {!loading && !fetchError && (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-4 sm:px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap sticky left-0 bg-gray-50/80 z-10">User</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden md:table-cell">Company</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Plan</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition hidden sm:table-cell"
                        onClick={() => handleSort("lastLoginMins")}>
                        Last Login <span className="ml-1 text-gray-300">{sortCol === "lastLoginMins" ? (sortDir === "asc" ? "↑" : sortDir === "desc" ? "↓" : "↕") : "↕"}</span>
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden lg:table-cell">Registered</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap hidden sm:table-cell">Expiry</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition"
                        onClick={() => handleSort("revenueTotal")}>
                        Revenue <span className="ml-1 text-gray-300">{sortCol === "revenueTotal" ? (sortDir === "asc" ? "↑" : sortDir === "desc" ? "↓" : "↕") : "↕"}</span>
                      </th>
                      <th className="px-4 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} className="px-5 py-10 text-center text-[13px] text-gray-400">No users match your filters</td></tr>
                    ) : filtered.map(user => (
                      <tr key={user.id} className="border-t border-gray-50 hover:bg-blue-50/20 transition group cursor-pointer" onClick={() => setEditUser(user)}>
                        <td className="px-4 sm:px-5 py-3.5 sticky left-0 bg-white group-hover:bg-blue-50/20 transition z-10">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white text-[12px] sm:text-[13px] font-bold shrink-0" style={{ background: user.avatarColor }}>
                              {user.initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 text-[13px] whitespace-nowrap">{user.name}</p>
                              <p className="text-[11px] text-gray-400 truncate max-w-[140px] sm:max-w-[180px]">{user.email}</p>
                              {user.phone && <p className="text-[11px] text-gray-400 hidden sm:block">{user.phone}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <p className="text-[13px] text-gray-700 font-medium whitespace-nowrap">{user.company || "—"}</p>
                        </td>
                        <td className="px-4 py-3.5"><PlanBadge plan={user.plan} /></td>
                        <td className="px-4 py-3.5"><StatusBadge status={user.status} /></td>
                        <td className="px-4 py-3.5 text-[13px] text-gray-500 whitespace-nowrap hidden sm:table-cell">{user.lastLogin}</td>
                        <td className="px-4 py-3.5 text-[13px] text-gray-500 whitespace-nowrap hidden lg:table-cell">{user.registered}</td>
                        <td className="px-4 py-3.5 hidden sm:table-cell"><ExpiryCell user={user} /></td>
                        <td className="px-4 py-3.5 text-right">
                          <p className="text-[13px] font-semibold text-gray-800 whitespace-nowrap">{user.revenueMonthly === 0 ? "—" : `$${user.revenueMonthly}/mo`}</p>
                          <p className="text-[11px] text-gray-400">{user.revenueTotal === 0 ? "" : `$${user.revenueTotal.toLocaleString()} total`}</p>
                        </td>
                        <td className="px-2 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="relative">
                            <button onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === user.id ? null : user.id); }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition opacity-0 group-hover:opacity-100">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                            </button>
                            {openMenu === user.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg z-30 py-1 min-w-[130px]">
                                <button onClick={() => { setEditUser(user); setOpenMenu(null); }}
                                  className="w-full text-left px-3.5 py-2 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  Edit
                                </button>
                                <button onClick={() => { setDeleteUser(user); setOpenMenu(null); }}
                                  className="w-full text-left px-3.5 py-2 text-[13px] text-red-500 hover:bg-red-50 flex items-center gap-2">
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Table footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[12px] text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{users.length}</span> users
              </p>
              <button onClick={() => setShowInvite(true)}
                className="flex items-center gap-1.5 text-[12px] text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Invite User
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Revenue (MRR)", value: `$${mrr.toLocaleString()}`, sub: "All active subscriptions", color: "text-green-600" },
              { label: "Annual Run Rate", value: `$${(mrr * 12).toLocaleString()}`, sub: "MRR × 12", color: "text-blue-600" },
              { label: "Avg Revenue / User", value: activeCount > 0 ? `$${(mrr / activeCount).toFixed(2)}` : "—", sub: "Per active subscription", color: "text-purple-600" },
              { label: "Registered Users", value: String(users.length), sub: `${activeCount} active`, color: "text-amber-600" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[12px] text-gray-400 mb-1.5">{label}</p>
                <p className={`text-[22px] font-bold ${color}`}>{value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">MRR Growth</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Monthly recurring revenue over time</p>
                </div>
                <span className="text-[12px] text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full">+47% YTD</span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MRR_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v: unknown) => [`$${v}`, "MRR"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
                    <Area type="monotone" dataKey="mrr" stroke="#3B82F6" strokeWidth={2} fill="url(#mrrGrad)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Churn Rate</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Monthly churn percentage</p>
                </div>
                <span className="text-[12px] text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full">↓ Improving</span>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CHURN_DATA} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} barSize={28}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={(v: unknown) => [`${v}%`, "Churn"]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E5E7EB" }} />
                    <Bar dataKey="rate" fill="#F87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">Plan Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {planDist.map(({ plan, count, pct }) => (
                <div key={plan} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${planColors[plan].light}`}>{plan}</span>
                    <span className="text-[12px] font-bold text-gray-700">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${planColors[plan].bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-400">{pct}% of users</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
