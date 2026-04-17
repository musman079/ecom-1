import Link from "next/link";

export default function ReturnsRefundsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black uppercase tracking-tight">Returns & Refunds</h1>
      <p className="mt-4 text-sm text-zinc-600">
        Start return requests and track refund status from this page. Detailed workflow can be added next.
      </p>
      <Link href="/profile" className="mt-8 inline-block rounded-full border border-zinc-300 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em]">
        Go to Profile
      </Link>
    </main>
  );
}
