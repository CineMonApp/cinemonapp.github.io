/*
 * GSAP scroll choreography — subtle reveals and parallax. The hero entrance
 * is CSS (main.css) so the first paint never waits on this script.
 * Everything degrades gracefully with prefers-reduced-motion.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  /* Generic fade-up reveals */
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  /* Staggered groups (bento grids, card rows) */
  gsap.utils.toArray("[data-reveal-group]").forEach((group) => {
    gsap.from(group.children, {
      y: 32,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    });
  });

  /* Slow parallax drift on feature screenshots */
  gsap.utils.toArray("[data-parallax]").forEach((el) => {
    gsap.fromTo(
      el,
      { y: 40 },
      {
        y: -40,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.2 },
      }
    );
  });
}
