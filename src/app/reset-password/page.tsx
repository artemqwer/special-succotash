"use client";

import { useState, useEffect, useRef } from "react";
import DataRocksLogo from "@/components/DataRocksLogo";

const RESEND_TIMEOUT = 60;

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function ResetPasswordPage() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const startTimer = () => {
    setCanResend(false);
    setCountdown(RESEND_TIMEOUT);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (step === "code") startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    if (!isValidEmail(value)) return "Enter a valid email address";
    return "";
  };

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;
    setStep("code");
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    pasted.split("").forEach((char, i) => { newCode[i] = char; });
    setCode(newCode);
    const nextEmpty = newCode.findIndex((v) => !v);
    inputsRef.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const handleResend = () => {
    if (!canResend) return;
    setCode(["", "", "", "", "", ""]);
    inputsRef.current[0]?.focus();
    startTimer();
  };

  const formatTime = (s: number) => `0:${s.toString().padStart(2, "0")}`;

  const isCodeComplete = code.every((d) => d !== "");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#e8ecf5] px-4">
      <DataRocksLogo />

      {step === "email" ? (
        <>
          <h1 className="text-[20px] font-semibold text-gray-900 mb-1">Reset your password</h1>
          <p className="text-[14px] text-gray-500 mb-6 text-center">
            Enter your email and we&apos;ll send you a reset code
          </p>

          <form onSubmit={handleSendCode} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-[400px]">
            <div className="mb-5">
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m2 7 10 7 10-7" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (emailTouched) setEmailError(validateEmail(e.target.value)); }}
                  onBlur={() => { setEmailTouched(true); setEmailError(validateEmail(email)); }}
                  placeholder="john@company.com"
                  className={`w-full pl-9 pr-4 py-2.5 text-[14px] border rounded-lg outline-none transition text-gray-700 placeholder-gray-400 ${
                    emailTouched && emailError
                      ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
                />
              </div>
              {emailTouched && emailError && (
                <p className="mt-1.5 text-[12px] text-red-500 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {emailError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-[15px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition mb-5"
            >
              Send reset code
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-center text-[13px] text-gray-500">
              Remembered your password?{" "}
              <a href="/login" className="text-blue-600 font-medium hover:underline">
                Sign in
              </a>
            </p>
          </form>
        </>
      ) : (
        <>
          <h1 className="text-[20px] font-semibold text-gray-900 mb-1">Check your email</h1>
          <p className="text-[14px] text-gray-500 mb-1 text-center">
            We sent a 6-digit code to
          </p>
          <p className="text-[14px] font-medium text-gray-800 mb-6">{email}</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-[400px]">
            {/* Code inputs */}
            <div className="flex gap-2.5 justify-center mb-5" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  className={`w-[48px] h-[52px] text-center text-[20px] font-semibold border rounded-xl outline-none transition
                    ${digit ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700"}
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
                />
              ))}
            </div>

            {/* Resend row */}
            <div className="flex items-center justify-between mb-5 px-1">
              <span className="text-[13px] text-gray-500">Didn&apos;t receive the code?</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleResend}
                  disabled={!canResend}
                  className={`text-[13px] font-medium transition ${
                    canResend
                      ? "text-blue-600 hover:underline cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Resend
                </button>
                {!canResend && (
                  <span className="text-[13px] text-gray-400 tabular-nums">
                    ({formatTime(countdown)})
                  </span>
                )}
              </div>
            </div>

            {/* Confirm button */}
            <button
              disabled={!isCodeComplete}
              className={`w-full font-medium text-[15px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition mb-5 ${
                isCodeComplete
                  ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Confirm code
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>

            <p className="text-center text-[13px] text-gray-500">
              Wrong email?{" "}
              <button
                onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); }}
                className="text-blue-600 font-medium hover:underline"
              >
                Change it
              </button>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
