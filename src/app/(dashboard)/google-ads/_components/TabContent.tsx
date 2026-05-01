"use client";

import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart,
  LabelList, ComposedChart, ReferenceLine, CartesianGrid, Line,
} from "recharts";
import SegmentDonut from "./SegmentDonut";
import {
  ChartTooltip, BarXTick, AdXTick, PlXTick, AdTooltip, PlTooltip,
  makeRenderConvLabel, renderProfitLabel, renderCostLabel, renderPlLabel,
  makeRenderLossTopLabel, makeRenderTotalLabel,
} from "./ChartPrimitives";
import { ChartMetric, ChartGroupBy, AdPerfItem, PlItem } from "../_data/constants";

interface TabContentProps {
  activeTab: number;
  isMobile: boolean;
  // Period Analysis
  aggregatedBarData: Record<string, string | number>[];
  chartSeries: { name: string; color: string }[];
  chartMetric: ChartMetric;
  chartGroupBy: ChartGroupBy;
  chartMetricOpen: boolean;
  chartGroupByOpen: boolean;
  hiddenSeries: Set<string>;
  rowTypeFilter: Set<string> | null;
  checkedRows: Set<number>;
  clickedRow: number | null;
  renderTotalLabelChart: (props: unknown) => React.ReactNode;
  CHART_METRICS: ChartMetric[];
  CHART_GROUPBY: ChartGroupBy[];
  onChartMetricChange: (m: ChartMetric) => void;
  onChartGroupByChange: (g: ChartGroupBy) => void;
  onChartMetricOpenChange: (v: boolean) => void;
  onChartGroupByOpenChange: (v: boolean) => void;
  onToggleSeries: (name: string) => void;
  onClearRowFilter: () => void;
  // Ad Performance
  aggregatedAdPerfData: AdPerfItem[];
  hiddenAdPerf: Set<string>;
  renderConvLabel: (props: unknown) => React.ReactNode;
  renderLossTopLabel: (props: unknown) => React.ReactNode;
  onHiddenAdPerfChange: (v: Set<string>) => void;
  // P&L
  aggregatedPlData: PlItem[];
  hiddenPL: Set<string>;
  dates: string[];
  onHiddenPLChange: (v: Set<string>) => void;
  // Segments
  dynSegData: {
    revenue: { name: string; value: number }[];
    profit: { name: string; value: number }[];
    conversions: { name: string; value: number }[];
  };
  // Granularity
  granularity: "days" | "weeks" | "months";
  granularityOpen: boolean;
  onGranularityChange: (g: "days" | "weeks" | "months") => void;
  onGranularityOpenChange: (v: boolean) => void;
}

export default function TabContent({
  activeTab, isMobile,
  aggregatedBarData, chartSeries, chartMetric, chartGroupBy,
  chartMetricOpen, chartGroupByOpen, hiddenSeries, rowTypeFilter,
  checkedRows, clickedRow, renderTotalLabelChart,
  CHART_METRICS, CHART_GROUPBY,
  onChartMetricChange, onChartGroupByChange, onChartMetricOpenChange, onChartGroupByOpenChange,
  onToggleSeries, onClearRowFilter,
  aggregatedAdPerfData, hiddenAdPerf, renderConvLabel, renderLossTopLabel, onHiddenAdPerfChange,
  aggregatedPlData, hiddenPL, dates, onHiddenPLChange,
  dynSegData,
  granularity, granularityOpen, onGranularityChange, onGranularityOpenChange,
}: TabContentProps) {
  return (
    <>
      {/* Chart controls */}
      <div className="flex items-center justify-between gap-2 mb-4 text-[14px]">
        {activeTab === 0 && (
          <div className="flex items-center gap-2 min-w-0">
            {/* Metric dropdown */}
            <div className="relative">
              <button
                onClick={() => { onChartMetricOpenChange(!chartMetricOpen); onChartGroupByOpenChange(false); }}
                className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 font-medium whitespace-nowrap"
              >
                {chartMetric}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${chartMetricOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {chartMetricOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => onChartMetricOpenChange(false)} />
                  <div className="absolute left-0 top-full mt-1.5 w-[130px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top">
                    {CHART_METRICS.map((m) => (
                      <button key={m} onClick={() => { onChartMetricChange(m); onChartMetricOpenChange(false); }}
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
                onClick={() => { onChartGroupByOpenChange(!chartGroupByOpen); onChartMetricOpenChange(false); }}
                className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 font-medium whitespace-nowrap"
              >
                {chartGroupBy}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${chartGroupByOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {chartGroupByOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => onChartGroupByOpenChange(false)} />
                  <div className="absolute left-0 top-full mt-1.5 w-[120px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top">
                    {CHART_GROUPBY.map((g) => (
                      <button key={g} onClick={() => { onChartGroupByChange(g); onChartGroupByOpenChange(false); }}
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
              onClick={() => onGranularityOpenChange(!granularityOpen)}
              className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-gray-100 whitespace-nowrap text-[14px] font-medium"
            >
              {granularity.charAt(0).toUpperCase() + granularity.slice(1)}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${granularityOpen ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {granularityOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => onGranularityOpenChange(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-[120px] bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150 origin-top-right">
                  {(["days", "weeks", "months"] as const).map((g) => (
                    <button key={g} onClick={() => { onGranularityChange(g); onGranularityOpenChange(false); }}
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
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip content={(p: any) => <ChartTooltip {...p} metric={chartMetric} />} cursor={{ fill: "rgba(99, 102, 241, 0.05)" }} />
                  {chartSeries.map(({ name, color }) => {
                    const visibleLast = chartSeries.filter(({ name: n }) => {
                      const isHidden = hiddenSeries.has(n);
                      return !isHidden && (rowTypeFilter === null || rowTypeFilter.has(n));
                    });
                    const isVisibleTop = visibleLast.length > 0 && visibleLast[visibleLast.length - 1].name === name;
                    const isHidden = hiddenSeries.has(name) || (rowTypeFilter !== null && !rowTypeFilter.has(name));
                    return (
                      <Bar key={name} dataKey={name} stackId="a" fill={color} hide={isHidden} radius={isVisibleTop ? [4, 4, 0, 0] : [0, 0, 0, 0]}>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {isVisibleTop && <LabelList dataKey="visibleTotal" content={renderTotalLabelChart as any} />}
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
              <button onClick={onClearRowFilter}
                className="text-[11px] text-gray-400 hover:text-gray-700 transition">× Clear</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 justify-center">
            {chartSeries.map(({ name, color }) => {
              const hidden = hiddenSeries.has(name);
              return (
                <button
                  key={name}
                  onClick={() => onToggleSeries(name)}
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
                <ComposedChart data={aggregatedAdPerfData} barCategoryGap="18%" margin={{ top: 28, right: isMobile ? 4 : 48, left: isMobile ? -10 : 45, bottom: isMobile ? 0 : 6 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 3" stroke="#F3F4F6" yAxisId="left" />
                  <XAxis dataKey="date" tick={isMobile && aggregatedAdPerfData.length > 8 ? false : (p) => <AdXTick {...p} data={aggregatedAdPerfData} />} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} height={isMobile && aggregatedAdPerfData.length > 8 ? 4 : 48} />
                  <YAxis yAxisId="left" domain={[0, "auto"]} tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} tickFormatter={(v) => `$${v / 1000}K`} label={isMobile ? undefined : { value: "Conv. Value / Profit / Cost", angle: -90, position: "insideLeft", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 11 } }} />
                  <YAxis yAxisId="right" orientation="right" hide domain={[0, 6]} />
                  <YAxis yAxisId="clicks" orientation="right" hide={isMobile} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} domain={[0, 8000]} label={isMobile ? undefined : { value: "Clicks", angle: 90, position: "insideRight", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 11 } }} />
                  <ReferenceLine yAxisId="left" y={0} stroke="#E5E7EB" strokeWidth={1} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip content={(p: any) => <AdTooltip {...p} data={aggregatedAdPerfData} />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                  <Bar yAxisId="left" dataKey="costBar" stackId="a" fill="#F87171" fillOpacity={0.9} radius={[0, 0, 3, 3]} hide={hiddenAdPerf.has("cost")} isAnimationActive={false}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <LabelList dataKey="costBar" content={renderCostLabel as any} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <LabelList dataKey="costBar" content={renderLossTopLabel as any} />
                  </Bar>
                  <Bar yAxisId="left" dataKey="profitBar" stackId="a" fill="#4ADE80" radius={[3, 3, 0, 0]} hide={hiddenAdPerf.has("profit")} isAnimationActive={false}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <LabelList dataKey="profitBar" content={renderProfitLabel as any} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <LabelList dataKey="profitBar" content={renderConvLabel as any} />
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
                <button key={key} onClick={() => { const n = new Set(hiddenAdPerf); n.has(key) ? n.delete(key) : n.add(key); onHiddenAdPerfChange(n); }}
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
                <ComposedChart data={aggregatedPlData} barCategoryGap="18%" margin={{ top: 28, right: isMobile ? 4 : 56, left: -10, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 3" stroke="#F3F4F6" yAxisId="left" />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <XAxis dataKey="date" tick={isMobile && aggregatedPlData.length > 8 ? false : (p: any) => <PlXTick {...p} />} height={isMobile && aggregatedPlData.length > 8 ? 4 : undefined} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                    label={isMobile ? undefined : { value: "Cumulative Profit", angle: -90, position: "insideLeft", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 11 } }} />
                  <YAxis yAxisId="right" orientation="right" hide={isMobile} tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={{ stroke: "#E5E7EB", strokeWidth: 1 }} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`}
                    label={isMobile ? undefined : { value: "Daily Profit", angle: 90, position: "insideRight", offset: 10, style: { textAnchor: "middle", fill: "#9CA3AF", fontSize: 11 } }} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip content={(p: any) => <PlTooltip {...p} data={aggregatedPlData} />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
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
                <button key={key} onClick={() => { const n = new Set(hiddenPL); n.has(toggleKey) ? n.delete(toggleKey) : n.add(toggleKey); onHiddenPLChange(n); }}
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
            <SegmentDonut title="Revenue" data={dynSegData.revenue}
              formatValue={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(2)}K`} />
          </div>
          {/* Desktop: 3 columns */}
          <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SegmentDonut title="Revenue" data={dynSegData.revenue}
              formatValue={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(2)}K`}
              colorScheme="blue" />
            <SegmentDonut title="Ad Profit" data={dynSegData.profit}
              formatValue={(v) => v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(2)}K`}
              colorScheme="green" />
            <SegmentDonut title="Conversions" data={dynSegData.conversions}
              formatValue={(v) => v >= 1000 ? `${(v / 1000).toFixed(2)}K` : String(v)}
              colorScheme="violet" />
          </div>
        </div>
      )}
    </>
  );
}
