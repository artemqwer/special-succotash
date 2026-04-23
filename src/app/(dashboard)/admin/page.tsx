"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = "Enterprise" | "Business" | "Professional" | "Starter";
type UserStatus = "Active" | "Trial" | "Inactive" | "Suspended";
type ExpiryStatus = "expired" | "soon" | "ok";
type SortDir = "asc" | "desc" | null;

interface AdminUser {
  id: number;
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
  expiryStatus: ExpiryStatus;
  expiryNote?: string;
  revenueMonthly: number;
  revenueTotal: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const USERS: AdminUser[] = [
  { id: 1, name: "James Wilson", initials: "JW", avatarColor: "#4F46E5", email: "jwilson@sportswear.net", phone: "+1 (555) 456-7890", company: "Athletic Wear Pro", plan: "Enterprise", status: "Active", lastLogin: "30 min ago", lastLoginMins: 30, registered: "Mar 10, 2024", expiry: "Mar 10, 2026", expiryStatus: "expired", revenueMonthly: 499, revenueTotal: 5488 },
  { id: 2, name: "Michelle Thompson", initials: "MT", avatarColor: "#3B82F6", email: "mthompson@cosmetics.com", phone: "+1 (555) 345-6780", company: "Beauty Cosmetics Ltd.", plan: "Business", status: "Trial", lastLogin: "45 min ago", lastLoginMins: 45, registered: "Jan 5, 2026", expiry: "Jan 19, 2026", expiryStatus: "expired", revenueMonthly: 0, revenueTotal: 0 },
  { id: 3, name: "Sarah Johnson", initials: "SJ", avatarColor: "#7C3AED", email: "sarah.j@fashionstore.com", phone: "+1 (555) 123-4567", company: "Fashion Store Inc.", plan: "Enterprise", status: "Active", lastLogin: "2h ago", lastLoginMins: 120, registered: "Jun 15, 2024", expiry: "Jun 15, 2026", expiryStatus: "ok", revenueMonthly: 499, revenueTotal: 3493 },
  { id: 4, name: "Jennifer Lee", initials: "JL", avatarColor: "#2563EB", email: "jlee@jewelry.com", phone: "+1 (555) 901-2345", company: "Luxury Jewelry Co.", plan: "Enterprise", status: "Active", lastLogin: "3h ago", lastLoginMins: 180, registered: "Apr 25, 2024", expiry: "Apr 25, 2026", expiryStatus: "soon", expiryNote: "1 days left", revenueMonthly: 499, revenueTotal: 4491 },
  { id: 5, name: "Daniel Harris", initials: "DH", avatarColor: "#0EA5E9", email: "dharris@electronics.net", phone: "+1 (555) 234-5679", company: "Electronics Mega Store", plan: "Enterprise", status: "Active", lastLogin: "4h ago", lastLoginMins: 240, registered: "May 20, 2024", expiry: "May 20, 2026", expiryStatus: "ok", revenueMonthly: 499, revenueTotal: 3992 },
  { id: 6, name: "Lisa Anderson", initials: "LA", avatarColor: "#059669", email: "landerson@petstore.com", phone: "+1 (555) 789-0123", company: "Pet Paradise", plan: "Professional", status: "Active", lastLogin: "8h ago", lastLoginMins: 480, registered: "Oct 30, 2024", expiry: "Mar 30, 2026", expiryStatus: "expired", revenueMonthly: 199, revenueTotal: 597 },
  { id: 7, name: "Michael Chen", initials: "MC", avatarColor: "#7C3AED", email: "mchen@techgear.io", phone: "+1 (555) 234-5678", company: "TechGear Online", plan: "Professional", status: "Active", lastLogin: "18h ago", lastLoginMins: 1080, registered: "Sep 22, 2024", expiry: "Feb 22, 2026", expiryStatus: "expired", revenueMonthly: 199, revenueTotal: 796 },
  { id: 8, name: "Robert Kim", initials: "RK", avatarColor: "#F59E0B", email: "rkim@kfashion.com", phone: "+1 (555) 678-9012", company: "K-Fashion Seoul", plan: "Enterprise", status: "Active", lastLogin: "1 day ago", lastLoginMins: 1440, registered: "Feb 14, 2024", expiry: "Feb 14, 2027", expiryStatus: "ok", revenueMonthly: 499, revenueTotal: 6487 },
  { id: 9, name: "Emma Davis", initials: "ED", avatarColor: "#EC4899", email: "edavis@glowbeauty.co", phone: "+1 (555) 321-0987", company: "Glow Beauty Co.", plan: "Starter", status: "Inactive", lastLogin: "5 days ago", lastLoginMins: 7200, registered: "Nov 3, 2025", expiry: "Dec 3, 2025", expiryStatus: "expired", revenueMonthly: 49, revenueTotal: 49 },
  { id: 10, name: "Carlos Mendez", initials: "CM", avatarColor: "#10B981", email: "cmendez@sportmax.mx", phone: "+1 (555) 456-1234", company: "SportMax Mexico", plan: "Business", status: "Active", lastLogin: "2 days ago", lastLoginMins: 2880, registered: "Mar 22, 2025", expiry: "Mar 22, 2026", expiryStatus: "ok", revenueMonthly: 299, revenueTotal: 1196 },
];

const MRR_DATA = [
  { month: "Nov", mrr: 2100, new: 380 },
  { month: "Dec", mrr: 2340, new: 420 },
  { month: "Jan", mrr: 2580, new: 390 },
  { month: "Feb", mrr: 2720, new: 440 },
  { month: "Mar", mrr: 2900, new: 480 },
  { month: "Apr", mrr: 3089, new: 520 },
];

const CHURN_DATA = [
  { month: "Nov", rate: 4.2 },
  { month: "Dec", rate: 3.8 },
  { month: "Jan", rate: 3.4 },
  { month: "Feb", rate: 3.1 },
  { month: "Mar", rate: 4.2 },
  { month: "Apr", rate: 2.8 },
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
    Active: { cls: "bg-green-50 text-green-700 border border-green-200", dot: "bg-green-500" },
    Trial: { cls: "bg-amber-50 text-amber-600 border border-amber-200", dot: "bg-amber-400" },
    Inactive: { cls: "bg-gray-50 text-gray-500 border border-gray-200", dot: "bg-gray-400" },
    Suspended: { cls: "bg-red-50 text-red-600 border border-red-200", dot: "bg-red-500" },
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
  if (user.expiryStatus === "expired") {
    return (
      <div>
        <p className="text-[13px] text-red-500 font-semibold">{user.expiry}</p>
        <p className="text-[11px] text-red-400">Expired</p>
      </div>
    );
  }
  if (user.expiryStatus === "soon") {
    return (
      <div>
        <p className="text-[13px] text-red-500 font-semibold">{user.expiry}</p>
        <p className="text-[11px] text-red-400">{user.expiryNote}</p>
      </div>
    );
  }
  return <p className="text-[13px] text-gray-700">{user.expiry}</p>;
}

function KpiCard({ icon, value, delta, up, label }: { icon: React.ReactNode; value: string; delta: string; up: boolean; label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3 min-w-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${up ? "bg-green-50" : "bg-red-50"}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[20px] font-bold text-gray-900 leading-none">{value}</span>
          <span className={`text-[12px] font-semibold ${up ? "text-green-500" : "text-red-500"}`}>{delta}</span>
        </div>
        <p className="text-[12px] text-gray-400 mt-0.5 truncate">{label}</p>
      </div>
      <div className="relative group shrink-0">
        <span className="w-4 h-4 rounded-full border border-gray-200 flex items-center justify-center text-[8px] text-gray-400 cursor-help select-none">i</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All Plans");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sortCol, setSortCol] = useState<"lastLoginMins" | "name" | "revenueTotal" | null>("lastLoginMins");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let rows = [...USERS];
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
  }, [search, planFilter, statusFilter, sortCol, sortDir]);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc");
      if (sortDir === "desc") setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 bg-[#f4f6fb] min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900">Admin Panel</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Manage users, subscriptions and analytics</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold px-4 py-2 rounded-xl transition shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        {["User Management", "Analytics"].map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium border-b-2 transition -mb-px ${
              activeTab === i ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {i === 0 ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
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
              value="$3 089" delta="+8.4%" up label="Monthly Recurring"
            />
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              value="$520" delta="+36.8%" up label="Net New MRR"
            />
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
              value="2.8%" delta="-33.3%" up={false} label="Churn Rate (Monthly)"
            />
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              value="9" delta="+12.5%" up label="Active Subscriptions"
            />
            <KpiCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              value="15" delta="+15.4%" up label="Registered Users"
            />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-4 flex items-center gap-3 border-b border-gray-100 flex-wrap">
              {/* Search */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, or company..."
                  className="text-[13px] bg-transparent outline-none w-full placeholder-gray-400 text-gray-700"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
              {/* Plan filter */}
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                className="text-[13px] border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 bg-white text-gray-700 cursor-pointer"
              >
                <option>All Plans</option>
                <option>Enterprise</option>
                <option>Business</option>
                <option>Professional</option>
                <option>Starter</option>
              </select>
              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-[13px] border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 bg-white text-gray-700 cursor-pointer"
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>Trial</option>
                <option>Inactive</option>
                <option>Suspended</option>
              </select>
              {/* Date range */}
              <button className="flex items-center gap-2 text-[13px] text-gray-600 border border-gray-200 rounded-xl px-3 py-2 hover:bg-gray-50 transition whitespace-nowrap">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Select date range
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">User</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Company</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Plan</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Status</th>
                    <th
                      className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition"
                      onClick={() => handleSort("lastLoginMins")}
                    >
                      Last Login
                      <span className="ml-1 text-gray-300">
                        {sortCol === "lastLoginMins" ? (sortDir === "asc" ? "↑" : sortDir === "desc" ? "↓" : "↕") : "↕"}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Registered</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Expiry Date</th>
                    <th
                      className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-700 transition"
                      onClick={() => handleSort("revenueTotal")}
                    >
                      Revenue
                      <span className="ml-1 text-gray-300">
                        {sortCol === "revenueTotal" ? (sortDir === "asc" ? "↑" : sortDir === "desc" ? "↓" : "↕") : "↕"}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10 text-center text-[13px] text-gray-400">No users match your filters</td>
                    </tr>
                  ) : filtered.map((user) => (
                    <tr key={user.id} className="border-t border-gray-50 hover:bg-blue-50/20 transition group">
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                            style={{ background: user.avatarColor }}
                          >
                            {user.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-[13px] whitespace-nowrap">{user.name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                              <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{user.email}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.1 9.82 19.79 19.79 0 0 1 1 1.21 2 2 0 0 1 2.97 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 7.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 14.92z"/></svg>
                              <p className="text-[11px] text-gray-400">{user.phone}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Company */}
                      <td className="px-4 py-3.5">
                        <p className="text-[13px] text-gray-700 font-medium whitespace-nowrap">{user.company}</p>
                      </td>
                      {/* Plan */}
                      <td className="px-4 py-3.5"><PlanBadge plan={user.plan} /></td>
                      {/* Status */}
                      <td className="px-4 py-3.5"><StatusBadge status={user.status} /></td>
                      {/* Last Login */}
                      <td className="px-4 py-3.5 text-[13px] text-gray-500 whitespace-nowrap">{user.lastLogin}</td>
                      {/* Registered */}
                      <td className="px-4 py-3.5 text-[13px] text-gray-500 whitespace-nowrap">{user.registered}</td>
                      {/* Expiry */}
                      <td className="px-4 py-3.5"><ExpiryCell user={user} /></td>
                      {/* Revenue */}
                      <td className="px-4 py-3.5 text-right">
                        <p className="text-[13px] font-semibold text-gray-800 whitespace-nowrap">
                          {user.revenueMonthly === 0 ? "$0/mo" : `$${user.revenueMonthly}/mo`}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {user.revenueTotal === 0 ? "$0 total" : `$${user.revenueTotal.toLocaleString()} total`}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <p className="text-[12px] text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{USERS.length}</span> users
              </p>
              <div className="flex items-center gap-1.5">
                <button className="flex items-center gap-1.5 text-[12px] text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Invite User
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === 1 && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Revenue (MRR)", value: "$3,089", sub: "All active subscriptions", color: "text-green-600" },
              { label: "Annual Run Rate", value: "$37,068", sub: "MRR × 12", color: "text-blue-600" },
              { label: "Avg Revenue / User", value: "$205.93", sub: "Per active subscription", color: "text-purple-600" },
              { label: "Lifetime Value (avg)", value: "$2,471", sub: "Estimated LTV", color: "text-amber-600" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[12px] text-gray-400 mb-1.5">{label}</p>
                <p className={`text-[22px] font-bold ${color}`}>{value}</p>
                <p className="text-[11px] text-gray-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* MRR Growth */}
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

            {/* Churn Rate */}
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

          {/* Plan distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-[15px] font-bold text-gray-900 mb-4">Plan Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { plan: "Enterprise", count: 5, pct: 50, color: "bg-purple-500", light: "bg-purple-100 text-purple-700" },
                { plan: "Business", count: 2, pct: 20, color: "bg-pink-500", light: "bg-pink-100 text-pink-600" },
                { plan: "Professional", count: 2, pct: 20, color: "bg-blue-500", light: "bg-blue-100 text-blue-700" },
                { plan: "Starter", count: 1, pct: 10, color: "bg-gray-400", light: "bg-gray-100 text-gray-600" },
              ].map(({ plan, count, pct, color, light }) => (
                <div key={plan} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${light}`}>{plan}</span>
                    <span className="text-[12px] font-bold text-gray-700">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
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
