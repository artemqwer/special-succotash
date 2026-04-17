"use client";

import { useState } from "react";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function InputField({
  placeholder,
  icon,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  showToggle,
  onToggle,
  showPass,
}: {
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  showToggle?: boolean;
  onToggle?: () => void;
  showPass?: boolean;
}) {
  return (
    <div>
      <div className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 transition ${
        error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
      }`}>
        <span className="text-gray-400 shrink-0">{icon}</span>
        <input
          type={showToggle ? (showPass ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="flex-1 text-[13px] text-gray-700 placeholder-gray-400 outline-none bg-transparent"
        />
        {showToggle && (
          <button type="button" onClick={onToggle} className="text-gray-400 hover:text-gray-600">
            <EyeIcon open={!!showPass} />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
  </svg>
);
const MailIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.7 12.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1.5h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.1a16 16 0 0 0 6 6l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16.5z" />
  </svg>
);
const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("John");
  const [lastName, setLastName] = useState("Doe");
  const [email, setEmail] = useState("john@company.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [location, setLocation] = useState("New York, USA");
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileTouched, setProfileTouched] = useState<Record<string, boolean>>({});
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdErrors, setPwdErrors] = useState<Record<string, string>>({});
  const [pwdTouched, setPwdTouched] = useState<Record<string, boolean>>({});
  const [pwdSaved, setPwdSaved] = useState(false);

  // Profile validation
  const validateProfile = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!lastName.trim()) e.lastName = "Required";
    if (!email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    return e;
  };

  const handleProfileBlur = (field: string) => {
    setProfileTouched((t) => ({ ...t, [field]: true }));
    setProfileErrors(validateProfile());
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileTouched({ firstName: true, lastName: true, email: true });
    const errs = validateProfile();
    setProfileErrors(errs);
    if (Object.keys(errs).length === 0) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  // Password validation
  const validatePwd = () => {
    const e: Record<string, string> = {};
    if (!currentPwd) e.currentPwd = "Required";
    if (!newPwd) e.newPwd = "Required";
    else if (newPwd.length < 8) e.newPwd = "Min 8 characters";
    if (!confirmPwd) e.confirmPwd = "Required";
    else if (confirmPwd !== newPwd) e.confirmPwd = "Passwords do not match";
    return e;
  };

  const handlePwdBlur = (field: string) => {
    setPwdTouched((t) => ({ ...t, [field]: true }));
    setPwdErrors(validatePwd());
  };

  const handlePwdSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdTouched({ currentPwd: true, newPwd: true, confirmPwd: true });
    const errs = validatePwd();
    setPwdErrors(errs);
    if (Object.keys(errs).length === 0) {
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setPwdTouched({});
      setPwdSaved(true);
      setTimeout(() => setPwdSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-8 py-8">
      <h1 className="text-[22px] font-bold text-gray-900 mb-1">Profile Settings</h1>
      <p className="text-[13px] text-gray-500 mb-7">Manage your personal information and account security</p>

      {/* Profile Photo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <h2 className="text-[15px] font-semibold text-gray-800 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white text-[20px] font-bold shrink-0">
            JD
          </div>
          <div>
            <p className="text-[13px] font-medium text-gray-800 mb-0.5">John Doe</p>
            <p className="text-[11px] text-gray-400 mb-3">JPG, PNG or GIF. Max size of 2MB</p>
            <div className="flex items-center gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition">
                Upload new photo
              </button>
              <button className="text-[12px] text-gray-500 hover:text-red-500 transition">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <form onSubmit={handleProfileSave} noValidate>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <h2 className="text-[15px] font-semibold text-gray-800 mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">First Name</label>
              <InputField
                placeholder="First Name"
                icon={<PersonIcon />}
                value={firstName}
                onChange={setFirstName}
                onBlur={() => handleProfileBlur("firstName")}
                error={profileTouched.firstName ? profileErrors.firstName : undefined}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Last Name</label>
              <InputField
                placeholder="Last Name"
                icon={<PersonIcon />}
                value={lastName}
                onChange={setLastName}
                onBlur={() => handleProfileBlur("lastName")}
                error={profileTouched.lastName ? profileErrors.lastName : undefined}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Email</label>
              <InputField
                placeholder="Email"
                icon={<MailIcon />}
                type="email"
                value={email}
                onChange={setEmail}
                onBlur={() => handleProfileBlur("email")}
                error={profileTouched.email ? profileErrors.email : undefined}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Phone</label>
              <InputField
                placeholder="+1 (555) 123-4567"
                icon={<PhoneIcon />}
                value={phone}
                onChange={setPhone}
              />
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Location</label>
            <InputField
              placeholder="City, Country"
              icon={<LocationIcon />}
              value={location}
              onChange={setLocation}
            />
          </div>
          <div className="flex justify-end items-center gap-3">
            {profileSaved && (
              <span className="text-[12px] text-green-600 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Changes saved
              </span>
            )}
            <button type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-5 py-2 rounded-lg transition">
              Save Changes
            </button>
          </div>
        </div>
      </form>

      {/* Security */}
      <form onSubmit={handlePwdSave} noValidate>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[15px] font-semibold text-gray-800 mb-4">Security</h2>
          <div className="mb-4">
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Current Password</label>
            <InputField
              placeholder="Enter current password"
              icon={<LockIcon />}
              value={currentPwd}
              onChange={setCurrentPwd}
              onBlur={() => handlePwdBlur("currentPwd")}
              error={pwdTouched.currentPwd ? pwdErrors.currentPwd : undefined}
              showToggle
              onToggle={() => setShowCurrent(!showCurrent)}
              showPass={showCurrent}
            />
          </div>
          <div className="mb-4">
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">New Password</label>
            <InputField
              placeholder="Enter new password"
              icon={<LockIcon />}
              value={newPwd}
              onChange={setNewPwd}
              onBlur={() => handlePwdBlur("newPwd")}
              error={pwdTouched.newPwd ? pwdErrors.newPwd : undefined}
              showToggle
              onToggle={() => setShowNew(!showNew)}
              showPass={showNew}
            />
          </div>
          <div className="mb-5">
            <label className="block text-[12px] font-medium text-gray-600 mb-1.5">Confirm New Password</label>
            <InputField
              placeholder="Confirm new password"
              icon={<LockIcon />}
              value={confirmPwd}
              onChange={setConfirmPwd}
              onBlur={() => handlePwdBlur("confirmPwd")}
              error={pwdTouched.confirmPwd ? pwdErrors.confirmPwd : undefined}
              showToggle
              onToggle={() => setShowConfirm(!showConfirm)}
              showPass={showConfirm}
            />
          </div>
          <div className="flex justify-end items-center gap-3">
            {pwdSaved && (
              <span className="text-[12px] text-green-600 flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Password updated
              </span>
            )}
            <button type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium px-5 py-2 rounded-lg transition">
              Update Password
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
