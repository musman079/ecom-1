"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { FadeIn } from "../../src/components/motion/fade-in";
import { SiteFooter } from "../../src/components/site-footer";

const contactMethods = [
  {
    icon: "mail",
    title: "Email Us",
    detail: "support@usolstice.store",
    sub: "We reply within 24 hours",
  },
  {
    icon: "call",
    title: "Call Us",
    detail: "+1 (800) 555-USOL",
    sub: "Mon–Fri, 9am–6pm EST",
  },
  {
    icon: "chat_bubble",
    title: "Live Chat",
    detail: "Available on site",
    sub: "Instant replies during business hours",
  },
];

export default function ContactPage() {
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    toast.success("Message sent!", { description: "We'll get back to you within 24 hours." });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#eaf2ff]">
      <main className="mx-auto w-full max-w-[1400px] px-6 py-16 xl:px-12">
        <FadeIn>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">Get in Touch</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Contact Us</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
            Have a question, feedback, or just want to say hello? We&apos;d love to hear from you.
          </p>
        </FadeIn>

        <div className="mt-16 grid gap-16 lg:grid-cols-2">
          {/* Contact Form */}
          <FadeIn>
            <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm sm:p-10">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:border-[#dfb257]/50 focus:outline-none focus:ring-1 focus:ring-[#dfb257]/20"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:border-[#dfb257]/50 focus:outline-none focus:ring-1 focus:ring-[#dfb257]/20"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Subject
                </label>
                <select
                  id="contact-subject"
                  name="subject"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white focus:border-[#dfb257]/50 focus:outline-none focus:ring-1 focus:ring-[#dfb257]/20"
                >
                  <option value="" className="bg-[#171412]">Select a topic</option>
                  <option value="order" className="bg-[#171412]">Order Inquiry</option>
                  <option value="return" className="bg-[#171412]">Return / Refund</option>
                  <option value="product" className="bg-[#171412]">Product Question</option>
                  <option value="feedback" className="bg-[#171412]">Feedback</option>
                  <option value="other" className="bg-[#171412]">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:border-[#dfb257]/50 focus:outline-none focus:ring-1 focus:ring-[#dfb257]/20"
                  placeholder="Tell us how we can help..."
                />
              </div>

              <motion.button
                type="submit"
                disabled={sending}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-full bg-[#dfb257] py-4 text-xs font-bold uppercase tracking-[0.2em] text-[#081224] transition hover:bg-white disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Message"}
              </motion.button>
            </form>
          </FadeIn>

          {/* Contact Methods */}
          <div className="space-y-8">
            {contactMethods.map((method, idx) => (
              <FadeIn key={method.title} delay={idx * 0.1}>
                <div className="flex items-start gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-white/20">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#dfb257]/20 to-[#e59a3b]/20">
                    <span className="material-symbols-outlined text-[#dfb257]">{method.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{method.title}</h3>
                    <p className="mt-1 text-sm font-medium text-[#dfb257]">{method.detail}</p>
                    <p className="mt-1 text-xs text-white/45">{method.sub}</p>
                  </div>
                </div>
              </FadeIn>
            ))}

            <FadeIn delay={0.3}>
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#dfb257]/5 to-[#e59a3b]/5 p-8 backdrop-blur-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Frequently Asked Questions</h3>
                <p className="mt-3 text-sm leading-7 text-white/55">
                  Looking for quick answers? Check out our FAQ page for common questions about shipping, returns, and more.
                </p>
                <Link
                  href={CUSTOMER_ROUTES.FAQ}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#dfb257] transition hover:text-white"
                >
                  View FAQ
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
