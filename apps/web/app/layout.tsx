import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { assertRuntimeEnvironment } from "../src/lib/env";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KINETIC Store",
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
