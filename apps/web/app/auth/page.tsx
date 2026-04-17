"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "login" | "register";

type AuthFormState = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

export default function AuthPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<AuthMode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
          user?: {
            id: string;
            roles?: string[];
          } | null;
        };

        if (data.user?.id) {
          const roles = Array.isArray(data.user.roles) ? data.user.roles : [];
          router.replace(roles.includes("ADMIN") ? "/admin_overview_dashboard" : "/");
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
    setError(null);
    setMessage(null);
    if (mode === "login") {
      router.push("/auth?mode=register");
      return;
    }

    router.push("/auth");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (mode === "register" && !form.fullName.trim()) {
      setError("Full name is required for account creation.");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
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

      const payload = (await response.json()) as {
        error?: string;
        user?: {
          roles?: string[];
        };
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to authenticate. Please try again.");
        return;
      }

      setMessage(mode === "login" ? "Login successful. Redirecting..." : "Account created. Redirecting...");
      const roles = Array.isArray(payload.user?.roles) ? payload.user?.roles : [];
      router.push(roles.includes("ADMIN") ? "/admin_overview_dashboard" : "/");
    } catch {
      setError("Network issue while signing in. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -left-44 -top-44 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-black/5 blur-[100px]" />
      </div>

      <main className="flex items-center justify-center w-full max-w-6xl min-h-screen px-6 py-12 mx-auto lg:px-0">
        <div className="w-full max-w-[440px]">
          <header className="mb-12 text-center">
            <h1 className="mb-2 text-5xl font-black uppercase tracking-[-0.06em]">KINETIC</h1>
            <p className="text-sm text-neutral-500">
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
                      className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500"
                    >
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(event) => onInputChange("fullName", event.target.value)}
                      placeholder="Usman Kousar"
                      className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-4 text-sm text-[#1a1c1c] placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-0"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500"
                    >
                      Phone (Optional)
                    </label>
                    <input
                      id="phone"
                      type="text"
                      value={form.phone}
                      onChange={(event) => onInputChange("phone", event.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-4 text-sm text-[#1a1c1c] placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-0"
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => onInputChange("email", event.target.value)}
                  placeholder="name@kinetic.com"
                  className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-4 text-sm text-[#1a1c1c] placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-0"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => onInputChange("password", event.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-4 text-sm text-[#1a1c1c] placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {error ? <p className="text-xs font-bold tracking-wide text-red-600">{error}</p> : null}
            {message ? <p className="text-xs font-bold tracking-wide text-emerald-700">{message}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-black py-5 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800 active:scale-[0.98]"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMessage("Password reset flow can be added next.")}
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500 transition hover:text-black"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={toggleMode}
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 transition hover:underline"
              >
                {mode === "login" ? "Create Account" : "Back to Login"}
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4 my-10">
            <div className="flex-1 h-px bg-neutral-300/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Or Continue With
            </span>
            <div className="flex-1 h-px bg-neutral-300/60" />
          </div>

          <div className="space-y-3">
            <button onClick={() => router.push("/")} className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-300/70 py-4 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:bg-neutral-100 active:scale-[0.98]">
              <span className="text-base">G</span>
              <span>Google</span>
            </button>
            <button onClick={() => router.push("/")} className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-300/70 py-4 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:bg-neutral-100 active:scale-[0.98]">
              <span className="text-base"></span>
              <span>Apple</span>
            </button>
          </div>

          <footer className="mt-16 text-center">
            <p className="mx-auto max-w-[280px] text-[10px] leading-loose text-neutral-500">
              By continuing, you agree to our <span className="font-bold text-black underline">Terms of Service</span> and <span className="font-bold text-black underline">Privacy Policy</span>.
            </p>
          </footer>
        </div>
      </main>

      <aside className="fixed top-0 right-0 hidden w-1/3 h-full overflow-hidden pointer-events-none lg:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-l from-white via-transparent to-transparent" />
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLGFVnXIMmcw4x4Uf7eYTU5frePTneM24seipjrW5wgwHe-T6vCBilasl6-m3oo_pEq3oCrq047gG37VnJeagYmRF1zdUSBTyJrThDw-pulfl8wg_Pkiyhb0UkbgA2UvcLuGj5tXLeGe3viLwt-LVh8WLrC4WH6zF2NT9H_zAi_GlV7PzeLqrs0K6vlwHQvViwMLgP3mgLC-FLKcSdTcbF_apz6OeSltk6wMjDc1NrZXP9xHlw900QYw_clLm5Zwm8ahG3TmkzCdtn"
          alt="Editorial"
          className="object-cover w-full h-full grayscale opacity-10"
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
