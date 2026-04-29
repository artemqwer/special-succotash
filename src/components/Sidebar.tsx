"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "@/lib/auth";

const nav = [
  {
    group: "PLATFORMS",
    items: [
      {
        label: "Google Ads",
        href: "/google-ads",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#4285F4"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: "SYSTEM",
    items: [
      {
        label: "Data Sources",
        href: "/data-sources",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
            <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
          </svg>
        ),
      },
    ],
  },
  {
    group: "ACCOUNT",
    items: [
      {
        label: "Profile",
        href: "/profile",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
          </svg>
        ),
      },
      {
        label: "Login Page",
        href: "/login",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        ),
      },
      {
        label: "Registration Page",
        href: "/register",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        ),
      },
      {
        label: "User Management",
        href: "/admin",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  session?: Session | null;
  onLogout?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose, session, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const fadeCls = `transition-opacity duration-150 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`;

  const content = (
    <aside className={`relative h-full bg-white border-r border-gray-100 flex flex-col transition-[width] duration-200 ease-out overflow-hidden ${collapsed ? "w-[60px]" : "w-[220px]"}`}>
      {/* Desktop collapse button — absolute so it stays clickable in collapsed state */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden lg:flex absolute top-5 right-2 z-10 w-6 h-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className="w-[220px] h-full flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center px-4 pt-5 pb-3 pr-10">
          <div className={`flex items-center gap-2 min-w-0 ${fadeCls}`}>
            <svg width="32" height="32" viewBox="0 0 42 42" fill="none" className="shrink-0">
              <rect width="42" height="42" rx="10" fill="#EFF4FF" />
              <rect x="7" y="26" width="6" height="10" rx="1.5" fill="#2563EB" />
              <rect x="15" y="19" width="6" height="17" rx="1.5" fill="#2563EB" />
              <rect x="23" y="11" width="6" height="25" rx="1.5" fill="#1D4ED8" />
              <rect x="31" y="22" width="4" height="14" rx="1.5" fill="#93C5FD" />
            </svg>
            <div>
              <div className="text-[13px] font-black text-gray-900 whitespace-nowrap" style={{ letterSpacing: "0.1em" }}>DATA ROCKS</div>
              <div className="text-[9px] text-gray-400 whitespace-nowrap" style={{ letterSpacing: "0.03em" }}>E-commerce Intelligence</div>
            </div>
          </div>
          {/* Mobile close button */}
          <button onClick={onMobileClose} className="lg:hidden text-gray-400 hover:text-gray-600 transition ml-auto shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pt-2">
          {nav.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <p className={`px-3 mb-1 text-[10px] font-semibold text-gray-400 tracking-widest uppercase whitespace-nowrap ${fadeCls}`}>{group}</p>
              {items.map(({ label, href, icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onMobileClose}
                    title={collapsed ? label : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition mb-0.5 ${
                      active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className={`shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`}>{icon}</span>
                    <span className={`whitespace-nowrap ${fadeCls}`}>{label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
            {session?.name ? session.name.slice(0, 2).toUpperCase() : "U"}
          </div>
          <div className={`overflow-hidden flex-1 min-w-0 ${fadeCls}`}>
            <p className="text-[13px] font-semibold text-gray-800 truncate whitespace-nowrap">{session?.name ?? "User"}</p>
            <p className="text-[11px] text-gray-400 truncate whitespace-nowrap">{session?.email ?? ""}</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              className={`shrink-0 text-gray-400 hover:text-red-500 transition ${fadeCls}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full shrink-0 sticky top-0">{content}</div>

      {/* Mobile drawer — always rendered, animated via transform */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onMobileClose}
      />
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden flex transition-transform duration-300 ease-in-out ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
            <aside className="w-[260px] h-full bg-white border-r border-gray-100 flex flex-col">
              {/* Logo + close */}
              <div className="flex items-center justify-between px-4 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <svg width="32" height="32" viewBox="0 0 42 42" fill="none">
                    <rect width="42" height="42" rx="10" fill="#EFF4FF" />
                    <rect x="7" y="26" width="6" height="10" rx="1.5" fill="#2563EB" />
                    <rect x="15" y="19" width="6" height="17" rx="1.5" fill="#2563EB" />
                    <rect x="23" y="11" width="6" height="25" rx="1.5" fill="#1D4ED8" />
                    <rect x="31" y="22" width="4" height="14" rx="1.5" fill="#93C5FD" />
                  </svg>
                  <div>
                    <div className="text-[13px] font-black text-gray-900" style={{ letterSpacing: "0.1em" }}>DATA ROCKS</div>
                    <div className="text-[9px] text-gray-400">E-commerce Intelligence</div>
                  </div>
                </div>
                <button onClick={onMobileClose} className="text-gray-400 hover:text-gray-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-2 pt-2">
                {nav.map(({ group, items }) => (
                  <div key={group} className="mb-4">
                    <p className="px-3 mb-1 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">{group}</p>
                    {items.map(({ label, href, icon }) => {
                      const active = pathname === href;
                      return (
                        <Link key={href} href={href} onClick={onMobileClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition mb-0.5 ${
                            active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}>
                          <span className={active ? "text-blue-600" : "text-gray-400"}>{icon}</span>
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
              <div className="border-t border-gray-100 p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                  {session?.name ? session.name.slice(0, 2).toUpperCase() : "U"}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{session?.name ?? "User"}</p>
                  <p className="text-[11px] text-gray-400 truncate">{session?.email ?? ""}</p>
                </div>
                {onLogout && (
                  <button onClick={onLogout} title="Sign out" className="shrink-0 text-gray-400 hover:text-red-500 transition">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                )}
              </div>
            </aside>
      </div>
    </>
  );
}
