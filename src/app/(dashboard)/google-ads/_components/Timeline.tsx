"use client";

import React from "react";
import { tlEventItems, tlAdItems, tlWebItems } from "../_data/constants";
import { isWeekend } from "./ChartPrimitives";
import type { CustomEvent } from "../_data/types";

interface TimelineProps {
  dates: string[];
  timelineOpen: boolean;
  isPortrait: boolean;
  customEvents: CustomEvent[];
  onToggle: () => void;
  onAddEvent: () => void;
}

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDateInRange(display: string, startISO: string, endISO: string): boolean {
  const start = isoToDisplay(startISO);
  if (!endISO) return display === start;
  const end = isoToDisplay(endISO);
  // Compare using date string order isn't reliable; use timestamps
  const [sy, sm, sd] = startISO.split("-").map(Number);
  const [ey, em, ed] = endISO.split("-").map(Number);
  const startTs = new Date(sy, sm - 1, sd).getTime();
  const endTs   = new Date(ey, em - 1, ed).getTime();
  // Find the date matching display in range
  for (let ts = startTs; ts <= endTs; ts += 86400000) {
    const d = new Date(ts);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (label === display) return true;
  }
  return false;
}

const CATEGORY_ICONS: Record<string, string> = {
  Holiday: "🎉",
  "Special Event": "⭐",
  Seasonal: "🌿",
  "Sale/Promotion": "%",
  "Flash Sale": "⚡",
  Clearance: "🏷️",
};

const CATEGORY_BG: Record<CustomEvent["category"], string> = {
  Events: "bg-blue-100",
  Ads: "bg-orange-100",
  Website: "bg-pink-100",
};

export default function Timeline({ dates, timelineOpen, isPortrait, customEvents, onToggle, onAddEvent }: TimelineProps) {
  const staticTotal = tlEventItems.length + tlAdItems.length + tlWebItems.length;
  const totalEvents = staticTotal + customEvents.length;

  const getCustomForDate = (date: string, category: CustomEvent["category"]) =>
    customEvents.filter(e => e.category === category && isDateInRange(date, e.startDate, e.endDate));

  return (
    <div className="mt-5 pt-4 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div className="flex items-start gap-2">
          <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`transition-transform duration-200 ${timelineOpen ? "" : "-rotate-90"}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-gray-800">Event Timeline</span>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">{totalEvents}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">Campaign changes, business updates, holidays, and performance anomalies</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onAddEvent}
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
                  const staticItem = tlEventItems.find((e) => e.date === date);
                  const customs = getCustomForDate(date, "Events");
                  const custom = customs[0];
                  return (
                    <div key={date} className="flex-1 flex justify-center relative z-10">
                      {staticItem ? (
                        <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] ${staticItem.bg} shadow-sm ring-1 ring-white`} title={staticItem.date}>{staticItem.icon}</span>
                      ) : custom ? (
                        <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] ${CATEGORY_BG.Events} shadow-sm ring-1 ring-white`} title={custom.title}>
                          {custom.type ? (CATEGORY_ICONS[custom.type] ?? "📌") : "📌"}
                        </span>
                      ) : (
                        <span className="w-[4px] h-[4px] rounded-full bg-gray-200 self-center" />
                      )}
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
                  const staticItem = tlAdItems.find((e) => e.date === date);
                  const customs = getCustomForDate(date, "Ads");
                  const custom = customs[0];
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center relative z-10">
                      {staticItem ? (
                        <>
                          <span className={`w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] ${staticItem.bg} shadow-sm ring-1 ring-white font-bold`}>⚡</span>
                          <span className="text-[8px] text-orange-400 font-semibold leading-tight mt-0.5">+{staticItem.count}</span>
                        </>
                      ) : custom ? (
                        <span className={`w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] ${CATEGORY_BG.Ads} shadow-sm ring-1 ring-white`} title={custom.title}>
                          {custom.type ? (CATEGORY_ICONS[custom.type] ?? "⚡") : "⚡"}
                        </span>
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
                  const staticItem = tlWebItems.find((e) => e.date === date);
                  const customs = getCustomForDate(date, "Website");
                  const custom = customs[0];
                  return (
                    <div key={date} className="flex-1 flex justify-center relative z-10">
                      {staticItem ? (
                        <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] ${staticItem.bg} shadow-sm ring-1 ring-white`} title={staticItem.date}>{staticItem.icon}</span>
                      ) : custom ? (
                        <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] ${CATEGORY_BG.Website} shadow-sm ring-1 ring-white`} title={custom.title}>
                          {custom.type ? (CATEGORY_ICONS[custom.type] ?? "🌐") : "🌐"}
                        </span>
                      ) : (
                        <span className="w-[4px] h-[4px] rounded-full bg-gray-200 self-center" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
