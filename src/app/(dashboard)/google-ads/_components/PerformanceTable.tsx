"use client";

import React, { useState, useMemo, useEffect } from "react";
import { SortIcon } from "./ChartPrimitives";
import { fmtNum, fmtK, fmtPct, fmtCurrency, heatmapBg } from "../_data/constants";
import { useCrossFilter } from "@/lib/store";
import type { PerfRow } from "@/app/api/data/[dimension]/route";

type SortCol = keyof Omit<PerfRow, "dimension" | "roas" | "roasColor">;

interface PerformanceTableProps {
  title: string;
  dimensionLabel: string;
  dimensionKey: string;
  dateFrom: string;
  dateTo: string;
  rangeLabel: string;
  isVisible: boolean;
}

function roasStyle(c: PerfRow["roasColor"]) {
  const map = {
    green:  { bg: "#DCFCE7", text: "#15803D" },
    red:    { bg: "#FEE2E2", text: "#DC2626" },
    orange: { bg: "#FFEDD5", text: "#EA580C" },
    gray:   { bg: "#F3F4F6", text: "#9CA3AF" },
  };
  return map[c];
}

export default function PerformanceTable({
  title, dimensionLabel, dimensionKey,
  dateFrom, dateTo, rangeLabel, isVisible,
}: PerformanceTableProps) {
  const [data, setData] = useState<PerfRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>("cost");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const { filters, toggleValue, clearFilter } = useCrossFilter();
  const selected = filters[dimensionKey] ?? [];

  // Fetch when first made visible
  useEffect(() => {
    if (!isVisible || fetched) return;
    setLoading(true);
    setError(null);
    fetch(`/api/data/${dimensionKey}?date_from=${dateFrom}&date_to=${dateTo}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json.data ?? []);
        setFetched(true);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isVisible, fetched, dimensionKey, dateFrom, dateTo]);

  // Re-fetch when date range changes
  useEffect(() => { setFetched(false); }, [dateFrom, dateTo]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
    setPage(1);
  };

  const sorted = useMemo(() => {
    let rows = search
      ? data.filter((r) => r.dimension.toLowerCase().includes(search.toLowerCase()))
      : [...data];
    rows = rows.sort((a, b) => {
      const av = a[sortCol] as number;
      const bv = b[sortCol] as number;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return rows;
  }, [data, sortCol, sortDir, search]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage));
  const paged = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Compute heat ranges
  const heat = useMemo(() => {
    const g = (key: SortCol) => {
      const vals = data.map((r) => r[key] as number);
      return { min: Math.min(...vals, 0), max: Math.max(...vals, 1) };
    };
    return {
      impr: g("impr"), clicks: g("clicks"), ctr: g("ctr"), cpc: g("cpc"),
      convRate: g("convRate"), conv: g("conv"), cpa: g("cpa"),
      revenue: g("revenue"), cost: g("cost"),
    };
  }, [data]);

  // Totals
  const totals = useMemo(() => {
    const rows = sorted;
    const totImpr   = rows.reduce((s, r) => s + r.impr, 0);
    const totClicks = rows.reduce((s, r) => s + r.clicks, 0);
    const totConv   = rows.reduce((s, r) => s + r.conv, 0);
    const totCost   = rows.reduce((s, r) => s + r.cost, 0);
    const totRev    = rows.reduce((s, r) => s + r.revenue, 0);
    const totProfit = rows.reduce((s, r) => s + r.profit, 0);
    const totSpend  = totCost * 1000;
    const totRevRaw = totRev * 1000;
    const roasVal   = totSpend > 0 ? totRevRaw / totSpend : 0;
    return {
      totImpr, totClicks, totConv, totCost, totRev, totProfit,
      avgCpc:     totClicks > 0 ? (totCost * 1000) / totClicks : 0,
      avgCtr:     totImpr   > 0 ? (totClicks / totImpr) * 100 : 0,
      avgConvRate:totClicks > 0 ? (totConv / totClicks) * 100 : 0,
      avgCpa:     totConv   > 0 ? (totCost * 1000) / totConv : 0,
      roasVal,
      roasColor:  roasVal >= 1.5 ? "green" : roasVal >= 1.0 ? "orange" : "red",
    };
  }, [sorted]);

  const COLS: [string, SortCol, "left" | "right"][] = [
    ["Impr.", "impr", "right"], ["Clicks", "clicks", "right"],
    ["CPC", "cpc", "right"], ["CTR", "ctr", "right"],
    ["Conv. rate", "convRate", "right"], ["Conv.", "conv", "right"],
    ["CPA", "cpa", "right"], ["Revenue", "revenue", "right"],
    ["Cost", "cost", "right"], ["Profit (ads)", "profit", "right"],
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 flex items-start justify-between flex-wrap gap-2 sm:gap-3 border-b border-gray-100">
        <div className="min-w-0">
          <h2 className="text-[15px] sm:text-[17px] font-bold text-gray-900">{title}</h2>
          <p className="text-[13px] text-gray-400 mt-0.5 hidden sm:block">
            {loading ? "Loading…" : error ? "Error loading data" : `${sorted.length} ${dimensionLabel.toLowerCase()}s • ${rangeLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white flex-1 sm:flex-none sm:w-[200px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={`Search ${dimensionLabel.toLowerCase()}s…`}
              className="text-[13px] outline-none w-full bg-transparent text-gray-700 placeholder-gray-300"
            />
            {search && <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 shrink-0"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
          </div>
          {selected.length > 0 && (
            <button onClick={() => clearFilter(dimensionKey)} className="text-[13px] text-blue-600 hover:text-blue-800 whitespace-nowrap shrink-0">
              Clear ({selected.length})
            </button>
          )}
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400 text-[14px]">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading data…
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center justify-center py-12 text-[14px] text-red-500 gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error.includes("not configured") || error.includes("503") ? "Connect a data source to see this data." : error}
        </div>
      )}
      {!loading && !error && data.length === 0 && fetched && (
        <div className="flex items-center justify-center py-12 text-[14px] text-gray-400">No data for selected period.</div>
      )}

      {/* Table */}
      {!loading && !error && data.length > 0 && (
        <>
          <div className="overflow-x-auto overflow-y-hidden rounded-b-2xl">
            <table className="w-full text-[13px] border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-3 py-2.5 text-left text-gray-500 font-medium text-[12px] sticky left-0 z-20 bg-gray-50 min-w-[160px] max-w-[220px]">
                    {dimensionLabel}
                  </th>
                  <th className="px-2.5 py-2.5 text-right text-gray-500 font-medium text-[12px] whitespace-nowrap cursor-pointer hover:text-gray-700 select-none"
                    onClick={() => handleSort("roasVal")}>
                    ROAS <SortIcon dir={sortCol === "roasVal" ? sortDir : null} />
                  </th>
                  {COLS.map(([label, col]) => (
                    <th key={col} className="px-2.5 py-2.5 text-right text-gray-500 font-medium text-[12px] whitespace-nowrap cursor-pointer hover:text-gray-700 select-none"
                      onClick={() => handleSort(col)}>
                      {label} <SortIcon dir={sortCol === col ? sortDir : null} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row, i) => {
                  const isSelected = selected.includes(row.dimension);
                  const s = roasStyle(row.roasColor);
                  return (
                    <tr key={i}
                      onClick={() => toggleValue(dimensionKey, row.dimension)}
                      className={`border-t border-gray-100 cursor-pointer group transition-colors duration-150 ${
                        isSelected ? "bg-blue-50/40" : "hover:bg-blue-50/20"
                      }`}>
                      <td className={`px-3 py-2.5 sticky left-0 z-10 isolate ${isSelected ? "bg-blue-50" : "bg-white group-hover:bg-blue-50/40"}`}>
                        <div className="flex items-center gap-2">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                          <span className="font-medium text-gray-800 text-[12px] truncate max-w-[200px]" title={row.dimension}>{row.dimension}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 text-right tabular-nums">
                        {row.roasVal > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold"
                            style={{ backgroundColor: s.bg, color: s.text }}>
                            {row.roas}
                          </span>
                        ) : <span className="text-gray-400 text-[12px]">—</span>}
                      </td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={{ backgroundColor: heatmapBg(row.impr, heat.impr.min, heat.impr.max, "blue") }}>{fmtNum(row.impr)}</td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={{ backgroundColor: heatmapBg(row.clicks, heat.clicks.min, heat.clicks.max, "blue") }}>{fmtNum(row.clicks)}</td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={{ backgroundColor: heatmapBg(row.cpc, heat.cpc.min, heat.cpc.max, "blue") }}>{fmtCurrency(row.cpc)}</td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={{ backgroundColor: heatmapBg(row.ctr, heat.ctr.min, heat.ctr.max, "blue") }}>{fmtPct(row.ctr)}</td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={{ backgroundColor: heatmapBg(row.convRate, heat.convRate.min, heat.convRate.max, "blue") }}>{fmtPct(row.convRate)}</td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={{ backgroundColor: heatmapBg(row.conv, heat.conv.min, heat.conv.max, "blue") }}>{fmtNum(row.conv)}</td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={{ backgroundColor: heatmapBg(row.cpa, heat.cpa.min, heat.cpa.max, "green") }}>{fmtCurrency(row.cpa)}</td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums font-medium" style={{ backgroundColor: heatmapBg(row.revenue, heat.revenue.min, heat.revenue.max, "green") }}>${fmtK(row.revenue)}</td>
                      <td className="px-2.5 py-2.5 text-gray-700 text-right tabular-nums" style={{ backgroundColor: heatmapBg(row.cost, heat.cost.min, heat.cost.max, "green") }}>${fmtK(row.cost)}</td>
                      <td className={`px-2.5 py-2.5 text-right tabular-nums ${row.profit < 0 ? "text-red-600" : "text-green-700"}`}>
                        {row.profit < 0 ? "-$" : "$"}{Math.abs(row.profit).toFixed(2)}K
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-gray-800 text-[13px]">
                  <td className="px-3 py-3 sticky left-0 z-10 bg-gray-50 text-[12px]">
                    Total <span className="text-gray-400 font-normal text-[11px]">({sorted.length})</span>
                  </td>
                  <td className="px-2.5 py-3 text-right tabular-nums">
                    <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold"
                      style={{ backgroundColor: totals.roasColor === "green" ? "#DCFCE7" : totals.roasColor === "red" ? "#FEE2E2" : "#FFEDD5", color: totals.roasColor === "green" ? "#15803D" : totals.roasColor === "red" ? "#DC2626" : "#EA580C" }}>
                      {totals.roasVal.toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-2.5 py-3 text-right tabular-nums">{fmtNum(totals.totImpr)}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums">{fmtNum(totals.totClicks)}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums">{fmtCurrency(totals.avgCpc)}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums">{fmtPct(totals.avgCtr)}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums">{fmtPct(totals.avgConvRate)}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums">{fmtNum(totals.totConv)}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums">{fmtCurrency(totals.avgCpa)}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums font-medium">${fmtK(totals.totRev)}</td>
                  <td className="px-2.5 py-3 text-right tabular-nums">${fmtK(totals.totCost)}</td>
                  <td className={`px-2.5 py-3 text-right tabular-nums ${totals.totProfit < 0 ? "text-red-600" : "text-green-700"}`}>
                    {totals.totProfit < 0 ? "-$" : "$"}{Math.abs(totals.totProfit).toFixed(2)}K
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2 border-t border-gray-100">
            <p className="text-[13px] text-gray-500">
              <span className="hidden sm:inline">
                Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, sorted.length)} of {sorted.length} {dimensionLabel.toLowerCase()}s
              </span>
              <span className="sm:hidden">{(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, sorted.length)} / {sorted.length}</span>
              <span className="mx-2 hidden sm:inline">|</span>
              <span className="hidden sm:inline">Rows:</span>
              <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
                className="ml-1.5 text-[13px] border border-gray-200 rounded px-1.5 py-0.5 bg-white outline-none cursor-pointer">
                <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
              </select>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => {
                const p = totalPages <= 5 ? idx + 1 : page <= 3 ? idx + 1 : page >= totalPages - 2 ? totalPages - 4 + idx : page - 2 + idx;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-[13px] font-medium transition ${page === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
