import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0b1220] px-6 py-16 text-white sm:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">Privacy</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
          We collect only the information needed to run the storefront, process orders, and support your account.
          This page explains how we use and protect that data.
        </p>

        <section className="mt-8 space-y-5 text-sm leading-7 text-white/72">
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#65f3de]">Information We Collect</h2>
            <p className="mt-2">We may store your name, email, phone number, shipping details, account preferences, order history, and support messages. We also keep product browsing and cart state necessary for checkout.</p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#65f3de]">How We Use It</h2>
            <p className="mt-2">Data is used to authenticate you, process purchases, track orders, manage returns, and improve the storefront experience. We do not sell your personal data.</p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#65f3de]">Sharing</h2>
            <p className="mt-2">We only share data with systems required to run the app, such as authentication, order storage, and payment or shipping integrations if they are enabled later.</p>
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#65f3de]">Your Choices</h2>
            <p className="mt-2">You can update profile details, control notification settings, and request order support through the account pages already built into the app.</p>
          </div>
        </section>

        <Link href="/" className="mt-10 inline-flex rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.08]">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
