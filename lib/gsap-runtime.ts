/** Internal deferred runtime; registration is centralized in this one chunk. */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

let registered = false;

export function registerMotionCore(): void {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);
  CustomEase.create("orilla", "0.76,0,0.24,1");
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}

registerMotionCore();

const optionalLoaders = {
  SplitText: async () => (await import("gsap/SplitText")).SplitText,
  Flip: async () => (await import("gsap/Flip")).Flip,
  Draggable: async () => (await import("gsap/Draggable")).Draggable,
  MotionPathPlugin: async () => (await import("gsap/MotionPathPlugin")).MotionPathPlugin,
  DrawSVGPlugin: async () => (await import("gsap/DrawSVGPlugin")).DrawSVGPlugin,
} as const;

export type OptionalPluginName = keyof typeof optionalLoaders;
type OptionalPlugins = {
  [Name in OptionalPluginName]: Awaited<ReturnType<(typeof optionalLoaders)[Name]>>;
};
const optionalCache = new Map<OptionalPluginName, Promise<unknown>>();

/** Optional plugins have their own chunks and are registered only on demand. */
export function loadOptionalPlugin<Name extends OptionalPluginName>(
  name: Name,
): Promise<OptionalPlugins[Name]> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Motion plugins can only load in the browser."));
  }
  registerMotionCore();
  const cached = optionalCache.get(name);
  if (cached) return cached as Promise<OptionalPlugins[Name]>;
  const loading = optionalLoaders[name]().then((plugin) => {
    gsap.registerPlugin(plugin);
    return plugin;
  }).catch((error: unknown) => {
    optionalCache.delete(name);
    throw error;
  });
  optionalCache.set(name, loading);
  return loading as Promise<OptionalPlugins[Name]>;
}

export function syncTriggerCount(): number {
  const count = ScrollTrigger.getAll().length;
  if (typeof window !== "undefined") window.__stCount = count;
  return count;
}

export function motionDebugEnabled(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");
}

export { gsap, ScrollTrigger, CustomEase, useGSAP };
