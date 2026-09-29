import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "DivyaDrishti PaperEval | Automated Evaluation & AI Paper Correction",
  description: "AI-assisted handwritten answer sheet evaluation, rubric-based grading, and educator-led verification for universities and examination boards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased selection:bg-amber-200 selection:text-slate-900">
        {children}
      </body>
    </html>
  );
}
