"use client";

import { useEffect, useRef } from "react";
import { motionCopy } from "@/content/site";
import { useMotion } from "@/components/motion/MotionProvider";

export function Cursor() {
  const { tier, reduced } = useMotion();
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor || reduced || tier < 2) return;
    const fine = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)");
    let frame = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let initialized = false;
    const tick = () => {
      frame = 0;
      x += (targetX - x) * 0.24;
      y += (targetY - y) * 0.24;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1 && !document.hidden && fine.matches) frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== "mouse" || document.hidden) return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!initialized) { x = targetX; y = targetY; initialized = true; }
      cursor.dataset.visible = "true";
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const contextual = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("input,textarea,select,[contenteditable='true']")) {
        cursor.dataset.visible = "false";
        cursor.dataset.state = "default";
        return;
      }
      const context = event.target.closest<HTMLElement>("[data-cursor]")?.dataset.cursor;
      const state = context === "ver" || context === "view" ? "view" : context === "drag" ? "drag" : event.target.closest("a,button") ? "link" : "default";
      cursor.dataset.state = state;
      if (labelRef.current) labelRef.current.textContent = state === "view" ? motionCopy.cursor.view : state === "drag" ? motionCopy.cursor.drag : "";
    };
    const hide = () => { cursor.dataset.visible = "false"; cancelAnimationFrame(frame); frame = 0; };
    const visibility = () => { if (document.hidden) hide(); };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", contextual, { passive: true });
    document.addEventListener("pointerleave", hide, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    fine.addEventListener("change", hide);
    return () => {
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", contextual);
      document.removeEventListener("pointerleave", hide);
      document.removeEventListener("visibilitychange", visibility);
      fine.removeEventListener("change", hide);
    };
  }, [tier, reduced]);

  return <div ref={ref} className="custom-cursor" aria-hidden="true" data-visible="false" data-state="default"><span className="custom-cursor-shape" /><span ref={labelRef} className="custom-cursor-label mono" /></div>;
}
