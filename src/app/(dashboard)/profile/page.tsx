"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { setSession } from "@/lib/auth";

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const meta = data.user.user_metadata ?? {};
        const full: string = meta.full_name ?? "";
        const parts = full.trim().split(" ");
        setFirstName(parts[0] ?? "");
        setLastName(parts.slice(1).join(" "));
        setEmail(data.user.email ?? "");
        setPhone(meta.phone ?? "");
        setLocation(meta.location ?? "");
        setAvatarUrl(meta.avatar_url ?? null);
      }
    });
  }, []);

  const initials = `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toUpperCase() || email.slice(0, 2).toUpperCase();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File must be under 2MB");
      return;
    }
    setAvatarLoading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? "unknown";
    const ext = file.name.split(".").pop();
    const path = `${uid}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setAvatarLoading(false);
      alert("Upload failed: " + upErr.message);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = urlData.publicUrl + `?t=${Date.now()}`;
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    setAvatarUrl(url);
    setAvatarLoading(false);
  };

  const handleRemoveAvatar = async () => {
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { avatar_url: null } });
    setAvatarUrl(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    const full_name = `${firstName.trim()} ${lastName.trim()}`.trim();
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name, phone: phone.trim(), location: location.trim() },
    });
    setProfileLoading(false);
    if (error) {
      setProfileMsg({ type: "error", text: error.message });
    } else {
      setSession({ email, name: full_name || email.split("@")[0] });
      setProfileMsg({ type: "success", text: "Profile updated successfully" });
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) { setPasswordMsg({ type: "error", text: "New password is required" }); return; }
    if (newPassword.length < 8) { setPasswordMsg({ type: "error", text: "Password must be at least 8 characters" }); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: "error", text: "Passwords do not match" }); return; }
    setPasswordLoading(true);
    setPasswordMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      setPasswordMsg({ type: "error", text: error.message });
    } else {
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPasswordMsg({ type: "success", text: "Password changed successfully" });
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[700px]">
      <h1 className="text-[22px] font-bold text-gray-900 mb-1">Profile Settings</h1>
      <p className="text-[14px] text-gray-500 mb-6">Manage your personal information and account security</p>

      {/* Profile Photo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-4">
        <p className="text-[14px] font-semibold text-gray-800 mb-4">Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-[72px] h-[72px] rounded-full bg-purple-500 flex items-center justify-center text-white text-[22px] font-bold overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-700 transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpg,image/jpeg,image/png,image/gif" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900 mb-0.5">{`${firstName} ${lastName}`.trim() || email}</p>
            <p className="text-[12px] text-gray-400 mb-3">JPG, PNG or GIF. Max size of 2MB</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="text-[13px] font-medium px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition flex items-center gap-1.5"
              >
                {avatarLoading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Upload new photo
              </button>
              {avatarUrl && (
                <button type="button" onClick={handleRemoveAvatar}
                  className="text-[13px] font-medium px-4 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-4">
        <p className="text-[14px] font-semibold text-gray-800 mb-5">Personal Information</p>
        <form onSubmit={handleSaveProfile}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">First Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>
                </span>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John"
                  className="w-full py-2.5 pl-9 pr-3 text-[14px] border border-gray-200 rounded-lg outline-none transition text-gray-700 placeholder-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Last Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>
                </span>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe"
                  className="w-full py-2.5 pl-9 pr-3 text-[14px] border border-gray-200 rounded-lg outline-none transition text-gray-700 placeholder-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                </span>
                <input type="email" value={email} disabled
                  className="w-full py-2.5 pl-9 pr-3 text-[14px] border border-gray-100 rounded-lg outline-none bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Phone</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4a2 2 0 0 1 1.98-2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.29 6.29l.87-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567"
                  className="w-full py-2.5 pl-9 pr-3 text-[14px] border border-gray-200 rounded-lg outline-none transition text-gray-700 placeholder-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5">Location</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="New York, USA"
                className="w-full py-2.5 pl-9 pr-3 text-[14px] border border-gray-200 rounded-lg outline-none transition text-gray-700 placeholder-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          {profileMsg && (
            <div className={`mb-4 px-3 py-2.5 rounded-lg text-[13px] flex items-center gap-2 ${profileMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {profileMsg.type === "success"
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              {profileMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={profileLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-[14px] px-6 py-2.5 rounded-lg flex items-center gap-2 transition">
              {profileLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 mb-4">
        <p className="text-[14px] font-semibold text-gray-800 mb-5">Security</p>
        <form onSubmit={handleChangePassword}>
          {[
            { label: "Current Password", placeholder: "Enter current password", value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
            { label: "New Password", placeholder: "Enter new password", value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(!showNew) },
            { label: "Confirm New Password", placeholder: "Confirm new password", value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
          ].map(({ label, placeholder, value, set, show, toggle }) => (
            <div key={label} className="mb-4">
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5">{label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input type={show ? "text" : "password"} value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                  className="w-full py-2.5 pl-9 pr-10 text-[14px] border border-gray-200 rounded-lg outline-none transition text-gray-700 placeholder-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                  {show
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
          ))}

          {passwordMsg && (
            <div className={`mb-4 px-3 py-2.5 rounded-lg text-[13px] flex items-center gap-2 ${passwordMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>
              {passwordMsg.type === "success"
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              {passwordMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={passwordLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-[14px] px-6 py-2.5 rounded-lg flex items-center gap-2 transition">
              {passwordLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-gray-900">Two-Factor Authentication</p>
              <p className="text-[12px] text-gray-400">Add an extra layer of security to your account</p>
            </div>
          </div>
          <button type="button"
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[13px] px-4 py-2 rounded-lg transition whitespace-nowrap">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  );
}
