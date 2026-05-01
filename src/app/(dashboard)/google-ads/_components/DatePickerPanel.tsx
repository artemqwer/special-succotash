"use client";

import React from "react";
import CalMonth from "./CalMonth";
import { END_MS, DAY_MS } from "../_data/constants";

interface DatePickerPanelProps {
  pickerTempStart: number | null;
  pickerTempEnd: number | null;
  pickerHover: number | null;
  pickerStep: 0 | 1;
  pickerViewYear: number;
  pickerViewMonth: number;
  daysUpToToday: number | string;
  daysUpToYesterday: number | string;
  compareEnabled: boolean;
  setPickerTempStart: (v: number | null) => void;
  setPickerTempEnd: (v: number | null) => void;
  setPickerHover: (v: number | null) => void;
  setPickerStep: (v: 0 | 1) => void;
  setPickerViewYear: (fn: (v: number) => number) => void;
  setPickerViewMonth: (fn: (v: number) => number) => void;
  setDaysUpToToday: (v: number | string) => void;
  setDaysUpToYesterday: (v: number | string) => void;
  setCompareEnabled: (v: boolean) => void;
  setDatePickerOpen: (v: boolean) => void;
  setRangeStart: (v: number) => void;
  setRangeEnd: (v: number) => void;
  setHiddenSeries: (v: Set<string>) => void;
  setCheckedRows: (v: Set<number>) => void;
  setClickedRow: (v: number | null) => void;
  handlePresetClick: (label: string) => void;
}

export default function DatePickerPanel({
  pickerTempStart, pickerTempEnd, pickerHover, pickerStep,
  pickerViewYear, pickerViewMonth,
  daysUpToToday, daysUpToYesterday, compareEnabled,
  setPickerTempStart, setPickerTempEnd, setPickerHover, setPickerStep,
  setPickerViewYear, setPickerViewMonth,
  setDaysUpToToday, setDaysUpToYesterday, setCompareEnabled,
  setDatePickerOpen, setRangeStart, setRangeEnd,
  setHiddenSeries, setCheckedRows, setClickedRow,
  handlePresetClick,
}: DatePickerPanelProps) {
  return (
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

          {/* Navigation Controls */}
          <div className="px-4 py-2 flex items-center justify-between border-y border-gray-100 bg-gray-50/50">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (pickerViewMonth === 0) { setPickerViewMonth(() => 11); setPickerViewYear(v => v - 1); }
                else setPickerViewMonth(v => v - 1);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm text-gray-500 group"
              title="Previous Month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:-translate-x-0.5 transition-transform"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navigation</span>
            <button
              onClick={(e) => {
                e.preventDefault();
                if (pickerViewMonth === 11) { setPickerViewMonth(() => 0); setPickerViewYear(v => v + 1); }
                else setPickerViewMonth(v => v + 1);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition shadow-sm text-gray-500 group"
              title="Next Month"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-0.5 transition-transform"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
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
  );
}
