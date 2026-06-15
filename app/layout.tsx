import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "alancho_0 攝影報價單系統",
  description: "Korean minimal photography quotation generator for alancho_0."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
