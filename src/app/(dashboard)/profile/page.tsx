"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { setSession } from "@/lib/auth";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setName(data.user.user_metadata?.full_name ?? "");
      }
    });
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ type: "error", text: "Name cannot be empty" });
      return;
    }
    setProfileLoading(true);
    setProfileMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setProfileLoading(false);
    if (error) {
      setProfileMsg({ type: "error", text: error.message });
    } else {
      setSession({ email, name: name.trim() });
      setProfileMsg({ type: "success", text: "Profile updated successfully" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPasswordMsg({ type: "error", text: "New password is required" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordMsg({ type: "error", text: error.message });
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "success", text: "Password changed successfully" });
    }
  };

  const initials = name ? name.slice(0, 2).toUpperCase() : email.slice(0, 2).toUpperCase();

  return (
    <div className="p-4 sm:p-6 max-w-[600px]">
      <h1 className="text-[20px] font-bold text-gray-900 mb-1">Profile</h1>
      <p className="text-[14px] text-gray-500 mb-6">Manage your account details</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-purple-500 flex items-center justify-center text-white text-[20px] font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-[16px] font-semibold text-gray-900">{name || "—"}</p>
            <p className="text-[13px] text-gray-400">{email}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <div className="mb-4">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full py-2.5 px-3 text-[14px] border border-gray-200 rounded-lg outline-none transition text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="mb-5">
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full py-2.5 px-3 text-[14px] border border-gray-100 rounded-lg outline-none bg-gray-50 text-gray-400 cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-gray-400">Email cannot be changed</p>
          </div>

          {profileMsg && (
            <div className={`mb-4 px-3 py-2.5 rounded-lg text-[13px] flex items-center gap-2 ${
              profileMsg.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {profileMsg.type === "success" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
              {profileMsg.text}
            </div>
          )}

          <button type="submit" disabled={profileLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-[14px] px-5 py-2.5 rounded-lg flex items-center gap-2 transition">
            {profileLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Save changes"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Change password</h2>

        <form onSubmit={handleChangePassword}>
          {[
            { label: "Current password", value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
            { label: "New password", value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(!showNew) },
            { label: "Confirm new password", value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
          ].map(({ label, value, set, show, toggle }) => (
            <div key={label} className="mb-4">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2.5 pl-3 pr-10 text-[14px] border border-gray-200 rounded-lg outline-none transition text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button type="button" onClick={toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {show ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
          ))}

          {passwordMsg && (
            <div className={`mb-4 px-3 py-2.5 rounded-lg text-[13px] flex items-center gap-2 ${
              passwordMsg.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              {passwordMsg.type === "success" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
              {passwordMsg.text}
            </div>
          )}

          <button type="submit" disabled={passwordLoading}
            className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium text-[14px] px-5 py-2.5 rounded-lg flex items-center gap-2 transition">
            {passwordLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
