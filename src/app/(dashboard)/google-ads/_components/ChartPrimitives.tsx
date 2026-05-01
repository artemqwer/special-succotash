"use client";

import React from "react";
import { AdPerfItem, PlItem, ChartMetric } from "../_data/constants";

export const MONTH_IDX: Record<string, number> = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };

export function isWeekend(dateStr: string) {
  const [m, d] = dateStr.split(" ");
  const day = new Date(2026, MONTH_IDX[m], parseInt(d)).getDay();
  return day === 0 || day === 6;
}

export const ChartTooltip = ({ active, payload, label, metric = "Revenue" }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; metric?: ChartMetric }) => {
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

export function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <span className="ml-1 text-gray-300 text-[10px]">
      {dir === "asc" ? "↑" : dir === "desc" ? "↓" : "↕"}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BarXTick = ({ x, y, payload }: any) => {
  const weekend = isWeekend(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} fill={weekend ? "#3B82F6" : "#9CA3AF"} fontSize={13} textAnchor="middle" fontWeight={weekend ? 700 : 400}>
        {payload.value}
      </text>
    </g>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AdXTick = ({ x, y, payload, data }: any) => {
  const item = data.find((d: AdPerfItem) => d.date === payload.value);
  const weekend = isWeekend(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <circle cx={0} cy={0} r={3.5} fill="#8B5CF6" />
      <text x={0} y={0} dy={14} fill="#8B5CF6" fontSize={11} textAnchor="middle" fontWeight={600}>
        {item ? `${item.roas.toFixed(2)}` : ""}
      </text>
      <text x={0} y={0} dy={30} fill={weekend ? "#3B82F6" : "#9CA3AF"} fontSize={12} textAnchor="middle" fontWeight={weekend ? 700 : 400}>{payload.value}</text>
    </g>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PlXTick = ({ x, y, payload }: any) => {
  const weekend = isWeekend(payload.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} fill={weekend ? "#3B82F6" : "#9CA3AF"} fontSize={12} textAnchor="middle" fontWeight={weekend ? 700 : 400}>{payload.value}</text>
    </g>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AdTooltip = ({ active, payload, label, data }: any) => {
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
export const PlTooltip = ({ active, payload, label, data }: any) => {
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
export const makeRenderConvLabel = (data: AdPerfItem[], hideConv = false) => ({ x = 0, y = 0, width = 0, index: idx = 0 }: any) => {
  if (hideConv || width < 24) return null;
  const item = data[idx];
  if (!item || item.profit < 0) return null;
  return <text x={x + width / 2} y={y - 5} fill="#374151" fontSize={11} fontWeight={700} textAnchor="middle">${(item.convValue / 1000).toFixed(1)}K</text>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderProfitLabel = ({ x = 0, y = 0, width: w = 0, height: h = 0, value: val = 0 }: any) => {
  if (w < 34 || h < 16 || val <= 0) return null;
  return <text x={x + w / 2} y={y + h / 2 + 4} fill="white" fontSize={11} fontWeight={700} textAnchor="middle">${(val / 1000).toFixed(1)}K</text>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderCostLabel = ({ x = 0, y = 0, width: w = 0, height: h = 0, value: val = 0 }: any) => {
  if (w < 34 || h < 16 || val <= 0) return null;
  return <text x={x + w / 2} y={y + h / 2 + 4} fill="white" fontSize={11} fontWeight={700} textAnchor="middle">${(val / 1000).toFixed(1)}K</text>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderPlLabel = ({ x = 0, y = 0, width: w = 0, value: val = 0 }: any) => {
  if (w < 32) return null;
  return (
    <text x={x + w / 2} y={y - 5} fill="#374151" fontSize={12} fontWeight={700} textAnchor="middle">
      ${(val / 1000).toFixed(2)}K
    </text>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeRenderLossTopLabel = (data: AdPerfItem[], hideConv = false) => ({ x = 0, y = 0, width: w = 0, index: idx = 0 }: any) => {
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

// Custom label renderer for stacked bar totals — hidden on narrow bars
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const makeRenderTotalLabel = (metric: ChartMetric) => ({ x: rawX, y: rawY, width: rawW, value: rawV }: any) => {
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
