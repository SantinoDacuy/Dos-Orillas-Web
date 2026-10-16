"use client"

// A full-bleed editorial hero driven by a filmstrip.
import * as React from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion"

import { cn } from "@/lib/utils"

export interface HeroCarouselItem {
  /** Stable key; falls back to the index. @default undefined */
  id?: string | number
  /** Headline for the active slide. Newlines become separate reveal lines. */
  title?: string
  /** Image URL, used both in the card and as the graded background. */
  image: string
  /** Byline printed beside the headline, e.g. "BY AURELIA STUDIO." @default undefined */
  credit?: string
  /** Right-aligned facts, e.g. ["SAT NOV 15", "5-10 PM", "MIAMI"]. @default undefined */
  meta?: string[]
  /**
   * CSS colour the background is graded to. The photo keeps its luminance and
   * takes this hue, which is what makes the backdrop swing on every change.
   * @default "#071725"
   */
  accent?: string
}

export interface HeroCarouselProps {
  /** Slides, in strip order. */
  items: HeroCarouselItem[]
  /** Focused slide when controlled. Leave unset for internal state. @default undefined */
  index?: number
  /** Focused slide on mount when uncontrolled. @default 0 */
  defaultIndex?: number
  /** Fires on every focus change, from any input. @default undefined */
  onIndexChange?: (index: number) => void
  /** Wordmark in the middle of the top bar. @default undefined */
  brand?: React.ReactNode
  /** Renders the "Back" control when provided. @default undefined */
  onBack?: () => void
  /** Renders the "Menu" control when provided. @default undefined */
  onMenu?: () => void
  /** Advance on a timer. Pauses on hover, drag and focus. @default false */
  autoplay?: boolean
  /** Milliseconds between autoplay steps. @default 4000 */
  autoplayDelay?: number
  /** Extra classes for the stage. @default undefined */
  className?: string
  /** Enable mouse wheel hijacking to step carousel. @default false */
  enableWheel?: boolean
}

/* Film grain, as a self-contained SVG so the component carries no assets. */
export const CAROUSEL_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

export interface FilmstripTrackProps {
  items: HeroCarouselItem[]
  index: number
  onChange: (index: number) => void
  className?: string
  cardHeight?: number
}

/**
 * Standalone manual filmstrip track that moves horizontally via drag or click.
 * Never intercepts page scroll / wheel events.
 */
export function FilmstripTrack({
  items,
  index,
  onChange,
  className,
  cardHeight = 280,
}: FilmstripTrackProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerW, setContainerW] = React.useState(0)
  const [dragging, setDragging] = React.useState(false)
  const reduced = useReducedMotion()

  const last = items.length - 1

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const read = () => setContainerW(el.clientWidth)
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const fullH = cardHeight
  const halfH = fullH * 0.52
  const cardW = fullH * 0.75
  const gap = 16
  const step = cardW + gap

  const xFor = React.useCallback(
    (i: number) => containerW / 2 - (i * step + cardW / 2),
    [containerW, step, cardW]
  )

  const x = useMotionValue(0)
  const target = xFor(index)

  const spring = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 280, damping: 32, mass: 0.9 }

  React.useEffect(() => {
    if (dragging) return
    const run = animate(x, target, spring)
    return () => run.stop()
  }, [target, dragging, reduced, x]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden select-none py-4", className)}
      style={{ height: fullH + 70 }}
    >
      {/* ── The filmstrip row ── */}
      <motion.div
        className="flex items-start cursor-grab active:cursor-grabbing"
        style={{ gap, x }}
        drag="x"
        dragMomentum={false}
        dragElastic={0.08}
        dragConstraints={{ left: xFor(last), right: xFor(0) }}
        onDragStart={() => setDragging(true)}
        onDragEnd={(_, info) => {
          setDragging(false)
          const thrown = x.get() + info.velocity.x * 0.12
          const next = clamp(
            Math.round((containerW / 2 - thrown - cardW / 2) / step),
            0,
            last
          )
          onChange(next)
        }}
      >
        {items.map((item, i) => {
          const isFocused = i === index
          return (
            <motion.button
              key={item.id ?? i}
              type="button"
              suppressHydrationWarning
              aria-label={item.title || `Slide ${i + 1}`}
              aria-current={isFocused}
              onClick={() => onChange(i)}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-none border-0 transition-all cursor-pointer",
                isFocused
                  ? "shadow-[0_28px_60px_-12px_rgba(0,0,0,0.95),0_14px_28px_-6px_rgba(0,0,0,0.8)] z-10"
                  : "shadow-[0_16px_36px_-8px_rgba(0,0,0,0.85)] opacity-85 hover:opacity-100"
              )}
              style={{ width: cardW }}
              animate={{ height: isFocused ? fullH : halfH }}
              transition={spring}
            >
              <img
                src={item.image}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 30%" }}
              />
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-black"
                animate={{ opacity: isFocused ? 0 : 0.28 }}
                transition={spring}
              />
              {item.title ? (
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-left transition-opacity",
                    isFocused ? "opacity-100" : "opacity-0"
                  )}
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                    {item.meta?.[0] ?? "PROYECTO"}
                  </p>
                  <p className="font-medium text-xs text-white truncate">
                    {item.title}
                  </p>
                </div>
              ) : null}
            </motion.button>
          )
        })}
      </motion.div>

      {/* ── Position Rail ── */}
      <div className="mx-auto mt-4 max-w-xs px-4">
        <div className="flex justify-between font-mono text-[11px] tabular-nums text-slate-400">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="text-cyan-400 tracking-wider">
            {items[index]?.title ?? "DESLIZÁ O TOCÁ PARA NAVEGAR"}
          </span>
          <span>{String(items.length).padStart(2, "0")}</span>
        </div>
        <div className="relative mt-1.5 h-1 w-full rounded-full bg-white/15 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 rounded-full bg-cyan-400 shadow-[0_0_10px_#38bdf8]"
            style={{ width: `${100 / items.length}%` }}
            animate={{ left: `${(index / items.length) * 100}%` }}
            transition={spring}
          />
        </div>
      </div>
    </div>
  )
}

/** Full-featured Hero Carousel component */
export function HeroCarousel({
  items,
  index: controlled,
  defaultIndex = 0,
  onIndexChange,
  brand,
  onBack,
  onMenu,
  autoplay = false,
  autoplayDelay = 4000,
  enableWheel = false,
  className,
}: HeroCarouselProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultIndex)
  const last = items.length - 1
  const index = clamp(controlled ?? uncontrolled, 0, Math.max(0, last))

  const go = React.useCallback(
    (next: number) => {
      const clamped = clamp(next, 0, Math.max(0, last))
      if (controlled === undefined) setUncontrolled(clamped)
      if (clamped !== index) onIndexChange?.(clamped)
    },
    [controlled, index, last, onIndexChange]
  )

  const active = items[index]
  if (!active) return null

  const accent = active.accent ?? "#071725"

  return (
    <div
      className={cn(
        "relative h-full min-h-[24rem] w-full overflow-hidden bg-black text-white select-none",
        className
      )}
    >
      {/* Background */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <motion.img
            src={active.image}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1.05 }}
            transition={{ duration: 6, ease: "linear" }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: accent, mixBlendMode: "color" }}
          />
          <div
            className="absolute inset-0 opacity-60"
            style={{ backgroundColor: accent, mixBlendMode: "multiply" }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-overlay"
        style={{ backgroundImage: CAROUSEL_GRAIN, backgroundSize: "180px 180px" }}
      />

      {/* Top bar */}
      {(brand || onBack || onMenu) && (
        <div className="absolute inset-x-0 top-6 flex items-center justify-center gap-8 z-10 text-xs font-mono">
          {onBack && (
            <button
              type="button"
              suppressHydrationWarning
              onClick={onBack}
              className="opacity-80 hover:opacity-100 cursor-pointer"
            >
              ← Atrás
            </button>
          )}
          {brand && <div className="font-semibold tracking-widest">{brand}</div>}
          {onMenu && (
            <button
              type="button"
              suppressHydrationWarning
              onClick={onMenu}
              className="opacity-80 hover:opacity-100 cursor-pointer"
            >
              Menú ☰
            </button>
          )}
        </div>
      )}

      {/* Filmstrip */}
      <div className="absolute inset-x-0 bottom-6 z-10">
        <FilmstripTrack items={items} index={index} onChange={go} />
      </div>
    </div>
  )
}
