"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./BookScrollStory.module.css";

function HeroDetails() {
  return (
    <>
      <div className={styles.finalKicker}><span />AI-ASSISTED. EDUCATOR-LED.</div>
      <div className={styles.finalBody}>
      <p className={styles.finalSubtitle}>Turn handwritten answers into thoughtful, rubric-linked feedback.<br className={styles.desktopBreak} /> ANKLYZE takes the first pass. You hold the final pen.</p>
      <div className={styles.finalActions}>
        <Link href="/examiner/dashboard" className={styles.pilotButton}>Portal <ArrowRight size={17} strokeWidth={1.8} /></Link>
        <Link href="/pricing" className={styles.plansButton}>Explore plans <ArrowUpRight size={17} strokeWidth={1.8} /></Link>
      </div>
      <p className={styles.finalNote}>For the people behind every grade.</p>
      </div>
    </>
  );
}

export default function BookScrollStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let progress = 0;
    let targetTime = 0;
    let disposed = false;
    const seek = () => {
      // Complete the current seek before applying the newest scroll position.
      if (disposed || video.readyState < 1 || video.seeking) return;
      if (Math.abs(video.currentTime - targetTime) > 1 / 30) {
        video.currentTime = targetTime;
      }
    };
    const render = (value: number) => {
      progress = value;
      const duration = Number.isFinite(video.duration) ? Math.max(0, video.duration - .04) : 0;
      targetTime = Math.max(0, Math.min(1, progress)) * duration;
      seek();
    };
    const onReady = () => render(progress);
    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("seeked", seek);

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      render(0);
      const playhead = { progress: 0 };
      const scene = section.querySelector(`.${styles.scene}`);
      const heading = section.querySelector<HTMLHeadingElement>(`.${styles.storyHeading} h1`);
      const details = section.querySelector(`.${styles.finalDetails}`);
      const stage = section.querySelector<HTMLElement>(`.${styles.stage}`);
      const body = section.querySelector<HTMLElement>(`.${styles.finalDetails} .${styles.finalBody}`);
      if (!heading || !stage || !body) return;
      let headingY = 0;
      let headingScale = 1;
      const measureEnding = () => {
        const mobile = window.innerWidth <= 900;
        const safeTop = mobile ? 108 : 128;
        const gap = mobile ? 24 : 32;
        const kickerSpace = 38;
        const available = stage.clientHeight - safeTop - 28;
        const maximumScale = mobile ? 1.08 : 1.75;
        headingScale = Math.max(1, Math.min(maximumScale,
          (available - kickerSpace - gap - body.offsetHeight) / heading.offsetHeight));
        const headingHeight = heading.offsetHeight * headingScale;
        const total = kickerSpace + headingHeight + gap + body.offsetHeight;
        const top = Math.max(safeTop, safeTop + (available - total) / 2);
        const headingTop = top + kickerSpace;
        headingY = headingTop - (heading.parentElement!.offsetTop + heading.offsetTop);
        gsap.set(stage, {
          "--final-kicker-top": `${top}px`,
          "--final-copy-top": `${headingTop + headingHeight + gap}px`,
        });
      };
      measureEnding();
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: .3, invalidateOnRefresh: true, onRefreshInit: measureEnding },
      });
      timeline.to(playhead, { progress: 1, duration: 86, ease: "none", onUpdate: () => render(playhead.progress) }, 0)
        .to(scene, { autoAlpha: 0, y: -25, scale: .96, duration: 8, ease: "power2.inOut" }, 86)
        .to(section.querySelectorAll(`.${styles.caption}, .${styles.scrollCue}`), { autoAlpha: 0, duration: 5 }, 87)
        .to(section.querySelector(`.${styles.storyKicker}`), { autoAlpha: 0, duration: 4 }, 90)
        .to(heading, { y: () => headingY, scale: () => headingScale, duration: 10, ease: "power2.inOut" }, 90)
        .fromTo(details, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 6, ease: "power2.out" }, 94);
    }, section);
    document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
    return () => {
      disposed = true;
      media.revert();
      video.pause();
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("seeked", seek);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.story} aria-label="From examination book to digital evaluation">
      <div className={styles.stage}>
        <div className={styles.storyHeading}>
          <span className={styles.storyKicker}>FROM PAPER TO PRACTICE</span>
          <h1>Every answer has a story.<br /><em>Every mark should too.</em></h1>
        </div>
        <div className={styles.scene} aria-hidden="true">
          <div className={styles.videoViewport}>
          <video
            ref={videoRef}
            className={styles.videoBook}
            src="/book%20video/book-story.mp4"
            preload="auto"
            muted
            playsInline
            disablePictureInPicture
            tabIndex={-1}
          />
          </div>
        </div>
        <div className={styles.finalDetails}><HeroDetails /></div>
        <p className={styles.caption}>A physical sheet becomes a clearer, more accountable evaluation workflow.</p>
        <span className={styles.scrollCue} aria-hidden="true">SCROLL TO FOLLOW THE PAPER <span>↓</span></span>
      </div>
      <div className={styles.reducedContent}><h1>Every answer has a story.<br /><em>Every mark should too.</em></h1><div className={styles.reducedDetails}><HeroDetails /></div></div>
    </section>
  );
}
