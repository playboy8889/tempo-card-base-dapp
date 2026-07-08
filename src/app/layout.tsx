import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  keywords: ["Base", "Base builder", "onchain", "dApp", "wallet"],
  title: "Tempo Card",
  // Base builder identity: project-level proof uses Build ID, Builder Wallet, Builder Code, Vercel Live Demo, and GitHub repository.
  description:
    "Publish a BPM, mood, and short note on Base in a clean player-style rhythm card.",
};

const baseAppId =
  process.env.NEXT_PUBLIC_BASE_APP_ID ?? "6a05f8808f636ba200aa02a8";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {baseAppId ? <meta name="base:app_id" content={baseAppId} /> : null}
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
