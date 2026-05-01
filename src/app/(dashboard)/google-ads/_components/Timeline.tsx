"use client";

import React from "react";
import { tlEventItems, tlAdItems, tlWebItems } from "../_data/constants";
import { isWeekend } from "./ChartPrimitives";

interface TimelineProps {
  dates: string[];
  timelineOpen: boolean;
  isPortrait: boolean;
  onToggle: () => void;
  onAddEvent: () => void;
}

export default function Timeline({ dates, timelineOpen, isPortrait, onToggle, onAddEvent }: TimelineProps) {
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
              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">109</span>
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
  );
}
