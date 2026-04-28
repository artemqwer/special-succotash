"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  LabelList, ComposedChart, ReferenceLine, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid,
} from "recharts";
import { fetchWindsorData, WindsorDataRow } from "@/lib/windsor";

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

const SPARK_DATES = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 3, 13));
  d.setUTCDate(d.getUTCDate() - (13 - i));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
});

const sparkData = (up: boolean, seed = 1) =>
  Array.from({ length: 14 }, (_, i) => ({
    v: up
      ? 30 + Math.sin(i * 0.7 + seed) * 8 + i * 2.5
      : 60 - Math.sin(i * 0.7 + seed) * 8 - i * 1.5,
    date: SPARK_DATES[i],
  }));

const kpis = [
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

const CAMPAIGNS = ["Brand", "Shopping", "DSA", "Remarketing", "PMax", "Search"];
const COLORS = ["#F472B6", "#FB923C", "#FACC15", "#4ADE80", "#A78BFA", "#60A5FA"];

const CAMPAIGN_TYPE_MAP: Record<string, string> = {
  Brand: "Search", Shopping: "Shopping", DSA: "Search",
  Remarketing: "Display", PMax: "PMax", Search: "Search",
};
const TYPES = ["Search", "Shopping", "PMax", "Display"];
const TYPE_COLORS_MAP: Record<string, string> = {
  Search: "#60A5FA", Shopping: "#FACC15", PMax: "#A78BFA", Display: "#F472B6",
};

type ChartMetric = "Revenue" | "Cost" | "Clicks";
type ChartGroupBy = "Campaign" | "Type";

const CHART_METRICS: ChartMetric[] = ["Revenue", "Cost", "Clicks"];
const CHART_GROUPBY: ChartGroupBy[] = ["Campaign", "Type"];

// Per-day share distribution (cycling for any period length)
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

// ─── Period presets & data generation ────────────────────────────────────────

const PERIOD_PRESETS = [
  { label: "Last 7 days",  days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 60 days", days: 60 },
  { label: "Last 90 days", days: 90 },
];

const END_MS = Date.UTC(2026, 3, 13); // Apr 13, 2026
const DAY_MS = 86400000;

const fmtMs = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const TYPE_TO_GROUPS: Record<string, string[]> = {
  Search: ["Search"],
  PMax: ["PMax"],
  Shopping: ["Shopping"],
  Display: ["Remarketing"],
};

type AdPerfItem = { date: string; convValue: number; cost: number; profit: number; clicks: number; roas: number; costBar: number; profitBar: number };
type PlItem = { date: string; dailyProfit: number; cumulative: number };

function generatePeriodData(startMs: number, endMs: number) {
  const days = Math.round((endMs - startMs) / DAY_MS) + 1;
  const genDates = Array.from({ length: days }, (_, i) => {
    const d = new Date(startMs + i * DAY_MS);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const genTotals = genDates.map((_, i) => {
    const wd = new Date(startMs + i * DAY_MS).getDay();
    const base = (wd === 0 || wd === 6) ? 72000 : 87000;
    return Math.round(base + Math.sin(i * 0.5 + 1.3) * 7000 + Math.cos(i * 0.9 + 0.6) * 4000);
  });

  const genBarData = genDates.map((date, di) => {
    const obj: Record<string, string | number> = { date };
    const total = genTotals[di];
    const sm = shareMatrix[di % shareMatrix.length];
    let used = 0;
    CAMPAIGNS.forEach((c, i) => {
      const share = i === CAMPAIGNS.length - 1 ? Math.max(0, total - used) : Math.round(total * sm[i]);
      obj[c] = share; used += share;
    });
    obj.total = total;
    return obj;
  });

  const genCampaignAvgs = CAMPAIGNS.map((name, i) => ({
    name, color: COLORS[i],
    avg: genBarData.reduce((s, d) => s + (d[name] as number), 0) / genBarData.length,
  })).sort((a, b) => b.avg - a.avg);

  const genAdPerfData: AdPerfItem[] = genDates.map((date, i) => {
    const wd = new Date(startMs + i * DAY_MS).getDay();
    const base = (wd === 0 || wd === 6) ? 72000 : 87000;
    const convValue = Math.round(base + Math.sin(i * 0.5 + 1.3) * 7000 + Math.cos(i * 0.9 + 0.6) * 4000);
    const cost = Math.round(convValue * (0.27 + Math.sin(i * 0.4 + 0.8) * 0.04));
    const profit = convValue - cost;
    const clicks = Math.round(3200 + Math.sin(i * 0.6 + 2) * 900 + (wd === 0 || wd === 6 ? -600 : 0));
    const roas = parseFloat((convValue / cost).toFixed(2));
    return { date, convValue, cost, profit, clicks, roas, costBar: cost, profitBar: Math.max(0, profit) };
  });

  let cum = 0;
  const genPlData: PlItem[] = genDates.map((date, i) => {
    const dailyProfit = Math.round(1200 + Math.sin(i * 0.6 + 1.5) * 1100 + Math.cos(i * 0.4 + 0.8) * 600);
    cum += dailyProfit;
    return { date, dailyProfit, cumulative: cum };
  });

  const plTotal = genPlData[genPlData.length - 1].cumulative;
  const plAvgDaily = Math.round(plTotal / genPlData.length);
  const plProfitDays = genPlData.filter((r) => r.dailyProfit > 0).length;
  const plLossDays = genPlData.filter((r) => r.dailyProfit <= 0).length;

  return { dates: genDates, barData: genBarData, campaignAvgs: genCampaignAvgs, adPerfData: genAdPerfData, plData: genPlData, plTotal, plAvgDaily, plProfitDays, plLossDays };
}

// ─── Timeline data (static — event log independent of period) ────────────────


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

// ─── Segments data ───────────────────────────────────────────────────────────

const SEG_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#f43f5e", "#06b6d4", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

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

// ─── AI Assistant helpers ─────────────────────────────────────────────────────

type AiMessage = { id: number; role: "assistant" | "user"; text: string; time: string; suggestions?: string[]; pinned: boolean };

function parseBold(line: string): React.ReactNode[] {
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

function renderAiText(text: string) {
  return text.split("\n").map((line, i) =>
    line
      ? <p key={i} className="leading-relaxed">{parseBold(line)}</p>
      : <span key={i} className="block h-2" />
  );
}

const AI_METRICS = [
  { label: "Impr.", value: "1.73M" }, { label: "Clicks", value: "144,022" },
  { label: "CPC", value: "$1.47" }, { label: "CTR", value: "8.3%" },
  { label: "Conv. rate", value: "5.5%" }, { label: "Conv.", value: "7,888" },
  { label: "CPA", value: "$26.87" }, { label: "Revenue", value: "$759.69K" },
  { label: "Cost", value: "$211.96K" },
  { label: "Profit (ads)", value: "$547.73K", hi: "text-green-600" },
  { label: "ROAS", value: "3.58", hi: "text-blue-600" },
];

const AI_QUICK = [
  { label: "Find Issues", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> },
  { label: "Improve ROAS", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> },
  { label: "Cut Costs", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: "Boost Performance", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
];

function getMockAiResponse(input: string): { text: string; suggestions: string[] } {
  const lo = input.toLowerCase();
  if (lo.includes("roas")) return { text: "📈 **ROAS Analysis**\n\nYour current ROAS is **3.58x** across all campaigns.\n\n**Top performers:**\n• Search - Men T-Shirts: **470%** ROAS\n• Shopping - Winter Clearance: **210%** ROAS\n\n**Needs attention:**\n• Search - Men Shirts: **42%** ROAS (below target)\n• Display - Retargeting: **24%** ROAS\n\nI recommend pausing underperforming campaigns and reallocating budget to top performers.", suggestions: ["How can I improve low ROAS?", "Show budget allocation", "Compare with previous period"] };
  if (lo.includes("perform") || lo.includes("account")) return { text: "📊 **Account Performance Summary**\n\nYour account is performing **above average** this period.\n\n• **Revenue:** $759.69K (+18.2% vs prev period)\n• **Profit:** $547.73K (+22.8% vs prev period)\n• **ROAS:** 3.58x\n• **Cost:** $211.96K (+6.4%)\n\nShopping and PMax campaigns are driving the most conversions. Clicks are up 8.3% while CPC decreased to $1.47.", suggestions: ["Which campaigns to scale?", "Show cost breakdown", "Forecast next 30 days"] };
  if (lo.includes("recommend") || lo.includes("optim")) return { text: "💡 **Optimization Recommendations**\n\nBased on your account data, here are my top recommendations:\n\n1. **Scale Search - Men T-Shirts** — 470% ROAS, increase budget by 30%\n2. **Pause Display - Retargeting** — 24% ROAS, negative ROI\n3. **Add negative keywords** to PMax campaigns to reduce wasted spend\n4. **Increase bids on mobile** — CTR 12% higher on mobile\n5. **Run A/B tests** on ad copy for Search campaigns", suggestions: ["Implement these changes", "Show keyword analysis", "What is my wasted spend?"] };
  if (lo.includes("issue") || lo.includes("problem")) return { text: "🔍 **Issues Found**\n\nI've identified **3 issues** in your account:\n\n⚠️ **High CPA campaigns:**\n• Display - Retargeting: CPA $93.3 (target: $30)\n• PMax - Men Pants: CPA $31.8\n\n⚠️ **Low conversion rate:**\n• PMax - Women Clothing: 0.31% (avg: 2.15%)\n\n⚠️ **Budget pacing:**\n• 2 campaigns running out of budget before end of day", suggestions: ["How to fix high CPA?", "Review budget pacing", "Show conversion tips"] };
  if (lo.includes("cost") || lo.includes("budget")) return { text: "💰 **Cost Analysis**\n\nTotal spend: **$211.96K** this period.\n\n**Budget breakdown:**\n• PMax campaigns: 41% of budget\n• Search campaigns: 35% of budget\n• Shopping: 14% of budget\n• Display: 10% of budget\n\n**Opportunity:** Reduce Display budget by 30% (lowest ROAS) and reallocate to Search.", suggestions: ["Reallocate budget", "Show ROI by channel", "Forecast with new budgets"] };
  return { text: "📊 Analyzing your campaign data...\n\nYour account has **45 active campaigns** generating $759.69K in revenue with a 3.58x ROAS. Key metrics look healthy with strong profit margins.\n\nWhat specific aspect would you like to explore?", suggestions: ["Performance trends", "Campaign comparison", "Keyword insights"] };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CalMonth({ year, month, tempStart, tempEnd, hover, step, maxMs, onDayClick, onDayHover }: {
  year: number; month: number;
  tempStart: number | null; tempEnd: number | null;
  hover: number | null; step: number;
  maxMs: number;
  onDayClick: (ts: number) => void;
  onDayHover: (ts: number | null) => void;
}) {
  const MNAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const firstDow = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();

  let displayStart = tempStart;
  let displayEnd = tempEnd;
  if (step === 1 && tempStart !== null && hover !== null) {
    displayStart = Math.min(tempStart, hover);
    displayEnd = Math.max(tempStart, hover);
  } else if (step === 1 && tempStart !== null) {
    displayStart = tempStart;
    displayEnd = null;
  }

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(<div key={`b${i}`} />);
  for (let d = 1; d <= dim; d++) {
    const ts = Date.UTC(year, month, d);
    const disabled = ts > maxMs;
    const isStart = displayStart !== null && ts === displayStart;
    const isEnd = displayEnd !== null && ts === displayEnd;
    const inRange = displayStart !== null && displayEnd !== null && ts > displayStart && ts < displayEnd;
    const dow = new Date(year, month, d).getDay();
    const isWknd = dow === 0 || dow === 6;
    cells.push(
      <div key={d}
        className={`relative h-8 flex items-center justify-center
          ${inRange ? "bg-blue-50" : ""}
          ${isStart && displayEnd !== null ? "bg-blue-50 rounded-l-full" : ""}
          ${isEnd && displayStart !== null ? "bg-blue-50 rounded-r-full" : ""}
        `}>
        <button
          disabled={disabled}
          onClick={() => !disabled && onDayClick(ts)}
          onMouseEnter={() => !disabled && onDayHover(ts)}
          className={`w-8 h-8 text-[12px] rounded-full flex items-center justify-center relative z-10 transition leading-none
            ${isStart || isEnd ? "bg-blue-600 text-white font-semibold shadow-sm" : ""}
            ${inRange && !isStart && !isEnd ? "text-blue-700 hover:bg-blue-100" : ""}
            ${!inRange && !isStart && !isEnd ? (disabled ? "text-gray-200 cursor-not-allowed" : isWknd ? "text-blue-400 hover:bg-blue-50 cursor-pointer" : "text-gray-700 hover:bg-gray-100 cursor-pointer") : ""}
          `}
        >
          {d}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[300px] mx-auto">
      <p className="text-center text-[13px] font-bold text-gray-700 mb-2 pb-1 border-b border-gray-100 uppercase tracking-wide">
        {MNAMES[month]} {year}
      </p>
      <div className="grid grid-cols-7">
        {DOW.map((d) => (
          <div key={d} className="h-7 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">{d}</div>
        ))}
        {cells}
      </div>
    </div>
  );
}

function KpiCard({ label, shortLabel, icon, value, delta, up, spark, desc, hoverFmt }: {
  label: string; shortLabel?: string; icon: React.ReactNode; value: string; delta: string; up: boolean;
  spark: { v: number; date: string }[]; desc: string; hoverFmt: (v: number) => string;
}) {
  const color = up ? "#22C55E" : "#EF4444";
  const gradId = `kg-${label.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-2 sm:px-4 pt-2.5 sm:pt-3 pb-0 min-w-0 flex-1 overflow-hidden hover:shadow-md hover:-translate-y-px transition-all duration-200">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 min-w-0">
          <span className={`shrink-0 ${up ? "text-green-500" : "text-red-400"}`}>{icon}</span>
          <span className="sm:hidden text-[10px] text-gray-500 truncate">{shortLabel ?? label}</span>
          <span className="hidden sm:inline text-[13px] text-gray-500 truncate">{label}</span>
        </div>
        <div className="relative group shrink-0 ml-1">
          <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-200 flex items-center justify-center text-[7px] sm:text-[8px] text-gray-400 cursor-help select-none">i</span>
          <div className="absolute right-0 top-5 w-[170px] bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none shadow-lg leading-snug">
            {desc}
          </div>
        </div>
      </div>
      <div className="mb-1.5">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
          <span className="text-[15px] sm:text-[22px] font-bold text-gray-900 leading-tight">{value}</span>
          <span className={`text-[10px] sm:text-[13px] font-semibold leading-tight ${up ? "text-green-500" : "text-red-500"}`}>{delta}</span>
        </div>
      </div>
      <div className="h-[62px] sm:h-[68px] -mx-2 sm:-mx-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="natural" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`}
              dot={false} activeDot={{ r: 3, fill: color, strokeWidth: 0 }} isAnimationActive={false} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ active, payload, label: lbl }: any) => {
                if (!active || !payload?.[0]) return null;
                return (
                  <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: "3px 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.10)", pointerEvents: "none" }}>
                    <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 500, lineHeight: 1.4 }}>{lbl}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1.4 }}>{hoverFmt(payload[0].value)}</div>
                  </div>
                );
              }}
              cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 2", strokeOpacity: 0.5 }}
              position={{ y: 22 }}
              isAnimationActive={false}
              wrapperStyle={{ zIndex: 20 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label, metric = "Revenue" }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; metric?: ChartMetric }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  const fmtV = (v: number) => metric === "Clicks" ? `${(v / 1000).toFixed(1)}K` : `$${(v / 1000).toFixed(1)}K`;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-2.5 py-2 text-[11px]">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ background: p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </span>
          <span className="font-medium text-gray-700">{fmtV(p.value)}</span>
        </div>
      ))}
      <div className="border-t border-gray-100 mt-1.5 pt-1 flex justify-between font-semibold text-gray-800">
        <span>Total</span><span>{fmtV(total)}</span>
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

function SegmentDonut({ title, data, formatValue, colorScheme = "blue" }: {
  title: string;
  data: { name: string; value: number }[];
  formatValue: (v: number) => string;
  colorScheme?: "blue" | "green" | "violet";
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const bgCls = colorScheme === "green" ? "bg-green-50 border-green-100" : colorScheme === "violet" ? "bg-violet-50 border-violet-100" : "bg-blue-50 border-blue-100";
  return (
    <div className={`rounded-2xl border p-4 flex flex-col ${bgCls}`}>
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BarXTick = ({ x, y, payload }: any) => {
  const weekend = isWeekend(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} fill={weekend ? "#3B82F6" : "#9CA3AF"} fontSize={13} textAnchor="middle" fontWeight={weekend ? 700 : 400}>
        {payload.value}
      </text>
    </g>
  );
};

// Custom label renderer for stacked bar totals — hidden on narrow bars
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRenderTotalLabel = (metric: ChartMetric) => ({ x: rawX, y: rawY, width: rawW, value: rawV }: any) => {
  const x = typeof rawX === "number" ? rawX : 0;
  const y = typeof rawY === "number" ? rawY : 0;
  const width = typeof rawW === "number" ? rawW : 0;
  const value = typeof rawV === "number" ? rawV : 0;
  if (width < 30) return null;
  const label = metric === "Clicks" ? `${(value / 1000).toFixed(1)}K` : `$${(value / 1000).toFixed(1)}K`;
  return (
    <text x={x + width / 2} y={y - 6} fill="#374151" fontSize={12} fontWeight={600} textAnchor="middle">
      {label}
    </text>
  );
};

// ─── Ad Performance helpers ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AdXTick = ({ x, y, payload, data }: any) => {
  const item = data.find((d: AdPerfItem) => d.date === payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={0} r={3.5} fill="#8B5CF6" />
      <text x={0} y={0} dy={14} fill="#8B5CF6" fontSize={11} textAnchor="middle" fontWeight={600}>
        {item ? `${item.roas.toFixed(2)}` : ""}
      </text>
      <text x={0} y={0} dy={30} fill="#9CA3AF" fontSize={12} textAnchor="middle">{payload.value}</text>
    </g>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AdTooltip = ({ active, payload, label, data }: any) => {
  if (!active || !payload?.length) return null;
  const item = data.find((d: AdPerfItem) => d.date === label);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PlTooltip = ({ active, payload, label, data }: any) => {
  if (!active || !payload?.length) return null;
  const item = data.find((d: PlItem) => d.date === label);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRenderConvLabel = (data: AdPerfItem[], hideConv = false) => ({ x = 0, y = 0, width = 0, index: idx = 0 }: any) => {
  if (hideConv || width < 24) return null;
  const item = data[idx];
  if (!item || item.profit < 0) return null;
  return <text x={x + width / 2} y={y - 5} fill="#374151" fontSize={11} fontWeight={700} textAnchor="middle">${(item.convValue / 1000).toFixed(1)}K</text>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderProfitLabel = ({ x = 0, y = 0, width: w = 0, height: h = 0, value: val = 0 }: any) => {
  if (w < 34 || h < 16 || val <= 0) return null;
  return <text x={x + w / 2} y={y + h / 2 + 4} fill="white" fontSize={11} fontWeight={700} textAnchor="middle">${(val / 1000).toFixed(1)}K</text>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCostLabel = ({ x = 0, y = 0, width: w = 0, height: h = 0, value: val = 0 }: any) => {
  if (w < 34 || h < 16 || val <= 0) return null;
  return <text x={x + w / 2} y={y + h / 2 + 4} fill="white" fontSize={11} fontWeight={700} textAnchor="middle">${(val / 1000).toFixed(1)}K</text>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPlLabel = ({ x = 0, y = 0, width: w = 0, value: val = 0 }: any) => {
  if (w < 32) return null;
  return (
    <text x={x + w / 2} y={y - 5} fill="#374151" fontSize={12} fontWeight={700} textAnchor="middle">
      ${(val / 1000).toFixed(2)}K
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeRenderLossTopLabel = (data: AdPerfItem[], hideConv = false) => ({ x = 0, y = 0, width: w = 0, index: idx = 0 }: any) => {
  if (hideConv || w < 24) return null;
  const item = data[idx];
  if (!item || item.profit >= 0) return null;
  return (
    <g>
      <text x={x + w / 2} y={y - 14} fill="#3B82F6" fontSize={11} fontWeight={700} textAnchor="middle">
        ${(item.convValue / 1000).toFixed(1)}K
      </text>
      <text x={x + w / 2} y={y - 3} fill="#EF4444" fontSize={11} fontWeight={700} textAnchor="middle">
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
  const [rangeStart, setRangeStart] = useState(END_MS - 13 * DAY_MS);
  const [rangeEnd, setRangeEnd] = useState(END_MS);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const openDatePicker = () => {
    setPickerTempStart(rangeStart);
    setPickerTempEnd(rangeEnd);
    setPickerStep(0);
    setPickerHover(null);
    const d = new Date(rangeStart);
    setPickerViewYear(d.getFullYear());
    setPickerViewMonth(d.getMonth());
    setDatePickerOpen(true);
  };
  const openDatePickerRef = useRef(openDatePicker);
  useEffect(() => { openDatePickerRef.current = openDatePicker; });
  const [pickerTempStart, setPickerTempStart] = useState<number | null>(null);
  const [pickerTempEnd, setPickerTempEnd] = useState<number | null>(null);
  const [pickerHover, setPickerHover] = useState<number | null>(null);
  const [pickerStep, setPickerStep] = useState<0 | 1>(0);
  const [pickerViewYear, setPickerViewYear] = useState(2026);
  const [pickerViewMonth, setPickerViewMonth] = useState(2);
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set());
  const [clickedRow, setClickedRow] = useState<number | null>(null);
  const [namesCollapsed, setNamesCollapsed] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [granularity, setGranularity] = useState<"days" | "weeks" | "months">("days");
  const [granularityOpen, setGranularityOpen] = useState(false);
  const [hiddenAdPerf, setHiddenAdPerf] = useState<Set<string>>(new Set());
  const [hiddenPL, setHiddenPL] = useState<Set<string>>(new Set());
  const [chartMetric, setChartMetric] = useState<ChartMetric>("Revenue");
  const [chartGroupBy, setChartGroupBy] = useState<ChartGroupBy>("Campaign");
  const [chartMetricOpen, setChartMetricOpen] = useState(false);
  const [chartGroupByOpen, setChartGroupByOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMsgs, setAiMsgs] = useState<AiMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [evtCategory, setEvtCategory] = useState<"Events" | "Ads" | "Website">("Events");
  const [evtType, setEvtType] = useState<string | null>(null);
  const [evtStartDate, setEvtStartDate] = useState("2026-04-14");
  const [evtEndDate, setEvtEndDate] = useState("");
  const [evtTitle, setEvtTitle] = useState("");
  const [evtDesc, setEvtDesc] = useState("");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [daysUpToToday, setDaysUpToToday] = useState<number | string>(30);
  const [windsorApiKey, setWindsorApiKey] = useState("");
  const [isWindsorLoading, setIsWindsorLoading] = useState(false);
  const [windsorError, setWindsorError] = useState<string | null>(null);
  const [realCampaignRows, setRealCampaignRows] = useState<any[] | null>(null);
  const [realBarData, setRealBarData] = useState<any[] | null>(null);

  useEffect(() => {
    if (!windsorApiKey) {
      setRealCampaignRows(null);
      setRealBarData(null);
      return;
    }

    const loadData = async () => {
      setIsWindsorLoading(true);
      setWindsorError(null);
      try {
        const start = new Date(rangeStart).toISOString().split('T')[0];
        const end = new Date(rangeEnd).toISOString().split('T')[0];

        const campData = await fetchWindsorData(windsorApiKey, start, end, 'campaign');
        const mappedRows = campData.map(d => {
          const roasNum = d.spend > 0 ? (Number(d.conversion_value) / Number(d.spend)) * 100 : 0;
          const revenue = Number(d.conversion_value) || 0;
          const cost = Number(d.spend) || 0;
          return {
            status: cost > 0 ? "green" : "gray",
            name: d.campaign || "Unknown",
            type: "Search",
            roas: d.spend > 0 ? `${roasNum.toFixed(0)}%` : "null",
            roasColor: d.spend === 0 ? "gray" : roasNum >= 150 ? "green" : roasNum >= 100 ? "orange" : "red",
            impr: Number(d.impressions) || 0,
            clicks: Number(d.clicks) || 0,
            cpc: d.clicks > 0 ? cost / Number(d.clicks) : 0,
            ctr: d.impressions > 0 ? (Number(d.clicks) / Number(d.impressions)) * 100 : 0,
            convRate: d.clicks > 0 ? (Number(d.conversions) / Number(d.clicks)) * 100 : 0,
            conv: Number(d.conversions) || 0,
            cpa: d.conversions > 0 ? cost / Number(d.conversions) : 0,
            revenue,
            cost,
            profit: revenue - cost,
            roasVal: roasNum,
          };
        });
        setRealCampaignRows(mappedRows);

        const dailyData = await fetchWindsorData(windsorApiKey, start, end, 'date,campaign');
        const dateMap: Record<string, any> = {};
        dailyData.forEach(d => {
          const dt = d.date!;
          if (!dateMap[dt]) dateMap[dt] = { date: new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), total: 0 };
          const val = Number(d.conversion_value) || 0;
          dateMap[dt][d.campaign || 'Unknown'] = val;
          dateMap[dt].total += val;
        });
        setRealBarData(Object.values(dateMap));
      } catch (err) {
        setWindsorError("API Error. Check key.");
      } finally {
        setIsWindsorLoading(false);
      }
    };

    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [windsorApiKey, rangeStart, rangeEnd]);
  const [daysUpToYesterday, setDaysUpToYesterday] = useState<number | string>(30);
  
  const handlePresetClick = (label: string) => {
    const today = new Date(END_MS);
    today.setUTCHours(0,0,0,0);
    const nowTs = today.getTime();
    let start = nowTs;
    let end = nowTs;

    switch (label) {
      case "Today":
        start = nowTs; end = nowTs; break;
      case "Yesterday":
        start = nowTs - DAY_MS; end = nowTs - DAY_MS; break;
      case "This week (Sun - Today)": {
        const d = new Date(nowTs);
        const day = d.getUTCDay();
        start = nowTs - day * DAY_MS;
        end = nowTs;
        break;
      }
      case "Last 7 days":
        start = nowTs - 6 * DAY_MS; end = nowTs; break;
      case "Last week (Sun - Sat)": {
        const d = new Date(nowTs);
        const day = d.getUTCDay();
        end = nowTs - (day + 1) * DAY_MS;
        start = end - 6 * DAY_MS;
        break;
      }
      case "Last 14 days":
        start = nowTs - 13 * DAY_MS; end = nowTs; break;
      case "This month": {
        const d = new Date(nowTs);
        d.setUTCDate(1);
        start = d.getTime(); end = nowTs; break;
      }
      case "Last 30 days":
        start = nowTs - 29 * DAY_MS; end = nowTs; break;
      case "Last month": {
        const d = new Date(nowTs);
        d.setUTCMonth(d.getUTCMonth() - 1);
        d.setUTCDate(1);
        start = d.getTime();
        const d2 = new Date(start);
        d2.setUTCMonth(d2.getUTCMonth() + 1);
        d2.setUTCDate(0);
        end = d2.getTime();
        break;
      }
      case "All time":
        start = Date.UTC(2025, 0, 1); end = nowTs; break;
      default: return;
    }
    setPickerTempStart(start);
    setPickerTempEnd(end);
    setPickerStep(0);
    const sd = new Date(start);
    setPickerViewMonth(sd.getUTCMonth());
    setPickerViewYear(sd.getUTCFullYear());
  };

  const { dates, barData, campaignAvgs, adPerfData, plData, plTotal, plAvgDaily, plProfitDays, plLossDays } = useMemo(
    () => {
      const mock = generatePeriodData(rangeStart, rangeEnd);
      if (realBarData) {
        const names = Array.from(new Set(realBarData.flatMap(d => Object.keys(d).filter(k => k !== 'date' && k !== 'total'))));
        return {
          ...mock,
          barData: realBarData,
          campaignAvgs: names.map((name, i) => ({
            name,
            color: COLORS[i % COLORS.length],
            avg: realBarData.reduce((s, d) => s + (d[name] || 0), 0) / realBarData.length
          })).sort((a, b) => b.avg - a.avg)
        };
      }
      return mock;
    },
    [rangeStart, rangeEnd, realBarData]
  );

  const openAi = () => {
    if (aiMsgs.length === 0) {
      const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setAiMsgs([{ id: 1, role: "assistant", text: "👋 Hello! I'm your AI Assistant for **All Account Campaigns**.\n\nI have access to your complete account data and can help you:\n\n📊 Analyze account-wide performance trends\n💡 Provide optimization recommendations\n📈 Create custom charts and graphs\n📋 Show detailed data tables\n🎯 Answer specific questions about metrics\n\nWhat would you like to explore today?", time: t, suggestions: ["How is the account performing?", "What are your recommendations?", "Show me ROAS analysis"], pinned: false }]);
    }
    setAiOpen(true);
  };

  const sendAiMsg = (text?: string) => {
    const msg = (text ?? aiInput).trim();
    if (!msg || aiLoading) return;
    setAiInput("");
    const t = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setAiMsgs(prev => [...prev, { id: Date.now(), role: "user", text: msg, time: t, pinned: false }]);
    setAiLoading(true);
    setTimeout(() => {
      const r = getMockAiResponse(msg);
      const t2 = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setAiMsgs(prev => [...prev, { id: Date.now() + 1, role: "assistant", text: r.text, time: t2, suggestions: r.suggestions, pinned: false }]);
      setAiLoading(false);
    }, 1100);
  };

  const toggleAiPin = (id: number) => setAiMsgs(prev => prev.map(m => m.id === id ? { ...m, pinned: !m.pinned } : m));

  useEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
  }, [aiMsgs, aiLoading]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    const isOpen = addEventOpen || aiOpen;
    if (!isOpen) return;
    const scrollY = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    return () => {
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";
      window.scrollTo(0, scrollY);
    };
  }, [addEventOpen, aiOpen]);


  const toggleSeries = (name: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 640);
    const portraitMql = window.matchMedia("(orientation: portrait)");
    const checkOrientation = (e: MediaQueryListEvent | MediaQueryList) => setIsPortrait(e.matches);

    checkSize();
    checkOrientation(portraitMql);
    window.addEventListener("resize", checkSize);
    portraitMql.addEventListener("change", checkOrientation);

    const handleOpen = () => openDatePickerRef.current();
    window.addEventListener("open-date-picker", handleOpen);

    return () => {
      window.removeEventListener("resize", checkSize);
      portraitMql.removeEventListener("change", checkOrientation);
      window.removeEventListener("open-date-picker", handleOpen);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("date-range-changed", {
      detail: { start: rangeStart, end: rangeEnd }
    }));
  }, [rangeStart, rangeEnd]);

  const handleSort = (col: SortKey) => {
    setCheckedRows(new Set());
    setClickedRow(null);
    if (sortCol === col) {
      const next: SortDir = sortDir === "asc" ? "desc" : sortDir === "desc" ? null : "asc";
      setSortDir(next);
      if (next === null) setSortCol(null);
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  const currentRows = realCampaignRows || campaignRows;
  const types = ["All", ...Array.from(new Set(currentRows.map((r) => r.type)))];

  const filtered = useMemo(() => {
    const base = realCampaignRows || campaignRows;
    let rows = typeFilter === "All" ? base : base.filter((r) => r.type === typeFilter);
    if (selectedCampaigns.size > 0) rows = rows.filter((r) => selectedCampaigns.has(r.name));
    if (sortCol && sortDir) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol]; const bv = b[sortCol];
        if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
        return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return rows;
  }, [typeFilter, selectedCampaigns, sortCol, sortDir, realCampaignRows]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);

  useEffect(() => { setPage(1); }, [filtered, rowsPerPage]);

  const rowTypeFilter = useMemo(() => {
    const selTypes = new Set<string>();
    if (clickedRow !== null && filtered[clickedRow]) selTypes.add(filtered[clickedRow].type);
    checkedRows.forEach((i) => { if (filtered[i]) selTypes.add(filtered[i].type); });
    if (selTypes.size === 0) return null;
    const groups = new Set<string>();
    selTypes.forEach((t) => (TYPE_TO_GROUPS[t] ?? []).forEach((g) => groups.add(g)));
    return groups;
  }, [checkedRows, clickedRow, filtered]);

  const selectedRows = useMemo(() => {
    const items: (typeof filtered)[number][] = [];
    if (clickedRow !== null && filtered[clickedRow]) items.push(filtered[clickedRow]);
    checkedRows.forEach((i) => { if (filtered[i] && !items.includes(filtered[i])) items.push(filtered[i]); });
    return items;
  }, [clickedRow, checkedRows, filtered]);

  const selectionScale = useMemo(() => {
    const base = realCampaignRows || campaignRows;
    if (selectedRows.length === 0) return 1;
    const totalRev = base.reduce((s, r) => s + r.revenue, 0);
    const selRev = selectedRows.reduce((s, r) => s + r.revenue, 0);
    return selRev / totalRev;
  }, [selectedRows, realCampaignRows]);

  const chartSeries = useMemo(() => {
    if (chartGroupBy === "Campaign") {
      return campaignAvgs.map(({ name, color }) => ({ name, color }));
    }
    return TYPES.map((name) => ({ name, color: TYPE_COLORS_MAP[name] }));
  }, [chartGroupBy, campaignAvgs]);

  const chartBarData = useMemo(() => {
    return barData.map((row, i) => {
      const perf = adPerfData[i] || { convValue: (row.total as number) || 0, cost: 0, clicks: 0 };
      const totalRev = (row.total as number) || 1;
      const metricTotal =
        chartMetric === "Cost" ? perf.cost :
        chartMetric === "Clicks" ? perf.clicks :
        perf.convValue;
      const scale = metricTotal / totalRev;

      if (chartGroupBy === "Campaign") {
        const obj: Record<string, string | number> = { date: row.date as string };
        CAMPAIGNS.forEach((c) => { obj[c] = Math.round(((row[c] as number) || 0) * scale); });
        obj.total = Math.round(metricTotal);
        return obj;
      } else {
        const typeVals: Record<string, number> = {};
        CAMPAIGNS.forEach((c) => {
          const t = CAMPAIGN_TYPE_MAP[c];
          typeVals[t] = (typeVals[t] || 0) + Math.round(((row[c] as number) || 0) * scale);
        });
        const obj: Record<string, string | number> = { date: row.date as string };
        TYPES.forEach((t) => { obj[t] = typeVals[t] || 0; });
        obj.total = Math.round(metricTotal);
        return obj;
      }
    });
  }, [barData, adPerfData, chartMetric, chartGroupBy]);

  const displayBarData = useMemo(() =>
    chartBarData.map((row) => ({
      ...row,
      visibleTotal: chartSeries
        .filter(({ name }) => !hiddenSeries.has(name) && (chartGroupBy === "Type" || rowTypeFilter === null || rowTypeFilter.has(name)))
        .reduce((s, { name }) => s + ((row[name] as number) || 0), 0),
    })),
    [chartBarData, chartSeries, hiddenSeries, rowTypeFilter, chartGroupBy]
  );

  const aggregatedBarData = useMemo(() => {
    if (granularity === "days") return displayBarData;
    const chunks: typeof displayBarData[] = [];
    if (granularity === "weeks") {
      for (let i = 0; i < displayBarData.length; i += 7) chunks.push(displayBarData.slice(i, i + 7));
    } else {
      const byMon: Record<string, typeof displayBarData> = {};
      displayBarData.forEach((r) => { const m = (r as any).date.split(" ")[0]; (byMon[m] ??= []).push(r); });
      Object.values(byMon).forEach((g) => chunks.push(g));
    }
    const seriesKeys = chartGroupBy === "Campaign" ? CAMPAIGNS : TYPES;
    return chunks.map((chunk) => {
      const agg: Record<string, number | string> = {
        date: granularity === "weeks"
          ? `${(chunk[0] as any).date}–${(chunk[chunk.length - 1] as any).date}`
          : (chunk[0] as any).date.split(" ")[0],
      };
      seriesKeys.forEach((n) => { (agg as any)[n] = chunk.reduce((s, r) => s + ((r as any)[n] as number || 0), 0); });
      (agg as any).visibleTotal = chartSeries
        .filter(({ name }) => !hiddenSeries.has(name) && (chartGroupBy === "Type" || rowTypeFilter === null || rowTypeFilter.has(name)))
        .reduce((s, { name }) => s + ((agg as any)[name] as number || 0), 0);
      return agg as typeof displayBarData[0];
    });
  }, [displayBarData, granularity, chartSeries, chartGroupBy, hiddenSeries, rowTypeFilter]);

  const aggregatedAdPerfData = useMemo(() => {
    const data = adPerfData.map(d => ({
      ...d,
      convValue: d.convValue * selectionScale,
      cost: d.cost * selectionScale,
      profit: d.profit * selectionScale,
      clicks: d.clicks * selectionScale,
      costBar: d.costBar * selectionScale,
      profitBar: d.profitBar * selectionScale,
    }));
    if (granularity === "days") return data;
    const chunks: AdPerfItem[][] = [];
    if (granularity === "weeks") {
      for (let i = 0; i < data.length; i += 7) chunks.push(data.slice(i, i + 7));
    } else {
      const byMon: Record<string, AdPerfItem[]> = {};
      data.forEach((r) => { const m = r.date.split(" ")[0]; (byMon[m] ??= []).push(r); });
      Object.values(byMon).forEach((g) => chunks.push(g));
    }
    return chunks.map((chunk) => {
      const convValue = chunk.reduce((s, r) => s + r.convValue, 0);
      const cost = chunk.reduce((s, r) => s + r.cost, 0);
      const profit = chunk.reduce((s, r) => s + r.profit, 0);
      const clicks = chunk.reduce((s, r) => s + r.clicks, 0);
      const roas = parseFloat((convValue / cost).toFixed(2));
      const date = granularity === "weeks"
        ? `${chunk[0].date}–${chunk[chunk.length - 1].date}`
        : chunk[0].date.split(" ")[0];
      return { date, convValue, cost, profit, clicks, roas, costBar: cost, profitBar: Math.max(0, profit) };
    });
  }, [adPerfData, granularity, selectionScale]);

  const aggregatedPlData = useMemo(() => {
    const data = plData.map(d => ({
      ...d,
      dailyProfit: d.dailyProfit * selectionScale,
    }));
    if (granularity === "days") {
      let c = 0;
      return data.map(d => { c += d.dailyProfit; return { ...d, cumulative: c }; });
    }
    const chunks: PlItem[][] = [];
    if (granularity === "weeks") {
      for (let i = 0; i < data.length; i += 7) chunks.push(data.slice(i, i + 7));
    } else {
      const byMon: Record<string, PlItem[]> = {};
      data.forEach((r) => { const m = r.date.split(" ")[0]; (byMon[m] ??= []).push(r); });
      Object.values(byMon).forEach((g) => chunks.push(g));
    }
    let cum = 0;
    return chunks.map((chunk) => {
      const dailyProfit = chunk.reduce((s, r) => s + r.dailyProfit, 0);
      cum += dailyProfit;
      const date = granularity === "weeks"
        ? `${chunk[0].date}–${chunk[chunk.length - 1].date}`
        : chunk[0].date.split(" ")[0];
      return { date, dailyProfit, cumulative: cum };
    });
  }, [plData, granularity, selectionScale]);

  const renderConvLabel = useMemo(() => makeRenderConvLabel(aggregatedAdPerfData, hiddenAdPerf.has("conv")), [aggregatedAdPerfData, hiddenAdPerf]);
  const renderLossTopLabel = useMemo(() => makeRenderLossTopLabel(aggregatedAdPerfData, hiddenAdPerf.has("conv")), [aggregatedAdPerfData, hiddenAdPerf]);
  const renderTotalLabelChart = useMemo(() => makeRenderTotalLabel(chartMetric), [chartMetric]);

  const dynKpis = useMemo(() => {
    if (selectedRows.length === 0) return null;
    const selClicks = selectedRows.reduce((s, r) => s + r.clicks, 0);
    const selConv   = selectedRows.reduce((s, r) => s + r.conv, 0);
    const selCost   = selectedRows.reduce((s, r) => s + r.cost, 0);
    const selRev    = selectedRows.reduce((s, r) => s + r.revenue, 0);
    const selProfit = selectedRows.reduce((s, r) => s + r.profit, 0);
    const totClicks = currentRows.reduce((s, r) => s + r.clicks, 0);
    const totConv   = currentRows.reduce((s, r) => s + r.conv, 0);
    const totCost   = currentRows.reduce((s, r) => s + r.cost, 0);
    const totRev    = currentRows.reduce((s, r) => s + r.revenue, 0);
    const convRate  = selClicks > 0 ? selConv / selClicks * 100 : 0;
    const cpa       = selConv  > 0 ? selCost / selConv : 0;
    const roas      = selCost  > 0 ? selRev  / selCost : 0;
    const fmtPct = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}% of total` : "—";
    return [
      { value: selClicks >= 1000 ? `${(selClicks/1000).toFixed(2)}K` : String(selClicks), delta: fmtPct(selClicks, totClicks), up: selClicks >= totClicks / currentRows.length },
      { value: `${convRate.toFixed(2)}%`,  delta: convRate > 2.47 ? "▲ above avg" : "▼ below avg", up: convRate >= 2.47 },
      { value: selConv >= 1000 ? `${(selConv/1000).toFixed(2)}K` : String(selConv), delta: fmtPct(selConv, totConv), up: true },
      { value: `${cpa.toFixed(2)}`,        delta: cpa < 20.42 ? "▲ below avg CPA" : "▼ above avg CPA", up: cpa <= 20.42 },
      { value: selCost >= 1000 ? `${(selCost/1000).toFixed(2)}K` : selCost.toFixed(2), delta: fmtPct(selCost, totCost), up: true },
      { value: selRev  >= 1000 ? `${(selRev/1000).toFixed(2)}K`  : selRev.toFixed(2),  delta: fmtPct(selRev, totRev), up: true },
      { value: `${roas.toFixed(2)}x`,      delta: roas > 1.76 ? "▲ above avg" : "▼ below avg", up: roas >= 1.76 },
      { value: selProfit >= 0 ? (selProfit >= 1000 ? `${(selProfit/1000).toFixed(2)}K` : selProfit.toFixed(0)) : `-${(Math.abs(selProfit)/1000).toFixed(2)}K`, delta: selProfit >= 0 ? "Profitable" : "Loss", up: selProfit >= 0 },
    ];
  }, [selectedRows, currentRows]);

  // Compute min/max for heatmap columns
  const heatCols = useMemo(() => {
    const keys = ["impr","clicks","cpc","ctr","convRate","conv","cpa","revenue","cost","profit"] as const;
    const result = {} as Record<typeof keys[number], { min: number; max: number }>;
    keys.forEach((k) => {
      const vals = currentRows.map((r) => r[k] as number);
      result[k] = { min: Math.min(...vals), max: Math.max(...vals) };
    });
    return result;
  }, [currentRows]);

  const tableTotals = useMemo(() => {
    const rows = filtered;
    const totImpr     = rows.reduce((s, r) => s + r.impr, 0);
    const totClicks   = rows.reduce((s, r) => s + r.clicks, 0);
    const totConv     = rows.reduce((s, r) => s + r.conv, 0);
    const totCost     = rows.reduce((s, r) => s + r.cost, 0);
    const totRev      = rows.reduce((s, r) => s + r.revenue, 0);
    const totProfit   = rows.reduce((s, r) => s + r.profit, 0);
    const avgCpc      = totClicks > 0 ? totCost / totClicks : 0;
    const avgCtr      = totImpr > 0 ? (totClicks / totImpr) * 100 : 0;
    const avgConvRate = totClicks > 0 ? (totConv / totClicks) * 100 : 0;
    const avgCpa      = totConv > 0 ? totCost / totConv : 0;
    return { totImpr, totClicks, totConv, totCost, totRev, totProfit, avgCpc, avgCtr, avgConvRate, avgCpa };
  }, [filtered]);

  const cellStyle = (col: keyof typeof heatCols, value: number, color: "blue" | "green" | "red") => ({
    backgroundColor: heatmapBg(value, heatCols[col].min, heatCols[col].max, color),
  });

  return (
    <div className={`px-4 sm:px-6 py-6 bg-[#f4f6fb] min-h-screen transition-[padding] duration-300 ease-out ${aiOpen ? "lg:pr-[456px]" : ""}`}>
      {/* Header */}
      <div className="hidden sm:flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
            </svg>
          </div>
          <div>
            <h1 className="text-[19px] font-bold text-gray-900 leading-tight">Google Ads</h1>
            <p className="text-[13px] text-gray-400">Campaign Performance Analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Windsor API Key Input */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"/></svg>
            <input
              type="password"
              placeholder="Windsor.ai API Key"
              value={windsorApiKey}
              onChange={(e) => setWindsorApiKey(e.target.value)}
              className="text-[13px] outline-none w-40 placeholder:text-gray-300"
            />
            {isWindsorLoading && <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
            {windsorError && <span className="text-[10px] text-red-500 font-medium">{windsorError}</span>}
            {!windsorApiKey && <span className="text-[10px] text-orange-500 font-medium">Demo Mode</span>}
            {windsorApiKey && !isWindsorLoading && !windsorError && <span className="text-[10px] text-green-500 font-medium">Connected</span>}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                if (datePickerOpen) setDatePickerOpen(false);
                else openDatePicker();
              }}
              className="flex items-center gap-2 text-[14px] text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-50 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {fmtMs(rangeStart)} – {fmtMs(rangeEnd)}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${datePickerOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>

          {/* Desktop Date Picker Dropdown */}
          {datePickerOpen &&
            <div className="hidden sm:block absolute right-0 top-full mt-2 w-[580px] bg-white border border-gray-100 rounded-2xl shadow-2xl z-[300] overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
              <div className="flex h-[580px]">
                {/* Sidebar */}
                <div className="w-[190px] border-r border-gray-100 py-4 flex flex-col bg-gray-50/30">
                  <div className="flex-1 overflow-y-auto scrollbar-none px-2 space-y-0.5">
                    {[
                      "Custom", "Today", "Yesterday", "This week (Sun - Today)",
                      "Last 7 days", "Last week (Sun - Sat)", "Last 14 days",
                      "This month", "Last 30 days", "Last month", "All time"
                    ].map((label) => {
                      return (
                        <button
                          key={label}
                          onClick={() => handlePresetClick(label)}
                          className={`w-full text-left px-4 py-2 text-[13px] rounded-lg transition-colors flex items-center justify-between ${
                            (label === "Custom" && !pickerTempStart) ? "text-blue-600 font-medium" : "text-gray-600 hover:bg-white hover:text-blue-600"
                          }`}
                        >
                          {label}
                          {(label.includes(">") || label.includes("This week") || label.includes("Last week")) && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-4 py-4 border-t border-gray-100 space-y-3 bg-white">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={daysUpToToday}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDaysUpToToday(v);
                          const num = parseInt(v);
                          if (!isNaN(num)) {
                            const end = new Date(END_MS).getTime();
                            const start = end - (num - 1) * DAY_MS;
                            setPickerTempStart(start);
                            setPickerTempEnd(end);
                          }
                        }}
                        className="w-12 h-8 border border-gray-200 rounded-md text-[13px] px-1 text-center outline-none focus:border-blue-400"
                      />
                      <span className="text-[12px] text-gray-500">days up to today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={daysUpToYesterday}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDaysUpToYesterday(v);
                          const num = parseInt(v);
                          if (!isNaN(num)) {
                            const end = new Date(END_MS).getTime() - DAY_MS;
                            const start = end - (num - 1) * DAY_MS;
                            setPickerTempStart(start);
                            setPickerTempEnd(end);
                          }
                        }}
                        className="w-12 h-8 border border-gray-200 rounded-md text-[13px] px-1 text-center outline-none focus:border-blue-400"
                      />
                      <span className="text-[12px] text-gray-500">days up to yesterday</span>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                      <span className="text-[13px] text-gray-600 font-medium">Compare</span>
                      <button
                        onClick={() => setCompareEnabled(!compareEnabled)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${compareEnabled ? "bg-blue-600" : "bg-gray-200"}`}
                      >
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${compareEnabled ? "translate-x-5" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                  {/* Date Inputs */}
                  <div className="px-4 py-5 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start date*</label>
                      <input
                        type="text"
                        readOnly
                        value={pickerTempStart ? new Date(pickerTempStart).toLocaleDateString() : ""}
                        className="w-full h-9 border border-gray-200 rounded-lg px-3 text-[13px] bg-gray-50/50"
                      />
                    </div>
                    <div className="pt-4 text-gray-300">—</div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">End date*</label>
                      <input
                        type="text"
                        readOnly
                        value={pickerTempEnd ? new Date(pickerTempEnd).toLocaleDateString() : ""}
                        className="w-full h-9 border border-gray-200 rounded-lg px-3 text-[13px] bg-gray-50/50"
                      />
                    </div>
                  </div>

                  {/* Calendar Area */}
                  <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-thin">
                    {([0, 1, 2] as const).map((offset) => {
                      const m = (pickerViewMonth + offset) % 12;
                      const y = pickerViewYear + Math.floor((pickerViewMonth + offset) / 12);
                      return (
                        <div key={offset} className="pb-4">
                          <CalMonth
                            year={y} month={m}
                            tempStart={pickerTempStart} tempEnd={pickerTempEnd}
                            hover={pickerHover} step={pickerStep}
                            maxMs={END_MS}
                            onDayClick={(ts) => {
                              if (pickerStep === 0) {
                                setPickerTempStart(ts);
                                setPickerTempEnd(null);
                                setPickerStep(1);
                              } else {
                                if (pickerTempStart !== null && ts < pickerTempStart) {
                                  setPickerTempEnd(pickerTempStart);
                                  setPickerTempStart(ts);
                                } else {
                                  setPickerTempEnd(ts);
                                }
                                setPickerStep(0);
                              }
                            }}
                            onDayHover={setPickerHover}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="px-4 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                    <button
                      onClick={() => setDatePickerOpen(false)}
                      className="px-6 py-2 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!pickerTempStart || !pickerTempEnd}
                      onClick={() => {
                        if (pickerTempStart && pickerTempEnd) {
                          setRangeStart(pickerTempStart);
                          setRangeEnd(pickerTempEnd);
                          setDatePickerOpen(false);
                          setHiddenSeries(new Set());
                          setCheckedRows(new Set());
                          setClickedRow(null);
                        }
                      }}
                      className="px-8 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 transition shadow-lg shadow-blue-100"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>


      {/* KPI cards */}
      {dynKpis && (
        <div className="flex items-center gap-1.5 mb-2 text-[12px] text-blue-600">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Showing metrics for {selectedRows.length} selected campaign{selectedRows.length > 1 ? "s" : ""}
          <button onClick={() => { setCheckedRows(new Set()); setClickedRow(null); }} className="ml-1 text-gray-400 hover:text-gray-700 transition">× Clear</button>
        </div>
      )}
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3 mb-5">
        {kpis.map((k, i) => {
          const dyn = dynKpis?.[i];
          return (
            <KpiCard key={k.label} label={k.label} shortLabel={k.shortLabel} icon={k.icon}
              value={dyn?.value ?? k.value}
              delta={dyn?.delta ?? k.delta}
              up={dyn?.up ?? k.up}
              spark={sparkData(dyn?.up ?? k.up, dyn ? i + selectedRows.length * 3 : i)}
              desc={k.desc} hoverFmt={k.hoverFmt} />
          );
        })}
      </div>

      {/* Chart card — fills viewport so table is below the fold */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-5 mb-5 min-w-0">
        {/* Tabs */}
        <div className="flex items-center justify-between gap-3 mb-5 min-w-0 border-b border-gray-100 pb-2 sm:pb-0">
          {/* Mobile: dropdown */}
          <div className="sm:hidden relative flex-1 min-w-0">
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
          <div className="hidden sm:flex gap-1 flex-1 overflow-x-auto scrollbar-none min-w-0">
            {tabs.map((t, i) => (
              <button key={t} onClick={() => setActiveTab(i)}
                className={`px-3 py-2 text-[14px] font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === i ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="p-[2px] rounded-xl shrink-0 mb-1" style={{ background: "linear-gradient(135deg, #3b82f6, #a78bfa, #f472b6)" }}>
            <button onClick={openAi} className="flex items-center gap-1.5 text-[13px] sm:text-[14px] font-bold text-gray-800 bg-white hover:bg-gray-50/80 px-2.5 sm:px-4 py-[6px] rounded-[10px] transition whitespace-nowrap">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <defs><linearGradient id="ai-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#ec4899"/></linearGradient></defs>
                <path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z" fill="url(#ai-grad)"/>
                <circle cx="18" cy="6" r="1.5" fill="url(#ai-grad)" />
              </svg>
              AI Assistant
            </button>
          </div>
        </div>

        {/* Chart controls */}
        <div className="flex items-center justify-between gap-2 mb-4 text-[14px]">
          {activeTab === 0 && (
            <div className="flex items-center gap-2 min-w-0">
              {/* Metric dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setChartMetricOpen(!chartMetricOpen); setChartGroupByOpen(false); }}
                  className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 font-medium whitespace-nowrap"
                >
                  {chartMetric}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${chartMetricOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {chartMetricOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setChartMetricOpen(false)} />
                    <div className="absolute left-0 top-full mt-1.5 w-[130px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top">
                      {CHART_METRICS.map((m) => (
                        <button key={m} onClick={() => { setChartMetric(m); setChartMetricOpen(false); setHiddenSeries(new Set()); }}
                          className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between transition ${chartMetric === m ? "text-blue-600 font-semibold bg-blue-50/60" : "text-gray-700"}`}>
                          {m}
                          {chartMetric === m && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <span className="text-gray-400 text-[13px] shrink-0">by</span>
              {/* GroupBy dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setChartGroupByOpen(!chartGroupByOpen); setChartMetricOpen(false); }}
                  className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 font-medium whitespace-nowrap"
                >
                  {chartGroupBy}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${chartGroupByOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {chartGroupByOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setChartGroupByOpen(false)} />
                    <div className="absolute left-0 top-full mt-1.5 w-[120px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top">
                      {CHART_GROUPBY.map((g) => (
                        <button key={g} onClick={() => { setChartGroupBy(g); setChartGroupByOpen(false); setHiddenSeries(new Set()); }}
                          className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between transition ${chartGroupBy === g ? "text-blue-600 font-semibold bg-blue-50/60" : "text-gray-700"}`}>
                          {g}
                          {chartGroupBy === g && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {activeTab === 1 && (
            <p className="text-[13px] text-gray-400">Conversion value, profit, cost, clicks &amp; ROAS over time</p>
          )}
          {activeTab === 2 && (
            <div className="flex items-center gap-3 flex-wrap text-[13px]">
              <span className="text-gray-600">Total: <span className="text-green-700 font-bold">${((aggregatedPlData[aggregatedPlData.length - 1]?.cumulative || 0) / 1000).toFixed(1)}K</span></span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Avg Daily: <span className="font-bold">${(( (aggregatedPlData[aggregatedPlData.length - 1]?.cumulative || 0) / dates.length ) / 1000).toFixed(1)}K</span></span>
              <span className="text-gray-400">|</span>
              <span className="text-green-600 font-semibold">↗ {aggregatedPlData.filter(d => d.dailyProfit > 0).length} days</span>
              <span className="text-gray-400">|</span>
              <span className="text-red-500 font-semibold">↘ {aggregatedPlData.filter(d => d.dailyProfit <= 0).length} days</span>
            </div>
          )}
          {activeTab !== 0 && activeTab !== 1 && activeTab !== 2 && <div />}
          {activeTab !== 3 && (
            <div className="relative shrink-0">
              <button
                onClick={() => setGranularityOpen(!granularityOpen)}
                className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 whitespace-nowrap text-[14px] font-medium"
              >
                {granularity.charAt(0).toUpperCase() + granularity.slice(1)}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${granularityOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {granularityOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setGranularityOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-[120px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                    {(["days", "weeks", "months"] as const).map((g) => (
                      <button key={g} onClick={() => { setGranularity(g); setGranularityOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between transition ${granularity === g ? "text-blue-600 font-semibold bg-blue-50/60" : "text-gray-700"}`}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                        {granularity === g && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Period Analysis chart ── */}
        {activeTab === 0 && (
          <div className="animate-in fade-in duration-200">
            <div className="sm:overflow-x-auto scrollbar-none -mx-1 px-1 outline-none focus:outline-none">
              <div className="h-[260px] sm:h-[340px] lg:h-[440px] sm:min-w-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregatedBarData} barCategoryGap="18%" margin={{ top: 28, right: 10, left: -10, bottom: isMobile ? 0 : 4 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 3" stroke="#F3F4F6" />
                    <XAxis dataKey="date" tick={isMobile && aggregatedBarData.length > 8 ? false : <BarXTick />} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} height={isMobile && aggregatedBarData.length > 8 ? 4 : 30} />
                    <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} tickFormatter={(v) => chartMetric === "Clicks" ? `${(v / 1000).toFixed(0)}K` : `$${v / 1000}K`} />
                    <Tooltip content={(p: any) => <ChartTooltip {...p} metric={chartMetric} />} cursor={{ fill: "rgba(99, 102, 241, 0.05)" }} />
                    {chartSeries.map(({ name, color }) => {
                      const visibleLast = chartSeries.filter(({ name: n }) => !hiddenSeries.has(n) && (chartGroupBy === "Type" || rowTypeFilter === null || rowTypeFilter.has(n)));
                      const isVisibleTop = visibleLast.length > 0 && visibleLast[visibleLast.length - 1].name === name;
                      const isHidden = hiddenSeries.has(name) || (chartGroupBy === "Campaign" && rowTypeFilter !== null && !rowTypeFilter.has(name));
                      return (
                        <Bar key={name} dataKey={name} stackId="a" fill={color} hide={isHidden} radius={isVisibleTop ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
                          {isVisibleTop && <LabelList dataKey="visibleTotal" content={renderTotalLabelChart} />}
                        </Bar>
                      );
                    })}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {chartGroupBy === "Campaign" && rowTypeFilter !== null && (
              <div className="flex items-center gap-1.5 mt-2 mb-1 justify-center">
                <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filtered by {checkedRows.size + (clickedRow !== null ? 1 : 0)} selected row{checkedRows.size + (clickedRow !== null ? 1 : 0) > 1 ? "s" : ""}
                </span>
                <button onClick={() => { setCheckedRows(new Set()); setClickedRow(null); }}
                  className="text-[11px] text-gray-400 hover:text-gray-700 transition">× Clear</button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 justify-center">
              {chartSeries.map(({ name, color }) => {
                const hidden = hiddenSeries.has(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleSeries(name)}
                    className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] cursor-pointer select-none transition-opacity hover:opacity-80"
                    style={{ opacity: hidden ? 0.38 : 1 }}
                  >
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm shrink-0 transition-all" style={{ background: hidden ? "#9CA3AF" : color }} />
                    <span className={`transition-all ${hidden ? "line-through text-gray-400" : "text-gray-500"}`}>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Ad Performance chart ── */}
        {activeTab === 1 && (
          <div className="animate-in fade-in duration-200">
            <div className="sm:overflow-x-auto scrollbar-none -mx-1 px-1 outline-none focus:outline-none">
              <div className="h-[260px] sm:h-[340px] lg:h-[440px] sm:min-w-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={aggregatedAdPerfData} barCategoryGap="18%" margin={{ top: 28, right: isMobile ? 4 : 48, left: -10, bottom: 30 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 3" stroke="#F3F4F6" yAxisId="left" />
                    <XAxis dataKey="date" tick={isMobile && aggregatedAdPerfData.length > 8 ? false : (p) => <AdXTick {...p} data={aggregatedAdPerfData} />} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} height={isMobile && aggregatedAdPerfData.length > 8 ? 4 : 48} />
                    <YAxis yAxisId="left" domain={[0, "auto"]} tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} tickFormatter={(v) => `$${v / 1000}K`} label={isMobile ? undefined : { value: "Conv. Value / Profit / Cost", angle: -90, position: "insideLeft", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 11 } }} />
                    <YAxis yAxisId="right" orientation="right" hide domain={[0, 6]} />
                    <YAxis yAxisId="clicks" orientation="right" hide={isMobile} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} domain={[0, 8000]} label={isMobile ? undefined : { value: "Clicks", angle: 90, position: "insideRight", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 11 } }} />
                    <ReferenceLine yAxisId="left" y={0} stroke="#E5E7EB" strokeWidth={1} />
                    <Tooltip content={(p) => <AdTooltip {...p} data={aggregatedAdPerfData} />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                    <Bar yAxisId="left" dataKey="costBar" stackId="a" fill="#F87171" fillOpacity={0.9} radius={[0, 0, 3, 3]} hide={hiddenAdPerf.has("cost")} isAnimationActive={false}>
                      <LabelList dataKey="costBar" content={renderCostLabel} />
                      <LabelList dataKey="costBar" content={renderLossTopLabel} />
                    </Bar>
                    <Bar yAxisId="left" dataKey="profitBar" stackId="a" fill="#4ADE80" radius={[3, 3, 0, 0]} hide={hiddenAdPerf.has("profit")} isAnimationActive={false}>
                      <LabelList dataKey="profitBar" content={renderProfitLabel} />
                      <LabelList dataKey="profitBar" content={renderConvLabel} />
                    </Bar>
                    <Line yAxisId="clicks" type="monotone" dataKey="clicks" stroke="#1F2937" strokeWidth={1.5} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, fill: "#1F2937" }} hide={hiddenAdPerf.has("clicks")} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 justify-center">
              {([
                { key: "conv", label: "Conv. Value", color: "#0EA5E9" },
                { key: "profit", label: "Profit", color: "#4ADE80" },
                { key: "cost", label: "Cost", color: "#F87171" },
                { key: "clicks", label: "Clicks", color: "#1F2937", line: true },
                { key: "roas", label: "ROAS", color: "#8B5CF6", dot: true },
              ] as { key: string; label: string; color: string; line?: boolean; dot?: boolean }[]).map(({ key, label, color, line, dot }) => {
                const hidden = hiddenAdPerf.has(key);
                return (
                  <button key={key} onClick={() => setHiddenAdPerf((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })}
                    className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] cursor-pointer select-none transition-opacity hover:opacity-80"
                    style={{ opacity: hidden ? 0.38 : 1 }}>
                    {line
                      ? <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={hidden ? "#9CA3AF" : color} strokeWidth="1.5" strokeDasharray="4 2"/></svg>
                      : dot
                      ? <div className="w-2 h-2 rounded-full shrink-0 transition-all" style={{ background: hidden ? "#9CA3AF" : color }} />
                      : <div className="w-2 h-2 rounded-sm shrink-0 transition-all" style={{ background: hidden ? "#9CA3AF" : color }} />
                    }
                    <span className={`transition-all ${hidden ? "line-through text-gray-400" : "text-gray-500"}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Profit / Loss chart ── */}
        {activeTab === 2 && (
          <div className="animate-in fade-in duration-200">
            <div className="sm:overflow-x-auto scrollbar-none -mx-1 px-1 outline-none focus:outline-none">
              <div className="h-[260px] sm:h-[340px] lg:h-[440px] sm:min-w-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={aggregatedPlData} barCategoryGap="18%" margin={{ top: 28, right: isMobile ? 4 : 56, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 3" stroke="#F3F4F6" yAxisId="left" />
                    <XAxis dataKey="date" tick={isMobile && aggregatedPlData.length > 8 ? false : { fontSize: 12, fill: "#9CA3AF" }} height={isMobile && aggregatedPlData.length > 8 ? 4 : undefined} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                      label={isMobile ? undefined : { value: "Cumulative Profit", angle: -90, position: "insideLeft", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 11 } }} />
                    <YAxis yAxisId="right" orientation="right" hide={isMobile} tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                      label={isMobile ? undefined : { value: "Daily Profit", angle: 90, position: "insideRight", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 11 } }} />
                    <Tooltip content={(p) => <PlTooltip {...p} data={aggregatedPlData} />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                    <ReferenceLine yAxisId="left" y={7000} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 3" />
                    <ReferenceLine yAxisId="left" y={3500} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 3" />
                    <Bar yAxisId="left" dataKey="cumulative" fill="#4ADE80" radius={[3, 3, 0, 0]} hide={hiddenPL.has("cumulative")} isAnimationActive={false}>
                      <LabelList dataKey="cumulative" content={renderPlLabel} />
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="dailyProfit" stroke="#1F2937" strokeWidth={1.5} strokeDasharray="4 3" hide={hiddenPL.has("daily")}
                      dot={(dotProps: unknown) => {
                        const p = dotProps as { cx: number; cy: number; index: number; key?: string };
                        const item = aggregatedPlData[p.index];
                        return <circle key={p.index} cx={p.cx} cy={p.cy} r={3} fill={item && item.dailyProfit < 0 ? "#EF4444" : "#1F2937"} stroke="none" />;
                      }}
                      activeDot={{ r: 4 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 justify-center">
              {([
                { key: "cumulative", label: "Cumulative Profit", color: "#4ADE80" },
                { key: "daily", label: "Daily Profit", color: "#1F2937", line: true },
                { key: "loss", label: "Daily Loss", color: "#EF4444", dot: true },
              ] as { key: string; label: string; color: string; line?: boolean; dot?: boolean }[]).map(({ key, label, color, line, dot }) => {
                const hidden = hiddenPL.has(key);
                const toggleKey = key === "loss" ? "daily" : key;
                return (
                  <button key={key} onClick={() => setHiddenPL((prev) => { const n = new Set(prev); n.has(toggleKey) ? n.delete(toggleKey) : n.add(toggleKey); return n; })}
                    className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] cursor-pointer select-none transition-opacity hover:opacity-80"
                    style={{ opacity: hidden ? 0.38 : 1 }}>
                    {line
                      ? <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={hidden ? "#9CA3AF" : color} strokeWidth="1.5" strokeDasharray="4 2"/></svg>
                      : dot
                      ? <div className="w-2 h-2 rounded-full shrink-0 transition-all" style={{ background: hidden ? "#9CA3AF" : color }} />
                      : <div className="w-2 h-2 rounded-sm shrink-0 transition-all" style={{ background: hidden ? "#9CA3AF" : color }} />
                    }
                    <span className={`transition-all ${hidden ? "line-through text-gray-400" : "text-gray-500"}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Segments chart ── */}
        {activeTab === 3 && (
          <div className="animate-in fade-in duration-200">
            {/* Mobile: first donut only, full width */}
            <div className="sm:hidden">
              <SegmentDonut title="Revenue" data={segRevenue}
                formatValue={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(2)}K`} />
            </div>
            {/* Desktop: 3 columns */}
            <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-4">
              <SegmentDonut title="Revenue" data={segRevenue}
                formatValue={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(2)}K`}
                colorScheme="blue" />
              <SegmentDonut title="Ad Profit" data={segAdProfit}
                formatValue={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(2)}K`}
                colorScheme="green" />
              <SegmentDonut title="Conversions" data={segConversions}
                formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(2)}K` : String(v)}
                colorScheme="violet" />
            </div>
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
              <button
                onClick={() => { setAddEventOpen(true); setEvtCategory("Events"); setEvtType(null); setEvtStartDate("2026-04-14"); setEvtEndDate(""); setEvtTitle(""); setEvtDesc(""); }}
                className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1 whitespace-nowrap"
              >
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
          {timelineOpen && isPortrait && (
            <div className="mt-2 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-[12px] text-blue-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-blue-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <p><span className="font-semibold">Events Timeline</span> is available on wider screens. Rotate to landscape mode or open on a larger screen to view the full timeline.</p>
            </div>
          )}
          {timelineOpen && !isPortrait && (
            <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
              <div className="min-w-[600px]">
                {/* Date row */}
                <div className="flex border-b border-gray-100 pb-1.5 mb-0.5">
                  <div className="w-[64px] shrink-0" />
                  {dates.map((date) => (
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
                    {dates.map((date) => {
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
                    {dates.map((date) => {
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
                    {dates.map((date) => {
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
        <div className="px-4 sm:px-5 py-4 flex items-start justify-between flex-wrap gap-2 sm:gap-3 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-[17px] font-bold text-gray-900">Campaign Performance</h2>
            <p className="text-[13px] text-gray-400 mt-0.5 hidden sm:block">Detailed analytics for {currentRows.length} campaigns • {fmtMs(rangeStart)} – {fmtMs(rangeEnd)}</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
            <span className="text-[13px] text-gray-500 hidden sm:inline">Filters:</span>

            {/* Campaign Name multi-select dropdown */}
            <div className="relative">
              <button
                onClick={() => setCampaignDropdownOpen(!campaignDropdownOpen)}
                className={`flex items-center gap-1.5 text-[13px] border rounded-lg px-2.5 py-1.5 transition whitespace-nowrap ${
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
                          checked={selectedCampaigns.size === currentRows.length && currentRows.length > 0}
                          onChange={() => {
                            if (selectedCampaigns.size === currentRows.length) setSelectedCampaigns(new Set());
                            else setSelectedCampaigns(new Set(currentRows.map((r) => r.name)));
                          }}
                          className="rounded"
                        />
                        <span className="text-[11px] text-gray-500">
                          {selectedCampaigns.size === 0 ? "Select All" : `${selectedCampaigns.size} of ${currentRows.length} selected`}
                        </span>
                      </label>
                      {selectedCampaigns.size > 0 && (
                        <button onClick={() => setSelectedCampaigns(new Set())} className="text-[11px] text-gray-400 hover:text-gray-700 transition">× Clear</button>
                      )}
                    </div>
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {currentRows
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

            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCheckedRows(new Set()); setClickedRow(null); }}
              className="text-[13px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 bg-white">
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select className="text-[13px] border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 bg-white">
              <option>Status</option><option>Active</option><option>Paused</option>
            </select>
            {(selectedCampaigns.size > 0 || typeFilter !== "All") && (
              <button
                onClick={() => { setSelectedCampaigns(new Set()); setTypeFilter("All"); setCheckedRows(new Set()); setClickedRow(null); }}
                className="text-[13px] text-blue-600 hover:text-blue-800 transition whitespace-nowrap"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse min-w-[1280px]">
            <colgroup>
              <col className="w-10" />
              <col className="w-14 hidden sm:table-column" />
              <col style={{ width: namesCollapsed ? 0 : 160 }} />
              <col className="w-[90px] hidden sm:table-column" />
              <col /><col /><col /><col /><col /><col /><col /><col /><col /><col />
              <col className="w-[108px]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-3 py-2.5 sticky left-0 z-20 bg-gray-50">
                  <div className="flex items-center gap-1.5">
                    <input type="checkbox" className="rounded cursor-pointer"
                      checked={checkedRows.size > 0 && checkedRows.size === filtered.length}
                      ref={(el) => { if (el) el.indeterminate = checkedRows.size > 0 && checkedRows.size < filtered.length; }}
                      onChange={() => {
                        if (checkedRows.size === filtered.length) setCheckedRows(new Set());
                        else setCheckedRows(new Set(filtered.map((_, i) => i)));
                      }}
                    />
                    {namesCollapsed && (
                      <button onClick={() => setNamesCollapsed(false)}
                        className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    )}
                  </div>
                </th>
                <th className="px-2 py-2.5 text-left text-gray-500 font-medium text-[12px] sticky left-10 z-20 bg-gray-50 hidden sm:table-cell">Status</th>
                {([
                  ["Campaign","name","left"],["Type","type","left"],
                  ["Impr.","impr","right"],["Clicks","clicks","right"],["CPC","cpc","right"],["CTR","ctr","right"],
                  ["Conv. rate","convRate","right"],["Conv.","conv","right"],["CPA","cpa","right"],
                  ["Revenue","revenue","right"],["Cost","cost","right"],["Profit (ads)","profit","right"],["ROAS","roas","right"],
                ] as [string, SortKey, "left" | "right"][]).map(([label, col, align]) => (
                  <th key={col} onClick={() => handleSort(col)}
                    className={`text-${align} text-gray-500 font-medium whitespace-nowrap cursor-pointer hover:text-gray-700 select-none text-[12px]${col === "name" ? " sticky left-10 sm:left-24 z-20 bg-gray-50 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-200 overflow-hidden p-0" : " px-2.5 py-2.5"}${col === "type" ? " hidden sm:table-cell" : ""}`}>
                    {col === "name" ? (
                      <div style={{
                        width: namesCollapsed ? 0 : 160,
                        overflow: "hidden",
                        paddingLeft: namesCollapsed ? 0 : 10,
                        paddingRight: namesCollapsed ? 0 : 4,
                        paddingTop: 10,
                        paddingBottom: 10,
                        opacity: namesCollapsed ? 0 : 1,
                        transition: "width 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-left 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-right 380ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease",
                        whiteSpace: "nowrap",
                      }}>
                        <span className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-0.5">
                            {label}<SortIcon dir={sortCol === col ? sortDir : null} />
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); setNamesCollapsed(true); }}
                            className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition shrink-0">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                          </button>
                        </span>
                      </div>
                    ) : (
                      <>{label}<SortIcon dir={sortCol === col ? sortDir : null} /></>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage).map((row, pageI) => {
                const i = (page - 1) * rowsPerPage + pageI;
                return (
                <tr key={i}
                  onClick={() => {
                    setCheckedRows(new Set());
                    setClickedRow(clickedRow === i ? null : i);
                  }}
                  className={`border-t border-gray-100 cursor-pointer group transition-colors duration-150 ${
                    clickedRow === i ? "bg-blue-100/40" : checkedRows.has(i) ? "bg-blue-50/30" : "hover:bg-blue-50/20"
                  }`}>
                  <td className={`px-3 py-2.5 sticky left-0 z-10 isolate ${clickedRow === i ? "bg-blue-100" : checkedRows.has(i) ? "bg-blue-50" : "bg-white group-hover:bg-blue-50"}`}>
                    <input type="checkbox" className="rounded cursor-pointer"
                      checked={checkedRows.has(i)}
                      onChange={(e) => {
                        e.stopPropagation();
                        setClickedRow(null);
                        setCheckedRows((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
                      }}
                    />
                  </td>
                  <td className={`px-2 py-2.5 sticky left-10 z-10 isolate hidden sm:table-cell ${clickedRow === i ? "bg-blue-100" : checkedRows.has(i) ? "bg-blue-50" : "bg-white group-hover:bg-blue-50"}`}>
                    <span className={`w-2 h-2 rounded-full inline-block ${row.status === "green" ? "bg-green-500" : "bg-gray-300"}`} />
                  </td>
                  <td className={`sticky left-10 sm:left-24 z-10 isolate overflow-hidden after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-100 p-0 ${clickedRow === i ? "bg-blue-100" : checkedRows.has(i) ? "bg-blue-50" : "bg-white group-hover:bg-blue-50"}`}>
                    <div
                      style={{
                        width: namesCollapsed ? 0 : 160,
                        overflow: "hidden",
                        paddingLeft: namesCollapsed ? 0 : 10,
                        paddingRight: namesCollapsed ? 0 : 10,
                        paddingTop: 10,
                        paddingBottom: 10,
                        opacity: namesCollapsed ? 0 : 1,
                        cursor: namesCollapsed ? undefined : "pointer",
                        transition: "width 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-left 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-right 380ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease",
                      }}
                      onClick={namesCollapsed ? undefined : (e) => {
                        e.stopPropagation();
                        setExpandedNameIdx(expandedNameIdx === i ? null : i);
                        setCheckedRows(new Set());
                        setClickedRow(clickedRow === i ? null : i);
                      }}
                      title={namesCollapsed ? undefined : row.name}
                    >
                      <span className={`font-medium text-gray-800 text-[12px] hover:text-blue-600 transition block ${expandedNameIdx === i ? "whitespace-normal wrap-break-word" : "whitespace-nowrap overflow-hidden text-ellipsis"}`}>
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 hidden sm:table-cell">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">{row.type}</span>
                  </td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("impr", row.impr, "blue")}>{fmtNum(row.impr)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("clicks", row.clicks, "blue")}>{fmtNum(row.clicks)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("cpc", row.cpc, "blue")}>{fmtCurrency(row.cpc)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("ctr", row.ctr, "blue")}>{fmtPct(row.ctr)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("convRate", row.convRate, "blue")}>{fmtPct(row.convRate)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("conv", row.conv, "blue")}>{fmtNum(row.conv)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("cpa", row.cpa, "green")}>{row.cpa.toFixed(1)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums font-medium" style={cellStyle("revenue", row.revenue, "green")}>${fmtK(row.revenue)}</td>
                  <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={cellStyle("cost", row.cost, "green")}>${fmtK(row.cost)}</td>
                  <td className={`px-2.5 py-2.5 text-right tabular-nums ${row.profit < 0 ? "text-red-600" : "text-green-700"}`}
                    style={cellStyle("profit", Math.abs(row.profit), row.profit < 0 ? "red" : "green")}>
                    {row.profit < 0 ? "-$" : "$"}{Math.abs(row.profit).toFixed(2)}K
                  </td>
                  <td className="px-2.5 py-2.5 text-right tabular-nums"
                    style={{ backgroundColor: row.roasColor === "green" ? "#DCFCE7" : row.roasColor === "red" ? "#FEE2E2" : row.roasColor === "orange" ? "#FFEDD5" : "transparent" }}>
                    <span className="font-medium" style={{ color: row.roasColor === "green" ? "#15803D" : row.roasColor === "red" ? "#DC2626" : row.roasColor === "orange" ? "#EA580C" : "#9CA3AF" }}>
                      {row.roas !== "null" ? row.roas : "—"}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-gray-800 text-[13px]">
                <td className="px-3 py-3 sticky left-0 z-10 bg-gray-50" />
                <td className="px-2 py-3 sticky left-10 z-10 bg-gray-50 hidden sm:table-cell" />
                <td className="sticky left-10 sm:left-24 z-10 bg-gray-50 overflow-hidden after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-200 p-0">
                  <div style={{
                    width: namesCollapsed ? 0 : 160,
                    overflow: "hidden",
                    paddingLeft: namesCollapsed ? 0 : 10,
                    paddingRight: namesCollapsed ? 0 : 10,
                    paddingTop: 12,
                    paddingBottom: 12,
                    opacity: namesCollapsed ? 0 : 1,
                    whiteSpace: "nowrap",
                    transition: "width 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-left 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-right 380ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease",
                  }}>
                    Total <span className="text-gray-400 font-normal text-[11px]">({filtered.length})</span>
                  </div>
                </td>
                <td className="px-2.5 py-3 hidden sm:table-cell" />
                <td className="px-2.5 py-3 text-right tabular-nums">{fmtNum(tableTotals.totImpr)}</td>
                <td className="px-2.5 py-3 text-right tabular-nums">{fmtNum(tableTotals.totClicks)}</td>
                <td className="px-2.5 py-3 text-right tabular-nums">{fmtCurrency(tableTotals.avgCpc)}</td>
                <td className="px-2.5 py-3 text-right tabular-nums">{fmtPct(tableTotals.avgCtr)}</td>
                <td className="px-2.5 py-3 text-right tabular-nums">{fmtPct(tableTotals.avgConvRate)}</td>
                <td className="px-2.5 py-3 text-right tabular-nums">{fmtNum(tableTotals.totConv)}</td>
                <td className="px-2.5 py-3 text-right tabular-nums">{tableTotals.avgCpa.toFixed(1)}</td>
                <td className="px-2.5 py-3 text-right tabular-nums">${fmtK(tableTotals.totRev)}</td>
                <td className="px-2.5 py-3 text-right tabular-nums">${fmtK(tableTotals.totCost)}</td>
                <td className={`px-2.5 py-3 text-right tabular-nums ${tableTotals.totProfit < 0 ? "text-red-600" : "text-green-700"}`}>
                  {tableTotals.totProfit < 0 ? "-$" : "$"}{Math.abs(tableTotals.totProfit).toFixed(2)}K
                </td>
                <td className="px-2.5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2 border-t border-gray-100">
          <p className="text-[13px] text-gray-500">
            <span className="hidden sm:inline">Showing {(page - 1) * rowsPerPage + 1} to {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} campaigns</span>
            <span className="sm:hidden">{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} / {filtered.length}</span>
            <span className="mx-2 hidden sm:inline">|</span>
            <span className="hidden sm:inline">Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              className="ml-1.5 text-[13px] border border-gray-200 rounded px-1.5 py-0.5 bg-white outline-none cursor-pointer"
            >
              <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
            </select>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-[13px] font-medium transition ${
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

      {/* ── Add Custom Event Modal ── */}
      {addEventOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 touch-none">
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={() => setAddEventOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-gray-900">Add Custom Event</h3>
                  <p className="text-[12px] text-gray-400 mt-0.5">Add your own event to the timeline</p>
                </div>
              </div>
              <button onClick={() => setAddEventOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Select Category */}
              <div>
                <p className="text-[12px] font-semibold text-gray-700 mb-2">Select Category</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "Events" as const, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color: "text-blue-600 border-blue-400 bg-blue-50" },
                    { id: "Ads" as const, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, color: "text-orange-500 border-orange-400 bg-orange-50" },
                    { id: "Website" as const, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, color: "text-pink-500 border-pink-400 bg-pink-50" },
                  ] as { id: "Events"|"Ads"|"Website"; icon: React.ReactNode; color: string }[]).map(({ id, icon, color }) => (
                    <button key={id} onClick={() => setEvtCategory(id)}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-[13px] font-medium transition ${evtCategory === id ? color : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      {icon}{id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Type */}
              <div>
                <p className="text-[12px] font-semibold text-gray-700 mb-2">Event Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "Holiday", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                    { id: "Special Event", icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z" fill="#a78bfa"/></svg> },
                    { id: "Seasonal", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> },
                    { id: "Sale/Promotion", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> },
                    { id: "Flash Sale", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
                    { id: "Clearance", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> },
                  ].map(({ id, icon }) => (
                    <button key={id} onClick={() => setEvtType(evtType === id ? null : id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] transition ${evtType === id ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                      <span className={evtType === id ? "text-blue-500" : "text-gray-400"}>{icon}</span>{id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <p className="text-[12px] font-semibold text-gray-700">Date</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1">Start Date</p>
                    <input type="date" value={evtStartDate} onChange={(e) => setEvtStartDate(e.target.value)}
                      className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 mb-1">End Date <span className="text-gray-400">(Optional)</span></p>
                    <input type="date" value={evtEndDate} onChange={(e) => setEvtEndDate(e.target.value)}
                      className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 bg-white" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Leave end date empty for single-day event</p>
              </div>

              {/* Event Title */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <p className="text-[12px] font-semibold text-gray-700">Event Title</p>
                </div>
                <input type="text" maxLength={80} value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)}
                  placeholder="e.g., Black Friday Campaign Launch"
                  className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 placeholder-gray-300" />
                <p className="text-[11px] text-gray-400 mt-1">{evtTitle.length}/80 characters</p>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  <p className="text-[12px] font-semibold text-gray-700">Description <span className="font-normal text-gray-400">(Optional)</span></p>
                </div>
                <textarea rows={3} value={evtDesc} onChange={(e) => setEvtDesc(e.target.value)}
                  placeholder="Add additional details about this event..."
                  className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400 placeholder-gray-300 resize-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100">
              <button onClick={() => setAddEventOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button
                disabled={!evtTitle.trim()}
                onClick={() => setAddEventOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Campaign Assistant Sidebar ── */}
      {/* Mobile backdrop */}
      {aiOpen && <div className="fixed inset-0 bg-black/40 z-[99] lg:hidden animate-in fade-in duration-200" onClick={() => setAiOpen(false)} />}

      {/* Sliding panel */}
      <div className={`fixed right-0 top-0 h-screen z-[100] flex flex-col bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-out w-full sm:w-[440px] ${aiOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z"/></svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">AI Campaign Assistant</h3>
              <p className="text-[12px] text-gray-400">All Account Data</p>
            </div>
          </div>
          <button onClick={() => setAiOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Metrics bar */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 overflow-x-auto scrollbar-none shrink-0">
          {AI_METRICS.map(({ label, value, hi }) => (
            <div key={label} className="flex flex-col shrink-0">
              <span className="text-[11px] text-gray-400 whitespace-nowrap">{label}</span>
              <span className={`text-[13px] font-bold whitespace-nowrap ${hi ?? "text-gray-900"}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-none">
          <span className="text-[12px] text-gray-400 shrink-0">Quick:</span>
          {AI_QUICK.map(({ label, icon }) => (
            <button key={label} onClick={() => sendAiMsg(label)}
              className="flex items-center gap-1.5 text-[12px] text-gray-600 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 whitespace-nowrap shrink-0 transition">
              <span className="text-gray-400">{icon}</span>{label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                {aiMsgs.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z"/></svg>
                      </div>
                    )}
                    <div className={`max-w-[78%] ${msg.role === "assistant" ? "bg-gray-50 rounded-2xl rounded-tl-sm" : "bg-blue-600 text-white rounded-2xl rounded-tr-sm"} px-4 py-3`}>
                      {msg.role === "assistant" ? (
                        <>
                          <div className="text-[13px] text-gray-800 space-y-0.5">{renderAiText(msg.text)}</div>
                          {msg.suggestions && (
                            <div className="mt-3">
                              <p className="text-[11px] text-gray-400 mb-1.5">💡 You might also ask:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.suggestions.map(s => (
                                  <button key={s} onClick={() => sendAiMsg(s)}
                                    className="text-[11px] text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5 hover:bg-white transition bg-white/80">
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
                            <span className="text-[10px] text-gray-400">{msg.time}</span>
                            <button onClick={() => toggleAiPin(msg.id)} title={msg.pinned ? "Unpin" : "Pin"}
                              className={`transition ${msg.pinned ? "text-purple-500" : "text-gray-300 hover:text-gray-500"}`}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill={msg.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-.85-1.65L16 12V5h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v7l-2.15 1.59A2 2 0 0 0 5 15.24V17z"/></svg>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-[13px] leading-relaxed">{msg.text}</p>
                          <p className="text-[10px] text-blue-200 mt-1.5">{msg.time}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z"/></svg>
                    </div>
                    <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce inline-block" style={{ animationDelay: `${delay}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-5 pt-3 pb-4 border-t border-gray-100 shrink-0">
                <div className="flex gap-2">
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMsg(); } }}
                    placeholder="Ask anything about this campaign..."
                    className="flex-1 text-[14px] border border-blue-200 focus:border-blue-400 rounded-xl px-4 py-2.5 outline-none placeholder-gray-300 transition"
                  />
                  <button
                    onClick={() => sendAiMsg()}
                    disabled={!aiInput.trim() || aiLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[14px] font-semibold transition disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#818cf8,#a78bfa)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Send
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Chat history is automatically saved</p>
              </div>

      </div>

      {/* ── Mobile Date Picker Modal ── */}
      {datePickerOpen && (
        <div className="sm:hidden fixed inset-0 z-[200] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDatePickerOpen(false)} />
          <div
            className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col w-full max-h-[92vh] overflow-y-auto"
            onMouseLeave={() => setPickerHover(null)}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            {/* Presets */}
            <div className="w-full sm:w-[160px] border-b sm:border-b-0 sm:border-r border-gray-100 py-3 shrink-0 bg-gray-50/50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pb-2">Quick Select</p>
              <div className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-none px-2 sm:px-0">
                {PERIOD_PRESETS.map(({ label, days }) => {
                  const ps = END_MS - (days - 1) * DAY_MS;
                  const isActive = pickerTempStart === ps && pickerTempEnd === END_MS;
                  return (
                    <button key={days}
                      onClick={() => { setPickerTempStart(ps); setPickerTempEnd(END_MS); setPickerStep(0); }}
                      className={`whitespace-nowrap sm:whitespace-normal text-left px-4 py-2 text-[13px] transition-all ${isActive ? "bg-blue-600 text-white font-bold rounded-xl mx-2 shadow-md shadow-blue-200" : "text-gray-600 hover:bg-white hover:text-blue-600"}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calendars + Content */}
            <div className="flex flex-col flex-1 min-w-0">
              {/* Header / Month Nav */}
              <div className="flex items-center justify-between px-6 pt-5 pb-2">
                <button
                  onClick={() => {
                    if (pickerViewMonth === 0) { setPickerViewMonth(11); setPickerViewYear(pickerViewYear - 1); }
                    else setPickerViewMonth(pickerViewMonth - 1);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-all border border-gray-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div className="text-[15px] font-bold text-gray-900">
                  Select Period
                </div>
                <button
                  onClick={() => {
                    if (pickerViewMonth === 11) { setPickerViewMonth(0); setPickerViewYear(pickerViewYear + 1); }
                    else setPickerViewMonth(pickerViewMonth + 1);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-all border border-gray-100">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>

              {/* Two months scrollable area */}
              <div className="flex flex-col lg:flex-row gap-8 px-6 py-4 overflow-y-auto lg:overflow-y-visible items-center sm:items-start">
                {([0, 1] as const).map((offset) => {
                  const m = (pickerViewMonth + offset) % 12;
                  const y = pickerViewYear + Math.floor((pickerViewMonth + offset) / 12);
                  return (
                    <CalMonth key={offset} year={y} month={m}
                      tempStart={pickerTempStart} tempEnd={pickerTempEnd}
                      hover={pickerHover} step={pickerStep}
                      maxMs={END_MS}
                      onDayClick={(ts) => {
                        if (pickerStep === 0) {
                          setPickerTempStart(ts);
                          setPickerTempEnd(null);
                          setPickerStep(1);
                        } else {
                          if (pickerTempStart !== null && ts < pickerTempStart) {
                            setPickerTempEnd(pickerTempStart);
                            setPickerTempStart(ts);
                          } else {
                            setPickerTempEnd(ts);
                          }
                          setPickerStep(0);
                        }
                      }}
                      onDayHover={setPickerHover}
                    />
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
                <button onClick={() => setDatePickerOpen(false)}
                  className="flex-1 py-3 text-[14px] font-bold text-gray-600 hover:bg-gray-50 rounded-2xl transition-all border border-gray-200">
                  Cancel
                </button>
                <button
                  disabled={!pickerTempStart || !pickerTempEnd}
                  onClick={() => {
                    if (pickerTempStart && pickerTempEnd) {
                      setRangeStart(pickerTempStart);
                      setRangeEnd(pickerTempEnd);
                      setDatePickerOpen(false);
                      setHiddenSeries(new Set());
                      setCheckedRows(new Set());
                      setClickedRow(null);
                    }
                  }}
                  className="flex-1 py-3 text-[14px] bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all">
                  Apply Period
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
