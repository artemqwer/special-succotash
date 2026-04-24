"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { getSession, clearSession, type Session } from "@/lib/auth";

const PLATFORM_META: Record<string, { icon: React.ReactNode; name: string; date: string }> = {
  "/google-ads": {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
      </svg>
    ),
    name: "Google Ads",
    date: "Mar 31 – Apr 13, 2026",
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
    } else {
      setSession(s);
      setChecking(false);
    }
  }, [router]);

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const platform = pathname ? PLATFORM_META[pathname] : null;

  return (
    <div className="bg-[#f4f6fb]">
    <div className="flex min-h-screen max-w-420">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        session={session}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-gray-500 hover:text-gray-700">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            {platform ? (
              <div className="flex items-center gap-2">
                {platform.icon}
                <span className="text-[15px] font-bold text-gray-900">{platform.name}</span>
              </div>
            ) : (
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
            )}
          </div>
          {platform && (
            <div 
              onClick={() => window.dispatchEvent(new CustomEvent("open-date-picker"))}
              className="flex items-center gap-1.5 text-[12px] text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 cursor-pointer active:bg-gray-50 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span className="truncate max-w-[120px]">{platform.date}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          )}
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
    </div>
  );
}
