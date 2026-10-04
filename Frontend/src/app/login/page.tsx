"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./LoginPage.module.css";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Loader2, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/examiner/dashboard";

  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Auto redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = "Please enter your official institutional email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Please enter a valid email address format";
    }

    if (!password) {
      errors.password = "Please enter your account password";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        router.push(redirectUrl);
      } else {
        setErrorMessage(result.error || "Invalid credentials. Please verify your credentials and try again.");
      }
    } catch {
      setErrorMessage("An unexpected authentication error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill helper for development & evaluator convenience
  const fillDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("AnklyzeDemo#2026");
    setFieldErrors({});
    setErrorMessage(null);
  };

  return (
    <div className={styles.formWrap}>
      {/* CARD CONTAINER */}
      <div className={styles.formCard}>
        
        {/* HEADER */}
        <div className={styles.formHead}>
          <Link href="/" aria-label="ANKLYZE home"><Image src="/anklyze-logo.png" alt="ANKLYZE" width={160} height={52} className={styles.logo} priority /></Link>
          <span className={styles.eyebrow}>Examiner access / 01</span>
          <h1>Welcome back to the desk.</h1>
          <p>Sign in to review the work behind every answer.</p>
        </div>

        {/* ERROR BANNER */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50/90 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Institutional Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                disabled={isLoading}
                placeholder="examiner@anklyze.demo"
                className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.email
                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-[#468189]/20 focus:border-[#468189]"
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Security Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                disabled={isLoading}
                placeholder="••••••••••••"
                className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  fieldErrors.password
                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-[#468189]/20 focus:border-[#468189]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 font-medium pl-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submit}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo roles quick fill for evaluators and demonstration */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#468189]" />
              Explore demo roles
            </span>
            <span className="text-[10px] text-slate-400">Click to fill</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemoCredentials("examiner@anklyze.demo")}
              className="min-h-12 p-2.5 text-center rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-[#eaf2ee] hover:border-[#b9d7d0] transition-colors group"
            >
              <div className="font-semibold text-slate-800 group-hover:text-[#276871]">Examiner</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoCredentials("head.examiner@anklyze.demo")}
              className="min-h-12 p-2.5 text-center rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-[#eaf2ee] hover:border-[#b9d7d0] transition-colors group"
            >
              <div className="font-semibold text-slate-800 group-hover:text-[#276871]">Head Examiner</div>
            </button>

            <button
              type="button"
              onClick={() => fillDemoCredentials("superadmin@anklyze.demo")}
              className="min-h-12 p-2.5 text-center rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-[#eaf2ee] hover:border-[#b9d7d0] transition-colors group"
            >
              <div className="font-semibold text-slate-800 group-hover:text-[#276871]">Admin</div>
            </button>
          </div>
        </div>

        {/* SECURITY FOOTER */}
        <div className="mt-6 pt-4 text-center border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Access to evaluation work is role based.</span>
        </div>
      </div>

      {/* BACK TO SITE LINK */}
      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          ← Return to ANKLYZE Platform Home
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <aside className={styles.story}>
        <div className={styles.storyTop}><span className={styles.signal} /> ANKLYZE / EDUCATOR WORKSPACE</div>
        <div className={styles.storyBody}>
          <span className={styles.chapter}>A CLEARER WAY TO EVALUATE</span>
          <h2>Give every answer<br /><em>the attention</em><br />it deserves.</h2>
          <p>The sheet stays in view. The evidence stays connected. The educator keeps the final say.</p>
          <div className={styles.paper}>
            <span>Q. 03 (B) / PHYSICS</span>
            <strong>Show your working.</strong>
            <i>F = m × a = 6 N</i>
            <small>OBSERVATION → REASONING → REVIEW</small>
          </div>
        </div>
        <div className={styles.storyFoot}>FROM PAPER TO PRACTICE <span>↗</span></div>
      </aside>
      <div className={styles.formSide}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#468189]" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      </div>
    </main>
  );
}
