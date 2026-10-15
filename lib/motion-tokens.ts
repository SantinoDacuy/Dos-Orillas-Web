/** Seconds, percentages and easings shared by every motion scene. */
export const dur = { xs: 0.2, sm: 0.4, md: 0.7, lg: 1.1, xl: 1.6 } as const;
export const ease = {
  out: "expo.out",
  inOut: "orilla",
  soft: "power3.out",
  scrub: "none",
  feel: "power2.inOut",
} as const;
export const stagger = { lines: 0.08, words: 0.03, list: 0.06 } as const;
export const distance = { reveal: 110, parallax: 10, magnet: 0.25 } as const;
export const motionCssEase = {
  out: "cubic-bezier(.16,1,.3,1)",
  inOut: "cubic-bezier(.76,0,.24,1)",
  soft: "cubic-bezier(.22,1,.36,1)",
} as const;
export const motionLimits = {
  fullWidth: 1024,
  sampleMs: 2000,
  minimumFps: 45,
  revealViewport: 0.85,
  observerMargin: "0px 0px -10% 0px",
  lazyMargin: "400px 0px",
} as const;
