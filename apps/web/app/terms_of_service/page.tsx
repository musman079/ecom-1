import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black uppercase tracking-tight">Terms of Service</h1>
      <p className="mt-4 text-sm text-zinc-600">
        This is a basic placeholder terms page. Replace this content with your legal terms.
      </p>
      <Link href="/" className="mt-8 inline-block rounded-full border border-zinc-300 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em]">
        Back to Home
      </Link>
    </main>
  );
}
