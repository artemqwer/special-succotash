"use client";

import { useState } from "react";
import DataRocksLogo from "@/components/DataRocksLogo";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

type Errors = { email?: string; password?: string; agreed?: string };

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
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (fields = { email, password, agreed }): Errors => {
    const e: Errors = {};
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, agreed: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      // submit
    }
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e8ecf5] px-4 py-10">
      <DataRocksLogo />

      <h1 className="text-[20px] font-semibold text-gray-900 mb-1">Create your account</h1>
      <p className="text-[14px] text-gray-500 mb-6 text-center">
        Transform data chaos into confident growth decisions
      </p>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-[400px]">
        {/* Email */}
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
            placeholder="Email address *"
            className={fieldClass("email", "px-4")}
          />
          <ErrorMsg field="email" />
        </div>

        {/* Password */}
        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password")}
              placeholder="Password *"
              className={fieldClass("password", "px-4 pr-10")}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
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
              onClick={() => { setAgreed(!agreed); setTouched((t) => ({ ...t, agreed: true })); setErrors(validate({ email, password, agreed: !agreed })); }}
              className={`mt-[2px] w-4 h-4 shrink-0 border rounded flex items-center justify-center cursor-pointer transition ${
                touched.agreed && errors.agreed
                  ? "border-red-400 bg-red-50"
                  : agreed
                  ? "bg-blue-600 border-blue-600"
                  : "border-gray-300 bg-white"
              }`}>
              {agreed && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-[13px] text-gray-600 leading-snug">
              I agree to the{" "}
              <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </span>
          </div>
          <ErrorMsg field="agreed" />
        </div>

        <button type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-[15px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition mb-5">
          Create account
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[13px] text-gray-400">Or sign up with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button type="button"
          className="w-full border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium text-[14px] py-2.5 rounded-lg flex items-center justify-center gap-2.5 transition mb-5">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        <p className="text-center text-[13px] text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 font-medium hover:underline">Sign in</a>
        </p>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-7 py-5 w-full max-w-[400px] mt-4">
        <p className="text-[13px] font-semibold text-gray-700 mb-3">What&apos;s included:</p>
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
          {["14-day free trial", "No credit card required", "AI-powered insights", "Cancel anytime"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#DCFCE7" />
                <path d="M7 12l3.5 3.5L17 8" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[13px] text-gray-600">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
