"use client";

import { useEffect, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { chapters, type ChapterId } from "@/content/site";
import { useMotion } from "@/components/motion/MotionProvider";
const subscribeHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

export function ScrollProgress() {
  const { reduced, ready } = useMotion();
  const hydrated = useSyncExternalStore(subscribeHydration, clientHydrated, serverHydrated);
  const initialChapter = chapters[0];
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const rail = railRef.current;
    const fill = fillRef.current;
    const label = labelRef.current;
    if (!rail || !fill || !label || !ready) return;
    // One cached range and one transform write per scroll frame.
    const nativeTimeline = false;
    const horizontal = matchMedia("(max-width: 767px)");
    let positions: Array<{ top: number; id: ChapterId; number: string; label: string }> = [];
    let range = 1;
    let current = "";
    let frame = 0;
    let measureFrame = 0;
    let labelTimer = 0;
    let started = false;
    let disposed = false;
    let startFrame = 0;
    let observer: ResizeObserver | undefined;
    let mutations: MutationObserver | undefined;
    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      if (!nativeTimeline && !reduced) fill.style.transform = `${horizontal.matches ? "scaleX" : "scaleY"}(${Math.min(1, y / range)})`;
      let index = 0;
      positions.forEach((position, i) => { if (position.top <= y + innerHeight * 0.3) index = i; });
      const chapter = positions[index];
      if (!chapter || chapter.id === current) return;
      current = chapter.id;
      rail.dataset.chapter = chapter.id;
      label.textContent = `${chapter.number} ${chapter.label}`;
      label.dataset.show = "true";
      clearTimeout(labelTimer);
      labelTimer = window.setTimeout(() => { label.dataset.show = "false"; }, 1400);
      rail.querySelectorAll<HTMLElement>(".scroll-progress-mark").forEach((mark) => { mark.dataset.active = String(mark.dataset.chapter === current); });
      window.dispatchEvent(new CustomEvent<ChapterId>("dos-orillas:chapter", { detail: chapter.id }));
    };
    const schedule = () => { if (started && !frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      measureFrame = 0;
      range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      positions = chapters.flatMap((chapter) => {
        const section = chapter.sections.map((id) => document.getElementById(id)).find(Boolean) ?? document.getElementById(chapter.id);
        if (!section) return [];
        const measured = section.parentElement?.classList.contains("pin-spacer") ? section.parentElement : section;
        const top = measured.getBoundingClientRect().top + window.scrollY;
        const mark = rail.querySelector<HTMLElement>(`[data-chapter="${chapter.id}"]`);
        mark?.style.setProperty("--chapter-position", `${Math.min(100, Math.max(0, top / range * 100))}%`);
        return [{ top, id: chapter.id, number: chapter.number, label: chapter.label }];
      });
      current = "";
      update();
    };
    const scheduleMeasure = () => { if (started && !measureFrame) measureFrame = requestAnimationFrame(measure); };
    const begin = () => {
      if (disposed || started || startFrame) return;
      window.removeEventListener("scroll", begin);
      startFrame = requestAnimationFrame(() => {
        startFrame = 0;
        if (disposed) return;
        started = true;
        observer = new ResizeObserver(scheduleMeasure);
        const shell = rail.closest(".site-shell");
        if (shell) observer.observe(shell);
        mutations = new MutationObserver(scheduleMeasure);
        const main = document.querySelector("main");
        if (main) mutations.observe(main, { childList: true, subtree: true });
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", scheduleMeasure, { passive: true });
        window.addEventListener("dos-orillas:refresh", scheduleMeasure);
        horizontal.addEventListener("change", scheduleMeasure);
        void document.fonts.ready.then(() => { if (!disposed) scheduleMeasure(); }).catch(() => {});
        measure();
      });
    };
    window.addEventListener("scroll", begin, { passive: true, once: true });
    // A restored position or hash has already passed the native-scroll boundary.
    const restoredObserver = new IntersectionObserver(([entry]) => {
      if (entry && entry.boundingClientRect.top < 0) begin();
    });
    const sentinel = document.querySelector('.nav-sentinel');
    if (sentinel) restoredObserver.observe(sentinel);
    return () => {
      disposed = true;
      started = false;
      window.removeEventListener("scroll", begin);
      cancelAnimationFrame(startFrame);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measureFrame);
      clearTimeout(labelTimer);
      observer?.disconnect();
      restoredObserver.disconnect();
      mutations?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("dos-orillas:refresh", scheduleMeasure);
      horizontal.removeEventListener("change", scheduleMeasure);
      fill.style.transform = "";
    };
  }, [ready, reduced]);

  return <div ref={railRef} className="scroll-progress-rail" aria-hidden="true" data-reduced={!hydrated || reduced} data-native="false" data-chapter={initialChapter.id}><span ref={fillRef} className="scroll-progress-fill" />{chapters.map((chapter, index) => <span key={chapter.id} className="scroll-progress-mark" data-chapter={chapter.id} data-active={chapter.id === initialChapter.id} style={{ "--chapter-position": `${index * 25}%` } as CSSProperties} />)}<span ref={labelRef} className="scroll-progress-label mono" data-show="true">{initialChapter.number} {initialChapter.label}</span></div>;
}
