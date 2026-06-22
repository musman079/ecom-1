"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../../src/constants/routes";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Failed to reset password.");
      } else {
        setSuccess(true);
        toast.success("Password has been successfully reset.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center p-8 border border-white/10 bg-white/5 rounded-sm">
        <p className="text-white/60 font-medium text-sm mb-6">
          The password reset link is invalid or missing. Please request a new one.
        </p>
        <Link
          href="/auth/forgot-password"
          className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#C8A96E] hover:text-white transition-colors"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center p-8 border border-[#C8A96E]/30 bg-[#C8A96E]/5 rounded-sm">
        <p className="text-[#C8A96E] font-medium text-sm mb-6">
          Your password has been reset successfully. You can now login with your new password.
        </p>
        <button
          onClick={() => router.push(CUSTOMER_ROUTES.AUTH)}
          className="w-full bg-[#C8A96E] text-[#050505] hover:bg-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="relative">
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder=" "
          className="peer w-full bg-transparent border-b border-white/10 px-0 py-3 text-sm text-white focus:border-[#C8A96E] focus:outline-none transition-colors"
        />
        <label htmlFor="password" className="absolute left-0 top-3 text-sm text-white/40 transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-[#C8A96E] peer-focus:uppercase peer-focus:tracking-widest peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-white/60 peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-widest">
          New Password
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full mt-4 bg-[#C8A96E] text-[#050505] hover:bg-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <span className="w-4 h-4 border-2 border-[#050505]/20 border-t-[#050505] rounded-full animate-spin" />
        ) : (
          "Reset Password"
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl text-white mb-2">Create New Password</h2>
            <p className="font-sans text-xs text-white/40 tracking-wide">
              Please enter your new password below.
            </p>
          </div>

          <Suspense fallback={<div className="text-white/40 text-center">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
          
        </motion.div>
      </div>
    </main>
  );
}
