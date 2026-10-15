"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type Lenis from "lenis";
import { useMotionTier, type MotionTier } from "../../hooks/useMotionTier";
import { motionLimits } from "../../lib/motion-tokens";
import { SmoothScroll } from "./SmoothScroll";

export interface MotionContextValue {
  tier: MotionTier;
  reduced: boolean;
  toggleMotion: () => void;
  lenisRef: MutableRefObject<Lenis | null>;
  ready: boolean;
}

const MotionContext = createContext<MotionContextValue | null>(null);

export function useMotion(): MotionContextValue {
  const context = useContext(MotionContext);
  if (!context) throw new Error("useMotion must be used inside MotionProvider.");
  return context;
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const { tier, reduced, ready, toggleMotion, downgrade } = useMotionTier();
  const lenisRef = useRef<Lenis | null>(null);
  const debugRef = useRef<HTMLOutputElement | null>(null);
  const latestFpsRef = useRef<number | null>(null);

  const writeDebug = useCallback(() => {
    const output = debugRef.current;
    if (!output) return;
    const fps = latestFpsRef.current === null ? "—" : Math.round(latestFpsRef.current);
    output.textContent = `Tier ${tier} · ${fps} FPS · ${window.__stCount ?? 0} ST`;
  }, [tier]);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const previousTier = root.getAttribute("data-motion-tier");
    const previousJSClass = root.classList.contains("js-motion");
    const effectiveTier = root.dataset.motionFailed === "true" ? 0 : tier;
    if (previousTier !== String(effectiveTier)) root.dataset.motionTier = String(effectiveTier);
    root.classList.toggle("js-motion", effectiveTier > 0);
    root.dataset.motionReady = String(ready);
    window.__stCount ??= 0;
    return () => {
      if (previousTier === null) root.removeAttribute("data-motion-tier");
      else root.setAttribute("data-motion-tier", previousTier);
      root.classList.toggle("js-motion", previousJSClass);
      root.removeAttribute("data-motion-ready");
    };
  }, [tier, ready]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    const output = document.createElement("output");
    output.setAttribute("aria-label", "Diagnóstico de movimiento");
    output.dataset.motionDebug = "true";
    Object.assign(output.style, {
      position: "fixed", right: "12px", bottom: "12px", zIndex: "9999",
      padding: "8px 12px", color: "#fff", background: "#142c45",
      border: "1px solid #fff6", font: "11px/1.4 monospace",
      pointerEvents: "none",
    });
    document.body.append(output);
    debugRef.current = output;
    writeDebug();
    const interval = window.setInterval(writeDebug, 500);
    return () => {
      window.clearInterval(interval);
      output.remove();
      debugRef.current = null;
    };
  }, [writeDebug]);

  useEffect(() => {
    if (!ready || tier !== 2) return;
    let cancelled = false;
    let started = false;
    let removeTicker: (() => void) | undefined;
    const events = ["pointerdown", "wheel", "touchstart", "keydown"] as const;
    const removeInteractionListeners = () => {
      for (const event of events) window.removeEventListener(event, beginSample);
    };

    function beginSample() {
      if (started || document.hidden) return;
      started = true;
      removeInteractionListeners();
      // This import runs only after an interaction; it cannot delay first paint.
      void import("../../lib/gsap").then(({ loadGSAP }) => loadGSAP()).then(({ gsap }) => {
        if (cancelled) return;
        let first: number | null = null;
        let last: number | null = null;
        let frameCount = 0;
        const resetSample = () => {
          first = null;
          last = null;
          frameCount = 0;
        };
        const tick = () => {
          const now = performance.now();
          if (document.hidden) {
            resetSample();
            return;
          }
          if (first === null) first = now;
          if (last !== null) frameCount += 1;
          last = now;
          const elapsed = now - first;
          if (elapsed < motionLimits.sampleMs) return;
          const fps = frameCount / (elapsed / 1000);
          latestFpsRef.current = fps;
          writeDebug();
          removeTicker?.();
          removeTicker = undefined;
          if (fps < motionLimits.minimumFps) downgrade();
        };
        document.addEventListener("visibilitychange", resetSample);
        removeTicker = () => {
          gsap.ticker.remove(tick);
          document.removeEventListener("visibilitychange", resetSample);
        };
        gsap.ticker.add(tick);
      }).catch(() => {
        // Runtime errors leave the semantic static page available.
      });
    }
    for (const event of events) window.addEventListener(event, beginSample, { passive: true });
    return () => {
      cancelled = true;
      removeInteractionListeners();
      removeTicker?.();
    };
  }, [tier, ready, downgrade, writeDebug]);

  const value = useMemo<MotionContextValue>(() => ({
    tier, reduced, ready, toggleMotion, lenisRef,
  }), [tier, reduced, ready, toggleMotion]);

  return (
    <MotionContext.Provider value={value}>
      <SmoothScroll />
      {children}
    </MotionContext.Provider>
  );
}
