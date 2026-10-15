/** Lightweight facade. Importing this file does not include the GSAP runtime. */
import type { OptionalPluginName } from "./gsap-runtime";

export type GSAPRuntime = typeof import("./gsap-runtime");
export type { OptionalPluginName } from "./gsap-runtime";

let runtimePromise: Promise<GSAPRuntime> | null = null;

export function loadGSAP(): Promise<GSAPRuntime> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Motion runtime can only load in the browser."));
  }
  runtimePromise ??= import("./gsap-runtime").catch((error: unknown) => {
    runtimePromise = null;
    throw error;
  });
  return runtimePromise;
}

export async function loadOptionalPlugin<Name extends OptionalPluginName>(name: Name) {
  const runtime = await loadGSAP();
  return runtime.loadOptionalPlugin(name);
}
