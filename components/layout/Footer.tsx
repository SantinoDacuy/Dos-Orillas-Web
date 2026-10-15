"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { FooterWordmark } from "@/components/layout/FooterWordmark";
import { useMotion } from "@/components/motion/MotionProvider";
import { accessibilityCopy, brandCopy, footerCopy, motionCopy, siteConfig } from "@/content/site";

const subscribeHydration = () => () => {};
const clientHydration = () => true;
const serverHydration = () => false;

function LocalClock() {
  const [date, setDate] = useState<Date | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let timer: number | undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      setDate(new Date());
      timer = window.setInterval(() => setDate(new Date()), 60_000);
    });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); clearInterval(timer); };
  }, []);
  const clock = useMemo(() => date ? new Intl.DateTimeFormat(siteConfig.locale, { timeZone: siteConfig.timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(date) : "—:—", [date]);
  return <span ref={ref} className="mono footer-clock">{footerCopy.clockCity} · <time dateTime={date?.toISOString()}>{clock}</time> {footerCopy.clockZone}</span>;
}

function Year() {
  const [year, setYear] = useState(() => String(new Date().getUTCFullYear()));
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let timer: number | undefined;
    const update = () => setYear(new Intl.DateTimeFormat(siteConfig.locale, { timeZone: siteConfig.timeZone, year: "numeric" }).format(new Date()));
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect(); update(); timer = window.setInterval(update, 60_000);
    });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); clearInterval(timer); };
  }, []);
  return <span ref={ref} suppressHydrationWarning>{year}</span>;
}

export function Footer({ home }: { home: boolean }) {
  const { tier, reduced, toggleMotion, lenisRef, ready } = useMotion();
  // This Suspense boundary may hydrate after the provider has classified motion.
  // Preserve its server label during hydration, then expose the current setting.
  const hydrated = useSyncExternalStore(subscribeHydration, clientHydration, serverHydration);
  const buttonReduced = !hydrated || reduced;
  const pathname = usePathname();
  const footerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    const footer = footerRef.current;
    const sentinel = sentinelRef.current;
    const shell = footer?.closest<HTMLElement>(".site-shell");
    if (!footer || !sentinel || !shell) return;
    if (tier < 2 || reduced) {
      if (shell.dataset.footerCurtain !== 'false') shell.dataset.footerCurtain = 'false';
      footer.inert = false;
      if (footer.style.visibility) footer.style.visibility = 'visible';
      return;
    }
    let frame = 0;
    let curtain = false;
    let observer: IntersectionObserver | undefined;
    const breakpoint = matchMedia("(min-width: 1024px)");
    const setVisible = (requestedVisible: boolean) => {
      // A queued observer must never hide/inert a focused control. Return the
      // footer to flow, where main cannot cover it, before applying visibility.
      if (curtain && footer.contains(document.activeElement)) {
        curtain = false;
        shell.dataset.footerCurtain = "false";
        observer?.disconnect();
        observer = undefined;
      }
      const visible = requestedVisible || !curtain;
      footer.dataset.visible = String(visible);
      footer.inert = !visible || document.documentElement.dataset.menuOpen === "true";
      footer.style.visibility = visible ? "visible" : "hidden";
    };
    const measure = () => {
      frame = 0;
      // A tall footer keeps ordinary document flow, including at 200% text zoom.
      const height = Math.ceil(footer.getBoundingClientRect().height);
      shell.style.setProperty("--footer-height", `${height}px`);
      const eligible = tier >= 2 && !reduced && breakpoint.matches && height <= innerHeight * 0.94
        && !footer.contains(document.activeElement);
      if (curtain !== eligible) {
        curtain = eligible;
        shell.dataset.footerCurtain = String(eligible);
        observer?.disconnect();
        if (eligible) {
          setVisible(sentinel.getBoundingClientRect().top < innerHeight);
          observer = new IntersectionObserver(([entry]) => setVisible(Boolean(entry?.isIntersecting)), { threshold: 0 });
          observer.observe(sentinel);
        } else {
          setVisible(true);
        }
      } else if (!eligible) {
        shell.dataset.footerCurtain = "false";
        setVisible(true);
      }
    };
    const scheduleMeasure = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(scheduleMeasure);
    resize.observe(footer);
    breakpoint.addEventListener("change", scheduleMeasure);
    window.addEventListener("resize", scheduleMeasure, { passive: true });
    footer.addEventListener("focusin", scheduleMeasure);
    footer.addEventListener("focusout", scheduleMeasure);
    scheduleMeasure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer?.disconnect();
      breakpoint.removeEventListener("change", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      footer.removeEventListener("focusin", scheduleMeasure);
      footer.removeEventListener("focusout", scheduleMeasure);
      delete shell.dataset.footerCurtain;
      shell.style.removeProperty("--footer-height");
      footer.inert = false;
      footer.style.visibility = "";
    };
  }, [tier, reduced, pathname, ready]);

  const backToTop = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: reduced ? 0 : 2, immediate: reduced });
    else window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
    document.getElementById("main-content")?.focus({ preventScroll: true });
    history.replaceState(null, "", pathname);
  };

  const followAnchor = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!home || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    event.preventDefault();
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: -76, duration: reduced ? 0 : 1.25, immediate: reduced });
    else target.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
    history.replaceState(null, "", href);
  };

  return (
    <>
      <div ref={sentinelRef} className="footer-sentinel" aria-hidden="true" data-footer-sentinel />
      <footer ref={footerRef} id="footer" className="site-footer" data-theme="ink" data-visible="true">
        <div className="footer-hairline" aria-hidden="true" />
        <div className="footer-marquee" aria-hidden="true"><span>{brandCopy.marquee} {brandCopy.marquee}</span></div>
        <div className="footer-wordmark-mask"><FooterWordmark /></div>
        <div className="footer-details">
          <div className="footer-philosophy"><p>{footerCopy.philosophy}</p><p className="mono">{siteConfig.location.label}</p></div>
          <nav className="footer-nav" aria-label={accessibilityCopy.footerNavigation}>
            {footerCopy.links.map((link) => <a key={link.href} href={home ? link.href : `/${link.href}`} onClick={(event) => followAnchor(event, link.href)}>{link.label}</a>)}
          </nav>
          <div className="footer-social"><a href={siteConfig.emailHref}>{footerCopy.emailLabel} ↗</a><a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer">{footerCopy.instagramLabel} ↗</a>{siteConfig.availability && <span className="mono">{siteConfig.availability}</span>}</div>
        </div>
        <div className="footer-bottom">
          <span className="mono">{footerCopy.copyright} <Year /> {siteConfig.name}</span>
          <LocalClock />
          <div className="footer-controls"><button className="motion-toggle mono" type="button" aria-pressed={buttonReduced} onClick={toggleMotion}>{buttonReduced ? motionCopy.full : motionCopy.reduce}<span className="motion-toggle-dot" aria-hidden="true" /></button><a className="back-to-top" href="#main-content" aria-label={accessibilityCopy.backToTop} onClick={backToTop}><span aria-hidden="true">↑</span></a></div>
        </div>
      </footer>
    </>
  );
}
