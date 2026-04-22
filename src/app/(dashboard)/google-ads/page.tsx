"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  LabelList, ComposedChart, ReferenceLine, Cell, PieChart, Pie, AreaChart, Area,
} from "recharts";

// ─── Icons ───────────────────────────────────────────────────────────────────

const I = {
  click: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11H3l6 9 3-6 6 2-9-14v9z"/></svg>,
  percent: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  cart: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  target: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  dollar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  trending: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  sparkle: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.39 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.61 8.26L12 2Z"/></svg>,
  profit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
};

// ─── Mock data ───────────────────────────────────────────────────────────────

const sparkData = (up: boolean, seed = 1) =>
  Array.from({ length: 14 }, (_, i) => ({
    v: up
      ? 30 + Math.sin(i * 0.7 + seed) * 8 + i * 2.5
      : 60 - Math.sin(i * 0.7 + seed) * 8 - i * 1.5,
  }));

const kpis = [
  { label: "Clicks", icon: I.click, value: "1.40K", delta: "+8.3%", up: true },
  { label: "Conv. Rate", icon: I.percent, value: "2.47%", delta: "-1.8%", up: false },
  { label: "Orders", icon: I.cart, value: "34.63K", delta: "+15.7%", up: true },
  { label: "CPA ($)", icon: I.target, value: "20.42", delta: "-8.2%", up: false },
  { label: "Cost ($)", icon: I.dollar, value: "701.18K", delta: "+6.4%", up: true },
  { label: "Revenue", icon: I.trending, value: "1.25K", delta: "+18.2%", up: true },
  { label: "ROAS", icon: I.refresh, value: "1.76", delta: "-12.1%", up: false },
  { label: "Ad Profit ($)", icon: I.profit, value: "538.48K", delta: "+22.8%", up: true },
];

const CAMPAIGNS = ["Brand", "Shopping", "DSA", "Remarketing", "PMax", "Search"];
const COLORS = ["#F472B6", "#FB923C", "#FACC15", "#4ADE80", "#A78BFA", "#60A5FA"];

const dates = [
  "Mar 31","Apr 1","Apr 2","Apr 3","Apr 4","Apr 5","Apr 6",
  "Apr 7","Apr 8","Apr 9","Apr 10","Apr 11","Apr 12","Apr 13",
];

const totals = [89450, 88230, 86680, 84950, 90870, 89240, 82020, 79190, 78510, 78870, 87300, 88380, 82000, 82900];

// Per-day share distribution (sums to 1.0). Shopping + Search dominate, others lighter.
const shareMatrix: number[][] = [
  [0.08, 0.22, 0.07, 0.12, 0.18, 0.33],
  [0.09, 0.20, 0.08, 0.11, 0.19, 0.33],
  [0.08, 0.24, 0.07, 0.13, 0.17, 0.31],
  [0.07, 0.23, 0.09, 0.12, 0.20, 0.29],
  [0.08, 0.21, 0.08, 0.14, 0.17, 0.32],
  [0.09, 0.22, 0.07, 0.13, 0.18, 0.31],
  [0.07, 0.25, 0.08, 0.12, 0.16, 0.32],
  [0.08, 0.23, 0.07, 0.13, 0.19, 0.30],
  [0.09, 0.21, 0.08, 0.11, 0.18, 0.33],
  [0.08, 0.24, 0.07, 0.12, 0.17, 0.32],
  [0.07, 0.22, 0.09, 0.13, 0.20, 0.29],
  [0.08, 0.23, 0.08, 0.12, 0.18, 0.31],
  [0.09, 0.21, 0.07, 0.14, 0.19, 0.30],
  [0.08, 0.22, 0.08, 0.13, 0.18, 0.31],
];

const barData = dates.map((date, di) => {
  const obj: Record<string, string | number> = { date };
  const total = totals[di];
  let used = 0;
  CAMPAIGNS.forEach((c, i) => {
    const share = i === CAMPAIGNS.length - 1 ? total - used : Math.round(total * shareMatrix[di][i]);
    obj[c] = share;
    used += share;
  });
  obj.total = total;
  return obj;
});

// ─── Ad Performance data ─────────────────────────────────────────────────────

const adPerfRaw = [
  { date: "Mar 30", clicks: 4450, convValue: 90800, profit: 70400, cost: 20400, roas: 4.45 },
  { date: "Mar 31", clicks: 3780, convValue: 97000, profit: 71400, cost: 25600, roas: 3.79 },
  { date: "Apr 1",  clicks: 740,  convValue: 94800, profit: 72400, cost: 22400, roas: 4.23 },
  { date: "Apr 2",  clicks: 4240, convValue: 98500, profit: 73500, cost: 25000, roas: 3.94 },
  { date: "Apr 3",  clicks: 3940, convValue: 94200, profit: 69400, cost: 24800, roas: 3.80 },
  { date: "Apr 4",  clicks: 3600, convValue: 89800, profit: 63300, cost: 26500, roas: 3.39 },
  { date: "Apr 5",  clicks: 3380, convValue: 89800, profit: 63200, cost: 26600, roas: 3.38 },
  { date: "Apr 6",  clicks: 3600, convValue: 98800, profit: 69700, cost: 29100, roas: 3.40 },
  { date: "Apr 7",  clicks: 3220, convValue: 94000, profit: 64800, cost: 29200, roas: 3.22 },
  { date: "Apr 8",  clicks: 980,  convValue: 100900, profit: 74900, cost: 26000, roas: 3.88 },
  { date: "Apr 9",  clicks: 3420, convValue: 90100, profit: 60600, cost: 29500, roas: 3.06 },
  { date: "Apr 10", clicks: 3580, convValue: 64900, profit: 39700, cost: 25200, roas: 2.57 },
  { date: "Apr 11", clicks: 710,  convValue: 23600, profit: -9600, cost: 33200, roas: 0.71 },
  { date: "Apr 12", clicks: 790,  convValue: 21600, profit: -5800, cost: 27400, roas: 0.79 },
];

const adPerfData = adPerfRaw.map((r) => ({
  ...r,
  costBase: r.cost,
  profitPos: Math.max(0, r.profit),
}));

// ─── Timeline data ───────────────────────────────────────────────────────────

const tlDates = adPerfRaw.map((d) => d.date);

const tlEventItems = [
  { date: "Mar 30", bg: "bg-orange-100", icon: "🎉" },
  { date: "Apr 1",  bg: "bg-blue-100",   icon: "📅" },
  { date: "Apr 2",  bg: "bg-red-100",    icon: "🎂" },
  { date: "Apr 4",  bg: "bg-green-100",  icon: "🛍️" },
  { date: "Apr 5",  bg: "bg-purple-100", icon: "⭐" },
  { date: "Apr 8",  bg: "bg-pink-100",   icon: "🎂" },
  { date: "Apr 10", bg: "bg-blue-100",   icon: "📅" },
  { date: "Apr 11", bg: "bg-orange-100", icon: "🎉" },
];

const tlAdItems = [
  { date: "Mar 30", bg: "bg-blue-100",   count: 5 },
  { date: "Mar 31", bg: "bg-orange-100", count: 5 },
  { date: "Apr 1",  bg: "bg-green-100",  count: 6 },
  { date: "Apr 2",  bg: "bg-red-100",    count: 5 },
  { date: "Apr 3",  bg: "bg-purple-100", count: 5 },
  { date: "Apr 4",  bg: "bg-blue-100",   count: 8 },
  { date: "Apr 5",  bg: "bg-orange-100", count: 5 },
  { date: "Apr 6",  bg: "bg-green-100",  count: 6 },
  { date: "Apr 7",  bg: "bg-red-100",    count: 3 },
  { date: "Apr 8",  bg: "bg-purple-100", count: 3 },
  { date: "Apr 9",  bg: "bg-blue-100",   count: 5 },
  { date: "Apr 10", bg: "bg-orange-100", count: 6 },
  { date: "Apr 11", bg: "bg-red-100",    count: 3 },
  { date: "Apr 12", bg: "bg-green-100",  count: 4 },
];

const tlWebItems = [
  { date: "Mar 31", bg: "bg-teal-100",   icon: "🌐" },
  { date: "Apr 1",  bg: "bg-blue-100",   icon: "🔧" },
  { date: "Apr 3",  bg: "bg-orange-100", icon: "💻" },
  { date: "Apr 5",  bg: "bg-teal-100",   icon: "🌐" },
  { date: "Apr 7",  bg: "bg-sky-100",    icon: "🌐" },
  { date: "Apr 9",  bg: "bg-pink-100",   icon: "🔗" },
  { date: "Apr 10", bg: "bg-teal-100",   icon: "💻" },
  { date: "Apr 11", bg: "bg-red-100",    icon: "🌐" },
  { date: "Apr 12", bg: "bg-purple-100", icon: "📊" },
];

// ─── Profit / Loss data ──────────────────────────────────────────────────────

const profitLossRaw = [
  { date: "Apr 8",  dailyProfit:  1930 },
  { date: "Apr 9",  dailyProfit:  2300 },
  { date: "Apr 10", dailyProfit:  -150 },
  { date: "Apr 11", dailyProfit:  1520 },
  { date: "Apr 12", dailyProfit: -1390 },
  { date: "Apr 13", dailyProfit:  1430 },
  { date: "Apr 14", dailyProfit:  1670 },
  { date: "Apr 15", dailyProfit:  -960 },
  { date: "Apr 16", dailyProfit:  1630 },
  { date: "Apr 17", dailyProfit:  1720 },
  { date: "Apr 18", dailyProfit:  1250 },
  { date: "Apr 19", dailyProfit:  -890 },
  { date: "Apr 20", dailyProfit:  -430 },
  { date: "Apr 21", dailyProfit:  1600 },
];

let _cumSum = 0;
const plData = profitLossRaw.map((r) => { _cumSum += r.dailyProfit; return { ...r, cumulative: _cumSum }; });
const plTotal      = plData[plData.length - 1].cumulative;
const plAvgDaily   = Math.round(plTotal / plData.length);
const plProfitDays = profitLossRaw.filter((r) => r.dailyProfit > 0).length;
const plLossDays   = profitLossRaw.filter((r) => r.dailyProfit < 0).length;

// ─── Segments data ───────────────────────────────────────────────────────────

const SEG_COLORS = ["#3B82F6","#22C55E","#F97316","#A855F7","#EF4444","#06B6D4","#EC4899","#10B981","#F59E0B","#6B7280"];

const segRevenue = [
  { name: "PMax - Men Jackets",        value: 236600 },
  { name: "Shopping - Women Sneakers", value: 231610 },
  { name: "PMax - Premium Brands",     value: 207270 },
  { name: "PMax - Women Dresses",      value: 199760 },
  { name: "PMax - Accessories",        value: 184270 },
  { name: "Search - Men Hoodies",      value: 178090 },
  { name: "Search - Men T-Shirts",     value: 167620 },
  { name: "PMax - Sportswear",         value: 142660 },
  { name: "Display - Summer Sale",     value: 135290 },
  { name: "Others",                    value: 1070000 },
];

const segAdProfit = [
  { name: "Shopping - Women Sneakers", value: 126110 },
  { name: "PMax - Premium Brands",     value: 112690 },
  { name: "PMax - Women Dresses",      value:  99880 },
  { name: "Search - Men T-Shirts",     value:  99450 },
  { name: "PMax - Men Jackets",        value:  88720 },
  { name: "Search - Men Hoodies",      value:  73330 },
  { name: "Search - Women Jeans",      value:  65430 },
  { name: "PMax - Accessories",        value:  65420 },
  { name: "PMax - Sportswear",         value:  58390 },
  { name: "Others",                    value: 377020 },
];

const segConversions = [
  { name: "Search - Men Boots",       value: 5400 },
  { name: "Search - Men Shirts",      value: 4760 },
  { name: "Search - Men Suits",       value: 4690 },
  { name: "Search - Men Jackets",     value: 3700 },
  { name: "Shopping - Men Outerwear", value: 3430 },
  { name: "Search - Women Skirts",    value: 3400 },
  { name: "PMax - Men Clothing",      value: 2960 },
  { name: "Search - Men Jeans",       value: 2950 },
  { name: "Search - Men Tops",        value: 2930 },
  { name: "Others",                   value: 37500 },
];

const campaignRows = [
  { status: "gray", name: "Search - Men T-Shirts", type: "Search", roas: "160.00%", roasColor: "green", impr: 886714, clicks: 75539, cpc: 0.25, ctr: 8.55, convRate: 0.74, conv: 563, cpa: 33.1, revenue: 87.65, cost: 18.64, profit: 69.01, roasVal: 470 },
  { status: "green", name: "Search - Men Shirts", type: "Search", roas: "94.00%", roasColor: "red", impr: 1562745, clicks: 75079, cpc: 1.05, ctr: 4.81, convRate: 2.15, conv: 1617, cpa: 48.6, revenue: 32.89, cost: 78.52, profit: -45.63, roasVal: 42 },
  { status: "gray", name: "PMax - Women Clothing", type: "PMax", roas: "117.00%", roasColor: "red", impr: 1894617, clicks: 73585, cpc: 0.81, ctr: 3.88, convRate: 0.31, conv: 227, cpa: 262.7, revenue: 29.43, cost: 59.64, profit: -30.21, roasVal: 49 },
  { status: "green", name: "Search - Men Jeans", type: "Search", roas: "160.00%", roasColor: "green", impr: 1907150, clicks: 66455, cpc: 0.49, ctr: 3.48, convRate: 1.49, conv: 993, cpa: 32.9, revenue: 16.69, cost: 32.32, profit: -15.63, roasVal: 52 },
  { status: "gray", name: "Display - Retargeting", type: "Display", roas: "196.00%", roasColor: "green", impr: 1549087, clicks: 65290, cpc: 1.45, ctr: 4.21, convRate: 1.55, conv: 1014, cpa: 93.3, revenue: 22.79, cost: 94.57, profit: -71.78, roasVal: 24 },
  { status: "gray", name: "PMax - Summer Collection", type: "PMax", roas: "null", roasColor: "gray", impr: 615426, clicks: 65273, cpc: 0.87, ctr: 10.61, convRate: 1.62, conv: 1058, cpa: 53.6, revenue: 28.17, cost: 56.66, profit: -28.48, roasVal: 50 },
  { status: "green", name: "PMax - Men Pants", type: "PMax", roas: "140.00%", roasColor: "orange", impr: 2166739, clicks: 63929, cpc: 1.50, ctr: 4.16, convRate: 1.72, conv: 1096, cpa: 31.8, revenue: 34.86, cost: 95.94, profit: -61.08, roasVal: 36 },
  { status: "green", name: "Search - Men Jackets", type: "Search", roas: "109.00%", roasColor: "red", impr: 2079414, clicks: 62116, cpc: 1.80, ctr: 2.99, convRate: 1.73, conv: 1072, cpa: 59.2, revenue: 63.47, cost: 111.73, profit: -48.27, roasVal: 57 },
  { status: "gray", name: "Search - Men Sneakers", type: "Search", roas: "167.00%", roasColor: "green", impr: 1589954, clicks: 60281, cpc: 1.74, ctr: 3.79, convRate: 2.14, conv: 1289, cpa: 81.6, revenue: 59.02, cost: 104.97, profit: -45.95, roasVal: 56 },
  { status: "green", name: "Shopping - Winter Clearance", type: "Shopping", roas: "100.00%", roasColor: "green", impr: 1127851, clicks: 60175, cpc: 0.42, ctr: 5.34, convRate: 0.27, conv: 164, cpa: 155.4, revenue: 53.61, cost: 25.49, profit: 28.13, roasVal: 210 },
];

const tabs = ["Period Analysis", "Ad Performance", "Profit / Loss", "Segments"];

type SortDir = "asc" | "desc" | null;
type SortKey = keyof (typeof campaignRows)[number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtNum = (n: number) => n.toLocaleString("en-US");
const fmtK = (n: number) => (Math.abs(n) >= 1 ? `${n.toFixed(2)}K` : n.toFixed(2));
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtCurrency = (n: number) => `$${n.toFixed(2)}`;

// Heatmap color scale: value between min/max → intensity 0..1
function heatmapBg(value: number, min: number, max: number, color: "blue" | "green" | "red"): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const alpha = 0.08 + t * 0.35;
  if (color === "blue") return `rgba(59, 130, 246, ${alpha})`;
  if (color === "green") return `rgba(34, 197, 94, ${alpha})`;
  return `rgba(239, 68, 68, ${alpha})`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, icon, value, delta, up, spark }: {
  label: string; icon: React.ReactNode; value: string; delta: string; up: boolean; spark: { v: number }[];
}) {
  const color = up ? "#22C55E" : "#EF4444";
  const gradId = `kg-${label.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-2 sm:px-4 pt-2.5 sm:pt-3.5 pb-2.5 sm:pb-0 min-w-0 flex-1 overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className={`shrink-0 ${up ? "text-green-500" : "text-red-400"}`}>{icon}</span>
          <span className="text-[10px] sm:text-[12px] text-gray-500 truncate">{label}</span>
        </div>
        <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-200 shrink-0 ml-1" />
      </div>
      <div className="flex items-baseline gap-1 sm:gap-2 mb-0 sm:mb-2.5 flex-wrap">
        <span className="text-[15px] sm:text-[20px] font-bold text-gray-900 leading-none truncate">{value}</span>
        <span className={`text-[10px] sm:text-[12px] font-semibold shrink-0 ${up ? "text-green-500" : "text-red-500"}`}>{delta}</span>
      </div>
      <div className="h-[58px] -mx-4 hidden sm:block">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="natural" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-2.5 py-2 text-[11px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </span>
          <span className="font-medium text-gray-700">${(p.value / 1000).toFixed(1)}K</span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-1.5 pt-1 flex justify-between font-semibold text-gray-800">
        <span>Total</span><span>${(total / 1000).toFixed(1)}K</span>
      </div>
    </div>
  );
};

function SortIcon({ dir }: { dir: SortDir }) {
  return (
    <span className="ml-1 text-gray-300 text-[10px]">
      {dir === "asc" ? "↑" : dir === "desc" ? "↓" : "↕"}
    </span>
  );
}

function SegmentDonut({ title, data, formatValue, highlight }: {
  title: string;
  data: { name: string; value: number }[];
  formatValue: (v: number) => string;
  highlight?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={`rounded-2xl border p-4 flex flex-col ${highlight ? "bg-green-50/40 border-green-100" : "bg-blue-50/30 border-gray-100"}`}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-[12px] font-medium cursor-pointer hover:bg-gray-50">
          {title}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <span className="text-[12px] text-gray-400">by</span>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-[12px] font-medium cursor-pointer hover:bg-gray-50">
          Campaigns
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div className="h-[220px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={105} dataKey="value" paddingAngle={1} startAngle={90} endAngle={-270} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={SEG_COLORS[i % SEG_COLORS.length]} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] text-gray-400 mb-0.5">Total</span>
          <span className="text-[20px] font-extrabold text-gray-900 leading-none">{formatValue(total)}</span>
        </div>
      </div>
      <div className="space-y-1.5 mt-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SEG_COLORS[i % SEG_COLORS.length] }} />
              <span className="text-gray-600 truncate">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-800 ml-2 shrink-0">{formatValue(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MONTH_IDX: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
function isWeekend(dateStr: string) {
  const [m, d] = dateStr.split(" ");
  const day = new Date(2026, MONTH_IDX[m], parseInt(d)).getDay();
  return day === 0 || day === 6;
}

const BarXTick = (props: unknown) => {
  const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
  const weekend = isWeekend(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} fill={weekend ? "#3B82F6" : "#9CA3AF"} fontSize={11} textAnchor="middle" fontWeight={weekend ? 700 : 400}>
        {payload.value}
      </text>
    </g>
  );
};

// Custom label renderer for stacked bar totals — hidden on narrow bars
const renderTotalLabel = (props: unknown) => {
  const p = props as { x?: number | string; y?: number | string; width?: number | string; value?: number | string | null };
  const x = typeof p.x === "number" ? p.x : 0;
  const y = typeof p.y === "number" ? p.y : 0;
  const width = typeof p.width === "number" ? p.width : 0;
  const value = typeof p.value === "number" ? p.value : 0;
  if (width < 30) return null;
  return (
    <text x={x + width / 2} y={y - 6} fill="#374151" fontSize={10} fontWeight={600} textAnchor="middle">
      ${(value / 1000).toFixed(1)}K
    </text>
  );
};

// ─── Ad Performance helpers ───────────────────────────────────────────────────

const AdXTick = (props: unknown) => {
  const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
  const item = adPerfData.find((d) => d.date === payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      {/* ROAS dot — sits exactly on the X-axis line */}
      <circle cx={0} cy={5} r={3.5} fill="#8B5CF6" />
      <text x={0} y={0} dy={20} fill="#6B7280" fontSize={10} textAnchor="middle" fontWeight={500}>
        {item ? `${(item.clicks / 1000).toFixed(2)}K` : ""}
      </text>
      <text x={0} y={0} dy={32} fill="#9CA3AF" fontSize={10} textAnchor="middle">
        {payload.value}
      </text>
      <text x={0} y={0} dy={44} fill="#8B5CF6" fontSize={9} textAnchor="middle" fontWeight={600}>
        {item ? `${item.roas.toFixed(2)}x` : ""}
      </text>
    </g>
  );
};

const AdTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const item = adPerfData.find((d) => d.date === label);
  if (!item) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2.5 text-[11px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      <div className="flex justify-between gap-4"><span className="text-gray-500">Conv. Value</span><span className="font-semibold text-gray-800">${(item.convValue / 1000).toFixed(1)}K</span></div>
      <div className="flex justify-between gap-4"><span className="text-green-600">Profit</span><span className={`font-semibold ${item.profit < 0 ? "text-red-600" : "text-green-700"}`}>{item.profit < 0 ? "-" : ""}${(Math.abs(item.profit) / 1000).toFixed(1)}K</span></div>
      <div className="flex justify-between gap-4"><span className="text-red-400">Cost</span><span className="font-semibold text-gray-800">${(item.cost / 1000).toFixed(1)}K</span></div>
      <div className="flex justify-between gap-4 border-t border-gray-100 mt-1.5 pt-1"><span className="text-purple-500">ROAS</span><span className="font-semibold text-gray-800">{item.roas.toFixed(2)}x</span></div>
      <div className="flex justify-between gap-4"><span className="text-gray-400">Clicks</span><span className="font-semibold text-gray-800">{(item.clicks / 1000).toFixed(2)}K</span></div>
    </div>
  );
};

const PlTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  const item = plData.find((d) => d.date === label);
  if (!item) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2.5 text-[11px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      <div className="flex justify-between gap-4"><span className="text-green-600">Cumulative</span><span className="font-semibold text-green-700">${(item.cumulative / 1000).toFixed(2)}K</span></div>
      <div className="flex justify-between gap-4">
        <span className={item.dailyProfit < 0 ? "text-red-400" : "text-gray-500"}>Daily</span>
        <span className={`font-semibold ${item.dailyProfit < 0 ? "text-red-600" : "text-green-700"}`}>
          {item.dailyProfit < 0 ? "-$" : "$"}{(Math.abs(item.dailyProfit) / 1000).toFixed(2)}K
        </span>
      </div>
    </div>
  );
};

const renderConvLabel = (props: unknown) => {
  const p = props as { x?: number; y?: number; width?: number; value?: number; index?: number };
  const x = p.x ?? 0; const y = p.y ?? 0; const width = p.width ?? 0; const idx = p.index ?? 0;
  if (width < 24) return null;
  const item = adPerfData[idx];
  if (!item || item.profit < 0) return null;
  return (
    <text x={x + width / 2} y={y - 5} fill="#374151" fontSize={9} fontWeight={700} textAnchor="middle">
      ${(item.convValue / 1000).toFixed(1)}K
    </text>
  );
};

const renderProfitLabel = (props: unknown) => {
  const p = props as { x?: number; y?: number; width?: number; height?: number; value?: number };
  const x = p.x ?? 0, y = p.y ?? 0, w = p.width ?? 0, h = p.height ?? 0, val = p.value ?? 0;
  if (w < 34 || h < 16 || val <= 0) return null;
  return <text x={x + w / 2} y={y + h / 2 + 4} fill="white" fontSize={9} fontWeight={700} textAnchor="middle">${(val / 1000).toFixed(1)}K</text>;
};

const renderCostLabel = (props: unknown) => {
  const p = props as { x?: number; y?: number; width?: number; height?: number; index?: number };
  const x = p.x ?? 0, y = p.y ?? 0, w = p.width ?? 0, h = p.height ?? 0, idx = p.index ?? 0;
  if (w < 34 || h < 16) return null;
  const item = adPerfData[idx];
  if (!item) return null;
  return <text x={x + w / 2} y={y + h / 2 + 4} fill="white" fontSize={9} fontWeight={700} textAnchor="middle">${(item.cost / 1000).toFixed(1)}K</text>;
};

const renderPlLabel = (props: unknown) => {
  const p = props as { x?: number; y?: number; width?: number; value?: number };
  const x = p.x ?? 0, y = p.y ?? 0, w = p.width ?? 0, val = p.value ?? 0;
  if (w < 32) return null;
  return (
    <text x={x + w / 2} y={y - 5} fill="#374151" fontSize={10} fontWeight={700} textAnchor="middle">
      ${(val / 1000).toFixed(2)}K
    </text>
  );
};

const renderLossTopLabel = (props: unknown) => {
  const p = props as { x?: number; y?: number; width?: number; index?: number };
  const x = p.x ?? 0, y = p.y ?? 0, w = p.width ?? 0, idx = p.index ?? 0;
  if (w < 24) return null;
  const item = adPerfData[idx];
  if (!item || item.profit >= 0) return null;
  return (
    <g>
      <text x={x + w / 2} y={y - 14} fill="#3B82F6" fontSize={9} fontWeight={700} textAnchor="middle">
        ${(item.convValue / 1000).toFixed(1)}K
      </text>
      <text x={x + w / 2} y={y - 3} fill="#EF4444" fontSize={9} fontWeight={700} textAnchor="middle">
        -{(Math.abs(item.profit) / 1000).toFixed(1)}K
      </text>
    </g>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GoogleAdsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<SortKey | null>("clicks");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [campaignDropdownOpen, setCampaignDropdownOpen] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [expandedNameIdx, setExpandedNameIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const totalPages = 5;

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 640);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSort = (col: SortKey) => {
    if (sortCol === col) {
      const next: SortDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      setSortDir(next);
      if (next === null) setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const types = ["All", ...Array.from(new Set(campaignRows.map((r) => r.type)))];

  const filtered = useMemo(() => {
    let rows = typeFilter === "All" ? campaignRows : campaignRows.filter((r) => r.type === typeFilter);
    if (selectedCampaigns.size > 0) rows = rows.filter((r) => selectedCampaigns.has(r.name));
    if (sortCol && sortDir) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol]; const bv = b[sortCol];
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [typeFilter, selectedCampaigns, sortCol, sortDir]);

  // Compute min/max for heatmap columns
  const heatCols = useMemo(() => {
    const keys = ["impr","clicks","cpc","ctr","convRate","conv","cpa","revenue","cost","profit","roasVal"] as const;
    const result = {} as Record<typeof keys[number], { min: number; max: number }>;
    keys.forEach((k) => {
      const vals = campaignRows.map((r) => r[k] as number);
      result[k] = { min: Math.min(...vals), max: Math.max(...vals) };
    });
    return result;
  }, []);

  const cellStyle = (col: keyof typeof heatCols, value: number, color: "blue" | "green" | "red") => ({
    backgroundColor: heatmapBg(value, heatCols[col].min, heatCols[col].max, color),
  });

  return (
    <div className="px-4 sm:px-6 py-6 bg-[#f4f6fb] min-h-screen">
      {/* Header */}
      <div className="hidden sm:flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-gray-900 leading-tight">Google Ads</h1>
            <p className="text-[12px] text-gray-400">Campaign Performance Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-50">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Mar 31 – Apr 13, 2026
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 sm:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3 mb-5">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} label={k.label} icon={k.icon} value={k.value} delta={k.delta} up={k.up} spark={sparkData(k.up, i)} />
        ))}
      </div>

      {/* Chart card — fills viewport so table is below the fold */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        {/* Tabs */}
        <div className="flex items-center justify-between gap-3 mb-5 min-w-0">
          {/* Mobile: dropdown */}
          <div className="sm:hidden relative flex-1">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(Number(e.target.value))}
              className="w-full appearance-none text-[13px] font-medium border border-gray-200 rounded-lg px-3 py-2 outline-none bg-white pr-8 cursor-pointer"
            >
              {tabs.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {/* Desktop: tab buttons */}
          <div className="hidden sm:flex gap-1 border-b border-gray-100 flex-1 overflow-x-auto scrollbar-none min-w-0">
            {tabs.map((t, i) => (
              <button key={t} onClick={() => setActiveTab(i)}
                className={`px-3 py-2 text-[13px] font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === i ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-[13px] font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition shrink-0 border border-purple-200">
            <span className="text-purple-500">{I.sparkle}</span>
            <span className="hidden sm:inline">AI Assistant</span>
            <span className="sm:hidden">AI</span>
          </button>
        </div>

        {/* Chart controls */}
        <div className="flex items-center justify-between gap-2 mb-4 text-[13px]">
          {activeTab === 0 && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 font-medium whitespace-nowrap">
                Revenue
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <span className="text-gray-400 text-[12px] shrink-0">by</span>
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 font-medium whitespace-nowrap">
                Campaign
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          )}
          {activeTab === 1 && (
            <p className="text-[12px] text-gray-400">Conversion value, profit, cost, clicks &amp; ROAS over time</p>
          )}
          {activeTab === 2 && (
            <div className="flex items-center gap-3 flex-wrap text-[12px]">
              <span className="text-gray-600">Total: <span className="text-green-700 font-bold">${(plTotal / 1000).toFixed(1)}K</span></span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Avg Daily: <span className="font-bold">${(plAvgDaily / 1000).toFixed(1)}K</span></span>
              <span className="text-gray-400">|</span>
              <span className="text-green-600 font-semibold">↗ {plProfitDays} days</span>
              <span className="text-gray-400">|</span>
              <span className="text-red-500 font-semibold">↘ {plLossDays} days</span>
            </div>
          )}
          {activeTab !== 0 && activeTab !== 1 && activeTab !== 2 && <div />}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 whitespace-nowrap shrink-0">
            Days
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* ── Period Analysis chart ── */}
        {activeTab === 0 && (
          <>
            <div className="sm:overflow-x-auto scrollbar-none -mx-1 px-1 outline-none focus:outline-none">
              <div className="h-[260px] sm:h-[340px] lg:h-[calc(100vh-500px)] lg:min-h-[360px] sm:min-w-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="18%" margin={{ top: 28, right: 10, left: -10, bottom: isMobile ? 0 : 4 }}>
                    <XAxis dataKey="date" tick={isMobile && barData.length > 8 ? false : <BarXTick />} axisLine={false} tickLine={false} height={isMobile && barData.length > 8 ? 4 : 30} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}K`} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99, 102, 241, 0.05)" }} />
                    {CAMPAIGNS.map((c, i) => (
                      <Bar key={c} dataKey={c} stackId="a" fill={COLORS[i]} radius={i === CAMPAIGNS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
                        {i === CAMPAIGNS.length - 1 && <LabelList dataKey="total" content={renderTotalLabel} />}
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 justify-center">
              {CAMPAIGNS.map((c, i) => (
                <div key={c} className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] text-gray-500">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i] }} />
                  {c}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Ad Performance chart ── */}
        {activeTab === 1 && (
          <>
            <div className="overflow-x-auto scrollbar-none -mx-1 px-1 outline-none focus:outline-none">
              <div className="h-[260px] sm:h-[340px] lg:h-[calc(100vh-480px)] lg:min-h-[380px] min-w-[1800px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={adPerfData} barCategoryGap="2%" margin={{ top: 28, right: 48, left: -10, bottom: 30 }}>
                    <XAxis dataKey="date" tick={<AdXTick />} axisLine={false} tickLine={false} height={60} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}K`} label={{ value: "Conv. Value / Profit / Cost", angle: -90, position: "insideLeft", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 9 } }} />
                    <YAxis yAxisId="right" orientation="right" hide domain={[0, 6]} />
                    <YAxis yAxisId="clicks" orientation="right" tick={{ fontSize: 9, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} domain={[0, 8000]} label={{ value: "Clicks", angle: 90, position: "insideRight", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 9 } }} />
                    <ReferenceLine yAxisId="left" y={0} stroke="#E5E7EB" strokeWidth={1} />
                    <Tooltip content={<AdTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />

                    {/* Cost base */}
                    <Bar yAxisId="left" dataKey="costBase" stackId="a" radius={[0, 0, 3, 3]} isAnimationActive={false}>
                      {adPerfData.map((_, i) => <Cell key={i} fill="#F87171" fillOpacity={0.9} />)}
                      <LabelList dataKey="costBase" content={renderCostLabel} />
                      <LabelList dataKey="costBase" content={renderLossTopLabel} />
                    </Bar>

                    {/* Profit positive (green, on top of cost) */}
                    <Bar yAxisId="left" dataKey="profitPos" stackId="a" fill="#4ADE80" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      <LabelList dataKey="profitPos" content={renderProfitLabel} />
                      <LabelList dataKey="profitPos" content={renderConvLabel} />
                    </Bar>

                    {/* Clicks line */}
                    <Line yAxisId="clicks" type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={1.5} dot={{ fill: "#3B82F6", r: 2.5, strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 justify-center text-[11px] sm:text-[12px] text-gray-500">
              {[
                { label: "Conv. Value", color: "#0EA5E9" },
                { label: "Profit", color: "#4ADE80" },
                { label: "Cost", color: "#F87171" },
                { label: "Clicks", color: "#3B82F6", line: true },
                { label: "ROAS", color: "#8B5CF6", dot: true },
              ].map(({ label, color, line, dot }) => (
                <div key={label} className="flex items-center gap-1.5">
                  {line
                    ? <div className="w-4 h-0.5 rounded-full" style={{ background: color }} />
                    : dot
                    ? <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                    : <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
                  }
                  {label}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Profit / Loss chart ── */}
        {activeTab === 2 && (
          <>
            <div className="overflow-x-auto scrollbar-none -mx-1 px-1 outline-none focus:outline-none">
              <div className="h-[260px] sm:h-[340px] lg:h-[calc(100vh-480px)] lg:min-h-[380px] min-w-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={plData} barCategoryGap="18%" margin={{ top: 28, right: 56, left: -10, bottom: 5 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                      label={{ value: "Cumulative Profit", angle: -90, position: "insideLeft", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 9 } }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                      label={{ value: "Daily Profit", angle: 90, position: "insideRight", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 9 } }} />
                    <ReferenceLine yAxisId="left" y={7000} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 3" />
                    <ReferenceLine yAxisId="left" y={3500} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 3" />
                    <Tooltip content={<PlTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                    <Bar yAxisId="left" dataKey="cumulative" fill="#4ADE80" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                      <LabelList dataKey="cumulative" content={renderPlLabel} />
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="dailyProfit" stroke="#1F2937" strokeWidth={1.5} strokeDasharray="4 3"
                      dot={(dotProps: unknown) => {
                        const p = dotProps as { cx: number; cy: number; index: number; key?: string };
                        const item = plData[p.index];
                        return <circle key={p.index} cx={p.cx} cy={p.cy} r={3} fill={item && item.dailyProfit < 0 ? "#EF4444" : "#1F2937"} stroke="none" />;
                      }}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center text-[11px] sm:text-[12px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm shrink-0 bg-[#4ADE80]" />
                Cumulative Profit
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0 bg-[#1F2937]" />
                Daily Profit
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full shrink-0 bg-red-400" />
                Loss Day
              </div>
            </div>
          </>
        )}

        {/* ── Segments chart ── */}
        {activeTab === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SegmentDonut title="Revenue" data={segRevenue}
              formatValue={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(2)}K`} />
            <SegmentDonut title="Ad Profit" data={segAdProfit}
              formatValue={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(2)}K`}
              highlight />
            <SegmentDonut title="Conversions" data={segConversions}
              formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(2)}K` : String(v)} />
          </div>
        )}

        {/* Event Timeline */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div className="flex items-start gap-2">
              <button onClick={() => setTimelineOpen(!timelineOpen)} className="text-gray-400 hover:text-gray-600 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`transition-transform duration-200 ${timelineOpen ? "" : "-rotate-90"}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-800">Event Timeline</span>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">109</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">Campaign changes, business updates, holidays, and performance anomalies</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Event
              </button>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500">
                <span>Holidays:</span>
                <span className="w-5 h-5 rounded bg-orange-100 flex items-center justify-center text-[10px]">🎉</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500">
                <span>Ads:</span>
                {["bg-blue-100","bg-orange-100","bg-red-100","bg-green-100","bg-purple-100"].map((c, i) => (
                  <span key={i} className={`w-5 h-5 rounded ${c} flex items-center justify-center text-[9px]`}>⚡</span>
                ))}
                <span className="text-[10px] text-gray-400">+4</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-500">
                <span>Website:</span>
                {["bg-teal-100","bg-blue-100","bg-orange-100","bg-pink-100"].map((c, i) => (
                  <span key={i} className={`w-5 h-5 rounded ${c} flex items-center justify-center text-[9px]`}>🌐</span>
                ))}
                <span className="text-[10px] text-gray-400">+6</span>
              </div>
            </div>
          </div>

          {/* Timeline grid */}
          {timelineOpen && isMobile && isPortrait && (
            <div className="mt-2 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[12px] text-blue-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-blue-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <p><span className="font-semibold">Events Timeline</span> is available on wider screens. Rotate to landscape mode or open on a larger screen to view the full timeline.</p>
            </div>
          )}
          {timelineOpen && (!isMobile || !isPortrait) && (
            <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
              <div className="min-w-[600px]">
                {/* Date row */}
                <div className="flex border-b border-gray-100 pb-1.5 mb-0.5">
                  <div className="w-[64px] shrink-0" />
                  {tlDates.map((date) => (
                    <div key={date} className={`flex-1 text-center text-[9px] font-semibold ${
                      isWeekend(date) ? "text-blue-500" : "text-gray-400"
                    }`}>{date}</div>
                  ))}
                </div>

                {/* Events row */}
                <div className="flex items-center py-1.5">
                  <div className="w-[64px] shrink-0 pr-2 flex flex-col items-end gap-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span className="text-[9px] font-semibold text-blue-500">Events</span>
                  </div>
                  <div className="flex-1 flex relative">
                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-100" />
                    {tlDates.map((date) => {
                      const item = tlEventItems.find((e) => e.date === date);
                      return (
                        <div key={date} className="flex-1 flex justify-center relative z-10">
                          {item
                            ? <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] ${item.bg} shadow-sm ring-1 ring-white`}>{item.icon}</span>
                            : <span className="w-[4px] h-[4px] rounded-full bg-gray-200 self-center" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ads row */}
                <div className="flex items-center py-1">
                  <div className="w-[64px] shrink-0 pr-2 flex flex-col items-end gap-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span className="text-[9px] font-semibold text-orange-500">Ads</span>
                  </div>
                  <div className="flex-1 flex relative">
                    <div className="absolute top-1/3 left-0 right-0 border-t border-dashed border-gray-100" />
                    {tlDates.map((date) => {
                      const item = tlAdItems.find((e) => e.date === date);
                      return (
                        <div key={date} className="flex-1 flex flex-col items-center relative z-10">
                          {item ? (
                            <>
                              <span className={`w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] ${item.bg} shadow-sm ring-1 ring-white font-bold`}>⚡</span>
                              <span className="text-[8px] text-orange-400 font-semibold leading-tight mt-0.5">+{item.count}</span>
                            </>
                          ) : (
                            <span className="w-[4px] h-[4px] rounded-full bg-gray-200 mt-[9px]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Website row */}
                <div className="flex items-center py-1.5">
                  <div className="w-[64px] shrink-0 pr-2 flex flex-col items-end gap-0.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    <span className="text-[9px] font-semibold text-pink-500">Website</span>
                  </div>
                  <div className="flex-1 flex relative">
                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-100" />
                    {tlDates.map((date) => {
                      const item = tlWebItems.find((e) => e.date === date);
                      return (
                        <div key={date} className="flex-1 flex justify-center relative z-10">
                          {item
                            ? <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] ${item.bg} shadow-sm ring-1 ring-white`}>{item.icon}</span>
                            : <span className="w-[4px] h-[4px] rounded-full bg-gray-200 self-center" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-4 flex items-start justify-between flex-wrap gap-3 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-gray-900">Campaign Performance</h2>
            <p className="text-[12px] text-gray-400 mt-0.5 hidden sm:block">Detailed analytics for 45 campaigns • Mar 31, 2026 – Apr 13, 2026</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <span className="text-[12px] text-gray-500 hidden sm:inline">Filters:</span>

            {/* Campaign Name multi-select dropdown */}
            <div className="relative">
              <button
                onClick={() => setCampaignDropdownOpen(!campaignDropdownOpen)}
                className={`flex items-center gap-1.5 text-[12px] border rounded-lg px-2.5 py-1.5 transition whitespace-nowrap ${
                  selectedCampaigns.size > 0
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Campaign Name
                {selectedCampaigns.size > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{selectedCampaigns.size}</span>
                )}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`transition-transform ${campaignDropdownOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {campaignDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCampaignDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 w-[240px] bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2 py-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input
                          autoFocus
                          value={campaignSearch}
                          onChange={(e) => setCampaignSearch(e.target.value)}
                          placeholder="Type to search"
                          className="text-[12px] outline-none w-full bg-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox"
                          checked={selectedCampaigns.size === campaignRows.length}
                          onChange={() => {
                            if (selectedCampaigns.size === campaignRows.length) setSelectedCampaigns(new Set());
                            else setSelectedCampaigns(new Set(campaignRows.map((r) => r.name)));
                          }}
                          className="rounded"
                        />
                        <span className="text-[11px] text-gray-500">
                          {selectedCampaigns.size === 0 ? "Select All" : `${selectedCampaigns.size} of 45 selected`}
                        </span>
                      </label>
                      {selectedCampaigns.size > 0 && (
                        <button onClick={() => setSelectedCampaigns(new Set())} className="text-[11px] text-gray-400 hover:text-gray-700 transition">× Clear</button>
                      )}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {campaignRows
                        .filter((r) => r.name.toLowerCase().includes(campaignSearch.toLowerCase()))
                        .map((r) => (
                          <label key={r.name} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                            <input type="checkbox"
                              checked={selectedCampaigns.has(r.name)}
                              onChange={() => {
                                const next = new Set(selectedCampaigns);
                                next.has(r.name) ? next.delete(r.name) : next.add(r.name);
                                setSelectedCampaigns(next);
                              }}
                              className="rounded"
                            />
                            <span className="text-[12px] text-gray-700">{r.name}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 bg-white">
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 bg-white">
              <option>Status</option><option>Active</option><option>Paused</option>
            </select>
            {(selectedCampaigns.size > 0 || typeFilter !== "All") && (
              <button
                onClick={() => { setSelectedCampaigns(new Set()); setTypeFilter("All"); }}
                className="text-[12px] text-blue-600 hover:text-blue-800 transition whitespace-nowrap"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse min-w-[1280px]">
            <colgroup>
              <col className="w-10" />
              <col className="w-14" />
              <col className="w-[75px]" />
              <col className="w-[90px]" />
              <col className="w-[108px]" />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-3 py-2.5 sticky left-0 z-20 bg-gray-50"><input type="checkbox" className="rounded" /></th>
                <th className="px-2 py-2.5 text-left text-gray-500 font-medium text-[11px] sticky left-10 z-20 bg-gray-50">Status</th>
                {([
                  ["Campaign","name","left"],["Type","type","left"],["Target ROAS","roas","left"],
                  ["Impr.","impr","right"],["Clicks","clicks","right"],["CPC","cpc","right"],["CTR","ctr","right"],
                  ["Conv. rate","convRate","right"],["Conv.","conv","right"],["CPA","cpa","right"],
                  ["Revenue","revenue","right"],["Cost","cost","right"],["Profit (ads)","profit","right"],["ROAS","roasVal","right"],
                ] as [string, SortKey, "left" | "right"][]).map(([label, col, align]) => (
                  <th key={col} onClick={() => handleSort(col)}
                    style={col === "name" ? { maxWidth: 75 } : undefined}
                    className={`px-2.5 py-2.5 text-${align} text-gray-500 font-medium whitespace-nowrap cursor-pointer hover:text-gray-700 select-none text-[11px]${col === "name" ? " sticky left-24 z-20 bg-gray-50 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-200 overflow-hidden" : ""}`}>
                    {label}<SortIcon dir={sortCol === col ? sortDir : null} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-blue-50/20 transition group">
                  <td className="px-3 py-2.5 sticky left-0 z-10 bg-white group-hover:bg-blue-50/20 transition"><input type="checkbox" className="rounded" /></td>
                  <td className="px-2 py-2.5 sticky left-10 z-10 bg-white group-hover:bg-blue-50/20 transition">
                    <span className={`w-2 h-2 rounded-full inline-block ${row.status === "green" ? "bg-green-500" : "bg-gray-300"}`} />
                  </td>
                  <td
                    className="px-2.5 py-2.5 sticky left-24 z-10 bg-white group-hover:bg-blue-50/20 transition after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-100 cursor-pointer"
                    style={{ maxWidth: 75 }}
                    onClick={() => setExpandedNameIdx(expandedNameIdx === i ? null : i)}
                    title={row.name}
                  >
                    <span className={`font-medium text-gray-800 text-[12px] hover:text-blue-600 transition block ${expandedNameIdx === i ? "whitespace-normal break-words" : "whitespace-nowrap overflow-hidden text-ellipsis"}`}>
                      {row.name}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">{row.type}</span>
                  </td>
                  <td className="px-2.5 py-2.5">
                    {row.roas !== "null" ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.roasColor === "red" ? "bg-red-100 text-red-600" :
                        row.roasColor === "orange" ? "bg-orange-100 text-orange-600" :
                        row.roasColor === "green" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>{row.roas}</span>
                    ) : <span className="text-gray-300 text-[11px]">null</span>}
                  </td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("impr", row.impr, "blue")}>{fmtNum(row.impr)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("clicks", row.clicks, "blue")}>{fmtNum(row.clicks)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("cpc", row.cpc, "blue")}>{fmtCurrency(row.cpc)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("ctr", row.ctr, "blue")}>{fmtPct(row.ctr)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("convRate", row.convRate, "blue")}>{fmtPct(row.convRate)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("conv", row.conv, "blue")}>{fmtNum(row.conv)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("cpa", row.cpa, "green")}>{row.cpa.toFixed(1)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums font-medium" style={cellStyle("revenue", row.revenue, "green")}>${fmtK(row.revenue)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("cost", row.cost, "blue")}>${fmtK(row.cost)}</td>
                  <td className={`px-2.5 py-2.5 text-right tabular-nums ${row.profit < 0 ? "text-red-600" : "text-green-700"}`}
                    style={cellStyle("profit", Math.abs(row.profit), row.profit < 0 ? "red" : "green")}>
                    {row.profit < 0 ? "-" : ""}{Math.abs(row.profit).toFixed(2)}K
                  </td>
                  <td className={`px-2.5 py-2.5 text-right tabular-nums ${row.roasVal >= 100 ? "text-green-700" : "text-red-600"}`}
                    style={cellStyle("roasVal", row.roasVal, row.roasVal >= 100 ? "green" : "red")}>
                    {row.roasVal}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-gray-800 text-[12px]">
                <td className="px-3 py-3 sticky left-0 z-10 bg-gray-50" colSpan={5}>Total (45 campaigns)</td>
                <td className="px-2.5 py-3 text-right tabular-nums">10,073,857</td>
                <td className="px-2.5 py-3 text-right tabular-nums">115,078</td>
                <td className="px-2.5 py-3 text-right tabular-nums">$3.82</td>
                <td className="px-2.5 py-3 text-right tabular-nums">1.14%</td>
                <td className="px-2.5 py-3 text-right tabular-nums">0.58%</td>
                <td className="px-2.5 py-3 text-right tabular-nums">3.19K</td>
                <td className="px-2.5 py-3 text-right tabular-nums">137.6</td>
                <td className="px-2.5 py-3 text-right tabular-nums">$670.34K</td>
                <td className="px-2.5 py-3 text-right tabular-nums">$439.18K</td>
                <td className="px-2.5 py-3 text-right tabular-nums">-231.17K</td>
                <td className="px-2.5 py-3 text-right tabular-nums">152.64%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2 border-t border-gray-100">
          <p className="text-[12px] text-gray-500">
            <span className="hidden sm:inline">Showing 1 to 10 of 45 campaigns</span>
            <span className="sm:hidden">1–10 / 45</span>
            <span className="mx-2 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Rows per page:</span>
            <select className="ml-1.5 text-[12px] border border-gray-200 rounded px-1.5 py-0.5 bg-white outline-none">
              <option>10</option><option>20</option><option>50</option>
            </select>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {[1,2,3,4,5].map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-[12px] font-medium transition ${
                  page === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
