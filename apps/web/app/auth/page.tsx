"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, []);

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
      const body = isRegisterMode ? { fullName, email, password } : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Authentication failed.");
      }

      router.push("/profile");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f9f9f9] text-[#1a1c1c]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-44 -top-44 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-black/5 blur-[100px]" />
      </div>

      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12 lg:px-0">
        <div className="w-full max-w-[440px]">
          <header className="mb-12 text-center">
            <h1 className="mb-2 text-5xl font-black uppercase tracking-[-0.06em]">KINETIC</h1>
            <p className="text-sm text-neutral-500">
              {isRegisterMode ? "Create your account to start shopping." : "Enter your credentials to access the editorial gallery."}
            </p>
          </header>

          <form
            className="space-y-6"
            onSubmit={submitAuth}
          >
            <div className="space-y-4">
              {isRegisterMode ? (
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
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Marcus Sterling"
                    className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-4 text-sm text-[#1a1c1c] placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-0"
                  />
                </div>
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
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-4 text-sm text-[#1a1c1c] placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-black py-5 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800 active:scale-[0.98]"
            >
              {loading ? "Please wait" : isRegisterMode ? "Create Account" : "Login"}
            </button>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setError(null);
                }}
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500 transition hover:text-black"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode((current) => !current);
                  setError(null);
                }}
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 transition hover:underline"
              >
                {isRegisterMode ? "Back to Login" : "Create Account"}
              </button>
            </div>
          </form>

          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-neutral-300/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Or Continue With
            </span>
            <div className="h-px flex-1 bg-neutral-300/60" />
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

      <aside className="pointer-events-none fixed right-0 top-0 hidden h-full w-1/3 overflow-hidden lg:block">
        <div className="absolute inset-0 z-10 bg-gradient-to-l from-white via-transparent to-transparent" />
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLGFVnXIMmcw4x4Uf7eYTU5frePTneM24seipjrW5wgwHe-T6vCBilasl6-m3oo_pEq3oCrq047gG37VnJeagYmRF1zdUSBTyJrThDw-pulfl8wg_Pkiyhb0UkbgA2UvcLuGj5tXLeGe3viLwt-LVh8WLrC4WH6zF2NT9H_zAi_GlV7PzeLqrs0K6vlwHQvViwMLgP3mgLC-FLKcSdTcbF_apz6OeSltk6wMjDc1NrZXP9xHlw900QYw_clLm5Zwm8ahG3TmkzCdtn"
          alt="Editorial"
          className="h-full w-full object-cover grayscale opacity-10"
        />
        <div className="absolute bottom-24 right-12 z-20 origin-bottom-right translate-x-full rotate-90">
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

          <div className="absolute bottom-16 flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white" />
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
