"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type ThemeBoundary = { top: number; element: HTMLElement };

/** One discrete colour switch per boundary. Large section backgrounds never repaint on scroll. */
export function ThemeController() {
  const pathname = usePathname();
  useEffect(() => {
    let boundaries: ThemeBoundary[] = [];
    let current: HTMLElement | undefined;
    let frame = 0;
    let measureFrame = 0;
    let alive = true;
    let started = false;
    let stripeObserver: IntersectionObserver | undefined;
    let resize: ResizeObserver | undefined;
    let mutations: MutationObserver | undefined;
    const root = document.documentElement;

    const update = () => {
      frame = 0;
      if (!alive || !started) return;
      const y = window.scrollY + 80;
      let low = 0;
      let high = boundaries.length - 1;
      let index = 0;
      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if ((boundaries[middle]?.top ?? Infinity) <= y) { index = middle; low = middle + 1; }
        else high = middle - 1;
      }
      const next = boundaries[index]?.element;
      if (!next || next === current) return;
      current = next;
      const style = getComputedStyle(next);
      const background = style.backgroundColor;
      const foreground = style.color;
      const numbers = background.match(/[\d.]+/g)?.map(Number);
      const luminance = numbers?.length ? ((numbers[0] ?? 0) * 0.2126 + (numbers[1] ?? 0) * 0.7152 + (numbers[2] ?? 0) * 0.0722) : 255;
      const dark = luminance < 135;
      const palette = getComputedStyle(root);
      const cursorColor = palette.getPropertyValue(dark ? "--bridge-on-dark" : "--bridge").trim();
      root.dataset.nav = dark ? "dark" : "light";
      root.dataset.currentTheme = next.dataset.theme ?? (dark ? "ink" : "cream");
      root.style.setProperty("--nav-bg", background);
      root.style.setProperty("--nav-fg", foreground);
      root.style.setProperty("--nav-line", dark ? "rgb(242 238 230 / 22%)" : "rgb(17 17 17 / 16%)");
      root.style.setProperty("--cursor-color", cursorColor);
    };
    const schedule = () => { if (alive && started && !frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      measureFrame = 0;
      if (!alive || !started) return;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[data-theme], footer[data-theme]"));
      boundaries = sections.map((element) => {
        const positionElement = element.tagName === "FOOTER" && element.closest<HTMLElement>(".site-shell")?.dataset.footerCurtain === "true"
          ? document.querySelector<HTMLElement>("[data-footer-sentinel]") ?? element
          : element.parentElement?.classList.contains("pin-spacer") ? element.parentElement : element;
        return { element, top: positionElement.getBoundingClientRect().top + window.scrollY };
      }).sort((a, b) => a.top - b.top);
      stripeObserver?.disconnect();
      stripeObserver = new IntersectionObserver(schedule, { rootMargin: `-80px 0px -${Math.max(0, innerHeight - 81)}px 0px`, threshold: 0 });
      sections.forEach((section) => stripeObserver?.observe(section));
      current = undefined;
      update();
    };
    const scheduleMeasure = () => { if (alive && started && !measureFrame) measureFrame = requestAnimationFrame(measure); };
    const begin = () => {
      if (!alive || started) return;
      started = true;
      window.removeEventListener("scroll", begin);
      const main = document.querySelector("main");
      resize = new ResizeObserver(scheduleMeasure);
      if (main) resize.observe(main);
      mutations = new MutationObserver(scheduleMeasure);
      if (main) mutations.observe(main, { childList: true, subtree: true });
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", scheduleMeasure, { passive: true });
      window.addEventListener("dos-orillas:refresh", scheduleMeasure);
      document.fonts.ready.then(scheduleMeasure);
      // Read fresh bounds after the first scroll, including any earlier font or
      // viewport changes. CSS supplies the cream hero palette until this point.
      scheduleMeasure();
    };
    window.addEventListener("scroll", begin, { passive: true, once: true });
    const restoredObserver = new IntersectionObserver(([entry]) => {
      if (entry && entry.boundingClientRect.top < 0) begin();
    });
    const sentinel = document.querySelector('.nav-sentinel');
    if (sentinel) restoredObserver.observe(sentinel);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(measureFrame);
      stripeObserver?.disconnect();
      restoredObserver.disconnect();
      resize?.disconnect();
      mutations?.disconnect();
      window.removeEventListener("scroll", begin);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("dos-orillas:refresh", scheduleMeasure);
      delete root.dataset.nav;
      delete root.dataset.currentTheme;
      ["--nav-bg", "--nav-fg", "--nav-line", "--cursor-color"].forEach((property) => root.style.removeProperty(property));
    };
  }, [pathname]);
  return null;
}
