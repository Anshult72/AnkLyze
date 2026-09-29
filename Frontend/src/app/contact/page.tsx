'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';
import { ArrowRight, Mail, Phone, MapPin, CheckCircle2, ShieldCheck, Clock, Building } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    role: 'Controller of Examinations',
    volume: '50,000 - 200,000 scripts / semester',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFAF5] selection:bg-amber-200 selection:text-slate-900">
      <MarketingNav />

      <main className="flex-1 pt-32 pb-20">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-4 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/60">
              <span>✦</span>
              <span>INSTITUTIONAL CONSULTATION &amp; PILOT</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-normal text-[#111827] tracking-tight leading-[1.12]">
              Let's modernize your university's{" "}
              <span className="italic relative inline-block">
                grading cycle
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#2563EB] pointer-events-none"
                  viewBox="0 0 280 12"
                  fill="none"
                >
                  <path d="M3 9C55 4 125 3 277 8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>.
            </h1>

            <p className="text-base sm:text-lg text-[#4B5563] mt-5 leading-relaxed">
              We work directly with Controllers of Examinations, Registrars, and Academic Councils to set up secure, blinded pilot evaluation runs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-6xl mx-auto">
            {/* Left Details */}
            <div className="lg:col-span-5 space-y-8">
              <div className="p-8 rounded-3xl bg-white border border-gray-200/90 shadow-xs space-y-6">
                <h3 className="font-serif text-2xl font-bold text-gray-900">Institutional Pilot Program</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Every pilot includes end-to-end setup: test script scanning calibration, customized subject rubric onboarding, and faculty orientation workshop.
                </p>

                <div className="space-y-4 pt-2 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-gray-900">48-Hour Onboarding</span>
                      <span className="text-xs text-gray-500">Live evaluation environment ready for initial sample calibration.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-gray-900">Strict Data Sovereignty</span>
                      <span className="text-xs text-gray-500">All data hosted on Indian institutional cloud tenants with strict RBAC.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-gray-900">MPOnline Integrated</span>
                      <span className="text-xs text-gray-500">Native integration with state university portal frameworks.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Contacts */}
              <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>institutional@papereval.mponline.gov.in</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>+91 755 4019400 (Academic Desk)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Bhopal, Madhya Pradesh • Examination Technology Division</span>
                </div>
              </div>
            </div>

            {/* Right Contact Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/90 shadow-sm">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-gray-900">Pilot Request Received</h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.name}. Our institutional deployment team will review your requirements for {formData.institution} and connect with your office within 24 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-xs font-semibold text-blue-600 underline hover:text-blue-800 pt-2"
                  >
                    Submit another institutional enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-gray-900">Request an Institutional Pilot</h3>
                    <p className="text-xs text-gray-500 mt-1">Please provide your official institutional details.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Prof. Ramesh Sharma"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Official Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="coe@university.ac.in"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Institution / University Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                        placeholder="Barkatullah University / RGPV"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                        Designation / Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                      >
                        <option>Controller of Examinations</option>
                        <option>Vice Chancellor / Registrar</option>
                        <option>Dean / Department Head</option>
                        <option>Senior Examiner / Moderator</option>
                        <option>Director of IT / EdTech</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Estimated Scripts per Examination Cycle
                    </label>
                    <select
                      value={formData.volume}
                      onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option>&lt; 10,000 scripts / semester</option>
                      <option>10,000 - 50,000 scripts / semester</option>
                      <option>50,000 - 200,000 scripts / semester</option>
                      <option>200,000+ scripts / semester (State Board / Central University)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Specific Examination Subjects &amp; Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="e.g. B.Tech Semester End Exams, Engineering Mathematics, multi-examiner moderation requirement..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Submit pilot evaluation request</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
