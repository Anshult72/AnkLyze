"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login";
      router.replace(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F3] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Image src="/anklyze-logo.png" alt="ANKLYZE" width={150} height={50} className="w-36 h-auto object-contain" priority />
          <div className="flex items-center space-x-2 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin text-[#468189]" />
            <span className="text-sm font-medium">Verifying ANKLYZE secure session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Return null while redirect executes in useEffect
    return null;
  }

  // Check role authorization if role restrictions are specified
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#F8F8F3] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Your account role (<span className="font-semibold text-slate-800">{user.role}</span>) does not have authorization to access this evaluation module.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 font-mono">
            Required Permissions: {allowedRoles.join(" | ")}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Platform Home</span>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#062834] text-white text-xs sm:text-sm font-medium hover:bg-[#164650] transition-colors"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
