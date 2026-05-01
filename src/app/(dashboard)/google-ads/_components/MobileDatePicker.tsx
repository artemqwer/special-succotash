"use client";

import React from "react";
import CalMonth from "./CalMonth";
import { PERIOD_PRESETS, END_MS } from "../_data/constants";

interface MobileDatePickerProps {
  pickerTempStart: number | null;
  pickerTempEnd: number | null;
  pickerHover: number | null;
  pickerStep: 0 | 1;
  pickerViewYear: number;
  pickerViewMonth: number;
  setPickerTempStart: (v: number | null) => void;
  setPickerTempEnd: (v: number | null) => void;
  setPickerHover: (v: number | null) => void;
  setPickerStep: (v: 0 | 1) => void;
  setPickerViewYear: (v: number) => void;
  setPickerViewMonth: (v: number) => void;
  setDatePickerOpen: (v: boolean) => void;
  setRangeStart: (v: number) => void;
  setRangeEnd: (v: number) => void;
  setHiddenSeries: (v: Set<string>) => void;
  setCheckedRows: (v: Set<number>) => void;
  setClickedRow: (v: number | null) => void;
}

export default function MobileDatePicker({
  pickerTempStart, pickerTempEnd, pickerHover, pickerStep,
  pickerViewYear, pickerViewMonth,
  setPickerTempStart, setPickerTempEnd, setPickerHover, setPickerStep,
  setPickerViewYear, setPickerViewMonth,
  setDatePickerOpen, setRangeStart, setRangeEnd,
  setHiddenSeries, setCheckedRows, setClickedRow,
}: MobileDatePickerProps) {
  return (
    <div className="sm:hidden fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setDatePickerOpen(false)} />
      <div
        className="relative bg-white rounded-t-3xl shadow-2xl overflow-hidden flex flex-col w-full max-h-[92vh] overflow-y-auto"
        onMouseLeave={() => setPickerHover(null)}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {/* Presets */}
        <div className="w-full sm:w-[160px] border-b sm:border-b-0 sm:border-r border-gray-100 py-3 shrink-0 bg-gray-50/50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pb-2">Quick Select</p>
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible pb-2 sm:pb-0 scrollbar-none px-2 sm:px-0">
            {PERIOD_PRESETS.map(({ label, days }) => {
              const ps = END_MS - (days - 1) * 86400000;
              const isActive = pickerTempStart === ps && pickerTempEnd === END_MS;
              return (
                <button key={days}
                  onClick={() => { setPickerTempStart(ps); setPickerTempEnd(END_MS); setPickerStep(0); }}
                  className={`whitespace-nowrap sm:whitespace-normal text-left px-4 py-2 text-[13px] transition-all ${isActive ? "bg-blue-600 text-white font-bold rounded-xl mx-2 shadow-md shadow-blue-200" : "text-gray-600 hover:bg-white hover:text-blue-600"}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calendars + Content */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header / Month Nav */}
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <button
              onClick={() => {
                if (pickerViewMonth === 0) { setPickerViewMonth(11); setPickerViewYear(pickerViewYear - 1); }
                else setPickerViewMonth(pickerViewMonth - 1);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-all border border-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="text-[15px] font-bold text-gray-900">
              Select Period
            </div>
            <button
              onClick={() => {
                if (pickerViewMonth === 11) { setPickerViewMonth(0); setPickerViewYear(pickerViewYear + 1); }
                else setPickerViewMonth(pickerViewMonth + 1);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-all border border-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          {/* Two months scrollable area */}
          <div className="flex flex-col lg:flex-row gap-8 px-6 py-4 overflow-y-auto lg:overflow-y-visible items-center sm:items-start">
            {([0, 1] as const).map((offset) => {
              const m = (pickerViewMonth + offset) % 12;
              const y = pickerViewYear + Math.floor((pickerViewMonth + offset) / 12);
              return (
                <CalMonth key={offset} year={y} month={m}
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
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
            <button onClick={() => setDatePickerOpen(false)}
              className="flex-1 py-3 text-[14px] font-bold text-gray-600 hover:bg-gray-50 rounded-2xl transition-all border border-gray-200">
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
              className="flex-1 py-3 text-[14px] bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all">
              Apply Period
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
