import { ArrowRight, Check, Sparkles } from "lucide-react";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
  return (
    <section className={styles.section} aria-labelledby="answer-conversation-title">
      <div className={styles.container}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}><span className={styles.eyebrowDot} /> THE THINKING BEHIND THE MARK</span>
          <h2 id="answer-conversation-title">An answer becomes <em>a conversation.</em></h2>
          <p>See the student&apos;s reasoning. Add the human insight that helps it grow.</p>
        </div>

        <div className={styles.composition}>
          <div className={styles.orbit} aria-hidden="true" />
          <div className={styles.answerWrap}>
            <div className={styles.answerBacking} aria-hidden="true" />
            <article className={styles.answerSheet} aria-label="Example student examination answer">
              <div className={styles.paperTop}>
                <span><span className={styles.paperMark}>EX</span> EXAMINATION ANSWER BOOK</span>
                <span>PAGE 03 / 08</span>
              </div>
              <div className={styles.paperBody}>
                <div className={styles.examMeta}><span>ROLL NO. 24 · · · 18</span><span>PHYSICS · 5 MARKS</span></div>
                <span className={styles.paperLabel}>Q. 3 (B)</span>
                <h3>A 2 kg trolley accelerates at 3 m/s². Find the net force.</h3>
                <div className={styles.studentAnswer}>
                  <p>Given: m = 2 kg, a = 3 m/s².</p>
                  <p>I first did <s>2 + 3 = 5 N</s>, but force is mass × acceleration. So F = 2 × 3.</p>
                </div>
                <svg className={styles.forceDiagram} viewBox="0 0 210 118" fill="none" role="img" aria-label="Sketch of a two kilogram trolley with force and acceleration arrows to the right">
                  <path d="M21 96h171M59 45h92v38H59zM151 60h42m-9-8 9 8-9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="84" cy="88" r="8" fill="#fffdf8" stroke="currentColor" strokeWidth="2" />
                  <circle cx="128" cy="88" r="8" fill="#fffdf8" stroke="currentColor" strokeWidth="2" />
                  <text x="105" y="68" textAnchor="middle">2 kg</text>
                  <text x="174" y="44" textAnchor="middle">F</text>
                  <text x="105" y="115" textAnchor="middle">a = 3 m/s² →</text>
                </svg>
                <p className={styles.finalAnswer}>Ans. <span>F = 6 N</span></p>
              </div>
              <div className={styles.paperFooter}>
                <span>P.T.O. →</span>
                <span>WRITE ON BOTH SIDES OF THE PAGE</span>
              </div>
            </article>
          </div>

          <div className={styles.connector} aria-hidden="true">
            <span className={styles.connectorLine} />
            <span className={styles.connectorIcon}><ArrowRight size={19} strokeWidth={1.8} /></span>
            <span className={styles.connectorLine} />
          </div>

          <article className={styles.feedback} aria-label="Example educator feedback">
            <div className={styles.feedbackTop}>
              <span className={styles.feedbackIcon}><Sparkles size={19} strokeWidth={1.7} /></span>
              <span className={styles.feedbackMeta}>THE HUMAN PART <span>·</span> EDUCATOR NOTE</span>
              <span className={styles.feedbackCheck}><Check size={17} strokeWidth={2} /></span>
            </div>
            <div className={styles.feedbackBody}>
              <span className={styles.feedbackLabel}>FEEDBACK ON QUESTION 3 (B)</span>
              <h3>You caught it.<br /><em>Now take it further.</em></h3>
              <blockquote>“You corrected the calculation and used the right unit. If this trolley accelerated twice as fast, what would happen to the net force?”</blockquote>
              <div className={styles.feedbackRule} />
              <p>A specific observation. A useful next step.</p>
            </div>
            <div className={styles.feedbackFooter}>
              <span className={styles.signatureMark}>✓</span>
              <span>Your experience. The final say.</span>
            </div>
          </article>
        </div>

        <div className={styles.process} aria-label="Evaluation process">
          <div className={styles.processStep}><span>01</span><strong>Read the handwriting</strong></div>
          <span className={styles.processLine} aria-hidden="true" />
          <div className={styles.processStep}><span>02</span><strong>Connect the reasoning</strong></div>
          <span className={styles.processLine} aria-hidden="true" />
          <div className={styles.processStep}><span>03</span><strong>Keep the human judgement</strong></div>
        </div>
      </div>
    </section>
  );
}
