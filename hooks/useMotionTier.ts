"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MotionTier = 0 | 1 | 2 | 3;

export interface UseMotionTierResult {
  tier: MotionTier;
  reduced: boolean;
  ready: boolean;
  toggleMotion: () => void;
  downgrade: () => void;
}

type MotionConnection = EventTarget & {
  readonly saveData?: boolean;
};

type StorageKind = "localStorage" | "sessionStorage";

const MOTION_KEY = "dos-orillas:motion";
const SESSION_TIER_KEY = "dos-orillas:motion-tier";

function readStorage(kind: StorageKind, key: string): string | null {
  try {
    return window[kind].getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(kind: StorageKind, key: string, value: string): void {
  try {
    window[kind].setItem(key, value);
  } catch {
    // The in-memory preference still works when browser storage is unavailable.
  }
}

function listenToQuery(query: MediaQueryList, listener: () => void): () => void {
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }

  // Retain support for browsers with the older MediaQueryList API.
  query.addListener(listener);
  return () => query.removeListener(listener);
}

export function useMotionTier(): UseMotionTierResult {
  // Hydration starts with exactly the same conservative state as server render.
  const [state, setState] = useState<{ tier: MotionTier; ready: boolean }>({
    tier: 0,
    ready: false,
  });
  const reduceOverride = useRef(false);
  const sessionDowngraded = useRef(false);
  const currentTier = useRef<MotionTier>(0);
  const reclassify = useRef<() => void>(() => {});

  useEffect(() => {
    reduceOverride.current = readStorage("localStorage", MOTION_KEY) === "reduce";
    sessionDowngraded.current =
      readStorage("sessionStorage", SESSION_TIER_KEY) === "1";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const finePointer = window.matchMedia("(pointer: fine)");
    const connection = (
      navigator as Navigator & { readonly connection?: MotionConnection }
    ).connection;

    const classify = (): void => {
      let tier: MotionTier;

      if (
        reducedMotion.matches ||
        connection?.saveData === true ||
        reduceOverride.current ||
        document.documentElement.dataset.motionFailed === "true"
      ) {
        tier = 0;
      } else if (
        !desktop.matches ||
        !finePointer.matches ||
        sessionDowngraded.current
      ) {
        tier = 1;
      } else {
        // Tier 3 remains reserved; automatic classification never enables it.
        tier = 2;
      }

      currentTier.current = tier;
      setState((previous) =>
        previous.tier === tier && previous.ready
          ? previous
          : { tier, ready: true },
      );
    };

    reclassify.current = classify;
    const cleanupQueries = [reducedMotion, desktop, finePointer].map((query) =>
      listenToQuery(query, classify),
    );
    const canListenToConnection =
      typeof connection?.addEventListener === "function" &&
      typeof connection?.removeEventListener === "function";

    if (canListenToConnection) {
      connection?.addEventListener("change", classify);
    }
    window.addEventListener("dos-orillas:motion-failed", classify);

    classify();

    return () => {
      cleanupQueries.forEach((cleanup) => cleanup());
      if (canListenToConnection) {
        connection?.removeEventListener("change", classify);
      }
      window.removeEventListener("dos-orillas:motion-failed", classify);
      reclassify.current = () => {};
    };
  }, []);

  const toggleMotion = useCallback((): void => {
    const root = document.documentElement;
    if (root.dataset.motionFailed === "true") {
      // A late hydration must not restart movement without this explicit action.
      delete root.dataset.motionFailed;
      reduceOverride.current = false;
    } else {
      reduceOverride.current = !reduceOverride.current;
    }
    writeStorage(
      "localStorage",
      MOTION_KEY,
      reduceOverride.current ? "reduce" : "full",
    );
    // System reduction and Save-Data always remain authoritative.
    reclassify.current();
  }, []);

  const downgrade = useCallback((): void => {
    if (currentTier.current !== 2) return;

    sessionDowngraded.current = true;
    writeStorage("sessionStorage", SESSION_TIER_KEY, "1");
    reclassify.current();
  }, []);

  return {
    tier: state.tier,
    reduced: state.tier === 0,
    ready: state.ready,
    toggleMotion,
    downgrade,
  };
}
