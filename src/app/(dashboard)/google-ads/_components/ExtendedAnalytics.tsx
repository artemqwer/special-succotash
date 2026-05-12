"use client";

import React, { useState } from "react";
import PerformanceTable from "./PerformanceTable";
import { useCrossFilter } from "@/lib/store";

interface ExtendedAnalyticsProps {
  dateFrom: string;
  dateTo: string;
  rangeLabel: string;
}

const TABLES = [
  { key: "ad_group",    title: "Ad Groups Performance",     dimensionLabel: "Ad Group",    available: true },
  { key: "keyword",     title: "Keywords Performance",      dimensionLabel: "Keyword",     available: true },
  { key: "match_type",  title: "Match Type Performance",    dimensionLabel: "Match Type",  available: true },
  { key: "search_term", title: "Search Terms Performance",  dimensionLabel: "Search Term", available: true },
  { key: "device",      title: "Device Performance",        dimensionLabel: "Device",      available: true },
  { key: "network",     title: "Network Performance",       dimensionLabel: "Network",     available: true },
  { key: "ad",          title: "Ad Performance",            dimensionLabel: "Ad",          available: false },
  { key: "audience",    title: "Audience Performance",      dimensionLabel: "Audience",    available: false },
  { key: "time",        title: "Time Performance",          dimensionLabel: "Time",        available: false },
  { key: "geography",   title: "Geography Performance",     dimensionLabel: "Region",      available: false },
] as const;

function ComingSoonTable({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <h2 className="text-[15px] sm:text-[17px] font-bold text-gray-900">{title}</h2>
        <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Coming soon</span>
      </div>
      <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-[13px]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        This dimension will be available in the next update.
      </div>
    </div>
  );
}

export default function ExtendedAnalytics({ dateFrom, dateTo, rangeLabel }: ExtendedAnalyticsProps) {
  const [open, setOpen] = useState(false);
  const { filters, clearAll } = useCrossFilter();
  const activeCount = Object.values(filters).flat().length;

  return (
    <div className="mt-4">
      {/* Toggle button */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center group-hover:bg-gray-50 transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-gray-500 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-bold text-gray-900 text-left leading-tight">Extended Analytics</p>
            <p className="text-[12px] text-gray-400 text-left">Ad Groups, Keywords, Devices, Networks &amp; more</p>
          </div>
        </button>
        {activeCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
              {activeCount} cross-filter{activeCount > 1 ? "s" : ""} active
            </span>
            <button onClick={clearAll} className="text-[12px] text-gray-400 hover:text-gray-700 transition">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Tables */}
      {open && (
        <div className="space-y-4">
          {TABLES.map((t) =>
            t.available ? (
              <PerformanceTable
                key={t.key}
                title={t.title}
                dimensionLabel={t.dimensionLabel}
                dimensionKey={t.key}
                dateFrom={dateFrom}
                dateTo={dateTo}
                rangeLabel={rangeLabel}
                isVisible={open}
              />
            ) : (
              <ComingSoonTable key={t.key} title={t.title} />
            )
          )}
        </div>
      )}
    </div>
  );
}
