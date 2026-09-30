import React from 'react';
import MarketingNav from '@/components/marketing/MarketingNav';
import HeroSection from '@/components/marketing/HeroSection';
import BookScrollStory from '@/components/marketing/BookScrollStory';
import HumanInLoopSection from '@/components/marketing/HumanInLoopSection';
import FeatureSuiteSection from '@/components/marketing/FeatureSuiteSection';
import MarketingFooter from '@/components/marketing/MarketingFooter';

export const metadata = {
  title: "ANKLYZE | Analyse the marks, not just the paper",
  description: "Human-in-the-loop AI grading for handwritten answer sheets, university examinations, and institutional academic rigor.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e3dfd3] selection:bg-[#c5ddd4] selection:text-slate-900">
      {/* Floating Pill Navigation */}
      <MarketingNav />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Scroll-driven hero */}
        <BookScrollStory />

        {/* Existing answer-sheet visual */}
        <HeroSection />

        {/* Human in the Loop / Workflow Section */}
        <HumanInLoopSection />

        {/* Institutional Feature Suite */}
        <FeatureSuiteSection />
      </main>

      {/* Dark Footer with CTA Banner */}
      <MarketingFooter />
    </div>
  );
}
