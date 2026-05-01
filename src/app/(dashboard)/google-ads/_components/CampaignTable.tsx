"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { SortIcon } from "./ChartPrimitives";
import { SortKey, SortDir, fmtNum, fmtK, fmtPct, fmtCurrency, heatmapBg } from "../_data/constants";

type CampaignRow = {
  status: string;
  name: string;
  type: string;
  roas: string;
  roasColor: string;
  impr: number;
  clicks: number;
  cpc: number;
  ctr: number;
  convRate: number;
  conv: number;
  cpa: number;
  revenue: number;
  cost: number;
  profit: number;
  roasVal: number;
};

interface CampaignTableProps {
  filtered: CampaignRow[];
  currentRows: CampaignRow[];
  page: number;
  rowsPerPage: number;
  totalPages: number;
  sortCol: SortKey | null;
  sortDir: SortDir;
  typeFilter: string;
  types: string[];
  selectedCampaigns: Set<string>;
  checkedRows: Set<number>;
  clickedRow: number | null;
  namesCollapsed: boolean;
  expandedNameIdx: number | null;
  isMobile: boolean;
  heatCols: Record<string, { min: number; max: number }>;
  tableTotals: {
    totImpr: number; totClicks: number; totConv: number; totCost: number; totRev: number; totProfit: number;
    avgCpc: number; avgCtr: number; avgConvRate: number; avgCpa: number; totRoasVal: number; totRoasColor: string;
  };
  rangeStart: number;
  rangeEnd: number;
  fmtMs: (ts: number) => string;
  onSort: (col: SortKey) => void;
  onTypeFilter: (v: string) => void;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
  onCheckedRowsChange: (v: Set<number>) => void;
  onClickedRowChange: (v: number | null) => void;
  onNamesCollapsedChange: (v: boolean) => void;
  onExpandedNameIdxChange: (v: number | null) => void;
  onSelectedCampaignsChange: (v: Set<string>) => void;
  campaignDropdownOpen: boolean;
  campaignSearch: string;
  onCampaignDropdownOpen: (open: boolean) => void;
  onCampaignSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
}

export default function CampaignTable({
  filtered, currentRows, page, rowsPerPage, totalPages,
  sortCol, sortDir, typeFilter, types,
  selectedCampaigns, checkedRows, clickedRow,
  namesCollapsed, expandedNameIdx, isMobile,
  heatCols, tableTotals, rangeStart, rangeEnd, fmtMs,
  onSort, onTypeFilter, onPageChange, onRowsPerPageChange,
  onCheckedRowsChange, onClickedRowChange,
  onNamesCollapsedChange, onExpandedNameIdxChange, onSelectedCampaignsChange,
  campaignDropdownOpen, campaignSearch,
  onCampaignDropdownOpen, onCampaignSearchChange,
  statusFilter, onStatusFilter,
}: CampaignTableProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const campaignBtnRef = useRef<HTMLButtonElement>(null);
  const typeBtnRef = useRef<HTMLButtonElement>(null);
  const statusBtnRef = useRef<HTMLButtonElement>(null);

  const [campaignDropdownPos, setCampaignDropdownPos] = useState({ top: 0, left: 0 });
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [typeDropdownPos, setTypeDropdownPos] = useState({ top: 0, left: 0 });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [statusDropdownPos, setStatusDropdownPos] = useState({ top: 0, left: 0 });

  const updatePositions = useCallback(() => {
    if (!headerRef.current) return;
    const headerRect = headerRef.current.getBoundingClientRect();
    const headerWidth = headerRef.current.offsetWidth;

    const getPos = (btn: HTMLButtonElement | null, width: number) => {
      if (!btn) return { top: 0, left: 0 };
      const r = btn.getBoundingClientRect();
      const left = Math.max(8, Math.min(r.left - headerRect.left, headerWidth - width - 8));
      return { top: r.bottom - headerRect.top + 6, left };
    };

    if (campaignDropdownOpen) setCampaignDropdownPos(getPos(campaignBtnRef.current, 260));
    if (typeDropdownOpen) setTypeDropdownPos(getPos(typeBtnRef.current, 140));
    if (statusDropdownOpen) setStatusDropdownPos(getPos(statusBtnRef.current, 120));
  }, [campaignDropdownOpen, typeDropdownOpen, statusDropdownOpen]);

  useEffect(() => {
    updatePositions();
  }, [campaignDropdownOpen, typeDropdownOpen, statusDropdownOpen, updatePositions]);

  useEffect(() => {
    const f = filtersRef.current;
    if (f) {
      f.addEventListener("scroll", updatePositions);
      window.addEventListener("resize", updatePositions);
    }
    return () => {
      f?.removeEventListener("scroll", updatePositions);
      window.removeEventListener("resize", updatePositions);
    };
  }, [updatePositions]);

  const cellStyle = (col: keyof typeof heatCols, value: number, color: "blue" | "green" | "red") => ({
    backgroundColor: heatmapBg(value, heatCols[col].min, heatCols[col].max, color),
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative">
      <div ref={headerRef} className="px-4 sm:px-5 py-4 flex items-start justify-between flex-wrap gap-2 sm:gap-3 border-b border-gray-100 relative">
        <div className="min-w-0">
          <h2 className="text-[15px] sm:text-[17px] font-bold text-gray-900">Campaign Performance</h2>
          <p className="text-[13px] text-gray-400 mt-0.5 hidden sm:block">Detailed analytics for {currentRows.length} campaigns • {fmtMs(rangeStart)} – {fmtMs(rangeEnd)}</p>
        </div>
        <div ref={filtersRef} className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto">
          <span className="text-[13px] text-gray-500 hidden sm:inline shrink-0">Filters:</span>

          {/* Campaign Name multi-select dropdown */}
          <div className="shrink-0">
            <button
              ref={campaignBtnRef}
              onClick={() => {
                if (!campaignDropdownOpen && campaignBtnRef.current) {
                  const r = campaignBtnRef.current.getBoundingClientRect();
                  setCampaignDropdownPos({ top: r.bottom + 6, left: r.left });
                }
                onCampaignDropdownOpen(!campaignDropdownOpen);
              }}
              className={`flex items-center gap-1.5 text-[13px] border rounded-lg px-2.5 py-1.5 transition whitespace-nowrap ${
                selectedCampaigns.size > 0
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="sm:hidden">Campaign</span>
              <span className="hidden sm:inline">Campaign Name</span>
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
                <div className="fixed inset-0 z-40" onClick={() => { onCampaignDropdownOpen(false); onCampaignSearchChange(""); }} />
                <div className="absolute w-[260px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 flex flex-col"
                  style={{ top: campaignDropdownPos.top, left: campaignDropdownPos.left }}>
                  <div className="p-2 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50/50">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      <input
                        autoFocus
                        value={campaignSearch}
                        onChange={(e) => onCampaignSearchChange(e.target.value)}
                        placeholder="Search campaigns..."
                        className="text-[12px] outline-none w-full bg-transparent"
                      />
                      {campaignSearch && (
                        <button onClick={() => onCampaignSearchChange("")} className="text-gray-400 hover:text-gray-600 transition shrink-0">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={selectedCampaigns.size === currentRows.length && currentRows.length > 0}
                        onChange={() => {
                          onCheckedRowsChange(new Set()); onClickedRowChange(null);
                          if (selectedCampaigns.size === currentRows.length) onSelectedCampaignsChange(new Set());
                          else onSelectedCampaignsChange(new Set(currentRows.map((r) => r.name)));
                        }}
                        className="rounded"
                      />
                      <span className="text-[11px] text-gray-500">
                        {selectedCampaigns.size === 0 ? "Select all" : `${selectedCampaigns.size} of ${currentRows.length} selected`}
                      </span>
                    </label>
                    {selectedCampaigns.size > 0 && (
                      <button onClick={() => { onSelectedCampaignsChange(new Set()); onCheckedRowsChange(new Set()); onClickedRowChange(null); }} className="text-[11px] text-gray-400 hover:text-gray-700 transition">× Clear</button>
                    )}
                  </div>
                  <div className="max-h-[220px] overflow-y-auto py-1">
                    {currentRows
                      .filter((r) => r.name.toLowerCase().includes(campaignSearch.toLowerCase()))
                      .map((r) => (
                        <label key={r.name} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox"
                            checked={selectedCampaigns.has(r.name)}
                            onChange={() => {
                              onCheckedRowsChange(new Set()); onClickedRowChange(null);
                              const next = new Set(selectedCampaigns);
                              next.has(r.name) ? next.delete(r.name) : next.add(r.name);
                              onSelectedCampaignsChange(next);
                            }}
                            className="rounded"
                          />
                          <span className="text-[12px] text-gray-700 truncate">{r.name}</span>
                        </label>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Type Dropdown */}
          <div className="shrink-0">
            <button
              ref={typeBtnRef}
              onClick={() => {
                setTypeDropdownOpen(!typeDropdownOpen);
                setStatusDropdownOpen(false);
                onCampaignDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 text-[13px] border rounded-lg px-2.5 py-1.5 transition whitespace-nowrap ${
                typeFilter !== "All"
                  ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {typeFilter === "All" ? "Type" : typeFilter}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${typeDropdownOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {typeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setTypeDropdownOpen(false)} />
                <div className="absolute w-[140px] bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 overflow-hidden"
                  style={{ top: typeDropdownPos.top, left: typeDropdownPos.left }}>
                  {types.map((t) => (
                    <button key={t} onClick={() => { onTypeFilter(t); setTypeDropdownOpen(false); onCheckedRowsChange(new Set()); onClickedRowChange(null); }}
                      className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between transition ${typeFilter === t ? "text-blue-600 font-semibold bg-blue-50/60" : "text-gray-700"}`}>
                      {t}
                      {typeFilter === t && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="shrink-0">
            <button
              ref={statusBtnRef}
              onClick={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setTypeDropdownOpen(false);
                onCampaignDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 text-[13px] border rounded-lg px-2.5 py-1.5 transition whitespace-nowrap ${
                statusFilter !== "Status"
                  ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {statusFilter}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {statusDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)} />
                <div className="absolute w-[120px] bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50 overflow-hidden"
                  style={{ top: statusDropdownPos.top, left: statusDropdownPos.left }}>
                  {["Status", "Active", "Paused"].map((s) => (
                    <button key={s} onClick={() => { onStatusFilter(s); setStatusDropdownOpen(false); }}
                      className={`w-full text-left px-3.5 py-2 text-[13px] hover:bg-gray-50 flex items-center justify-between transition ${statusFilter === s ? "text-blue-600 font-semibold bg-blue-50/60" : "text-gray-700"}`}>
                      {s}
                      {statusFilter === s && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {(selectedCampaigns.size > 0 || typeFilter !== "All" || statusFilter !== "Status") && (
            <button
              onClick={() => { onSelectedCampaignsChange(new Set()); onTypeFilter("All"); onStatusFilter("Status"); onCheckedRowsChange(new Set()); onClickedRowChange(null); }}
              className="text-[13px] text-blue-600 hover:text-blue-800 transition whitespace-nowrap shrink-0"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden rounded-b-2xl">
        <table className="w-full text-[13px] border-collapse min-w-[1280px]">
          <colgroup>
            <col className="w-10" />
            <col className="w-14 hidden sm:table-column" />
            <col style={{ width: namesCollapsed ? 0 : 160 }} />
            <col className="w-[90px] hidden sm:table-column" />
            <col className="w-[108px]" />
            <col /><col /><col /><col /><col /><col /><col /><col /><col /><col />
          </colgroup>
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-3 py-2.5 sticky left-0 z-20 bg-gray-50">
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" className="rounded cursor-pointer"
                    checked={checkedRows.size > 0 && checkedRows.size === filtered.length}
                    ref={(el) => { if (el) el.indeterminate = checkedRows.size > 0 && checkedRows.size < filtered.length; }}
                    onChange={() => {
                      if (checkedRows.size === filtered.length) onCheckedRowsChange(new Set());
                      else onCheckedRowsChange(new Set(filtered.map((_, i) => i)));
                    }}
                  />
                  {namesCollapsed && (
                    <button onClick={() => onNamesCollapsedChange(false)}
                      className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition shrink-0 sm:hidden">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  )}
                </div>
              </th>
              <th className="px-2 py-2.5 text-left text-gray-500 font-medium text-[12px] sticky left-10 z-20 bg-gray-50 hidden sm:table-cell">Status</th>
              {([
                ["Campaign","name","left"],["Type","type","left"],["ROAS","roas","right"],
                ["Impr.","impr","right"],["Clicks","clicks","right"],["CPC","cpc","right"],["CTR","ctr","right"],
                ["Conv. rate","convRate","right"],["Conv.","conv","right"],["CPA","cpa","right"],
                ["Revenue","revenue","right"],["Cost","cost","right"],["Profit (ads)","profit","right"],
              ] as [string, SortKey, "left" | "right"][]).map(([label, col, align]) => (
                <th key={col} onClick={() => onSort(col)}
                  className={`text-${align} text-gray-500 font-medium whitespace-nowrap cursor-pointer hover:text-gray-700 select-none text-[12px]${col === "name" ? " sticky left-10 sm:left-24 z-20 bg-gray-50 after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-200 overflow-hidden p-0" : " px-2.5 py-2.5"}${col === "type" ? " hidden sm:table-cell" : ""}`}>
                  {col === "name" ? (
                    <div style={{
                      width: (isMobile && namesCollapsed) ? 0 : 160,
                      overflow: "hidden",
                      paddingLeft: (isMobile && namesCollapsed) ? 0 : 10,
                      paddingRight: (isMobile && namesCollapsed) ? 0 : 4,
                      paddingTop: 10,
                      paddingBottom: 10,
                      opacity: (isMobile && namesCollapsed) ? 0 : 1,
                      transition: "width 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-left 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-right 380ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease",
                      whiteSpace: "nowrap",
                    }}>
                      <span className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-0.5">
                          {label}<SortIcon dir={sortCol === col ? sortDir : null} />
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); onNamesCollapsedChange(true); onExpandedNameIdxChange(null); }}
                          className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition shrink-0 sm:hidden">
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
                  onCheckedRowsChange(new Set());
                  onClickedRowChange(clickedRow === i ? null : i);
                }}
                className={`border-t border-gray-100 cursor-pointer group transition-colors duration-150 ${
                  clickedRow === i ? "bg-blue-100/40" : checkedRows.has(i) ? "bg-blue-50/30" : "hover:bg-blue-50/20"
                }`}>
                <td className={`px-3 py-2.5 sticky left-0 z-10 isolate ${clickedRow === i ? "bg-blue-100" : checkedRows.has(i) ? "bg-blue-50" : "bg-white group-hover:bg-blue-50"}`}>
                  <input type="checkbox" className="rounded cursor-pointer"
                    checked={checkedRows.has(i)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onClickedRowChange(null);
                      const n = new Set(checkedRows);
                      n.has(i) ? n.delete(i) : n.add(i);
                      onCheckedRowsChange(n);
                    }}
                  />
                </td>
                <td className={`px-2 py-2.5 sticky left-10 z-10 isolate hidden sm:table-cell ${clickedRow === i ? "bg-blue-100" : checkedRows.has(i) ? "bg-blue-50" : "bg-white group-hover:bg-blue-50"}`}>
                  <span className={`w-2 h-2 rounded-full inline-block ${row.status === "green" ? "bg-green-500" : "bg-gray-300"}`} />
                </td>
                <td className={`sticky left-10 sm:left-24 z-10 isolate overflow-hidden after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-gray-100 p-0 ${clickedRow === i ? "bg-blue-100" : checkedRows.has(i) ? "bg-blue-50" : "bg-white group-hover:bg-blue-50"}`}>
                  <div
                    style={{
                      width: (isMobile && namesCollapsed) ? 0 : 160,
                      overflow: "hidden",
                      paddingLeft: (isMobile && namesCollapsed) ? 0 : 10,
                      paddingRight: (isMobile && namesCollapsed) ? 0 : 10,
                      paddingTop: 10,
                      paddingBottom: 10,
                      opacity: (isMobile && namesCollapsed) ? 0 : 1,
                      cursor: (isMobile && namesCollapsed) ? undefined : "pointer",
                      transition: "width 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-left 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-right 380ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease",
                    }}
                    onClick={(isMobile && namesCollapsed) ? undefined : (e) => {
                      e.stopPropagation();
                      onExpandedNameIdxChange(expandedNameIdx === i ? null : i);
                      onCheckedRowsChange(new Set());
                      onClickedRowChange(clickedRow === i ? null : i);
                    }}
                    title={namesCollapsed ? undefined : row.name}
                  >
                    <span className={`font-medium text-gray-800 text-[12px] hover:text-blue-600 transition block ${(expandedNameIdx === i && !namesCollapsed) ? "whitespace-normal wrap-break-word" : "whitespace-nowrap overflow-hidden text-ellipsis"}`}>
                      {row.name}
                    </span>
                  </div>
                </td>
                <td className="px-2.5 py-2.5 hidden sm:table-cell">
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-medium">{row.type}</span>
                </td>
                <td className="px-2.5 py-2.5 text-right tabular-nums">
                  {row.roas !== "null" ? (
                    <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold"
                      style={{
                        backgroundColor: row.roasColor === "green" ? "#DCFCE7" : row.roasColor === "red" ? "#FEE2E2" : row.roasColor === "orange" ? "#FFEDD5" : "#F3F4F6",
                        color: row.roasColor === "green" ? "#15803D" : row.roasColor === "red" ? "#DC2626" : row.roasColor === "orange" ? "#EA580C" : "#9CA3AF",
                      }}>
                      {row.roas}
                    </span>
                  ) : <span className="text-gray-400 text-[12px]">—</span>}
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
                  width: (isMobile && namesCollapsed) ? 0 : 160,
                  overflow: "hidden",
                  paddingLeft: (isMobile && namesCollapsed) ? 0 : 10,
                  paddingRight: (isMobile && namesCollapsed) ? 0 : 10,
                  paddingTop: 12,
                  paddingBottom: 12,
                  opacity: (isMobile && namesCollapsed) ? 0 : 1,
                  whiteSpace: "nowrap",
                  transition: "width 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-left 380ms cubic-bezier(0.4, 0, 0.2, 1), padding-right 380ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease",
                }}>
                  Total <span className="text-gray-400 font-normal text-[11px]">({filtered.length})</span>
                </div>
              </td>
              <td className="px-2.5 py-3 hidden sm:table-cell" />
              <td className="px-2.5 py-3 text-right tabular-nums">
                <span className="inline-block px-2 py-0.5 rounded text-[12px] font-semibold"
                  style={{
                    backgroundColor: tableTotals.totRoasColor === "green" ? "#DCFCE7" : tableTotals.totRoasColor === "red" ? "#FEE2E2" : "#FFEDD5",
                    color: tableTotals.totRoasColor === "green" ? "#15803D" : tableTotals.totRoasColor === "red" ? "#DC2626" : "#EA580C",
                  }}>
                  {tableTotals.totRoasVal.toFixed(2)}%
                </span>
              </td>
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
            onChange={(e) => { onRowsPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="ml-1.5 text-[13px] border border-gray-200 rounded px-1.5 py-0.5 bg-white outline-none cursor-pointer"
          >
            <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
          </select>
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(Math.max(1, page - 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-[13px] font-medium transition ${
                page === p ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}>
              {p}
            </button>
          ))}
          <button onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
