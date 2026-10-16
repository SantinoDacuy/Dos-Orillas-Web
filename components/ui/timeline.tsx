// Built using Hyperiux Vault: https://vault.hyperiux.com
"use client";

import {
  type CSSProperties,
  useLayoutEffect,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* Inline stand-in for @gsap/react's useGSAP. Mirrors its default
   `revertOnUpdate: false`: one gsap.context lives for the component's
   lifetime, the callback is re-added when dependencies change, and the
   context is reverted only on unmount. A callback may return its own
   cleanup, which runs before the next re-add and on unmount. */
function useGSAP(
  callback: () => void | (() => void),
  options?: {
    dependencies?: unknown[];
    scope?: { current: Element | null } | Element | null;
  }
) {
  const deps = options?.dependencies ?? [];
  const scope = options?.scope;
  const ctxRef = useRef<gsap.Context | null>(null);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useIsomorphicLayoutEffect(() => {
    const el =
      scope && typeof scope === "object" && "current" in scope
        ? scope.current
        : (scope as Element | null);
    ctxRef.current = gsap.context(() => {}, el ?? undefined);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!ctxRef.current) return;
    cleanupRef.current?.();
    const ret = ctxRef.current.add(callback);
    cleanupRef.current = typeof ret === "function" ? ret : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export type JourneyStep = {
  id: string;
  number: string;
  title: string;
  description: string;
  isTop: boolean;
};

export type TimelineProps = {
  title?: string;
  subtitle?: string;
  periodLabel?: string;
  textColor?: string;
  mutedTextColor?: string;
  activeColor?: string;
  backgroundColor?: string;
  imageUrl?: string;
  imageAlt?: string;
  steps?: JourneyStep[];
  /** Reveal animation duration, in seconds. */
  duration?: number;
  /** Fallback reveal duration when `duration` is omitted, in seconds. */
  scrollDuration?: number;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);

  return () => mediaQueryList.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;

  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
}

function getServerReducedMotionSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

export const defaultProcessSteps: JourneyStep[] = [
  {
    id: "step-01",
    number: "01",
    title: "NOS CONTÁS",
    description: "Entendemos qué está pasando y qué necesitás resolver.",
    isTop: true,
  },
  {
    id: "step-02",
    number: "02",
    title: "LO PENSAMOS",
    description: "Analizamos el problema antes de elegir herramientas.",
    isTop: false,
  },
  {
    id: "step-03",
    number: "03",
    title: "LO CONSTRUIMOS",
    description: "Diseñamos y desarrollamos una solución adecuada.",
    isTop: true,
  },
  {
    id: "step-04",
    number: "04",
    title: "LO PONEMOS A ANDAR",
    description: "Implementamos, probamos y acompañamos el funcionamiento.",
    isTop: false,
  },
];

export default function Timeline({
  title = "CÓMO TRABAJAMOS",
  subtitle = "No empezamos construyendo. Empezamos escuchando.",
  periodLabel = "PROCESO · 01 — 04",
  textColor = "#F2EEE6",
  mutedTextColor = "#8FA6CF",
  activeColor = "#38BDF8",
  backgroundColor = "#071725",
  imageUrl = "/images/river-delta.jpg",
  imageAlt = "Vista aérea de los humedales y brazos del río Uruguay en Entre Ríos",
  steps = defaultProcessSteps,
  duration,
  scrollDuration = 1.2,
}: TimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wholeSliderRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const animationDuration = duration ?? scrollDuration;
  const normalizedDuration = Math.max(0.2, animationDuration);

  const topJourneyData = steps.filter((s) => s.isTop);
  const bottomJourneyData = steps.filter((s) => !s.isTop);
  const allJourneyItems = [...steps];

  const sectionStyle: CSSProperties = {
    color: textColor,
    backgroundColor,
  };
  const activeStyle: CSSProperties = {
    backgroundColor: activeColor,
  };
  const mutedTextStyle: CSSProperties = {
    color: mutedTextColor,
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const isMobile = window.innerWidth < 768;
      const slidePercent = isMobile ? -68 : -55;
      const lineWidth = isMobile ? "80%" : "98%";

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
        defaults: {
          ease: "none",
        },
      });

      tl.fromTo(
        wholeSliderRef.current,
        { xPercent: 0 },
        { xPercent: slidePercent }
      );

      if (reducedMotion) {
        gsap.set(".journey-line", { width: lineWidth });
        return;
      }

      gsap.to(".journey-line", {
        width: lineWidth,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
        },
      });
    },
    { dependencies: [reducedMotion], scope: sectionRef }
  );

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const items = allJourneyItems;

      if (reducedMotion) {
        items.forEach((item) => {
          gsap.set(`.jl-${item.id}`, { scaleY: 1 });
          gsap.set(`.jd-${item.id}`, { scale: 1 });
          gsap.set(`.card-${item.id}`, { opacity: 1, y: 0 });
        });
        return;
      }

      items.forEach((item) => {
        gsap.set(`.jl-${item.id}`, {
          scaleY: 0,
          transformOrigin: item.isTop ? "bottom center" : "top center",
        });
        gsap.set(`.jd-${item.id}`, { scale: 0 });
        gsap.set(`.card-${item.id}`, {
          opacity: 0.15,
          y: item.isTop ? 20 : -20,
        });
      });

      // Sequential reveal positions based on timeline scroll
      const positions: ReadonlyArray<readonly [number, number]> =
        window.innerWidth < 768
          ? [
              [8, 22],
              [24, 38],
              [40, 54],
              [56, 72],
            ]
          : [
              [6, 22],
              [22, 38],
              [38, 54],
              [54, 70],
            ];

      items.forEach((item, index) => {
        const [startPos, endPos] = positions[index] || [
          8 + index * 16,
          24 + index * 16,
        ];
        const lineSelector = `.jl-${item.id}`;
        const dotSelector = `.jd-${item.id}`;
        const cardSelector = `.card-${item.id}`;

        const itemTl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: `${startPos}% top`,
            end: `${endPos}% top`,
            scrub: 0.6,
          },
        });

        itemTl
          .to(lineSelector, {
            scaleY: 1,
            duration: 0.4,
            ease: "power2.out",
          })
          .to(
            dotSelector,
            {
              scale: 1,
              duration: 0.3,
              ease: "back.out(2)",
            },
            "<0.1"
          )
          .to(
            cardSelector,
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
            },
            "<0.1"
          );
      });

      const handleResize = () => {
        ScrollTrigger.refresh();
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    { dependencies: [normalizedDuration, reducedMotion], scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="proceso"
      className="h-[280svh] max-[767px]:h-[400svh] w-full relative isolation-isolate"
      style={sectionStyle}
      aria-labelledby="process-title"
    >
      {/* Pinned Viewport Container */}
      <div className="h-screen w-screen sticky top-0 flex items-center overflow-hidden">
        {/* Horizontal Sliding Track */}
        <div
          ref={wholeSliderRef}
          className="flex h-[38vw] w-[240vw] items-center gap-[4vw] px-[4vw] max-[767px]:h-[84vh] max-[767px]:w-[580vw] max-[767px]:px-[6vw]"
        >
          {/* Leading Media Card */}
          <div className="relative h-full w-[26vw] shrink-0 overflow-hidden rounded-[1.2vw] border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-[767px]:h-[56vw] max-[767px]:w-[78vw] max-[767px]:rounded-[4vw]">
            <img
              src={imageUrl}
              alt={imageAlt}
              draggable={false}
              className="h-full w-full object-cover filter brightness-[0.92] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071725] via-[#071725]/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-[1.8vw] left-[1.8vw] right-[1.8vw] max-[767px]:bottom-[4vw] max-[767px]:left-[4vw]">
              <span className="inline-flex items-center gap-2 font-mono text-[0.85vw] font-semibold tracking-wider text-[#38BDF8] uppercase max-[767px]:text-[3vw]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
                {periodLabel}
              </span>
            </div>
          </div>

          {/* Timeline Stems and Content */}
          <div className="relative h-full flex-1">
            {/* Glowing Central Horizon Line */}
            <div className="w-full absolute left-0 top-[50%] -translate-y-1/2 flex items-center h-fit pointer-events-none z-10">
              <div
                className="h-[.85vw] w-[.85vw] max-[767px]:h-[2.4vw] max-[767px]:w-[2.4vw] rounded-full shadow-[0_0_12px_#38BDF8]"
                style={activeStyle}
              />
              <div
                className="h-[2px] w-[0%] journey-line shadow-[0_0_14px_rgba(56,189,248,0.7)]"
                style={activeStyle}
              />
              <div
                className="h-[.85vw] w-[.85vw] max-[767px]:h-[2.4vw] max-[767px]:w-[2.4vw] rounded-full shadow-[0_0_12px_#38BDF8]"
                style={activeStyle}
              />
            </div>

            {/* TOP HALF (Header Title + Top Steps 01 & 03) */}
            <div className="flex h-1/2 w-full items-end pb-[2.6vw] justify-start gap-[1vw] max-[767px]:pb-[6vw]">
              {/* Section Header Text */}
              <div className="h-full w-[24vw] shrink-0 flex flex-col justify-end pb-[0.8vw] max-[767px]:w-[70vw]">
                <span className="font-mono text-[0.9vw] font-semibold tracking-[0.14em] text-[#7FA6CF] uppercase mb-2.5 max-[767px]:text-[3.2vw]">
                  {title}
                </span>
                <h2
                  id="process-title"
                  className="font-display text-[2.4vw] font-bold leading-[1.04] tracking-tight text-[#F2EEE6] max-[767px]:text-[6.8vw]"
                >
                  {subtitle}
                </h2>
              </div>

              {/* Steps (01 & 03) */}
              <div className="flex h-full items-end gap-x-[18vw] ml-[6vw] max-[767px]:gap-x-[40vw] max-[767px]:ml-[8vw]">
                {topJourneyData.map((item) => (
                  <div
                    key={`top-${item.id}`}
                    className="relative h-full w-[23vw] shrink-0 px-[1.5vw] max-[767px]:w-[58vw] max-[767px]:px-[4vw]"
                  >
                    {/* Stem & Node going up from center line */}
                    <div className="w-full absolute left-0 bottom-0 top-0 h-full pointer-events-none">
                      <div
                        className={`size-[1vw] max-[767px]:size-[2.6vw] -translate-x-1/2 relative aspect-square rounded-full jd-${item.id} ring-4 ring-[#38BDF8]/20 shadow-[0_0_14px_#38BDF8]`}
                        style={activeStyle}
                      />
                      <div
                        className={`h-[94%] w-[2px] origin-bottom rounded-full jl-${item.id} shadow-[0_0_8px_rgba(56,189,248,0.5)]`}
                        style={activeStyle}
                      />
                    </div>

                    {/* Step Card Content */}
                    <div className={`card-${item.id} space-y-[0.6vw] max-[767px]:space-y-[2vw]`}>
                      <span className="font-mono text-[1.2vw] font-bold tracking-wider text-[#38BDF8] block max-[767px]:text-[4vw]">
                        {item.number}
                      </span>
                      <h3 className="font-display text-[2vw] font-bold tracking-tight leading-tight text-[#F2EEE6] max-[767px]:text-[5.6vw]">
                        {item.title}
                      </h3>
                      <p
                        className="w-[95%] text-[1.05vw] font-normal leading-[1.4] text-[#A1B2C6] max-[767px]:text-[3.6vw]"
                        style={mutedTextStyle}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM HALF (Period Label + Bottom Steps 02 & 04) */}
            <div className="h-1/2 flex items-start pt-[2.6vw] justify-start w-full max-[767px]:pt-[6vw]">
              {/* Bottom Intro Subtext */}
              <div className="w-[24vw] shrink-0 pt-[1.2vw] max-[767px]:w-[70vw]">
                <p
                  className="font-mono text-[1vw] uppercase tracking-[0.14em] text-[#7FA6CF] font-semibold max-[767px]:text-[3.4vw]"
                  style={mutedTextStyle}
                >
                  {periodLabel}
                </p>
                <p className="text-[0.9vw] text-[#7FA6CF]/70 mt-1.5 max-[767px]:text-[3vw]">
                  Deslizá para descubrir cada etapa del camino
                </p>
              </div>

              {/* Steps (02 & 04) */}
              <div className="flex h-full items-start gap-x-[18vw] ml-[20vw] max-[767px]:gap-x-[40vw] max-[767px]:ml-[26vw]">
                {bottomJourneyData.map((item) => (
                  <div
                    key={`bottom-${item.id}`}
                    className="relative h-full w-[23vw] shrink-0 px-[1.5vw] max-[767px]:w-[58vw] max-[767px]:px-[4vw]"
                  >
                    {/* Stem & Node going down from center line */}
                    <div className="w-full absolute left-0 top-0 h-full pointer-events-none">
                      <div
                        className={`h-[94%] origin-top w-[2px] rounded-full max-[767px]:h-full jl-${item.id} shadow-[0_0_8px_rgba(56,189,248,0.5)]`}
                        style={activeStyle}
                      />
                      <div
                        className={`size-[1vw] max-[767px]:size-[2.6vw] -translate-x-1/2 relative aspect-square rounded-full jd-${item.id} ring-4 ring-[#38BDF8]/20 shadow-[0_0_14px_#38BDF8]`}
                        style={activeStyle}
                      />
                    </div>

                    {/* Step Card Content */}
                    <div className={`card-${item.id} flex h-full w-full flex-col justify-start space-y-[0.6vw] pt-[1.8vw] max-[767px]:pt-[4vw] max-[767px]:space-y-[2vw]`}>
                      <span className="font-mono text-[1.2vw] font-bold tracking-wider text-[#38BDF8] block max-[767px]:text-[4vw]">
                        {item.number}
                      </span>
                      <h3 className="font-display text-[2vw] font-bold tracking-tight leading-tight text-[#F2EEE6] max-[767px]:text-[5.6vw]">
                        {item.title}
                      </h3>
                      <p
                        className="w-[95%] text-[1.05vw] font-normal leading-[1.4] text-[#A1B2C6] max-[767px]:text-[3.6vw]"
                        style={mutedTextStyle}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
