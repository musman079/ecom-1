import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { assertRuntimeEnvironment } from "../src/lib/env";
import Header from "../src/components/Header";
import MobileNav from "../src/components/MobileNav";

const display = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-display",
});

const body = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "KINETIC Store ",
  description: "E-commerce Web App",
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
      </head>
      <body className={`${display.variable} ${body.variable}`}>
        <Header />
        <div className="pt-20 pb-24">{children}</div>
        <MobileNav />
        <Toaster
          richColors
          closeButton
          position="top-right"
          toastOptions={{
            duration: 3500,
            classNames: {
              toast:
                "!rounded-2xl !border !border-white/10 !bg-[#0f1726]/95 !text-[#eaf2ff] !shadow-[0_24px_80px_rgba(0,0,0,0.35)] !backdrop-blur-xl",
              title: "!text-sm !font-bold !tracking-tight",
              description: "!text-sm !text-white/70",
              actionButton:
                "!rounded-full !bg-[#65f3de] !px-3 !py-2 !text-[11px] !font-bold !uppercase !tracking-[0.14em] !text-[#081224]",
              cancelButton:
                "!rounded-full !border !border-white/15 !bg-white/5 !px-3 !py-2 !text-[11px] !font-bold !uppercase !tracking-[0.14em] !text-white/80",
            },
          }}
        />
      </body>
    </html>
  );
}
