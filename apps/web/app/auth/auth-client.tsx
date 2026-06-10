"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { getSafeNextPath } from "../../src/lib/auth-redirect";
import { writeAuthStatusCache } from "../../src/hooks/use-auth-status";

type AuthMode = "login" | "register";

type AuthFormState = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

export function AuthClient() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<AuthMode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AuthFormState>({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => getSafeNextPath(searchParams.get("next")), [searchParams]);

  const resolveRedirect = useCallback((role: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN") => {
    const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    if (nextPath) {
      if (isAdmin && nextPath.startsWith("/admin")) return nextPath;
      if (!isAdmin && !nextPath.startsWith("/admin")) return nextPath;
    }
    return isAdmin ? "/admin_overview_dashboard" : CUSTOMER_ROUTES.HOME;
  }, [nextPath]);

  useEffect(() => {
    // Splash screen duration
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (!response.ok) return;

        const data = (await response.json()) as {
          success?: boolean;
          user?: { id: string; role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" } | null;
        };

        if (response.ok && data.success && data.user?.id) {
          const role = data.user.role ?? "CUSTOMER";
          router.replace(resolveRedirect(role));
        }
      } catch {
        // Ignore initial transient check issues
      }
    };
    void verifySession();
  }, [resolveRedirect, router]);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "register") {
      setMode("register");
      return;
    }
    setMode("login");
  }, [searchParams]);

  const onInputChange = (field: keyof AuthFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleMode = () => {
    if (mode === "login") {
      const nextQuery = nextPath ? `&next=${encodeURIComponent(nextPath)}` : "";
      router.push(`${CUSTOMER_ROUTES.AUTH}?mode=register${nextQuery}`);
      return;
    }
    const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    router.push(`${CUSTOMER_ROUTES.AUTH}${nextQuery}`);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Email and password are required.");
      return;
    }

    if (mode === "register" && !form.fullName.trim()) {
      toast.error("Full name is required for account creation.");
      return;
    }

    setSubmitting(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
          }),
        });

        const registerPayload = (await response.json()) as { message?: string };
        if (!response.ok) {
          toast.error(registerPayload.message ?? "Unable to create account. Please try again.");
          setSubmitting(false);
          return;
        }
      }

      const loginResult = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      });

      if (!loginResult || loginResult.error) {
        toast.error("Invalid email or password.");
        setSubmitting(false);
        return;
      }

      writeAuthStatusCache("authenticated");
      toast.success(mode === "login" ? "Welcome back to Usolstice." : "Account created successfully.");

      const meResponse = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!meResponse.ok) {
        router.push("/");
        return;
      }

      const mePayload = (await meResponse.json()) as {
        user?: { role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN" };
      };

      const role = mePayload.user?.role ?? "CUSTOMER";
      await router.replace(resolveRedirect(role));
    } catch {
      toast.error("Network issue while signing in. Please retry.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent opacity-50" />
            <motion.div
              initial={{ opacity: 0, filter: "blur(12px)", scale: 0.9 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <h2 className="font-heading text-5xl md:text-7xl lg:text-8xl text-white tracking-widest uppercase relative">
                USOLSTICE
                <motion.span 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
                  className="absolute -bottom-4 left-0 h-px bg-gradient-to-r from-transparent via-[#C8A96E]/50 to-transparent"
                />
              </h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="mt-8 font-sans text-[10px] md:text-xs tracking-[0.4em] uppercase text-white/40"
              >
                The Editorial Collection
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen w-full bg-[#050505] flex">
        {/* Left Side: Editorial Image Container */}
        <div className="hidden lg:flex relative w-[55%] flex-col justify-end p-16 overflow-hidden">
          <div className="absolute inset-0 bg-[#050505]">
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2500&auto=format&fit=crop" 
              alt="Fashion Editorial" 
              className="w-full h-full object-cover opacity-40 mix-blend-luminosity hover:scale-105 transition-transform duration-10000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#050505]" />
          </div>
          
          <div className="relative z-10 max-w-lg">
            <h1 className="font-heading text-5xl text-white mb-6">Redefining Modern Elegance.</h1>
            <p className="font-sans text-sm text-white/50 leading-relaxed mb-8">
              Experience a highly curated collection of garments designed for the contemporary aesthete. Seamlessly blending architectural forms with timeless luxury.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[#C8A96E]" />
              <span className="font-sans text-[10px] tracking-widest uppercase text-[#C8A96E]">Est. 2024</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form Container */}
        <div className="relative w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 lg:p-16">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#C8A96E]/5 blur-[120px]" />
          </div>

          <div className="w-full max-w-sm relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: showSplash ? 2.6 : 0 }}
            >
              <Link href="/" className="lg:hidden inline-block mb-12">
                <h2 className="font-heading text-3xl text-white tracking-widest uppercase">
                  USOLSTICE
                </h2>
              </Link>

              <div className="mb-10">
                <h2 className="font-heading text-3xl text-white mb-2">
                  {mode === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="font-sans text-xs text-white/40 tracking-wide">
                  {mode === "login" ? "Enter your details to access your portal." : "Join the movement. Enter your details below."}
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <AnimatePresence mode="popLayout">
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="relative">
                        <input
                          id="fullName"
                          type="text"
                          value={form.fullName}
                          onChange={(e) => onInputChange("fullName", e.target.value)}
                          placeholder=" "
                          className="peer w-full bg-transparent border-b border-white/10 px-0 py-3 text-sm text-white focus:border-[#C8A96E] focus:outline-none transition-colors"
                        />
                        <label htmlFor="fullName" className="absolute left-0 top-3 text-sm text-white/40 transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-[#C8A96E] peer-focus:uppercase peer-focus:tracking-widest peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-white/60 peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-widest">
                          Full Name
                        </label>
                      </div>

                      <div className="relative">
                        <input
                          id="phone"
                          type="text"
                          value={form.phone}
                          onChange={(e) => onInputChange("phone", e.target.value)}
                          placeholder=" "
                          className="peer w-full bg-transparent border-b border-white/10 px-0 py-3 text-sm text-white focus:border-[#C8A96E] focus:outline-none transition-colors"
                        />
                        <label htmlFor="phone" className="absolute left-0 top-3 text-sm text-white/40 transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-[#C8A96E] peer-focus:uppercase peer-focus:tracking-widest peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-white/60 peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-widest">
                          Phone (Optional)
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => onInputChange("email", e.target.value)}
                    placeholder=" "
                    className="peer w-full bg-transparent border-b border-white/10 px-0 py-3 text-sm text-white focus:border-[#C8A96E] focus:outline-none transition-colors"
                  />
                  <label htmlFor="email" className="absolute left-0 top-3 text-sm text-white/40 transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-[#C8A96E] peer-focus:uppercase peer-focus:tracking-widest peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-white/60 peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-widest">
                    Email Address
                  </label>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => onInputChange("password", e.target.value)}
                    placeholder=" "
                    className="peer w-full bg-transparent border-b border-white/10 px-0 py-3 text-sm text-white focus:border-[#C8A96E] focus:outline-none transition-colors"
                  />
                  <label htmlFor="password" className="absolute left-0 top-3 text-sm text-white/40 transition-all peer-focus:-top-3 peer-focus:text-[10px] peer-focus:text-[#C8A96E] peer-focus:uppercase peer-focus:tracking-widest peer-not-placeholder-shown:-top-3 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:text-white/60 peer-not-placeholder-shown:uppercase peer-not-placeholder-shown:tracking-widest">
                    Password
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 bg-[#C8A96E] text-[#050505] hover:bg-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-[#050505]/20 border-t-[#050505] rounded-full animate-spin" />
                  ) : mode === "login" ? "Sign In" : "Register"}
                </button>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => toast.message("Password reset unavailable.")}
                    className="text-[10px] font-sans font-medium uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                  >
                    Forgot Password?
                  </button>
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[10px] font-sans font-medium uppercase tracking-widest text-[#C8A96E] hover:text-white transition-colors"
                  >
                    {mode === "login" ? "Create an account" : "Back to login"}
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-4 my-10 opacity-30">
                <div className="flex-1 h-px bg-white" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white">
                  Or
                </span>
                <div className="flex-1 h-px bg-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => void signIn("google", { callbackUrl: "/" })}
                  className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 bg-transparent py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-white/[0.02]"
                >
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => void signIn("github", { callbackUrl: "/" })}
                  className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/30 bg-transparent py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-white/[0.02]"
                >
                  GitHub
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
