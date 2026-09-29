"use client";

import React from "react";

export default function TrustMetricsBar() {
  const metrics = [
    {
      stat: "100%",
      label: "Faculty Approved",
      detail: "Every grade confirmed by educator",
    },
    {
      stat: "256-bit",
      label: "Data Encryption",
      detail: "AES encrypted tenant data security",
    },
    {
      stat: "0",
      label: "Black-Box Decisions",
      detail: "Every score rubric-linked",
    },
    {
      stat: "1",
      label: "Approval Gate",
      detail: "Single human sign-off before release",
    },
  ];

  return (
    <section className="py-12 sm:py-16 border-y border-gray-100 bg-[#FAFAFA]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200/80">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className={`p-4 sm:p-6 text-left ${idx % 2 === 0 ? "pr-4" : "pl-4 md:pl-6"}`}
            >
              <div className="font-serif text-4xl sm:text-5xl font-normal text-[#111827] tracking-tight">
                {m.stat}
              </div>
              <div className="font-bold text-sm text-[#111827] mt-2">
                {m.label}
              </div>
              <div className="text-xs text-[#4B5563] mt-0.5 leading-relaxed">
                {m.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
