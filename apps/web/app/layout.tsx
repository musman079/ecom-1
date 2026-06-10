import type { Metadata } from "next";
import { Cormorant_Garamond, Playfair_Display, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Navbar } from "../src/components/layout/Navbar";
import { Footer } from "../src/components/layout/Footer";
import { ConditionalLayout } from "../src/components/layout/ConditionalLayout";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "USOLSTICE Store — Premium Fashion & Lifestyle",
  description: "Premium e-commerce store for the modern shopper. Discover curated collections, fast shipping, and exclusive deals on fashion and lifestyle products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* We can use the fonts defined in Next.js directly */}
      </head>
      <body className={`${cormorant.variable} ${playfair.variable} ${inter.variable} font-sans bg-primary text-text-primary antialiased`}>
        <ConditionalLayout
          navbar={<Navbar />}
          footer={<Footer />}
        >
          {children}
        </ConditionalLayout>

        <Toaster
          richColors
          closeButton
          position="top-right"
          toastOptions={{
            duration: 3500,
            classNames: {
              toast: "!rounded-sm !border !border-white/10 !bg-surface !text-text-primary",
              title: "!text-sm !font-bold !font-heading",
              description: "!text-sm !text-text-secondary",
              actionButton: "!rounded-full !bg-gold !px-3 !py-2 !text-[11px] !font-bold !uppercase !tracking-[0.14em] !text-primary",
              cancelButton: "!rounded-full !border !border-white/15 !bg-white/5 !px-3 !py-2 !text-[11px] !font-bold !uppercase !tracking-[0.14em] !text-text-primary",
            },
          }}
        />
      </body>
    </html>
  );
}
