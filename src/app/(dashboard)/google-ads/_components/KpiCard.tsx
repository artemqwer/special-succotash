"use client";

import React from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

interface KpiCardProps {
  label: string;
  shortLabel?: string;
  icon: React.ReactNode;
  value: string;
  delta: string;
  up: boolean;
  spark: { v: number; date: string }[];
  desc: string;
  hoverFmt: (v: number) => string;
}

export default function KpiCard({ label, shortLabel, icon, value, delta, up, spark, desc, hoverFmt }: KpiCardProps) {
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
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
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
