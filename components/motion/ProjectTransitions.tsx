'use client';

import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState,
  Fragment, ViewTransition, type HTMLAttributes, type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useMotion } from '@/components/motion/MotionProvider';
import { setRouteScrollPolicy } from '@/lib/route-scroll-policy';
import { getVisibleRoot } from '@/lib/get-visible-root';
import type { ProjectTransitionFallback } from './project-transition-fallback';

type Selection = { slug: string; sourceId: string; sourcePath: string } | null;
type NavigationKind = 'cover' | 'curtain' | 'history';
interface PendingNavigation {
  pathname: string;
  controller: AbortController;
  restore: Selection;
  restored: boolean;
  finished?: boolean;
  restoreCleanup?: () => void;
  restoreTimer?: number;
  fallback?: ProjectTransitionFallback;
  watchdog?: number;
}
interface TransitionContextValue {
  pathname: string;
  enabled: boolean;
  supported: boolean;
  selection: Selection;
  kind: NavigationKind;
  restoreSource: (sourceId: string, element: HTMLElement) => void;
  finishRoute: (pathname: string) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);
const capabilitySnapshot = () => typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
let fallbackModule: Promise<typeof import('./project-transition-fallback')> | undefined;
const loadFallback = () => fallbackModule ??= import('./project-transition-fallback').catch(error => {
  fallbackModule = undefined;
  throw error;
});

function useProjectTransitions() {
  const value = useContext(TransitionContext);
  if (!value) throw new Error('Project transitions require ProjectTransitionsProvider.');
  return value;
}

function unlockGridLayout(element: HTMLElement): void {
  const grid = element.closest<HTMLElement>('[data-grid-motion-policy="native-tier1"][data-grid-intrinsic="true"]');
  if (!grid || document.documentElement.dataset.motionTier !== '1' || grid.dataset.narrativeLayoutReady === 'true') return;
  grid.dataset.narrativeLayoutReady = 'true';
  window.dispatchEvent(new Event('dos-orillas:refresh'));
}

/** One persistent routing owner under MotionProvider, outside keyed page content. */
export function ProjectTransitionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tier, ready } = useMotion();
  // Capability changes no visible startup state. Detect it at navigation rather
  // than reconciling every cover after the server's false snapshot hydrates.
  const [supported, setSupported] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [kind, setKind] = useState<NavigationKind>('history');
  const pending = useRef<PendingNavigation | null>(null);
  const currentPath = useRef(pathname);
  const prefetched = useRef(new Set<string>());
  const enabled = ready && tier > 0;

  const cancelPending = useCallback(() => {
    const operation = pending.current;
    pending.current = null;
    if (!operation) return;
    if (operation.watchdog !== undefined) window.clearTimeout(operation.watchdog);
    if (operation.restoreTimer !== undefined) window.clearTimeout(operation.restoreTimer);
    operation.restoreCleanup?.();
    operation.controller.abort();
    operation.fallback?.cancel();
  }, []);
  const restoreSource = useCallback((sourceId: string, element: HTMLElement) => {
    const operation = pending.current;
    if (!operation || operation.restored || operation.pathname !== pathname || operation.restore?.sourceId !== sourceId) return;
    operation.restored = true;
    unlockGridLayout(element);
    // Synchronous positioning/focus precedes the new snapshot's layout callback.
    const bounds = element.getBoundingClientRect();
    const target = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight,
      bounds.top + scrollY - Math.max(88, (innerHeight - bounds.height) / 2)));
    if (window.__lenis) {
      window.__lenis.resize();
      window.__lenis.scrollTo(target, { immediate: true, force: true });
    } else window.scrollTo({ top: target, behavior: 'instant' });
    const link = element.closest<HTMLAnchorElement>('a')
      ?? element.parentElement?.querySelector<HTMLAnchorElement>('a[href]');
    link?.focus({ preventScroll: true });
    // User input cancels immediately, including while the optional helper loads.
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    for (const event of inputs) window.addEventListener(event, cancelPending, { capture: true, passive: true });
    operation.restoreCleanup = () => { for (const event of inputs) window.removeEventListener(event, cancelPending, true); };
    void import('./project-cover-restoration').then(({ mountProjectCoverRestoration }) => {
      if (pending.current !== operation || operation.controller.signal.aborted || operation.pathname !== location.pathname || !element.isConnected) return;
      operation.restoreCleanup?.();
      operation.restoreCleanup = mountProjectCoverRestoration(element, {
        pathname: operation.pathname, signal: operation.controller.signal, onUserInput: cancelPending,
      });
    }).catch(() => { /* Native initial cover position/focus remain available. */ });
  }, [pathname, cancelPending]);
  const finishRoute = useCallback((nextPath: string) => {
    currentPath.current = nextPath;
    const operation = pending.current;
    if (!operation || operation.pathname !== nextPath || operation.finished) return;
    const caseSlug = nextPath.match(/^\/projects\/([^/]+)\/?$/)?.[1];
    const caseRoot = caseSlug && getVisibleRoot(`[data-project-case="${CSS.escape(decodeURIComponent(caseSlug))}"]`);
    if (caseSlug && !caseRoot) return;
    if (operation.restore && !operation.restored) return;
    if (operation.watchdog !== undefined) window.clearTimeout(operation.watchdog);
    if (!operation.restore && operation.restoreTimer !== undefined) window.clearTimeout(operation.restoreTimer);
    const destination = operation.restore
      ? getVisibleRoot(`[data-project-cover-source-id="${CSS.escape(operation.restore.sourceId)}"][data-project-cover-path="${CSS.escape(operation.restore.sourcePath)}"]`)
      : getVisibleRoot(`[data-project-cover-role="destination"][data-project-cover-path="${CSS.escape(nextPath)}"]`);
    void operation.fallback?.close(destination ?? undefined).finally(() => {
      if (pending.current === operation && !operation.restore) pending.current = null;
    });
    operation.finished = true;
    if (!operation.fallback && !operation.restore) pending.current = null;
    if (nextPath.startsWith('/projects/') && !operation.restore) {
      if (window.__lenis) {
        window.__lenis.resize();
        window.__lenis.scrollTo(0, { immediate: true, force: true });
      }
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
  }, []);
  useLayoutEffect(() => { finishRoute(pathname); }, [pathname, finishRoute]);

  useEffect(() => {
    if (!enabled) cancelPending();
    const readAnchor = (target: EventTarget | null) => target instanceof Element
      ? target.closest<HTMLAnchorElement>('a[href]') : null;
    const readURL = (anchor: HTMLAnchorElement) => {
      if (anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return null;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return null;
      return url;
    };
    const prefetch = (event: Event) => {
      const anchor = readAnchor(event.target);
      const url = anchor && readURL(anchor);
      if (!url) return;
      const href = `${url.pathname}${url.search}${url.hash}`;
      if (!prefetched.current.has(href)) {
        prefetched.current.add(href);
        router.prefetch(href);
      }
      // Only the small fallback facade is primed here; GSAP/Flip start at click.
      if (enabled && (!capabilitySnapshot() || !anchor?.dataset.projectTransitionLink)) void loadFallback().catch(() => {});
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = readAnchor(event.target);
      const url = anchor && readURL(anchor);
      if (!anchor || !url) return;
      event.preventDefault();
      cancelPending();
      const nativeSupported = enabled && capabilitySnapshot();
      const href = `${url.pathname}${url.search}${url.hash}`;
      const backSlug = anchor.dataset.projectBack;
      if (backSlug) {
        try { sessionStorage.setItem('last-cover', backSlug); } catch { /* Restoration also works from in-memory selection. */ }
      }
      const slug = backSlug || anchor.dataset.projectTransitionLink;
      const sourceId = backSlug ? `grid:${backSlug}` : anchor.dataset.projectTransitionSource;
      const selector = slug && sourceId ? (backSlug
        ? `[data-project-cover-role="destination"][data-project-cover="${CSS.escape(slug)}"][data-project-cover-path="${CSS.escape(location.pathname)}"]`
        : `[data-project-cover-source-id="${CSS.escape(sourceId)}"][data-project-cover-path="${CSS.escape(location.pathname)}"]`) : null;
      if (selector) document.querySelectorAll<HTMLElement>(selector).forEach(unlockGridLayout);
      const source = selector ? getVisibleRoot(selector) : null;
      const nextSelection = source && slug && sourceId ? { slug, sourceId, sourcePath: backSlug ? url.pathname : location.pathname } : null;
      if (nextSelection && !backSlug) {
        // Keep a semantic source in this entry: deferred pins may change its pixel coordinate on return.
        try {
          history.replaceState({ ...history.state, __dosOrillasCover: {
            pathname: location.pathname, ...nextSelection,
          } }, '', location.href);
        } catch { /* A history-storage restriction never prevents the requested navigation. */ }
      }
      // React pairs the previous committed memoizedProps.name, not a name queued in the push transition.
      flushSync(() => {
        setSupported(nativeSupported);
        setSelection(enabled ? nextSelection : null);
        setKind(enabled && nextSelection ? 'cover' : enabled ? 'curtain' : 'history');
      });
      const controller = new AbortController();
      const operation: PendingNavigation = {
        pathname: url.pathname, controller,
        restore: backSlug && url.pathname === '/projects' ? nextSelection : null, restored: false,
      };
      pending.current = operation;
      if (operation.restore) operation.restoreTimer = window.setTimeout(() => {
        if (pending.current !== operation || controller.signal.aborted) return;
        if (operation.restored) {
          operation.restoreCleanup?.();
          pending.current = null;
          return;
        }
        // Missing grid integration must not strand a fallback overlay or route focus.
        operation.restore = null;
        operation.restored = true;
        document.getElementById('main-content')?.focus({ preventScroll: true });
        finishRoute(url.pathname);
      }, 4000);
      let pushed = false;
      const push = () => {
        if (pushed || controller.signal.aborted) return;
        pushed = true;
        setRouteScrollPolicy(url.pathname, operation.restore ? 'restore' : 'top');
        try { router.push(href, { scroll: !operation.restore }); }
        catch {
          cancelPending();
          // A failed router must still honor this native navigation.
          location.assign(url.href);
        }
      };
      if (!enabled || (nativeSupported && nextSelection)) { push(); return; }
      // Never hold navigation indefinitely while a deferred chunk loads.
      const previousPath = currentPath.current;
      operation.watchdog = window.setTimeout(push, 200);
      void loadFallback().then(({ startProjectTransitionFallback }) => {
        if (controller.signal.aborted || pending.current !== operation || currentPath.current !== previousPath) { push(); return; }
        operation.fallback = startProjectTransitionFallback({ source: source ?? undefined, signal: controller.signal });
        window.clearTimeout(operation.watchdog);
        push();
      }).catch(push);
    };
    const pop = (event: PopStateEvent) => {
      cancelPending();
      setRouteScrollPolicy(location.pathname, 'history');
      const bookmark = event.state?.__dosOrillasCover;
      if (bookmark?.pathname === location.pathname && typeof bookmark.slug === 'string' && typeof bookmark.sourceId === 'string') {
        const operation: PendingNavigation = {
          pathname: location.pathname, controller: new AbortController(),
          restore: { slug: bookmark.slug, sourceId: bookmark.sourceId, sourcePath: bookmark.pathname }, restored: false,
        };
        pending.current = operation;
        operation.restoreTimer = window.setTimeout(() => {
          if (pending.current === operation) {
            operation.restoreCleanup?.();
            pending.current = null;
          }
        }, 4000);
      }
      // Capture listener precedes Next's bubble listener; history never reuses stale selected cover names.
      flushSync(() => { setSelection(null); setKind('history'); });
    };
    document.addEventListener('pointerover', prefetch, { passive: true });
    document.addEventListener('focusin', prefetch);
    document.addEventListener('click', click);
    window.addEventListener('popstate', pop, true);
    return () => {
      document.removeEventListener('pointerover', prefetch);
      document.removeEventListener('focusin', prefetch);
      document.removeEventListener('click', click);
      window.removeEventListener('popstate', pop, true);
      cancelPending();
    };
  }, [enabled, router, cancelPending, finishRoute]);

  const value = useMemo<TransitionContextValue>(() => ({
    pathname, enabled, supported, selection, kind, restoreSource, finishRoute,
  }), [pathname, enabled, supported, selection, kind, restoreSource, finishRoute]);
  return <TransitionContext.Provider value={value}>{children}</TransitionContext.Provider>;
}

interface ProjectCoverTransitionProps extends HTMLAttributes<HTMLDivElement> {
  slug: string;
  sourceId?: string;
  role: 'source' | 'destination';
}

/** Replaces the existing cover div, preserving its classes, geometry and SSR content. */
export function ProjectCoverTransition({ slug, sourceId, role, children, ...props }: ProjectCoverTransitionProps) {
  const { pathname, enabled, supported, selection, kind, restoreSource, finishRoute } = useProjectTransitions();
  const ref = useRef<HTMLDivElement>(null);
  const [origin] = useState(pathname);
  const selected = kind === 'cover' && selection?.slug === slug && (role === 'destination'
    ? origin === pathname
    : selection.sourceId === sourceId && selection.sourcePath === origin);
  useLayoutEffect(() => {
    if (role === 'source' && sourceId && ref.current && origin === pathname) restoreSource(sourceId, ref.current);
    finishRoute(pathname);
  });
  const cover = <div {...props} ref={ref} data-project-cover={slug} data-project-cover-role={role}
    data-project-cover-source-id={role === 'source' ? sourceId : undefined} data-project-cover-path={origin}>{children}</div>;
  // Readiness/capability must not replace every cover during hydration. The
  // selected source is prepared synchronously at navigation; its counterpart
  // receives the same name in the destination route.
  return enabled && supported && selected
    ? <ViewTransition name={`project-${slug}`} share="project-cover" default="none">{cover}</ViewTransition>
    : cover;
}

/** The page tree keeps its type through hydration and motion preference changes. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { finishRoute } = useProjectTransitions();
  useLayoutEffect(() => { finishRoute(pathname); }, [pathname, finishRoute]);
  return <Fragment key={pathname}>{children}</Fragment>;
}
