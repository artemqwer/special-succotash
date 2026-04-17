"use client";

import { useState } from "react";

type Status = "connected" | "disconnected";
type Category = "advertising" | "analytics" | "ecommerce";

interface Connector {
  id: string;
  name: string;
  description: string;
  category: Category;
  status: Status;
  accounts?: number;
  lastSync?: string;
  color: string;
  icon: React.ReactNode;
}

const connectors: Connector[] = [
  {
    id: "google-ads",
    name: "Google Ads",
    description: "Connect your Google Ads campaigns and get deep analytics",
    category: "advertising",
    status: "connected",
    accounts: 3,
    lastSync: "2 minutes ago",
    color: "#2563EB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#2563EB"/>
      </svg>
    ),
  },
  {
    id: "facebook-ads",
    name: "Facebook Ads",
    description: "Analyze your Facebook & Instagram advertising performance",
    category: "advertising",
    status: "disconnected",
    color: "#2563EB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: "tiktok-ads",
    name: "TikTok Ads",
    description: "Track and optimize your TikTok advertising campaigns",
    category: "advertising",
    status: "disconnected",
    color: "#2563EB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
  {
    id: "linkedin-ads",
    name: "LinkedIn Ads",
    description: "Monitor your LinkedIn B2B advertising campaigns",
    category: "advertising",
    status: "disconnected",
    color: "#2563EB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    id: "microsoft-ads",
    name: "Microsoft Ads",
    description: "Connect Bing Ads and expand your reach",
    category: "advertising",
    status: "connected",
    accounts: 1,
    lastSync: "3 minutes ago",
    color: "#2563EB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="10" height="10" fill="#2563EB"/>
        <rect x="13" y="1" width="10" height="10" fill="#3B82F6"/>
        <rect x="1" y="13" width="10" height="10" fill="#60A5FA"/>
        <rect x="13" y="13" width="10" height="10" fill="#93C5FD"/>
      </svg>
    ),
  },
  {
    id: "amazon-ads",
    name: "Amazon Ads",
    description: "Optimize your Amazon advertising and product campaigns",
    category: "advertising",
    status: "disconnected",
    color: "#2563EB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB">
        <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.636 2.11 7.594 3.166 11.87 3.166 2.852 0 5.668-.533 8.447-1.595l.315-.14c.138-.06.234-.1.293-.13.226-.088.39-.046.525.13.12.174.09.336-.12.48-.256.19-.6.41-1.006.654-1.244.743-2.64 1.316-4.185 1.726a17.617 17.617 0 0 1-4.445.572c-3.988 0-7.605-1.066-10.856-3.2a.66.66 0 0 1-.133-.118.44.44 0 0 1-.062-.26c0-.1.04-.2.01-.263zM7.17 11.585c0-1.09.243-2.07.73-2.94.486-.87 1.157-1.55 2.014-2.04.856-.49 1.826-.74 2.91-.74.87 0 1.648.177 2.336.53a4.5 4.5 0 0 1 1.648 1.44c.42.6.63 1.24.63 1.92v.09c0 .06-.02.12-.063.18a.183.183 0 0 1-.157.072h-1.32a.31.31 0 0 1-.195-.063.436.436 0 0 1-.12-.205c-.164-.65-.476-1.15-.937-1.5-.46-.352-1.04-.527-1.742-.527-.87 0-1.566.3-2.086.9-.52.6-.78 1.42-.78 2.46v.27c0 1.04.26 1.856.783 2.453.52.595 1.215.892 2.083.892.7 0 1.283-.175 1.744-.527.46-.352.77-.854.934-1.505a.44.44 0 0 1 .12-.204.307.307 0 0 1 .196-.063h1.32c.067 0 .12.024.157.072a.22.22 0 0 1 .063.18v.09c0 .68-.21 1.32-.63 1.92a4.5 4.5 0 0 1-1.648 1.44c-.688.35-1.466.528-2.336.528-1.084 0-2.054-.247-2.91-.74a5.345 5.345 0 0 1-2.013-2.04 5.874 5.874 0 0 1-.73-2.94v-.27z"/>
      </svg>
    ),
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Combine advertising data with website analytics",
    category: "analytics",
    status: "connected",
    accounts: 1,
    lastSync: "5 minutes ago",
    color: "#2563EB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M22.84 10.88a1.5 1.5 0 0 0-1.5-1.5h-8.5a1.5 1.5 0 0 0-1.5 1.5v8.5a1.5 1.5 0 0 0 1.5 1.5h8.5a1.5 1.5 0 0 0 1.5-1.5v-8.5z" fill="#2563EB"/>
        <rect x="2" y="14" width="7" height="7" rx="1.5" fill="#2563EB" opacity=".5"/>
        <rect x="2" y="3" width="7" height="7" rx="1.5" fill="#2563EB" opacity=".3"/>
      </svg>
    ),
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync your e-commerce data for better attribution",
    category: "ecommerce",
    status: "disconnected",
    color: "#2563EB",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563EB">
        <path d="M15.337 23.979l7.216-1.561S19.686 7.309 19.67 7.17c-.017-.135-.135-.225-.248-.225s-2.154-.149-2.154-.149-.993-1.035-1.517-1.428v-.017c0-.018-.018-.018-.018-.018-.525 2.77-1.482 5.04-1.482 5.04-.003.003-.003.003-.003.006.006.003 1.089.335 1.089.335zm-5.374-14.69s-.972-.286-2.171-.286c-1.78 0-1.87.934-1.87 1.168 0 1.28 4.004 1.769 4.004 4.759 0 2.358-1.66 3.879-3.898 3.879-2.686 0-4.061-1.67-4.061-1.67l.72-2.373s1.414 1.207 2.61 1.207c.778 0 1.094-.6 1.094-1.042 0-1.669-3.287-1.744-3.287-4.46 0-2.296 1.652-4.518 4.987-4.518 1.282 0 1.916.36 1.916.36l-.044 2.976zM13.29 2.483l-.33.084S12.637.83 11.25.283C11.73.12 12.393.06 12.9.276c0 0 .24.83.39 2.207zm-1.81.463c-.75.195-1.578.408-2.403.624-.23-1.004-.636-2.256-1.357-3.006 1.665.26 2.49 2.012 2.76 2.382zm-3.207.83C8.102 3.79 7.896 3.8 7.7 3.812c-1.248.066-2.133.5-2.808 1.16C4.56 5.294 4.17 5.7 3.873 6.08L2.337 22.63l9.793 1.856c.077.015.15-.04.154-.12L13.78 3.312c-.12.03-5.497.464-5.497.464z"/>
      </svg>
    ),
  },
];

const tabs = [
  { label: "All Connectors", value: "all" },
  { label: "Advertising Platforms", value: "advertising" },
  { label: "Analytics Tools", value: "analytics" },
  { label: "E-commerce Platforms", value: "ecommerce" },
];

const SyncIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

export default function DataSourcesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState(connectors);

  const connected = items.filter((c) => c.status === "connected").length;
  const totalAccounts = items.reduce((s, c) => s + (c.accounts ?? 0), 0);
  const available = items.filter((c) => c.status === "disconnected").length;

  const filtered = activeTab === "all" ? items : items.filter((c) => c.category === activeTab);

  const tabCount = (val: string) =>
    val === "all" ? items.length : items.filter((c) => c.category === val).length;

  const toggleConnect = (id: string) => {
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? c.status === "connected"
            ? { ...c, status: "disconnected", accounts: undefined, lastSync: undefined }
            : { ...c, status: "connected", accounts: 1, lastSync: "just now" }
          : c
      )
    );
  };

  return (
    <div className="px-8 py-8">
      <h1 className="text-[22px] font-bold text-gray-900 mb-1">Data Sources</h1>
      <p className="text-[13px] text-gray-500 mb-6">
        Connect and manage your advertising platforms and analytics tools
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <p className="text-[22px] font-bold text-gray-900 leading-none">{connected}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Connected Sources</p>
            <p className="text-[11px] text-gray-300">Active integrations</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div>
            <p className="text-[22px] font-bold text-gray-900 leading-none">{totalAccounts}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Total Accounts</p>
            <p className="text-[11px] text-gray-300">Across all platforms</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <div>
            <p className="text-[22px] font-bold text-gray-900 leading-none">{available}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">Available to Connect</p>
            <p className="text-[11px] text-gray-300">Expand your analytics</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-white border border-gray-100 rounded-xl shadow-sm px-2 py-1.5 w-fit">
        {tabs.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition ${
              activeTab === value
                ? "bg-blue-600 text-white"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
              activeTab === value ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {tabCount(value)}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${c.color}15` }}>
                  {c.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-gray-900">{c.name}</h3>
                    {c.status === "connected" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 leading-snug mt-0.5">{c.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              {c.status === "connected" ? (
                <>
                  <div className="flex items-center gap-3 text-[12px] text-gray-400">
                    <span>Accounts {c.accounts}</span>
                    <span className="flex items-center gap-1">
                      <SyncIcon />
                      Last sync: {c.lastSync}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-50">
                      <SettingsIcon />
                    </button>
                    <button
                      onClick={() => toggleConnect(c.id)}
                      className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[12px] font-medium px-3 py-1.5 rounded-lg transition"
                    >
                      Manage
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-[12px] text-gray-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                    Not connected
                  </span>
                  <button
                    onClick={() => toggleConnect(c.id)}
                    className="flex items-center gap-1 border border-blue-200 hover:bg-blue-50 text-blue-600 text-[12px] font-medium px-3 py-1.5 rounded-lg transition"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Connect
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
