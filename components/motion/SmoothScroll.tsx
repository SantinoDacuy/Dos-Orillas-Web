"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMotion } from "./MotionProvider";
import { takeRouteScrollPolicy } from "@/lib/route-scroll-policy";

type MotionRuntime = Awaited<ReturnType<typeof import("../../lib/gsap").loadGSAP>>;

/** Native scrolling remains the complete fallback when this island cannot load. */
export function SmoothScroll() {
  const { tier, ready, lenisRef } = useMotion();
  const pathname = usePathname();
  const previousPathRef = useRef(pathname);
  const runtimeRef = useRef<MotionRuntime | null>(null);

  useEffect(() => {
    if (!ready || tier !== 2) return;
    let cancelled = false;
    let started = false;
    let destroy: (() => void) | undefined;
    const begin = () => {
      if (started || cancelled) return;
      started = true;
      window.removeEventListener('scroll', begin);
    void Promise.all([
      import("../../lib/gsap").then(({ loadGSAP }) => loadGSAP()), import("lenis"),
    ]).then(([runtime, lenisModule]) => {
      if (cancelled) return;
      const { gsap, ScrollTrigger, syncTriggerCount } = runtime;
      const lenis = new lenisModule.default({
        lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: false,
      });
      runtimeRef.current = runtime;
      lenisRef.current = lenis;
      window.__lenis = lenis;
      const onScroll = () => ScrollTrigger.update();
      const tick = (time: number) => lenis.raf(time * 1000);
      let refreshFrame = 0;
      const refresh = () => {
        if (cancelled || refreshFrame) return;
        refreshFrame = window.requestAnimationFrame(() => {
          refreshFrame = 0;
          if (cancelled) return;
          lenis.resize();
          ScrollTrigger.refresh();
          syncTriggerCount();
        });
      };
      const onImageLoad = (event: Event) => {
        if (event.target instanceof HTMLImageElement) refresh();
      };
      const onVisibility = () => {
        if (document.hidden) gsap.ticker.remove(tick);
        else {
          gsap.ticker.add(tick);
          refresh();
        }
      };
      lenis.on("scroll", onScroll);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      document.addEventListener("load", onImageLoad, true);
      document.addEventListener("visibilitychange", onVisibility);
      void document.fonts.ready.then(refresh);
      refresh();
      destroy = () => {
        if (refreshFrame) window.cancelAnimationFrame(refreshFrame);
        document.removeEventListener("load", onImageLoad, true);
        document.removeEventListener("visibilitychange", onVisibility);
        lenis.off("scroll", onScroll);
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
        if (lenisRef.current === lenis) lenisRef.current = null;
        if (window.__lenis === lenis) delete window.__lenis;
        runtimeRef.current = null;
        syncTriggerCount();
      };
    }).catch(() => {
      // Failed enhancement never intercepts or prevents native navigation.
    });
    };
    // The first native movement is uninterrupted. Load smoothing only when the
    // visitor starts the journey, keeping the runtime out of the initial load.
    window.addEventListener('scroll', begin, { passive: true, once: true });
    if (window.scrollY > 0) begin();
    return () => {
      cancelled = true;
      window.removeEventListener('scroll', begin);
      destroy?.();
    };
  }, [tier, ready, lenisRef]);

  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;
    const scrollPolicy = takeRouteScrollPolicy(pathname);
    if (tier !== 2) return;
    if (scrollPolicy === 'top') lenisRef.current?.scrollTo(0, { immediate: true });
    const frame = window.requestAnimationFrame(() => {
      lenisRef.current?.resize();
      runtimeRef.current?.ScrollTrigger.refresh();
      runtimeRef.current?.syncTriggerCount();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, tier, lenisRef]);

  return null;
}
