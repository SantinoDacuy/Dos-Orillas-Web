"use client";

// A portfolio index built as a wheel you turn.
//
// At rest the work sits in a ring around a title, each card tangent to the
// circle. The first notch of scroll blows the ring open into a vertical drum:
// the card at the front lies flat and full size, the ones above and below
// rotate away into hard perspective and run off the top and bottom of the
// frame. Keep turning and the drum carries the next piece round to the front.
//
// The whole thing is one number - `turn` - read by a single rAF pass that writes
// transforms straight to the DOM. 0 is the ring, 1 is the drum with item 0 at
// the front, and every whole number after that is one more item turned past.
import * as React from "react";
import { cn } from "@/lib/utils";

export interface WorksWheelItem {
  /** Project name. Shown beside the front card and in the index. */
  title: string;
  /** Cover art. Any src an <img> takes. */
  image: string;
  /** Where the card links to. Omit for a wheel that only browses. */
  href?: string;
  /** Category or subtitle */
  category?: string;
  /** Description */
  description?: string;
  /** Technologies used */
  technologies?: readonly string[];
}

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children"
> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. @default undefined */
  label?: string;
  /** Label on the card's hover affordance. Omit to drop it. @default undefined */
  action?: string;
  onActiveChange?: (index: number) => void;
}

/* Geometry. The card is measured against the stage; everything else is measured
   against the card, so a narrow stage - where the card is capped by width, not
   height - scales the whole wheel down with it instead of leaving a small card
   swinging on a huge drum. The three that matter are tuned together: STEP
   against DRUM sets how hard the neighbours rotate away, and DRUM against LENS
   decides whether they land inside the frame or run off it. */
const CARD_H = 0.44; // front card height, of the stage
const CARD_MAX_W = 0.42; // ... but never wider than this much of the stage
const CARD_RATIO = 1.45; // card width / height
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights - and everything below likewise
const LENS = 2.7; // perspective distance
const RING_R = 1.14; // ring radius
/* The drum alone hangs the work on a plumb line. It isn't one: the strip curves
   away round an arc whose centre sits off to the LEFT, so the piece at the front
   is at the arc's near point - dead centre - and its neighbours have already
   swung back left as well as up and down. BOW is that arc's radius; nothing else
   makes the difference between a stack of cards and a wheel seen side on. */
const BOW = 1.82;
const TITLE = 0.124; // ring label and front-card title
const INDEX = 0.04; // the index down the right-hand side
/** Items either side of the front still worth drawing. Past this a card is
    edge-on, and further round it would stack up on the vanishing point. */
const CULL = 1.6;

/** How much of a wheel-notch or a dragged pixel counts as one item. */
const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
/** Quiet time after the last wheel event before the wheel settles on an item. */
const SETTLE = 140;
/** Fraction of the remaining distance closed each frame. 1 = no smoothing. */
const EASE = 0.12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Stage = { w: number; h: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** How far left the arc has carried something that has turned `drumDeg` off the
    front. Zero at the front, so the piece being read stays centred. */
const bowAt = (drumDeg: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDeg)));

/** Both states in one chain: the ring terms fall away as `m` reaches the drum,
    and the drum terms are still zero while the ring is up. The bow is applied
    first, in the wheel's own plane, so it slides the card sideways rather than
    turning with it - and perspective still shrinks it with distance. */
function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number,
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export function WorksWheel({
  items,
  label = "PROYECTOS",
  action = "Ver proyecto",
  onActiveChange,
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  // The wheel's position, and where it is heading. Only `active` is state -
  // everything else is written to the DOM, so turning the wheel is not a render.
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);

  // Read after mount, not during render: the server has no matchMedia, and
  // branching on it inline is a hydration mismatch. Reduced motion drops the
  // easing, so the wheel lands where it is put instead of gliding there.
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const cardW = Math.min(h * CARD_H * CARD_RATIO, w * CARD_MAX_W);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    // Shrink the ring's cards until the circle reads as a closed loop rather
    // than beads on a wire, however many pieces the wheel is given.
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: cardH * TITLE,
      index: cardH * INDEX,
    };
  }, [stage, count]);

  // One pass per frame: ease toward the target, then write every transform.
  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      // The drum is pulled back so its front face lands on the picture plane.
      // That set-back has to arrive with the drum, or the ring would sit at the
      // far side of the perspective and render at half its size.
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m,
          );
          // Culled by distance, not by angle: at a full turn the far side comes
          // back round to face us, and everything past the neighbours lands on
          // the vanishing point in a heap.
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(1 - m);
      if (titleRef.current) titleRef.current.style.opacity = String(m);
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => {
        if (prev !== near) {
          onActiveChange?.(near);
          return near;
        }
        return prev;
      });
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced, onActiveChange]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last],
  );

  // Native listener, because the wheel has to be cancellable - and it only
  // cancels while it still has somewhere to go, so the page scrolls on at
  // either end instead of trapping the reader.
  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const next = target.current + event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) event.preventDefault();
      to(next);
      // Settle onto an item.
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(
        () => to(Math.round(target.current)),
        SETTLE,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settling.current);
    };
  }, [to, last]);

  const drag = React.useRef<number | null>(null);
  const settling = React.useRef(0);

  const currentItem = items[active];

  return (
    <div
      aria-label={label}
      className={cn(
        "relative h-full min-h-[36rem] lg:min-h-[46rem] w-full overflow-hidden select-none bg-transparent text-[#F2EEE6]",
        className,
      )}
      {...props}
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="listbox"
        aria-label={label}
        aria-activedescendant={`works-wheel-${active}`}
        className="absolute inset-0 cursor-grab touch-pan-x outline-none active:cursor-grabbing"
        style={{ perspective: `${metrics.depth}px` }}
        onPointerDown={(event) => {
          drag.current = event.clientY;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (drag.current === null) return;
          to(target.current + (drag.current - event.clientY) / DRAG_UNITS);
          drag.current = event.clientY;
        }}
        onPointerUp={() => {
          drag.current = null;
          if (target.current > 1) to(Math.round(target.current));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowRight") to(Math.round(target.current) + 1);
          else if (event.key === "ArrowUp" || event.key === "ArrowLeft") to(Math.round(target.current) - 1);
          else return;
          event.preventDefault();
        }}
      >
        <div
          ref={wheelRef}
          className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
        >
          {items.map((item, i) => {
            const isSelected = i === active;
            return (
              <div
                key={item.title}
                id={`works-wheel-${i}`}
                role="option"
                aria-selected={isSelected}
                ref={(node: HTMLElement | null) => {
                  cardRefs.current[i] = node;
                }}
                className="group absolute [backface-visibility:hidden] cursor-pointer"
                style={{
                  width: metrics.cardW,
                  height: metrics.cardH,
                  marginLeft: -metrics.cardW / 2,
                  marginTop: -metrics.cardH / 2,
                }}
                onClick={() => to(i + 1)}
              >
                {/* Sharp rectangular card without rounded corners, prominent border & shadow on active */}
                <div 
                  className={cn(
                    "relative block size-full overflow-hidden rounded-none border transition-all duration-300",
                    isSelected 
                      ? "border-[#38bdf8] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.25)] brightness-100" 
                      : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/30 brightness-75 hover:brightness-90 shadow-2xl"
                  )}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    draggable={false}
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Corner tag on card */}
                  <span className="mono absolute top-3 left-3 bg-[#071725]/85 backdrop-blur-md border border-white/15 px-2 py-0.5 text-[11px] text-[#38bdf8] tracking-widest">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {action && item.href ? (
                    <a
                      href={item.href}
                      onClick={(e) => e.stopPropagation()}
                      className="mono absolute right-3 bottom-3 flex items-center gap-1.5 bg-[#38bdf8] text-[#071725] px-3 py-1 text-[11px] font-semibold tracking-wider uppercase transition-all duration-200 hover:bg-[#7dd3fc] hover:scale-105"
                    >
                      <span>{action}</span>
                      <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden="true">
                        <path
                          d="M3 9 9 3M4 3h5v5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ring center title at rest */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center font-display font-semibold tracking-tighter text-[#F2EEE6]/80"
        style={{ fontSize: metrics.title }}
      >
        {label}
      </div>

      {/* Front-card info rendered directly on the background (no boxed rectangle), at the left */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute top-1/2 left-[5%] -translate-y-1/2 max-w-[340px] lg:max-w-[420px] opacity-0 transition-opacity duration-300"
      >
        {currentItem ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="mono text-xs text-[#38bdf8] tracking-widest">
                {String(active + 1).padStart(2, "0")} // {String(count).padStart(2, "0")}
              </span>
              {currentItem.category && (
                <>
                  <span className="text-white/30 text-xs">·</span>
                  <span className="mono text-xs uppercase text-white/70 tracking-wider">
                    {currentItem.category}
                  </span>
                </>
              )}
            </div>
            
            <h3 
              className="font-display font-semibold text-[#F2EEE6] tracking-tight leading-[1.05]"
              style={{ fontSize: `clamp(1.75rem, 3.5vw, 2.75rem)` }}
            >
              {currentItem.title}
            </h3>

            {currentItem.description && (
              <p className="text-sm lg:text-base text-white/75 leading-relaxed">
                {currentItem.description}
              </p>
            )}

            {currentItem.technologies && currentItem.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentItem.technologies.slice(0, 5).map((t) => (
                  <span
                    key={t}
                    className="mono text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 text-white/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {currentItem.href && (
              <div className="pt-2 pointer-events-auto">
                <a
                  href={currentItem.href}
                  className="mono inline-flex items-center gap-2 text-xs text-[#38bdf8] hover:text-white uppercase tracking-wider transition-colors duration-200"
                >
                  <span>Explorar caso completo</span>
                  <span>→</span>
                </a>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Index list on the right side - clean typography directly on background */}
      <ol
        className="absolute top-[8%] right-[4%] text-right leading-[1.8] mono z-10 hidden sm:block"
        style={{ fontSize: "clamp(11px, 1.2vw, 14px)" }}
      >
        {items.map((item, i) => (
          <li key={item.title}>
            <button
              type="button"
              onClick={() => to(i + 1)}
              className={cn(
                "cursor-pointer transition-all duration-200 outline-none hover:text-[#38bdf8]",
                i === active
                  ? "text-[#38bdf8] font-semibold translate-x-[-4px]"
                  : "text-white/40 hover:text-white/80",
              )}
            >
              <span className="text-[10px] opacity-60 mr-2">{String(i + 1).padStart(2, "0")}</span>
              {item.title}
            </button>
          </li>
        ))}
      </ol>

      {/* Bottom Hint */}
      <div className="mono absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-white/40 uppercase tracking-widest text-center pointer-events-none">
        Deslizá verticalmente o arrastrá para girar el tambor 3D
      </div>
    </div>
  );
}

export default WorksWheel;
