"use client";

type LoginRequiredPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export default function LoginRequiredPopup({ isOpen, onClose, onLogin }: LoginRequiredPopupProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/25 bg-[linear-gradient(140deg,#111827_0%,#1f2937_35%,#0f172a_100%)] text-white shadow-[0_35px_120px_-45px_rgba(15,23,42,0.9)]">
        <div className="border-b border-white/10 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-300">Secure Access</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight">Login Required</h3>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-6 text-zinc-200">
            Add to cart use karne ke liye pehle account me sign in karein. Login ke baad aap isi product se checkout continue kar sakte hain.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/25 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-zinc-100 transition hover:bg-white/10"
            >
              Maybe Later
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="rounded-xl bg-[linear-gradient(120deg,#f59e0b_0%,#f97316_100%)] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#111827] shadow-[0_12px_30px_-16px_rgba(251,146,60,0.9)] transition hover:brightness-105"
            >
              Go To Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
