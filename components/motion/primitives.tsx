"use client";

import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from "react";
import { useMotion } from "./MotionProvider";
import { distance, dur, motionCssEase, motionLimits } from "../../lib/motion-tokens";
import type { PrimitiveMotionProps } from "./PrimitiveMotion";

const LazyPrimitiveMotion = lazy(() => import("./PrimitiveMotion").then((module) => ({
  default: module.PrimitiveMotion,
})));

class MotionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

function useNearViewport(rootRef: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;
    let observer: IntersectionObserver | undefined;
    const frame = window.requestAnimationFrame(() => {
      if (!("IntersectionObserver" in window)) {
        setNear(true);
        return;
      }
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer?.disconnect();
        }
      }, { rootMargin: motionLimits.lazyMargin });
      observer.observe(root);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [rootRef, enabled]);
  return near;
}

/** Tier 1 uses the browser's animation engine and never downloads GSAP. */
function useLiteMotion(props: PrimitiveMotionProps, enabled: boolean): void {
  const { rootRef, kind, axis = "horizontal" } = props;
  useEffect(() => {
    if (!enabled || kind === "parallax-image") return;
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window) || typeof root.animate !== "function") return;
    // Never hide already-visible content, including the LCP heading/image.
    if (root.getBoundingClientRect().top < window.innerHeight) return;
    const animations: Animation[] = [];
    let observer: IntersectionObserver | undefined;
    let safetyTimer = 0;
    const cancelAnimations = () => animations.forEach((animation) => animation.cancel());
    try {
      const targets = kind === "reveal-text"
        ? Array.from(root.querySelectorAll<HTMLElement>("[data-motion-target]"))
        : [root];
      targets.forEach((target, index) => {
        const keyframes: Keyframe[] = kind === "image-reveal"
          ? [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }]
          : kind === "bridge"
            ? [{ transform: axis === "vertical" ? "scaleY(0)" : "scaleX(0)" }, { transform: "none" }]
            : [{ transform: "translateY(35%)", opacity: 0 }, { transform: "none", opacity: 1 }];
        const animation = target.animate(keyframes, {
          duration: dur.md * 1000,
          delay: kind === "reveal-text" ? index * 60 : 0,
          easing: motionCssEase.out,
          fill: "both",
        });
        animation.pause();
        animation.currentTime = 0;
        animation.onfinish = () => animation.cancel();
        animations.push(animation);
      });
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        animations.forEach((animation) => animation.play());
        observer?.disconnect();
        // Once started, an interrupted native animation cannot strand content.
        safetyTimer = window.setTimeout(cancelAnimations, 3000);
      }, { rootMargin: motionLimits.observerMargin, threshold: 0 });
      observer.observe(root);
    } catch {
      observer?.disconnect();
      cancelAnimations();
    }
    return () => {
      window.clearTimeout(safetyTimer);
      observer?.disconnect();
      cancelAnimations();
    };
  }, [enabled, rootRef, kind, axis]);
}

function EnhanceMotion(props: PrimitiveMotionProps) {
  const { tier, ready } = useMotion();
  const near = useNearViewport(props.rootRef, ready && tier === 2);
  useLiteMotion(props, ready && tier === 1);
  if (!ready || tier !== 2 || !near) return null;
  return (
    <MotionBoundary>
      <Suspense fallback={null}>
        <LazyPrimitiveMotion {...props} />
      </Suspense>
    </MotionBoundary>
  );
}

type TextElement = "h1" | "h2" | "h3" | "h4" | "p" | "div" | "span";
export interface RevealTextProps extends HTMLAttributes<HTMLElement> {
  as?: TextElement;
  children: ReactNode;
  /** Use explicit editorial line breaks when the composition calls for them. */
  lines?: readonly ReactNode[];
}

export function RevealText({ as = "div", children, lines, className, ...props }: RevealTextProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const Tag = as;
  const content = (lines ?? [children]).map((line, index) => (
    <span className="motion-line" key={index} style={{ display: "block", overflow: "clip" }}>
      <span data-motion-target className="motion-line-inner" style={{ display: "block" }}>{line}</span>
    </span>
  ));
  return (
    <Tag {...props} ref={rootRef} className={className} data-reveal="text">
      {content}
      <EnhanceMotion rootRef={rootRef} kind="reveal-text" />
    </Tag>
  );
}

export interface ImageRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ImageReveal({ children, className, style, ...props }: ImageRevealProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  return (
    <div {...props} ref={rootRef} className={className} data-reveal="image" style={{ overflow: "clip", ...style }}>
      <div data-motion-target className="motion-image-inner" style={{ position: "relative", width: "100%", height: "100%" }}>{children}</div>
      <EnhanceMotion rootRef={rootRef} kind="image-reveal" />
    </div>
  );
}

export interface ParallaxImageProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  amount?: number;
}

export function ParallaxImage({ children, amount = distance.parallax, className, style, ...props }: ParallaxImageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const boundedAmount = Math.min(distance.parallax, Math.max(0, amount));
  return (
    <div {...props} ref={rootRef} className={className} data-parallax="image" style={{ overflow: "clip", ...style }}>
      <div data-motion-target className="motion-parallax-inner" style={{ position: "relative", width: "100%", height: "100%" }}>{children}</div>
      <EnhanceMotion rootRef={rootRef} kind="parallax-image" amount={boundedAmount} />
    </div>
  );
}

export interface BridgeProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

export function Bridge({ orientation = "horizontal", className, style, ...props }: BridgeProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  return (
    <div
      {...props} ref={rootRef} className={className} aria-hidden="true" data-bridge={orientation}
      style={{
        display: "block", background: "var(--accent)", transformOrigin: "center",
        width: orientation === "horizontal" ? "100%" : "1px",
        height: orientation === "horizontal" ? "1px" : "100%", ...style,
      }}
    >
      <EnhanceMotion rootRef={rootRef} kind="bridge" axis={orientation} />
    </div>
  );
}
