import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader, Kalam } from "next/font/google";
import "./globals.css";
import "./workspace.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const kalam = Kalam({
  weight: ["400", "700"],
  variable: "--font-handwriting",
  subsets: ["latin"],
});

import { AuthProvider } from "@/context/AuthContext";
import { RealtimeProvider } from "@/context/RealtimeContext";

export const metadata: Metadata = {
  title: "ANKLYZE | Analyse the marks, not just the paper",
  description: "AI-assisted handwritten examination evaluation workstation with rubric alignment and human examiner decision-making.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${kalam.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased selection:bg-[#c5ddd4] selection:text-slate-900">
        <AuthProvider>
          <RealtimeProvider>{children}</RealtimeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
