"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          success?: boolean;
          user?: {
            id: string;
            role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
          } | null;
        };

        if (response.ok && data.success && data.user?.id) {
          const role = data.user.role ?? "CUSTOMER";
          router.replace(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin_overview_dashboard" : "/");
        }
      } catch {
        // Ignore transient session check issues on initial load.
      }
    };

    void verifySession();
  }, [router]);

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    if (requestedMode === "register") {
      setMode("register");
      return;
    }

    setMode("login");
  }, [searchParams]);

  const onInputChange = (field: keyof AuthFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleMode = () => {
    if (mode === "login") {
      router.push("/auth?mode=register");
      return;
    }

    router.push("/auth");
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
          }),
        });

        const registerPayload = (await response.json()) as {
          message?: string;
        };

        if (!response.ok) {
          toast.error(registerPayload.message ?? "Unable to create account. Please try again.");
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
        return;
      }

      toast.success(mode === "login" ? "Login successful. Redirecting..." : "Account created. Redirecting...");

      const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
      if (!meResponse.ok) {
        router.push("/");
        return;
      }

      const mePayload = (await meResponse.json()) as {
        user?: {
          role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
        };
      };

      const role = mePayload.user?.role ?? "CUSTOMER";
      router.push(role === "ADMIN" || role === "SUPER_ADMIN" ? "/admin_overview_dashboard" : "/");
    } catch {
      toast.error("Network issue while signing in. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070d17] text-[#eaf2ff]">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -left-44 -top-44 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-black/5 blur-[100px]" />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12 lg:px-0">
        <div className="w-full max-w-[440px] rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl sm:p-8">
          <header className="mb-12 text-center">
            <h1 className="mb-2 text-5xl font-black uppercase tracking-[-0.06em] text-white">KINETIC</h1>
            <p className="text-sm text-white/65">
              {mode === "login"
                ? "Enter your credentials to access the editorial gallery."
                : "Create your account to start shopping the collection."}
            </p>
          </header>

          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-4">
              {mode === "register" ? (
                <>
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(event) => onInputChange("fullName", event.target.value)}
                      placeholder="Usman Kousar"
                      className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-4 text-sm text-white placeholder:text-white/40 focus:border-[#65f3de] focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60"
                    >
                      Phone (Optional)
                    </label>
                    <input
                      id="phone"
                      type="text"
                      value={form.phone}
                      onChange={(event) => onInputChange("phone", event.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-4 text-sm text-white placeholder:text-white/40 focus:border-[#65f3de] focus:outline-none focus:ring-0"
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => onInputChange("email", event.target.value)}
                  placeholder="name@kinetic.com"
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-4 text-sm text-white placeholder:text-white/40 focus:border-[#65f3de] focus:outline-none focus:ring-0"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => onInputChange("password", event.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b border-white/20 bg-transparent px-0 py-4 text-sm text-white placeholder:text-white/40 focus:border-[#65f3de] focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-gradient-to-br from-[#65f3de] via-[#4f8cff] to-[#3f7dff] py-5 text-xs font-bold uppercase tracking-[0.2em] text-[#081224] transition hover:brightness-110 active:scale-[0.98]"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => toast.message("Password reset flow can be added next.")}
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60 transition hover:text-white"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={toggleMode}
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#65f3de] transition hover:underline"
              >
                {mode === "login" ? "Create Account" : "Back to Login"}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4 my-10">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
              Or Continue With
            </span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                void signIn("google", { callbackUrl: "/" });
              }}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/[0.04] py-4 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:bg-white/[0.08] active:scale-[0.98]"
            >
              <span className="text-base">G</span>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                void signIn("github", { callbackUrl: "/" });
              }}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/[0.04] py-4 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:bg-white/[0.08] active:scale-[0.98]"
            >
              <span className="text-base">GH</span>
              <span>GitHub</span>
            </button>
          </div>

          <footer className="mt-16 text-center">
            <p className="mx-auto max-w-[280px] text-[10px] leading-loose text-white/55">
              By continuing, you agree to our <span className="font-bold text-white underline">Terms of Service</span> and <span className="font-bold text-white underline">Privacy Policy</span>.
            </p>
          </footer>
        </div>
      </main>

      <aside className="fixed top-0 right-0 hidden w-1/3 h-full overflow-hidden pointer-events-none lg:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-l from-[#070d17] via-transparent to-transparent" />
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLGFVnXIMmcw4x4Uf7eYTU5frePTneM24seipjrW5wgwHe-T6vCBilasl6-m3oo_pEq3oCrq047gG37VnJeagYmRF1zdUSBTyJrThDw-pulfl8wg_Pkiyhb0UkbgA2UvcLuGj5tXLeGe3viLwt-LVh8WLrC4WH6zF2NT9H_zAi_GlV7PzeLqrs0K6vlwHQvViwMLgP3mgLC-FLKcSdTcbF_apz6OeSltk6wMjDc1NrZXP9xHlw900QYw_clLm5Zwm8ahG3TmkzCdtn"
          alt="Editorial"
          className="object-cover w-full h-full grayscale opacity-20"
        />
        <div className="absolute z-20 origin-bottom-right rotate-90 translate-x-full bottom-24 right-12">
          <span className="select-none whitespace-nowrap text-[80px] font-black uppercase leading-none tracking-[-0.05em] text-neutral-300/30">
            KINETIC 2024 COLLECTION
          </span>
        </div>
      </aside>

      {showSplash ? (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b1638] text-white">
          <div className="flex flex-col items-center">
            <h2 className="animate-pulse-soft text-7xl font-black uppercase tracking-[-0.06em]">KINETIC</h2>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
              Editorial Movement
            </p>
          </div>

          <div className="absolute flex flex-col items-center bottom-16">
            <div className="w-8 h-8 border-2 rounded-full animate-spin border-white/15 border-t-white" />
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes pulse-soft {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.82;
            transform: scale(1.04);
          }
        }

        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
