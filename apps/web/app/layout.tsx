import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { assertRuntimeEnvironment } from "../src/lib/env";
import Header from "../src/components/Header";
import MobileNav from "../src/components/MobileNav";
import { ScrollProgress } from "../src/components/scroll-progress";
import { BackToTop } from "../src/components/back-to-top";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "USOLSTICE Store — Premium Fashion & Lifestyle",
  description: "Premium e-commerce store for the modern shopper. Discover curated collections, fast shipping, and exclusive deals on fashion and lifestyle products.",
  keywords: "premium fashion, online store, designer clothing, fast shipping, exclusive deals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  assertRuntimeEnvironment();

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={geist.variable}>
        <ScrollProgress />
        <Header />
        <div className="pt-20 pb-24">{children}</div>
        <MobileNav />
        <BackToTop />
        <Toaster
          richColors
          closeButton
          position="top-right"
          toastOptions={{
            duration: 3500,
            classNames: {
              toast:
                "!rounded-2xl !border !border-white/10 !bg-[#171412]/95 !text-[#eaf2ff] !shadow-[0_24px_80px_rgba(0,0,0,0.35)] !backdrop-blur-xl",
              title: "!text-sm !font-bold !tracking-tight",
              description: "!text-sm !text-white/70",
              actionButton:
                "!rounded-full !bg-[#dfb257] !px-3 !py-2 !text-[11px] !font-bold !uppercase !tracking-[0.14em] !text-[#081224]",
              cancelButton:
                "!rounded-full !border !border-white/15 !bg-white/5 !px-3 !py-2 !text-[11px] !font-bold !uppercase !tracking-[0.14em] !text-white/80",
            },
          }}
        />
      </body>
    </html>
  );
}
