"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { useMotion } from "@/components/motion/MotionProvider";
import { accessibilityCopy, chapters, navigationItems, siteConfig, type ChapterId } from "@/content/site";
import { getVisibleRoot } from "@/lib/get-visible-root";

/** Only this empty query observer may suspend; the navigation stays in SSR. */
function NavQueryCleanup({ cleanup }: { cleanup: () => void }) {
  const searchParams = useSearchParams();
  useEffect(() => cleanup, [searchParams, cleanup]);
  return null;
}

export function Nav({ home }: { home: boolean }) {
  const { reduced, lenisRef } = useMotion();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLSpanElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const restoreInertRef = useRef<Array<{ element: HTMLElement; inert: boolean }>>([]);
  const overflowRef = useRef<string | null>(null);
  const animationRef = useRef<Animation[]>([]);
  const closingRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState<ChapterId>("estudio");

  const restoreDocument = useCallback(() => {
    restoreInertRef.current.forEach(({ element, inert }) => { element.inert = (element.tagName === "FOOTER" && element.closest<HTMLElement>(".site-shell")?.dataset.footerCurtain === "true" && element.dataset.visible === "false") || inert; });
    restoreInertRef.current = [];
    if (overflowRef.current !== null) {
      document.documentElement.style.overflow = overflowRef.current;
      overflowRef.current = null;
    }
    delete document.documentElement.dataset.menuOpen;
    lenisRef.current?.start();
  }, [lenisRef]);

  const closeMenu = useCallback(async (restoreFocus = true) => {
    const dialog = dialogRef.current;
    if (!dialog?.open || closingRef.current) return;
    closingRef.current = true;
    animationRef.current.forEach((animation) => animation.cancel());
    const animation = dialog.animate(
      reduced
        ? [{ opacity: 1 }, { opacity: 0 }]
        : [{ clipPath: "inset(0)" }, { clipPath: "inset(0 0 100% 0)" }],
      { duration: reduced ? 120 : 520, easing: "cubic-bezier(.76,0,.24,1)", fill: "both" },
    );
    animationRef.current = [animation];
    await animation.finished.catch(() => undefined);
    dialog.close();
    animation.cancel();
    restoreDocument();
    setMenuOpen(false);
    closingRef.current = false;
    if (restoreFocus) toggleRef.current?.focus({ preventScroll: true });
  }, [reduced, restoreDocument]);

  const openMenu = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    closingRef.current = false;
    restoreInertRef.current = Array.from(document.querySelectorAll<HTMLElement>("main, footer")).map((element) => ({ element, inert: element.inert }));
    restoreInertRef.current.forEach(({ element }) => { element.inert = true; });
    overflowRef.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "clip";
    document.documentElement.dataset.menuOpen = "true";
    lenisRef.current?.stop();
    dialog.showModal();
    setMenuOpen(true);
    animationRef.current = [dialog.animate(
      reduced
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0)" }],
      { duration: reduced ? 180 : 760, easing: "cubic-bezier(.76,0,.24,1)", fill: "both" },
    )];
    if (!reduced) {
      dialog.querySelectorAll<HTMLElement>(".mobile-menu-link-inner").forEach((link, index) => {
        animationRef.current.push(link.animate(
          [{ transform: "translateY(115%)" }, { transform: "translateY(0)" }],
          { duration: 650, delay: 130 + index * 60, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" },
        ));
      });
    }
    dialog.querySelector<HTMLButtonElement>(".mobile-menu-close")?.focus({ preventScroll: true });
  };

  const moveTo = useCallback((id: ChapterId) => {
    const chapter = chapters.find((c) => c.id === id);
    const targetId = chapter?.sections?.[0] ?? id;
    const target = getVisibleRoot(`#${CSS.escape(targetId)}`) ?? getVisibleRoot(`#${CSS.escape(id)}`);
    if (!target) return;
    const focusTarget = () => {
      const previouslyFocusable = target.hasAttribute("tabindex");
      if (!previouslyFocusable) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      if (!previouslyFocusable) target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
    };
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: -76, duration: reduced ? 0 : 1.25, immediate: reduced, onComplete: focusTarget });
    } else {
      target.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
      focusTarget();
    }
    history.replaceState(history.state, "", `#${id}`);
  }, [lenisRef, reduced]);

  const followAnchor = async (event: MouseEvent<HTMLAnchorElement>, id: ChapterId, fromMenu = false) => {
    if (!home || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (fromMenu) await closeMenu();
    moveTo(id);
  };

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const updateCondensed = () => {
      const isCondensed = window.scrollY > 80;
      const condensedVal = isCondensed ? "true" : "false";
      if (nav.dataset.condensed !== condensedVal) {
        nav.dataset.condensed = condensedVal;
      }
    };
    window.addEventListener("scroll", updateCondensed, { passive: true });
    updateCondensed();
    const chapter = (event: Event) => {
      const id = (event as CustomEvent<ChapterId>).detail;
      if (navigationItems.some((item) => item.id === id)) setActive(id);
    };
    window.addEventListener("dos-orillas:chapter", chapter);
    return () => {
      window.removeEventListener("scroll", updateCondensed);
      window.removeEventListener("dos-orillas:chapter", chapter);
    };
  }, [pathname]);

  useEffect(() => {
    const breakpoint = matchMedia("(min-width: 1024px)");
    const resize = () => { if (breakpoint.matches && dialogRef.current?.open) void closeMenu(); };
    breakpoint.addEventListener("change", resize);
    return () => breakpoint.removeEventListener("change", resize);
  }, [closeMenu]);

  const cleanupNavigation = useCallback(() => {
    animationRef.current.forEach((animation) => animation.cancel());
    animationRef.current = [];
    closingRef.current = false;
    dialogRef.current?.close();
    restoreDocument();
  }, [restoreDocument]);
  useEffect(() => cleanupNavigation, [pathname, cleanupNavigation]);

  return (
    <>
      <Suspense fallback={null}><NavQueryCleanup cleanup={cleanupNavigation} /></Suspense>
      <span ref={sentinelRef} className="nav-sentinel" aria-hidden="true" />
      <header ref={navRef} className="site-nav" data-condensed="false">
        <div className="site-nav-surface" aria-hidden="true" />
        <div className="site-nav-inner">
          {/* Home deliberately uses native navigation; no router prefetch runtime is needed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="nav-home" href="/" aria-label={siteConfig.name}>
            <Logo horizontal eager className="nav-logo nav-logo-dark" />
          </a>
          <nav className="desktop-nav" aria-label={accessibilityCopy.mainNavigation}>
            {navigationItems.map((item) => {
              if (item.id === "contacto") {
                return (
                  <a
                    key={item.id}
                    className="nav-link-contact"
                    href={home ? item.href : `/${item.href}`}
                    aria-current={home && active === item.id ? "location" : undefined}
                    onClick={(event) => void followAnchor(event, item.id)}
                  >
                    <span className="nav-contact-label">Conversemos</span>
                    <span className="nav-contact-arrow" aria-hidden="true">→</span>
                  </a>
                );
              }
              return (
                <a
                  key={item.id}
                  className="nav-link"
                  href={home ? item.href : `/${item.href}`}
                  aria-current={home && active === item.id ? "location" : undefined}
                  onClick={(event) => void followAnchor(event, item.id)}
                >
                  <span className="nav-link-num" aria-hidden="true">{item.number}</span>
                  <span className="nav-link-text">{item.label}</span>
                </a>
              );
            })}
          </nav>
          <button ref={toggleRef} className="menu-toggle" type="button" suppressHydrationWarning aria-label={menuOpen ? accessibilityCopy.closeMenu : accessibilityCopy.openMenu} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={openMenu}>
            <span aria-hidden="true" /><span aria-hidden="true" />
          </button>
        </div>
      </header>
      <dialog ref={dialogRef} id="mobile-navigation" className="mobile-menu" aria-label={accessibilityCopy.mobileMenu} aria-modal="true" data-lenis-prevent onClose={() => setMenuOpen(false)} onCancel={(event) => { event.preventDefault(); void closeMenu(); }} onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const nodes = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'));
        const first = nodes[0]; const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
        <div className="mobile-menu-top">
          <Logo horizontal light className="mobile-menu-logo" />
          <button className="mobile-menu-close" type="button" suppressHydrationWarning aria-label={accessibilityCopy.closeMenu} onClick={() => void closeMenu()}><span aria-hidden="true">×</span></button>
        </div>
        <nav className="mobile-menu-nav" aria-label={accessibilityCopy.mainNavigation}>
          {navigationItems.map((item) => <a className="mobile-menu-link" key={item.id} href={home ? item.href : `/${item.href}`} onClick={(event) => void followAnchor(event, item.id, true)}><span className="mobile-menu-link-inner"><span className="mono">{item.number}</span><span>{item.menuLabel}</span></span></a>)}
        </nav>
        <div className="mobile-menu-bottom">
          <a href={siteConfig.emailHref}>{siteConfig.email}</a>
          <a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer">{siteConfig.instagram.handle} ↗</a>
          <p className="mono">{siteConfig.location.label}</p>
        </div>
        <div className="mobile-menu-orilla" aria-hidden="true" />
      </dialog>
    </>
  );
}

