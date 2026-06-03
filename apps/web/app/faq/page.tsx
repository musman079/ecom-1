"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "../../src/components/motion/fade-in";
import { SiteFooter } from "../../src/components/site-footer";

const faqSections = [
  {
    title: "Shipping & Delivery",
    icon: "local_shipping",
    items: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 5–7 business days. Express shipping takes 2–3 business days. Orders placed before 2pm EST ship same day.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes! We ship to over 50 countries worldwide. International shipping typically takes 7–14 business days depending on your location.",
      },
      {
        q: "Is shipping free?",
        a: "We offer free standard shipping on all orders over $100. Orders under $100 have a flat rate of $9.99 for standard shipping.",
      },
      {
        q: "Can I track my order?",
        a: "Absolutely. Once your order ships, you'll receive a tracking number via email. You can also track your order from the Order Tracking page in your account.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    icon: "assignment_return",
    items: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 30 days of delivery. Items must be unused, unworn, and in their original packaging with all tags attached.",
      },
      {
        q: "How do I initiate a return?",
        a: "Go to your Order History, select the order, and click 'Request Return'. You'll receive a prepaid shipping label via email within 24 hours.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5–7 business days after we receive your returned item. The refund will be credited to your original payment method.",
      },
      {
        q: "Can I exchange an item for a different size?",
        a: "Yes! During the return process, select 'Exchange' and choose your preferred size. We'll ship the new item as soon as we receive your return.",
      },
    ],
  },
  {
    title: "Payment & Security",
    icon: "shield",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, MasterCard, American Express), debit cards, bank transfers, and cash on delivery (select regions).",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. All transactions are encrypted with industry-standard SSL/TLS. We never store your full card details on our servers.",
      },
      {
        q: "Can I use a coupon code?",
        a: "Yes! Enter your coupon code at checkout in the 'Apply Coupon' field. Discounts are applied to eligible items before taxes and shipping.",
      },
    ],
  },
  {
    title: "Account & Orders",
    icon: "person",
    items: [
      {
        q: "How do I create an account?",
        a: "Click the 'Sign Up' button on the login page. You'll need an email address and a password. It takes less than 30 seconds!",
      },
      {
        q: "Can I change or cancel my order?",
        a: "Orders can be modified or cancelled within 1 hour of placement. After that, the order enters processing and cannot be changed. Contact us for urgent requests.",
      },
      {
        q: "How do I update my account details?",
        a: "Go to your Profile page to update your name, email, phone number, shipping addresses, and notification preferences.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/8 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left transition hover:text-[#65f3de]"
      >
        <span className="text-sm font-semibold leading-6 text-white">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="material-symbols-outlined shrink-0 text-lg text-white/40"
        >
          expand_more
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-7 text-white/55">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="min-h-screen bg-[#070d17] text-[#eaf2ff]">
      <main className="mx-auto w-full max-w-[1400px] px-6 py-16 xl:px-12">
        <FadeIn>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#65f3de]">Help Center</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
            Find quick answers to common questions about orders, shipping, returns, and more.
          </p>
        </FadeIn>

        {/* Category Tabs */}
        <FadeIn className="mt-12">
          <div className="flex flex-wrap gap-3">
            {faqSections.map((section, idx) => (
              <button
                key={section.title}
                onClick={() => setActiveSection(idx)}
                className={`flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition ${
                  activeSection === idx
                    ? "border-[#65f3de]/40 bg-[#65f3de]/10 text-[#65f3de]"
                    : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-base">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* FAQ Content */}
        <FadeIn className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-2 backdrop-blur-sm sm:px-10"
            >
              {faqSections[activeSection]!.items.map((item) => (
                <FAQItem key={item.q} q={item.q} a={item.a} />
              ))}
            </motion.div>
          </AnimatePresence>
        </FadeIn>

        {/* CTA */}
        <FadeIn className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-[#65f3de]/5 to-[#4f8cff]/5 p-10 text-center backdrop-blur-sm">
          <span className="material-symbols-outlined text-4xl text-white/20">support_agent</span>
          <h3 className="mt-4 text-xl font-bold">Still have questions?</h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <motion.a
            href="/contact"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="mt-6 inline-block rounded-full bg-[#65f3de] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-[#081224] transition hover:bg-white"
          >
            Contact Support
          </motion.a>
        </FadeIn>
      </main>
      <SiteFooter />
    </div>
  );
}
