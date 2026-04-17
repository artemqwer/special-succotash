"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f4f6fb]">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button onClick={() => setMobileOpen(true)} className="text-gray-500 hover:text-gray-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 42 42" fill="none">
              <rect width="42" height="42" rx="10" fill="#EFF4FF" />
              <rect x="7" y="26" width="6" height="10" rx="1.5" fill="#2563EB" />
              <rect x="15" y="19" width="6" height="17" rx="1.5" fill="#2563EB" />
              <rect x="23" y="11" width="6" height="25" rx="1.5" fill="#1D4ED8" />
              <rect x="31" y="22" width="4" height="14" rx="1.5" fill="#93C5FD" />
            </svg>
            <span className="text-[13px] font-black text-gray-900" style={{ letterSpacing: "0.1em" }}>DATA ROCKS</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
