'use client';

import { useEffect } from 'react';
import { useMotion } from '@/components/motion/MotionProvider';
import { getMountedSceneRoot } from '@/lib/get-visible-root';

/** Reveals planos para secciones sin recorrido fijado. El servidor entrega todo el texto; esta isla
 * sólo marca `data-in` en cada bloque `[data-reveal]` cuando entra en pantalla (las transiciones son
 * CSS, en la hoja de la sección) y suaviza con Lenis el enlace `[data-reveal-link]`. */
export function SectionReveal({ selector }: { selector: string }) {
  const { tier, ready } = useMotion();
  useEffect(() => {
    if (!ready || tier === 0) return;
    const root = getMountedSceneRoot(selector);
    if (!root) return;
    const blocks = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reveal = (block: HTMLElement) => { block.dataset.in = 'true'; };
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === 'undefined') blocks.forEach(reveal);
    else {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        // Un bloque que ya quedó arriba (ancla o recarga a mitad de página) también se muestra.
        if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) return;
        reveal(entry.target as HTMLElement);
        observer?.unobserve(entry.target);
      }), { rootMargin: '0px 0px -12% 0px' });
      blocks.forEach(block => observer!.observe(block));
    }
    root.dataset.revealReady = 'true';

    const link = root.querySelector<HTMLAnchorElement>('[data-reveal-link]');
    const click = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !link) return;
      const destination = document.querySelector<HTMLElement>(link.getAttribute('href') ?? '');
      if (!destination || !window.__lenis) return;
      event.preventDefault();
      window.__lenis.scrollTo(destination, { duration: 1.4 });
      if (location.hash !== link.hash) history.pushState(history.state, '', link.hash);
    };
    link?.addEventListener('click', click);
    return () => {
      observer?.disconnect();
      link?.removeEventListener('click', click);
      blocks.forEach(block => { delete block.dataset.in; });
      delete root.dataset.revealReady;
    };
  }, [selector, tier, ready]);
  return null;
}
