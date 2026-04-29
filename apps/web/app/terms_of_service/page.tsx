import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#0b1220] px-6 py-16 text-white sm:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">Legal</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
          These terms apply to your use of the Kinetic storefront, checkout flow, and account features.
          By using the site, you agree to provide accurate information and follow the rules below.
        </p>

        <section className="mt-8 space-y-5 text-sm leading-7 text-white/72">
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#65f3de]">Orders & Accounts</h2>
            <p className="mt-2">You may place orders only with valid contact and shipping details. We may suspend accounts that abuse checkout, spam the platform, or attempt unauthorized access.</p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#65f3de]">Pricing & Availability</h2>
            <p className="mt-2">Prices, stock, and product availability can change without notice. We may cancel or adjust an order if pricing or inventory data is clearly incorrect.</p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#65f3de]">Payments</h2>
            <p className="mt-2">Orders placed through checkout are recorded with the payment method selected at the time of purchase. If online card processing is unavailable in your environment, orders may still be accepted and marked for manual confirmation.</p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#65f3de]">Returns</h2>
            <p className="mt-2">Return eligibility depends on order status and product condition. Use the Returns & Refunds page for the current flow and any return request rules.</p>
          </div>
        </section>

        <Link href="/" className="mt-10 inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.08]">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
