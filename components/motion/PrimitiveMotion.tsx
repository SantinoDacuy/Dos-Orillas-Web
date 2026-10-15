"use client";

import { type RefObject } from "react";
import { useMotion } from "./MotionProvider";
import { gsap, useGSAP, motionDebugEnabled, syncTriggerCount } from "../../lib/gsap-runtime";
import { distance, dur, ease, stagger } from "../../lib/motion-tokens";

export interface PrimitiveMotionProps {
  rootRef: RefObject<HTMLElement | null>;
  kind: "reveal-text" | "image-reveal" | "parallax-image" | "bridge";
  axis?: "horizontal" | "vertical";
  amount?: number;
}

/** Deferred controller: all semantic content belongs to the static wrapper. */
export function PrimitiveMotion({ rootRef, kind, axis = "horizontal", amount = distance.parallax }: PrimitiveMotionProps) {
  const { tier } = useMotion();
  useGSAP(() => {
    const root = rootRef.current;
    if (!root || tier !== 2) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-motion-target]"));
    const target = targets[0];
    const markers = motionDebugEnabled();
    if (kind === "parallax-image" && target && amount > 0) {
      gsap.fromTo(target, { yPercent: amount, scale: 1 + amount / 100 * 2 }, {
        yPercent: -amount, scale: 1 + amount / 100 * 2, ease: ease.scrub,
        scrollTrigger: {
          trigger: root, start: "top bottom", end: "bottom top", scrub: true,
          invalidateOnRefresh: true, markers,
        },
      });
    } else {
      // Late-loaded motion must never make an already visible block disappear.
      if (root.getBoundingClientRect().top < window.innerHeight) return;
      const trigger = { trigger: root, start: "top 85%", once: true, markers };
      if (kind === "reveal-text" && targets.length) {
        gsap.fromTo(targets, { yPercent: distance.reveal, opacity: 0 }, {
          yPercent: 0, opacity: 1, duration: dur.lg, ease: ease.out,
          stagger: stagger.lines, scrollTrigger: trigger,
        });
      } else if (kind === "image-reveal" && target) {
        const timeline = gsap.timeline({ scrollTrigger: trigger });
        timeline.fromTo(root, { clipPath: "inset(100% 0% 0% 0%)" }, {
          clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: ease.inOut,
        }, 0);
        timeline.fromTo(target, { scale: 1.15 }, { scale: 1, duration: dur.xl, ease: ease.out }, 0);
      } else if (kind === "bridge") {
        const property = axis === "vertical" ? "scaleY" : "scaleX";
        gsap.fromTo(root, { [property]: 0 }, {
          [property]: 1, duration: dur.lg, ease: ease.inOut, scrollTrigger: trigger,
        });
      }
    }
    syncTriggerCount();
    // useGSAP reverts its context first; refresh the diagnostic after that pass.
    return () => { queueMicrotask(syncTriggerCount); };
  }, { scope: rootRef, dependencies: [tier, kind, axis, amount], revertOnUpdate: true });
  return null;
}
