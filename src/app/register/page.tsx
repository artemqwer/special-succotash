"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DataRocksLogo from "@/components/DataRocksLogo";
import { registerUser } from "@/lib/auth";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

type Errors = { name?: string; email?: string; password?: string; agreed?: string };

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < score ? colors[score - 1] : "bg-gray-200"}`} />
        ))}
      </div>
      <p className={`text-[11px] font-medium ${["text-red-500","text-orange-500","text-yellow-600","text-green-600"][score - 1] ?? "text-gray-400"}`}>
        {score > 0 ? labels[score - 1] : ""}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const validate = (fields = { name, email, password, agreed }): Errors => {
    const e: Errors = {};
    if (!fields.name.trim()) e.name = "Full name is required";
    if (!fields.email.trim()) e.email = "Email is required";
    else if (!isValidEmail(fields.email)) e.email = "Enter a valid email address";
    if (!fields.password) e.password = "Password is required";
    else if (fields.password.length < 8) e.password = "Password must be at least 8 characters";
    if (!fields.agreed) e.agreed = "You must accept the terms to continue";
    return e;
  };

  const handleBlur = (field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, agreed: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setServerError("");
    const result = await registerUser(email.trim(), name.trim(), password);
    setLoading(false);

    if (!result.success) {
      setServerError(result.error ?? "Registration failed");
      return;
    }

    // Supabase may require email confirmation — show success message
    setSuccess(true);
    setTimeout(() => router.replace("/google-ads"), 1500);
  };

  const fieldClass = (field: keyof Errors, extra = "") =>
    `w-full py-2.5 text-[14px] border rounded-lg outline-none transition text-gray-700 placeholder-gray-400 ${extra} ${
      touched[field] && errors[field]
        ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    }`;

  const ErrorMsg = ({ field }: { field: keyof Errors }) =>
    touched[field] && errors[field] ? (
      <p className="mt-1.5 text-[12px] text-red-500 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {errors[field]}
      </p>
    ) : null;

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#e8ecf5] px-4">
        <DataRocksLogo />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-[400px] text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-semibold text-gray-900 mb-2">Account created!</h2>
          <p className="text-[14px] text-gray-500">Redirecting you to the dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e8ecf5] px-4 py-10">
      <DataRocksLogo />

      <h1 className="text-[20px] font-semibold text-gray-900 mb-1">Create your account</h1>
      <p className="text-[14px] text-gray-500 mb-6 text-center">
        Transform data chaos into confident growth decisions
      </p>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8 w-full max-w-[400px]">
        {serverError && (
          <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-600 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {serverError}
          </div>
        )}

        {/* Full Name */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/></svg>
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name")}
              placeholder="Full name *"
              className={fieldClass("name", "pl-9 pr-4")}
            />
          </div>
          <ErrorMsg field="name" />
        </div>

        {/* Email */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email")}
              placeholder="Email address *"
              className={fieldClass("email", "pl-9 pr-4")}
            />
          </div>
          <ErrorMsg field="email" />
        </div>

        {/* Password */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="Password *"
              className={fieldClass("password", "pl-9 pr-10")}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <PasswordStrength password={password} />
          <ErrorMsg field="password" />
        </div>

        {/* Terms */}
        <div className="mb-5">
          <div className="flex items-start gap-2.5">
            <div
              onClick={() => { setAgreed(!agreed); setTouched((t) => ({ ...t, agreed: true })); setErrors(validate({ name, email, password, agreed: !agreed })); }}
              className={`mt-[2px] w-4 h-4 shrink-0 border rounded flex items-center justify-center cursor-pointer ${
                touched.agreed && errors.agreed ? "border-red-400 bg-red-50" : agreed ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
              }`}>
              {agreed && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
            </div>
            <span className="text-[13px] text-gray-600 leading-snug">
              I agree to the{" "}<a href="#" className="text-blue-600 hover:underline">Terms of Service</a>{" "}and{" "}<a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </span>
          </div>
          <ErrorMsg field="agreed" />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-medium text-[15px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition mb-5">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Create account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </>
          )}
        </button>

        <p className="text-center text-[13px] text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 font-medium hover:underline">Sign in</a>
        </p>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 sm:px-7 py-5 w-full max-w-[400px] mt-4">
        <p className="text-[13px] font-semibold text-gray-700 mb-3">What&apos;s included:</p>
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
          {["14-day free trial", "No credit card required", "AI-powered insights", "Cancel anytime"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#DCFCE7"/><path d="M7 12l3.5 3.5L17 8" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="text-[13px] text-gray-600">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
