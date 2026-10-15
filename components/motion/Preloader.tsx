"use client";

import { useEffect, useRef } from "react";
import { loaderCopy } from "@/content/site";
import { shellAccessibilityCopy } from "@/content/shell";
import { useMotion } from "@/components/motion/MotionProvider";

const SESSION_KEY = "do-intro";
declare global { interface Window { __finishIntro?: () => void; } }

export function Preloader() {
  const { tier, reduced, ready, lenisRef } = useMotion();
  const overlayRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<(() => void) | null>(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!ready || tier === 0 || reduced || attemptedRef.current) return;
    if (document.documentElement.classList.contains('do-intro')) return;
    let visited = false;
    try { visited = sessionStorage.getItem(SESSION_KEY) === "1"; } catch { /* Storage is optional. */ }
    if (visited || window.scrollY > 40 || location.hash) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    attemptedRef.current = true;
    let disposed = false;
    let active = false;
    let previousOverflow = "";
    let firstFrame = 0;
    let secondFrame = 0;
    let waitTimer = 0;
    let finishTimer = 0;
    let safety = 0;
    let previousFocus: HTMLElement | null = null;
    let inertElements: Array<{ element: HTMLElement; inert: boolean }> = [];
    const animations: Animation[] = [];
    const markVisited = () => { try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* Keep the ephemeral attempted flag. */ } };
    const finish = () => {
      if (disposed) return;
      disposed = true;
      markVisited();
      overlay.hidden = true;
      animations.forEach((animation) => animation.cancel());
      clearTimeout(waitTimer);
      clearTimeout(finishTimer);
      clearTimeout(safety);
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      if (active) {
        inertElements.forEach(({ element, inert }) => { element.inert = (element.tagName === "FOOTER" && element.closest<HTMLElement>(".site-shell")?.dataset.footerCurtain === "true" && element.dataset.visible === "false") || inert; });
        inertElements = [];
        if (document.documentElement.dataset.menuOpen !== "true") document.documentElement.style.overflow = previousOverflow;
        delete document.documentElement.dataset.intro;
        if (document.documentElement.dataset.menuOpen !== "true") lenisRef.current?.start();
        previousFocus?.focus({ preventScroll: true });
      }
      skipRef.current = null;
      window.dispatchEvent(new Event("dos-orillas:intro-complete"));
    };
    skipRef.current = finish;
    // Text and semantic Hero are already painted. Intro is an optional overlay only.
    safety = window.setTimeout(finish, 3000);
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(async () => {
        const heroImages = Array.from(document.querySelectorAll<HTMLImageElement>("#estudio .hero-photo img, #estudio img[data-hero], #estudio .hero-media img, [data-hero-image]"));
        const imagesReady = Promise.allSettled(heroImages.map((image) => image.decode().catch(() => undefined)));
        const timeout = new Promise<void>((resolve) => { waitTimer = window.setTimeout(resolve, 2500); });
        await Promise.race([Promise.allSettled([document.fonts.ready, imagesReady]), timeout]);
        if (disposed || window.scrollY > 40 || document.documentElement.dataset.menuOpen === "true") { finish(); return; }
        markVisited();
        previousOverflow = document.documentElement.style.overflow;
        if (tier === 2) document.documentElement.style.overflow = "clip";
        document.documentElement.dataset.intro = "true";
        if (tier === 2) lenisRef.current?.stop();
        active = true;
        previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        inertElements = tier === 2 ? Array.from(document.querySelectorAll<HTMLElement>("main, footer, .site-nav")).map((element) => ({ element, inert: element.inert })) : [];
        inertElements.forEach(({ element }) => { element.inert = true; });
        overlay.hidden = false;
        if (tier === 2) overlay.querySelector<HTMLButtonElement>(".preloader-skip")?.focus({ preventScroll: true });
        const animate = (selector: string, frames: Keyframe[], options: KeyframeAnimationOptions) => {
          const element = overlay.querySelector<HTMLElement>(selector);
          if (element) animations.push(element.animate(frames, { fill: "both", ...options }));
        };
        animate(".preloader-line-left", [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 340, easing: "cubic-bezier(.76,0,.24,1)" });
        animate(".preloader-line-right", [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 340, easing: "cubic-bezier(.76,0,.24,1)" });
        animate(".preloader-connected", [{ opacity: 0, transform: "translateY(115%)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 160, delay: 340, easing: "cubic-bezier(.16,1,.3,1)" });
        animate(".preloader-panel-top", [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], { duration: 300, delay: 500, easing: "cubic-bezier(.76,0,.24,1)" });
        animate(".preloader-panel-bottom", [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], { duration: 300, delay: 500, easing: "cubic-bezier(.76,0,.24,1)" });
        animate(".preloader-connection", [{ opacity: 1 }, { opacity: 0 }], { duration: 120, delay: 500 });
        finishTimer = window.setTimeout(finish, 800);
      });
    });
    return () => { finish(); clearTimeout(safety); };
  }, [tier, reduced, ready, lenisRef]);

  return <div ref={overlayRef} suppressHydrationWarning className="preloader" role={tier === 2 ? "dialog" : "status"} aria-modal={tier === 2 ? true : undefined} aria-label={loaderCopy.connected} hidden onKeyDown={(event) => { if (event.key === "Escape") { window.__finishIntro?.(); skipRef.current?.(); } if (event.key === "Tab" && tier === 2) { event.preventDefault(); overlayRef.current?.querySelector<HTMLButtonElement>(".preloader-skip")?.focus(); } }}><div className="preloader-panel preloader-panel-top" aria-hidden="true" /><div className="preloader-panel preloader-panel-bottom" aria-hidden="true" /><div className="preloader-connection" aria-hidden="true"><span className="preloader-orilla preloader-orilla-left mono">{loaderCopy.orilla}</span><span className="preloader-line preloader-line-left" /><span className="preloader-line preloader-line-right" /><span className="preloader-orilla preloader-orilla-right mono">{loaderCopy.orilla}</span><div className="preloader-word-mask"><span className="preloader-connected">{loaderCopy.connected}</span></div></div><button className="preloader-skip mono" type="button" onClick={() => { window.__finishIntro?.(); skipRef.current?.(); }}>{shellAccessibilityCopy.skipIntro}</button></div>;
}


