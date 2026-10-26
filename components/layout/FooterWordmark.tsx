'use client';
import { useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';
import { LogoSpotlight } from './LogoSpotlight';
import { siteConfig } from '@/content/site';

/** Logo oficial (870 × 492), usado como máscara de la luz que sigue al puntero por todo el footer. */
const LOGO = { src: '/brand/logo.svg', ratio: 870 / 492 };

/** Reserve the exact logo box; fetch the official SVG as the footer approaches. */
export function FooterWordmark() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const wrapper = ref.current;
    const shell = wrapper?.closest<HTMLElement>('.site-shell');
    const sentinel = shell?.querySelector<HTMLElement>('[data-footer-sentinel]');
    const observer = new IntersectionObserver(entries => {
      const curtain = shell?.dataset.footerCurtain === 'true';
      const target = curtain ? sentinel : wrapper;
      if (!entries.some(entry => entry.target === target && entry.isIntersecting)) return;
      observer.disconnect(); setVisible(true);
    }, { rootMargin: '100px 0px' });
    if (wrapper) observer.observe(wrapper);
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="footer-wordmark-frame" role="img" aria-label={siteConfig.name}>
    {visible && <LogoSpotlight src={LOGO.src} aspectRatio={LOGO.ratio} className="footer-wordmark" />}
    <noscript><Logo light eager className="footer-wordmark" /></noscript>
  </div>;
}
