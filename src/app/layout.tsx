import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RE-SKIN | Glow Up-nya Dapat, Buminya Juga Selamat!",
  description:
    "Tukarkan kemasan skincare dan makeup kosong menjadi SKINPoint dan hadiah. Nikmati pickup gratis di area jangkauan RE-SKIN, termasuk kampus Universitas Trunodjoyo Madura (UTM).",
  applicationName: "RE-SKIN",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@1,400;1,500;1,600;1,700&family=Noto+Sans:wght@400..600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
