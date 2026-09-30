"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail, RotateCcw } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import styles from "./ContactPage.module.css";

const inbox = "institutional@anklyze.mponline.gov.in";

export default function ContactPage() {
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", institution: "", role: "", volume: "", interest: "Institutional pilot", message: "" });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const interest = params.get("plan") || params.get("solution") || (params.has("pilot") ? "Institutional pilot" : null);
      if (interest) setForm(previous => ({ ...previous, interest: interest.replaceAll("-", " ") }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const emailBody = [
    `Name: ${form.name}`, `Official email: ${form.email}`, `Institution: ${form.institution}`,
    `Role: ${form.role || "Not specified"}`, `Script volume: ${form.volume || "Not specified"}`,
    `Interest: ${form.interest}`, "", form.message || "Please contact me to discuss an evaluation pilot.",
  ].join("\n");
  const emailHref = `mailto:${inbox}?subject=${encodeURIComponent(`ANKLYZE enquiry — ${form.institution}`)}&body=${encodeURIComponent(emailBody)}`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReady(true);
  }

  return (
    <div className={styles.page}>
      <MarketingNav />
      <main className={styles.main}>
        <div className={styles.shell}>
          <section className={styles.intro}>
            <span className={styles.eyebrow}>LET&apos;S BEGIN / YOUR EXAMINATION CYCLE</span>
            <h1>Put your questions <em>on the table.</em></h1>
            <p>Tell us about your scripts, marking scheme and review process. A useful pilot starts with the realities of your institution.</p>
            <div className={styles.sequence}>
              <div><span>01</span><strong>Share the context</strong><p>Subjects, volume and the kind of answers you evaluate.</p></div>
              <div><span>02</span><strong>Choose a sample</strong><p>Start with a defined set of scripts and the rubric you already use.</p></div>
              <div><span>03</span><strong>Review together</strong><p>Compare the first pass with the educator&apos;s own judgement.</p></div>
            </div>
            <div className={styles.direct}><Mail size={17} /><span>Prefer email? <a href={`mailto:${inbox}`}>{inbox}</a></span></div>
          </section>

          <section className={styles.formCard} aria-labelledby="contact-form-title">
            <div className={styles.formTop}><span className={styles.formDot} /> ANKLYZE / INSTITUTIONAL ENQUIRY <span>01 / 01</span></div>
            {ready ? (
              <div className={styles.ready}>
                <span className={styles.readyIcon}><Check size={27} /></span>
                <span className={styles.formEyebrow}>YOUR REQUEST DRAFT</span>
                <h2 id="contact-form-title">Ready to send.</h2>
                <p>Your details have been prepared in an email draft. Choose the button below to open your email app and send it to our institutional desk.</p>
                <a href={emailHref} className={styles.submit}>Open email draft <ArrowRight size={17} /></a>
                <button type="button" className={styles.restart} onClick={() => setReady(false)}><RotateCcw size={14} /> Edit details</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <span className={styles.formEyebrow}>A FEW DETAILS TO GET STARTED</span>
                <h2 id="contact-form-title">Tell us about your work.</h2>
                <p className={styles.formLead}>The more context you share, the more useful the first conversation can be.</p>
                <div className={styles.fields}>
                  <label>Full name <input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>
                  <label>Official email <input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="name@institution.edu" /></label>
                  <label>Institution <input required value={form.institution} onChange={event => setForm({ ...form, institution: event.target.value })} placeholder="University or examination board" /></label>
                  <label>Role <select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option value="">Select your role</option><option>Controller of Examinations</option><option>Registrar</option><option>Dean or Department Head</option><option>Examiner or Moderator</option><option>Technology Lead</option><option>Other</option></select></label>
                  <label>Approximate script volume <select value={form.volume} onChange={event => setForm({ ...form, volume: event.target.value })}><option value="">Select a range</option><option>Under 10,000 per cycle</option><option>10,000–50,000 per cycle</option><option>50,000–200,000 per cycle</option><option>More than 200,000 per cycle</option></select></label>
                  <label>What would you like to explore? <input value={form.interest} onChange={event => setForm({ ...form, interest: event.target.value })} /></label>
                  <label className={styles.fullField}>A little more context <textarea rows={4} value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} placeholder="Subjects, current review process, or a question for us…" /></label>
                </div>
                <button type="submit" className={styles.submit}>Prepare enquiry <ArrowRight size={17} /></button>
                <p className={styles.formNote}>This step prepares an email draft for you to review and send.</p>
              </form>
            )}
          </section>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
