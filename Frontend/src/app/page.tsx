import React from 'react';
import MarketingNav from '@/components/marketing/MarketingNav';
import HeroSection from '@/components/marketing/HeroSection';
import TrustMetricsBar from '@/components/marketing/TrustMetricsBar';
import HumanInLoopSection from '@/components/marketing/HumanInLoopSection';
import FeatureSuiteSection from '@/components/marketing/FeatureSuiteSection';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = {
  title: "ANKLYZE | Analyse the marks, not just the paper",
  description: "Human-in-the-loop AI grading for handwritten answer sheets, university examinations, and institutional academic rigor.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] selection:bg-amber-200 selection:text-slate-900">
      {/* Floating Pill Navigation */}
      <MarketingNav />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Institutional Trust Metrics Bar */}
        <TrustMetricsBar />

        {/* 3. Human in the Loop / Workflow Section */}
        <HumanInLoopSection />

        {/* 4. Institutional Feature Suite */}
        <FeatureSuiteSection />
      </main>

      {/* 5. Dark Footer with CTA Banner */}
      <MarketingFooter />
    </div>
  );
}
