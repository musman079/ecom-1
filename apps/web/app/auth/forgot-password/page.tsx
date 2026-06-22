"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CUSTOMER_ROUTES } from "../../../src/constants/routes";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Failed to process request.");
      } else {
        setSuccess(true);
        toast.success("Password reset instructions sent.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-md relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl text-white mb-2">Reset Password</h2>
            <p className="font-sans text-xs text-white/40 tracking-wide">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {success ? (
            <div className="text-center p-8 border border-[#C8A96E]/30 bg-[#C8A96E]/5 rounded-sm">
              <p className="text-[#C8A96E] font-medium text-sm mb-6">
                Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
              </p>
              <Link
                href={CUSTOMER_ROUTES.AUTH}
                className="text-[10px] font-sans font-bold uppercase tracking-widest text-white hover:text-[#C8A96E] transition-colors"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  className="peer w-full bg-transparent border-b border-white/10 px-0 py-3 text-sm text-white focus:border-[#C8A96E] focus:outline-none transition-colors"
                />
                <label htmlFor="email" className="absolute left-0 top-3 text-sm text-white/40 transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-[#C8A96E] peer-focus:uppercase peer-focus:tracking-widest peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-white/60 peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-widest">
                  Email Address
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
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center pt-4">
                <Link
                  href={CUSTOMER_ROUTES.AUTH}
                  className="text-[10px] font-sans font-medium uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
