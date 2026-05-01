"use client";

import React from "react";
import { AiMessage, AI_METRICS, AI_QUICK, renderAiText } from "../_data/constants";

interface AiSidebarProps {
  aiOpen: boolean;
  aiInput: string;
  aiMsgs: AiMessage[];
  aiLoading: boolean;
  aiScrollRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onInputChange: (v: string) => void;
  onSendMsg: (text?: string) => void;
  onTogglePin: (id: number) => void;
}

export default function AiSidebar({
  aiOpen, aiInput, aiMsgs, aiLoading, aiScrollRef,
  onClose, onInputChange, onSendMsg, onTogglePin,
}: AiSidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {aiOpen && <div className="fixed inset-0 bg-black/40 z-[99] lg:hidden animate-in fade-in duration-200" onClick={onClose} />}

      {/* Sliding panel */}
      <div className={`fixed right-0 top-0 z-[100] flex flex-col bg-white shadow-2xl border-l border-gray-200 transition-transform duration-300 ease-out w-full sm:w-[440px] ${aiOpen ? "translate-x-0" : "translate-x-full"}`} style={{ height: "100dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z"/></svg>
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-gray-900">AI Campaign Assistant</h3>
              <p className="text-[12px] text-gray-400">All Account Data</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Metrics bar */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 overflow-x-auto scrollbar-none shrink-0">
          {AI_METRICS.map(({ label, value, hi }) => (
            <div key={label} className="flex flex-col shrink-0">
              <span className="text-[11px] text-gray-400 whitespace-nowrap">{label}</span>
              <span className={`text-[13px] font-bold whitespace-nowrap ${hi ?? "text-gray-900"}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-gray-100 shrink-0 overflow-x-auto scrollbar-none">
          <span className="text-[12px] text-gray-400 shrink-0">Quick:</span>
          {AI_QUICK.map(({ label, icon }) => (
            <button key={label} onClick={() => onSendMsg(label)}
              className="flex items-center gap-1.5 text-[12px] text-gray-600 border border-gray-200 rounded-full px-3 py-1 hover:bg-gray-50 whitespace-nowrap shrink-0 transition">
              <span className="text-gray-400">{icon}</span>{label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {aiMsgs.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z"/></svg>
                </div>
              )}
              <div className={`max-w-[78%] ${msg.role === "assistant" ? "bg-gray-50 rounded-2xl rounded-tl-sm" : "bg-blue-600 text-white rounded-2xl rounded-tr-sm"} px-4 py-3`}>
                {msg.role === "assistant" ? (
                  <>
                    <div className="text-[13px] text-gray-800 space-y-0.5">{renderAiText(msg.text)}</div>
                    {msg.suggestions && (
                      <div className="mt-3">
                        <p className="text-[11px] text-gray-400 mb-1.5">💡 You might also ask:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map(s => (
                            <button key={s} onClick={() => onSendMsg(s)}
                              className="text-[11px] text-gray-600 border border-gray-200 rounded-full px-2.5 py-0.5 hover:bg-white transition bg-white/80">
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">{msg.time}</span>
                      <button onClick={() => onTogglePin(msg.id)} title={msg.pinned ? "Unpin" : "Pin"}
                        className={`transition ${msg.pinned ? "text-purple-500" : "text-gray-300 hover:text-gray-500"}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={msg.pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-.85-1.65L16 12V5h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1v7l-2.15 1.59A2 2 0 0 0 5 15.24V17z"/></svg>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[13px] leading-relaxed">{msg.text}</p>
                    <p className="text-[10px] text-blue-200 mt-1.5">{msg.time}</p>
                  </>
                )}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#a78bfa,#818cf8)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 1.5C12.5 7.5 16.5 11.5 22.5 12C16.5 12.5 12.5 16.5 12 22.5C11.5 16.5 7.5 12.5 1.5 12C7.5 11.5 11.5 7.5 12 1.5Z"/></svg>
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-bounce inline-block" style={{ animationDelay: `${delay}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-5 pt-3 pb-4 border-t border-gray-100 shrink-0">
          <div className="flex gap-2">
            <input
              value={aiInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendMsg(); } }}
              placeholder="Ask anything about this campaign..."
              className="flex-1 text-[14px] border border-blue-200 focus:border-blue-400 rounded-xl px-4 py-2.5 outline-none placeholder-gray-300 transition"
            />
            <button
              onClick={() => onSendMsg()}
              disabled={!aiInput.trim() || aiLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-[14px] font-semibold transition disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#818cf8,#a78bfa)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">Chat history is automatically saved</p>
        </div>

      </div>
    </>
  );
}
