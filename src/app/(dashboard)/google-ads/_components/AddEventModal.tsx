"use client";

import React from "react";

interface AddEventModalProps {
  evtCategory: "Events" | "Ads" | "Website";
  evtType: string | null;
  evtStartDate: string;
  evtEndDate: string;
  evtTitle: string;
  evtDesc: string;
  onClose: () => void;
  onSubmit: () => void;
  onCategoryChange: (v: "Events" | "Ads" | "Website") => void;
  onTypeChange: (v: string | null) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onDescChange: (v: string) => void;
}

export default function AddEventModal({
  evtCategory, evtType, evtStartDate, evtEndDate, evtTitle, evtDesc,
  onClose, onSubmit, onCategoryChange, onTypeChange, onStartDateChange, onEndDateChange, onTitleChange, onDescChange,
}: AddEventModalProps) {
  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative bg-white sm:rounded-2xl shadow-2xl w-full sm:max-w-xl mx-auto flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-top-2 sm:zoom-in-95 duration-300 h-full sm:h-auto sm:max-h-[92svh]">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">Add Custom Event</h3>
              <p className="text-[12px] text-gray-400">Add your own event to the timeline</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1">
          {/* Select Category */}
          <div>
            <p className="text-[12px] font-semibold text-gray-700 mb-2">Select Category</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "Events" as const, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, color: "text-blue-600 border-blue-400 bg-blue-50" },
                { id: "Ads" as const, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, color: "text-orange-500 border-orange-400 bg-orange-50" },
                { id: "Website" as const, icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, color: "text-pink-500 border-pink-400 bg-pink-50" },
              ] as { id: "Events"|"Ads"|"Website"; icon: React.ReactNode; color: string }[]).map(({ id, icon, color }) => (
                <button key={id} onClick={() => onCategoryChange(id)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${evtCategory === id ? color + " shadow-sm ring-1 ring-inset ring-current" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {icon}{id}
                </button>
              ))}
            </div>
          </div>

          {/* Event Type */}
          <div>
            <p className="text-[12px] font-semibold text-gray-700 mb-2">Event Type</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "Holiday", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { id: "Special Event", icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z" fill="#a78bfa"/></svg> },
                { id: "Seasonal", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg> },
                { id: "Sale/Promotion", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg> },
                { id: "Flash Sale", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
                { id: "Clearance", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> },
              ].map(({ id, icon }) => (
                <button key={id} onClick={() => onTypeChange(evtType === id ? null : id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] transition ${evtType === id ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <span className={evtType === id ? "text-blue-500" : "text-gray-400"}>{icon}</span>{id}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <p className="text-[12px] font-semibold text-gray-700">Date Range</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <p className="text-[11px] text-gray-400 mb-1 ml-1 font-medium">Start Date</p>
                <input type="date" value={evtStartDate} onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full text-[14px] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 bg-white transition-all appearance-none min-h-[44px]" />
              </div>
              <div className="relative">
                <p className="text-[11px] text-gray-400 mb-1 ml-1 font-medium">End Date <span className="opacity-60">(Optional)</span></p>
                <input type="date" value={evtEndDate} onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full text-[14px] border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 bg-white transition-all appearance-none min-h-[44px]" />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 ml-1">Leave end date empty for a single-day event</p>
          </div>

          {/* Event Title */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <p className="text-[12px] font-semibold text-gray-700">Event Title</p>
            </div>
            <input type="text" maxLength={80} value={evtTitle} onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g., Black Friday Campaign Launch"
              className="w-full text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 bg-white transition-all placeholder-gray-300" />
            <div className="flex justify-end mt-1">
              <p className="text-[10px] font-medium text-gray-400">{evtTitle.length}/80</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              <p className="text-[12px] font-semibold text-gray-700">Description <span className="font-normal text-gray-400">(Optional)</span></p>
            </div>
            <textarea rows={3} value={evtDesc} onChange={(e) => onDescChange(e.target.value)}
              placeholder="Add additional details about this event..."
              className="w-full text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 bg-white transition-all placeholder-gray-300 resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button
            disabled={!evtTitle.trim() || !evtStartDate}
            onClick={onSubmit}
            className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            Add Event
          </button>
        </div>
      </div>
    </div>
  );
}
