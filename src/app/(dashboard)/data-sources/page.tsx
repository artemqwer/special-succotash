"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

const comingSoon = [
  {
    id: "facebook-ads",
    name: "Facebook Ads",
    description: "Analyze your Facebook & Instagram advertising performance",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#9CA3AF">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: "tiktok-ads",
    name: "TikTok Ads",
    description: "Track and optimize your TikTok advertising campaigns",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#9CA3AF">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
  {
    id: "linkedin-ads",
    name: "LinkedIn Ads",
    description: "Monitor your LinkedIn B2B advertising campaigns",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#9CA3AF">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    id: "microsoft-ads",
    name: "Microsoft Ads",
    description: "Connect Bing Ads and expand your reach",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="1" y="1" width="10" height="10" fill="#9CA3AF"/>
        <rect x="13" y="1" width="10" height="10" fill="#9CA3AF" opacity=".8"/>
        <rect x="1" y="13" width="10" height="10" fill="#9CA3AF" opacity=".6"/>
        <rect x="13" y="13" width="10" height="10" fill="#9CA3AF" opacity=".4"/>
      </svg>
    ),
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Combine advertising data with website analytics",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M22.84 10.88a1.5 1.5 0 0 0-1.5-1.5h-8.5a1.5 1.5 0 0 0-1.5 1.5v8.5a1.5 1.5 0 0 0 1.5 1.5h8.5a1.5 1.5 0 0 0 1.5-1.5v-8.5z" fill="#9CA3AF"/>
        <rect x="2" y="14" width="7" height="7" rx="1.5" fill="#9CA3AF" opacity=".5"/>
        <rect x="2" y="3" width="7" height="7" rx="1.5" fill="#9CA3AF" opacity=".3"/>
      </svg>
    ),
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "Sync your e-commerce data for better attribution",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#9CA3AF">
        <path d="M15.337 23.979l7.216-1.561S19.686 7.309 19.67 7.17c-.017-.135-.135-.225-.248-.225s-2.154-.149-2.154-.149-.993-1.035-1.517-1.428v-.017c0-.018-.018-.018-.018-.018-.525 2.77-1.482 5.04-1.482 5.04-.003.003-.003.003-.003.006.006.003 1.089.335 1.089.335zm-5.374-14.69s-.972-.286-2.171-.286c-1.78 0-1.87.934-1.87 1.168 0 1.28 4.004 1.769 4.004 4.759 0 2.358-1.66 3.879-3.898 3.879-2.686 0-4.061-1.67-4.061-1.67l.72-2.373s1.414 1.207 2.61 1.207c.778 0 1.094-.6 1.094-1.042 0-1.669-3.287-1.744-3.287-4.46 0-2.296 1.652-4.518 4.987-4.518 1.282 0 1.916.36 1.916.36l-.044 2.976zM13.29 2.483l-.33.084S12.637.83 11.25.283C11.73.12 12.393.06 12.9.276c0 0 .24.83.39 2.207zm-1.81.463c-.75.195-1.578.408-2.403.624-.23-1.004-.636-2.256-1.357-3.006 1.665.26 2.49 2.012 2.76 2.382zm-3.207.83C8.102 3.79 7.896 3.8 7.7 3.812c-1.248.066-2.133.5-2.808 1.16C4.56 5.294 4.17 5.7 3.873 6.08L2.337 22.63l9.793 1.856c.077.015.15-.04.154-.12L13.78 3.312c-.12.03-5.497.464-5.497.464z"/>
      </svg>
    ),
  },
];

export default function DataSourcesPage() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [windsorKey, setWindsorKey] = useState("");
  const [windsorSaving, setWindsorSaving] = useState(false);
  const [windsorConnected, setWindsorConnected] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setConnected(!!user?.user_metadata?.google_ads_refresh_token);
      const key = user?.user_metadata?.windsor_api_key ?? "";
      setWindsorKey(key);
      setWindsorConnected(!!key);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const status = searchParams.get("connected");
    const error = searchParams.get("error");
    if (status === "true") {
      setConnected(true);
      showToast("success", "Google Ads connected successfully");
    } else if (error) {
      const msgs: Record<string, string> = {
        oauth_cancelled: "Authorization was cancelled",
        token_exchange: "Failed to exchange authorization code",
        no_refresh_token: "No refresh token received — try again",
        save_failed: "Failed to save connection",
      };
      showToast("error", msgs[error] ?? "Connection failed");
    }
  }, [searchParams, showToast]);

  const handleSaveWindsorKey = async () => {
    setWindsorSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { windsor_api_key: windsorKey.trim() || null } });
    setWindsorSaving(false);
    if (error) {
      showToast("error", "Failed to save Windsor API key");
    } else {
      setWindsorConnected(!!windsorKey.trim());
      showToast("success", windsorKey.trim() ? "Windsor.ai connected" : "Windsor.ai disconnected");
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { google_ads_refresh_token: null },
    });
    setDisconnecting(false);
    if (error) {
      showToast("error", "Failed to disconnect");
    } else {
      setConnected(false);
      showToast("success", "Google Ads disconnected");
    }
  };

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-500 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium transition-all ${
          toast.type === "success"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {toast.type === "success"
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          }
          {toast.text}
        </div>
      )}

      <h1 className="text-[22px] font-bold text-gray-900 mb-1">Data Sources</h1>
      <p className="text-[13px] text-gray-500 mb-8">
        Connect your advertising platforms to start tracking performance
      </p>

      {/* Google Ads — main connector */}
      <div className="mb-8">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Available</p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="#2563EB"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-[15px] font-semibold text-gray-900">Google Ads</h3>
                  {!loading && connected && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-400 leading-snug">
                  Connect your Google Ads account via OAuth to pull campaign data directly
                </p>
              </div>
            </div>

            <div className="shrink-0 sm:ml-4">
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              ) : connected ? (
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-[13px] font-medium px-4 py-2 rounded-xl transition disabled:opacity-50"
                >
                  {disconnecting && <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                  Disconnect
                </button>
              ) : (
                <a
                  href="/api/auth/google-ads"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold px-5 py-2 rounded-xl transition shadow-sm shadow-blue-100"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Connect with Google
                </a>
              )}
            </div>
          </div>

          {connected && (
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[12px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Syncing via Google Ads API
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Secured with OAuth 2.0
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Windsor.ai */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-50 shrink-0">
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#7C3AED" opacity=".12"/>
                <path d="M20 8L26 20L20 32L14 20L20 8Z" fill="#7C3AED"/>
                <path d="M8 20L20 14L32 20L20 26L8 20Z" fill="#A78BFA"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-[15px] font-semibold text-gray-900">Windsor.ai</h3>
                {!loading && windsorConnected && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Connected
                  </span>
                )}
              </div>
              <p className="text-[13px] text-gray-400 leading-snug">
                Connect via Windsor.ai API key to pull Google Ads data directly
              </p>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-50">
            <label className="text-[12px] font-medium text-gray-500 block mb-1.5">API Key</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={windsorKey}
                onChange={e => setWindsorKey(e.target.value)}
                placeholder="Paste your Windsor.ai API key"
                className="text-[13px] border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-700 focus:border-purple-400 flex-1"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWindsorKey}
                  disabled={windsorSaving}
                  className="flex-1 sm:flex-none text-[12px] font-medium bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                >
                  {windsorSaving ? "Saving…" : windsorConnected ? "Update" : "Connect"}
                </button>
                {windsorConnected && (
                  <button
                    onClick={async () => {
                      setWindsorSaving(true);
                      const supabase = createClient();
                      await supabase.auth.updateUser({ data: { windsor_api_key: null } });
                      setWindsorSaving(false);
                      setWindsorKey("");
                      setWindsorConnected(false);
                      showToast("success", "Windsor.ai disconnected");
                    }}
                    disabled={windsorSaving}
                    className="flex-1 sm:flex-none text-[12px] font-medium border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Find your API key in Windsor.ai → Settings → API
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Coming Soon</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {comingSoon.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-gray-500">{c.name}</h3>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Coming soon
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-400 leading-snug mt-0.5">{c.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
