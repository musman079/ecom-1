"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function KineticLuxuryFashionEcommercePage() {
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f9f9f9] text-[#1a1c1c] antialiased">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-48 -top-48 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-black/5 blur-[100px]" />
      </div>

      <main className="flex min-h-screen items-center justify-center bg-white px-6 lg:px-0">
        <div className="w-full max-w-[440px]">
          <header className="mb-12 text-center">
            <h1 className="mb-2 text-5xl font-black uppercase tracking-[-0.06em]">KINETIC</h1>
            <p className="text-sm text-neutral-500">Enter your credentials to access the editorial gallery.</p>
          </header>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/profile");
            }}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@kinetic.com"
                  className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-sm placeholder:text-neutral-400 focus:border-[#497cff] focus:outline-none focus:ring-0"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 ml-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-sm placeholder:text-neutral-400 focus:border-[#497cff] focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <button type="submit" className="w-full rounded-full bg-black py-5 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800 active:scale-[0.98]">
              Login
            </button>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => router.push("/auth")} className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500 transition hover:text-black">
                Forgot Password?
              </button>
              <button type="button" onClick={() => router.push("/auth?mode=register")} className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#497cff] transition hover:underline">
                Create Account
              </button>
            </div>
          </form>

          <div className="my-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#c6c6cd]/50" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Or Continue With</span>
            <div className="h-px flex-1 bg-[#c6c6cd]/50" />
          </div>

          <div className="space-y-3">
            <button onClick={() => router.push("/")} className="flex w-full items-center justify-center gap-3 rounded-full border border-[#c6c6cd]/60 py-4 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:bg-[#f3f3f4] active:scale-[0.98]">
              <span className="material-symbols-outlined text-lg">google</span>
              <span>Google</span>
            </button>
            <button onClick={() => router.push("/")} className="flex w-full items-center justify-center gap-3 rounded-full border border-[#c6c6cd]/60 py-4 text-[11px] font-bold uppercase tracking-[0.16em] transition hover:bg-[#f3f3f4] active:scale-[0.98]">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                ios
              </span>
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
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#111827] text-white">
          <div className="flex flex-col items-center">
            <h2 className="animate-pulse-soft text-6xl font-black uppercase tracking-[-0.06em]">KINETIC</h2>
            <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">Editorial Movement</p>
          </div>
          <div className="absolute bottom-16 flex flex-col items-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white" />
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
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .animate-pulse-soft {
          animation: pulse-soft 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
