"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { accessibilityCopy } from "@/content/site";
import { Footer } from "@/components/layout/Footer";
import { Nav } from "@/components/navigation/Nav";
import { Cursor } from "@/components/motion/Cursor";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { ThemeController } from "@/components/motion/ThemeController";
import { PageTransition } from "@/components/motion/ProjectTransitions";
import { LivingBackground } from "@/components/motion/LivingBackground";

/** MotionProvider lives above this shell so scenes and global controls share one tier. */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/";
  const caseRoute = pathname.startsWith("/projects/");

  return (
    <div className="site-shell" data-home={home} data-case={caseRoute} data-footer-curtain="false">
      <a className="skip-link" href="#main-content">{accessibilityCopy.skipLink}</a>
      {/* Keep the complete shell in the initial server frame. Query-dependent
          controllers use their own empty boundaries inside these components. */}
      {home && <LivingBackground />}
      <Nav home={home} />
      <noscript><style>{`.menu-toggle,.motion-toggle,.footer-clock,.scroll-progress-rail{display:none!important}.site-shell[data-home="true"] .site-nav{background:#071725}.site-shell[data-case="true"]:has(.project-case) .site-nav{background:#071725}@media(max-width:1023px){.site-nav{position:relative;height:auto}.site-nav-inner{height:auto;min-height:76px;flex-wrap:wrap;padding-block:20px;gap:12px}.desktop-nav{display:flex;width:100%;gap:8px 20px;flex-wrap:wrap}.nav-link-contact{padding-inline:12px}}`}</style></noscript>
      <main id="main-content" className="site-main" tabIndex={-1}><PageTransition>{children}</PageTransition></main>
      <Footer home={home} />
      <ThemeController />
      <Cursor />
      {home && <ScrollProgress />}
    </div>
  );
}
