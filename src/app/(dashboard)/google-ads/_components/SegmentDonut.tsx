"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { SEG_COLORS } from "../_data/constants";

interface SegmentDonutProps {
  title: string;
  data: { name: string; value: number }[];
  formatValue: (v: number) => string;
  colorScheme?: "blue" | "green" | "violet";
}

export default function SegmentDonut({ title, data, formatValue, colorScheme = "blue" }: SegmentDonutProps) {
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
