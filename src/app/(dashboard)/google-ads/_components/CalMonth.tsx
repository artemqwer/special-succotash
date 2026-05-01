"use client";

import React from "react";

interface CalMonthProps {
  year: number;
  month: number;
  tempStart: number | null;
  tempEnd: number | null;
  hover: number | null;
  step: number;
  maxMs: number;
  onDayClick: (ts: number) => void;
  onDayHover: (ts: number | null) => void;
}

export default function CalMonth({ year, month, tempStart, tempEnd, hover, step, maxMs, onDayClick, onDayHover }: CalMonthProps) {
  const MNAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DOW = ["Su","Mo","Tu","We","Th","Fr","Sa"];
  const firstDow = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();

  let displayStart = tempStart;
  let displayEnd = tempEnd;
  if (step === 1 && tempStart !== null && hover !== null) {
    displayStart = Math.min(tempStart, hover);
    displayEnd = Math.max(tempStart, hover);
  } else if (step === 1 && tempStart !== null) {
    displayStart = tempStart;
    displayEnd = null;
  }

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(<div key={`b${i}`} />);
  for (let d = 1; d <= dim; d++) {
    const ts = Date.UTC(year, month, d);
    const disabled = ts > maxMs;
    const isStart = displayStart !== null && ts === displayStart;
    const isEnd = displayEnd !== null && ts === displayEnd;
    const inRange = displayStart !== null && displayEnd !== null && ts > displayStart && ts < displayEnd;
    const dow = new Date(year, month, d).getDay();
    const isWknd = dow === 0 || dow === 6;
    cells.push(
      <div key={d}
        className={`relative h-8 flex items-center justify-center
          ${inRange ? "bg-blue-50" : ""}
          ${isStart && displayEnd !== null ? "bg-blue-50 rounded-l-full" : ""}
          ${isEnd && displayStart !== null ? "bg-blue-50 rounded-r-full" : ""}
        `}>
        <button
          disabled={disabled}
          onClick={() => !disabled && onDayClick(ts)}
          onMouseEnter={() => !disabled && onDayHover(ts)}
          className={`w-8 h-8 text-[12px] rounded-full flex items-center justify-center relative z-10 transition leading-none
            ${isStart || isEnd ? "bg-blue-600 text-white font-semibold shadow-sm" : ""}
            ${inRange && !isStart && !isEnd ? "text-blue-700 hover:bg-blue-100" : ""}
            ${!inRange && !isStart && !isEnd ? (disabled ? "text-gray-200 cursor-not-allowed" : isWknd ? "text-blue-400 hover:bg-blue-50 cursor-pointer" : "text-gray-700 hover:bg-gray-100 cursor-pointer") : ""}
          `}
        >
          {d}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[300px] mx-auto">
      <p className="text-center text-[13px] font-bold text-gray-700 mb-2 pb-1 border-b border-gray-100 uppercase tracking-wide">
        {MNAMES[month]} {year}
      </p>
      <div className="grid grid-cols-7">
        {DOW.map((d) => (
          <div key={d} className="h-7 flex items-center justify-center text-[10px] text-gray-400 font-bold uppercase">{d}</div>
        ))}
        {cells}
      </div>
    </div>
  );
}
