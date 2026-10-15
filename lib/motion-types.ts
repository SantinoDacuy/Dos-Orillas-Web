import type Lenis from "lenis";

declare global {
  interface Window {
    __stCount?: number;
    __lenis?: Lenis;
  }
}

export {};
