"use client";

import React from "react";

// ─── Icons ───────────────────────────────────────────────────────────────────

export const I = {
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartMetric = "Revenue" | "Cost" | "Clicks";
export type ChartGroupBy = "Campaign" | "Type";
export type SortDir = "asc" | "desc" | null;
export type SortKey = keyof (typeof campaignRows)[number];
export type AiMessage = { id: number; role: "assistant" | "user"; text: string; time: string; suggestions?: string[]; pinned: boolean };
export type AdPerfItem = { date: string; convValue: number; cost: number; profit: number; clicks: number; roas: number; costBar: number; profitBar: number };
export type PlItem = { date: string; dailyProfit: number; cumulative: number };

// ─── Mock data ───────────────────────────────────────────────────────────────

const _today = new Date();
_today.setUTCHours(0, 0, 0, 0);
export const END_MS_NOW = _today.getTime();

export const SPARK_DATES = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(END_MS_NOW);
  d.setUTCDate(d.getUTCDate() - (13 - i));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});

export const sparkData = (up: boolean, seed = 1) =>
  Array.from({ length: 14 }, (_, i) => ({
    v: up
      ? 30 + Math.sin(i * 0.7 + seed) * 8 + i * 2.5
      : 60 - Math.sin(i * 0.7 + seed) * 8 - i * 1.5,
    date: SPARK_DATES[i],
  }));

export const kpis = [
  { label: "Clicks", shortLabel: "Clicks", icon: I.click, value: "1.40K", delta: "+8.3%", up: true,
    desc: "Total ad clicks in the selected period",
    hoverFmt: (v: number) => `${(v * 0.0083 + 0.95).toFixed(2)}K` },
  { label: "Conv. Rate", shortLabel: "CVR", icon: I.percent, value: "2.47%", delta: "-1.8%", up: false,
    desc: "% of clicks that result in a conversion",
    hoverFmt: (v: number) => `${(v * 0.032).toFixed(2)}%` },
  { label: "Orders", shortLabel: "Orders", icon: I.cart, value: "34.63K", delta: "+15.7%", up: true,
    desc: "Total completed orders attributed to ads",
    hoverFmt: (v: number) => `${(v * 0.12 + 27).toFixed(2)}K` },
  { label: "CPA ($)", shortLabel: "CPA", icon: I.target, value: "20.42", delta: "-8.2%", up: false,
    desc: "Average cost per conversion/acquisition",
    hoverFmt: (v: number) => `$${(63 - v * 0.69).toFixed(2)}` },
  { label: "Cost ($)", shortLabel: "Cost", icon: I.dollar, value: "701.18K", delta: "+6.4%", up: true,
    desc: "Total advertising spend in the period",
    hoverFmt: (v: number) => `$${(v * 2 + 590).toFixed(0)}K` },
  { label: "Revenue", shortLabel: "Revenue", icon: I.trending, value: "1.25K", delta: "+18.2%", up: true,
    desc: "Total revenue generated from ad-driven sales",
    hoverFmt: (v: number) => `${(v * 0.006 + 0.92).toFixed(2)}K` },
  { label: "ROAS", shortLabel: "ROAS", icon: I.refresh, value: "1.76", delta: "-12.1%", up: false,
    desc: "Return on ad spend — revenue divided by cost",
    hoverFmt: (v: number) => `${(2.3 - v * 0.012).toFixed(2)}x` },
  { label: "Ad Profit ($)", shortLabel: "Profit", icon: I.profit, value: "538.48K", delta: "+22.8%", up: true,
    desc: "Revenue minus total advertising costs",
    hoverFmt: (v: number) => `$${(v * 1.9 + 413).toFixed(0)}K` },
];

export const CAMPAIGNS = [
  "Search - Men T-Shirts", "Search - Men Shirts", "PMax - Women Clothing",
  "Search - Men Jeans", "Display - Retargeting", "PMax - Summer Collection",
  "PMax - Men Pants", "Search - Men Jackets", "Search - Men Sneakers",
  "Shopping - Winter Clearance"
];
export const COLORS = ["#F472B6", "#FB923C", "#FACC15", "#4ADE80", "#A78BFA", "#60A5FA", "#3b82f6", "#10b981", "#f59e0b", "#6366f1"];

export const CAMPAIGN_TYPE_MAP: Record<string, string> = {
  "Search - Men T-Shirts": "Search", "Search - Men Shirts": "Search", "PMax - Women Clothing": "PMax",
  "Search - Men Jeans": "Search", "Display - Retargeting": "Display", "PMax - Summer Collection": "PMax",
  "PMax - Men Pants": "PMax", "Search - Men Jackets": "Search", "Search - Men Sneakers": "Search",
  "Shopping - Winter Clearance": "Shopping"
};
export const TYPES = ["Search", "Shopping", "PMax", "Display"];
export const TYPE_COLORS_MAP: Record<string, string> = {
  Search: "#60A5FA", Shopping: "#FACC15", PMax: "#A78BFA", Display: "#F472B6",
};

export const CHART_METRICS: ChartMetric[] = ["Revenue", "Cost", "Clicks"];
export const CHART_GROUPBY: ChartGroupBy[] = ["Campaign", "Type"];

// Per-day share distribution (cycling for any period length)
export const shareMatrix: number[][] = [
  [0.08, 0.12, 0.07, 0.12, 0.08, 0.13, 0.10, 0.08, 0.10, 0.12],
  [0.09, 0.11, 0.08, 0.11, 0.09, 0.12, 0.11, 0.07, 0.11, 0.11],
  [0.08, 0.13, 0.07, 0.13, 0.07, 0.11, 0.12, 0.09, 0.09, 0.11],
  [0.07, 0.12, 0.09, 0.12, 0.10, 0.10, 0.11, 0.10, 0.10, 0.09],
  [0.08, 0.11, 0.08, 0.14, 0.08, 0.12, 0.09, 0.11, 0.10, 0.09],
  [0.09, 0.12, 0.07, 0.13, 0.08, 0.11, 0.10, 0.12, 0.09, 0.09],
  [0.07, 0.15, 0.08, 0.12, 0.06, 0.12, 0.08, 0.13, 0.08, 0.11],
  [0.08, 0.13, 0.07, 0.13, 0.09, 0.10, 0.11, 0.10, 0.10, 0.09],
  [0.09, 0.11, 0.08, 0.11, 0.08, 0.13, 0.10, 0.12, 0.08, 0.10],
  [0.08, 0.14, 0.07, 0.12, 0.07, 0.12, 0.09, 0.13, 0.09, 0.09],
  [0.07, 0.12, 0.09, 0.13, 0.10, 0.09, 0.11, 0.12, 0.08, 0.09],
  [0.08, 0.13, 0.08, 0.12, 0.08, 0.11, 0.10, 0.12, 0.09, 0.09],
  [0.09, 0.11, 0.07, 0.14, 0.09, 0.10, 0.11, 0.13, 0.08, 0.08],
  [0.08, 0.12, 0.08, 0.13, 0.08, 0.11, 0.10, 0.12, 0.09, 0.09],
];

// ─── Period presets & data generation ────────────────────────────────────────

export const PERIOD_PRESETS = [
  { label: "Last 7 days",  days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
];

export const END_MS = END_MS_NOW;
export const DAY_MS = 86400000;

export const fmtMs = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const TYPE_TO_GROUPS: Record<string, string[]> = {
  Search: ["Search"],
  PMax: ["PMax"],
  Shopping: ["Shopping"],
  Display: ["Remarketing"],
};

// ─── Timeline data (static — event log independent of period) ────────────────

export const tlEventItems = [
  { date: "Mar 30", bg: "bg-orange-100", icon: "🎉" },
  { date: "Apr 1",  bg: "bg-blue-100",   icon: "📅" },
  { date: "Apr 2",  bg: "bg-red-100",    icon: "🎂" },
  { date: "Apr 4",  bg: "bg-green-100",  icon: "🛍️" },
  { date: "Apr 5",  bg: "bg-purple-100", icon: "⭐" },
  { date: "Apr 8",  bg: "bg-pink-100",   icon: "🎂" },
  { date: "Apr 10", bg: "bg-blue-100",   icon: "📅" },
  { date: "Apr 11", bg: "bg-orange-100", icon: "🎉" },
];

export const tlAdItems = [
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

export const tlWebItems = [
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

// ─── Segments data ───────────────────────────────────────────────────────────

export const SEG_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#f43f5e", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export const segRevenue = [
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

export const segAdProfit = [
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

export const segConversions = [
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

export const campaignRows = [
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

export const tabs = ["Period Analysis", "Ad Performance", "Profit / Loss", "Segments"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const fmtNum = (n: number) => n.toLocaleString("en-US");
export const fmtK = (n: number) => (Math.abs(n) >= 1 ? `${n.toFixed(2)}K` : n.toFixed(2));
export const fmtPct = (n: number) => `${n.toFixed(2)}%`;
export const fmtCurrency = (n: number) => `$${n.toFixed(2)}`;

// Heatmap color scale: value between min/max → intensity 0..1
export function heatmapBg(value: number, min: number, max: number, color: "blue" | "green" | "red"): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));
  const alpha = 0.08 + t * 0.35;
  if (color === "blue") return `rgba(59, 130, 246, ${alpha})`;
  if (color === "green") return `rgba(34, 197, 94, ${alpha})`;
  return `rgba(239, 68, 68, ${alpha})`;
}

// ─── AI Assistant helpers ─────────────────────────────────────────────────────

export function parseBold(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let rest = line;
  let k = 0;
  while (rest.length > 0) {
    const s = rest.indexOf("**");
    if (s === -1) { nodes.push(rest); break; }
    if (s > 0) nodes.push(rest.slice(0, s));
    rest = rest.slice(s + 2);
    const e = rest.indexOf("**");
    if (e === -1) { nodes.push("**" + rest); break; }
    nodes.push(<strong key={k++}>{rest.slice(0, e)}</strong>);
    rest = rest.slice(e + 2);
  }
  return nodes;
}

export function renderAiText(text: string) {
  return text.split("\n").map((line, i) =>
    line
      ? <p key={i} className="leading-relaxed">{parseBold(line)}</p>
      : <span key={i} className="block h-2" />
  );
}

export const AI_METRICS = [
  { label: "Impr.", value: "1.73M" }, { label: "Clicks", value: "144,022" },
  { label: "CPC", value: "$1.47" }, { label: "CTR", value: "8.3%" },
  { label: "Conv. rate", value: "5.5%" }, { label: "Conv.", value: "7,888" },
  { label: "CPA", value: "$26.87" }, { label: "Revenue", value: "$759.69K" },
  { label: "Cost", value: "$211.96K" },
  { label: "Profit (ads)", value: "$547.73K", hi: "text-green-600" },
  { label: "ROAS", value: "3.58", hi: "text-blue-600" },
];

export const AI_QUICK = [
  { label: "Find Issues", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
  { label: "Improve ROAS", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> },
  { label: "Cut Costs", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: "Boost Performance", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
];
