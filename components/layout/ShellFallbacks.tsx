import { Logo } from '@/components/layout/Logo';
import {
  accessibilityCopy,
  brandCopy,
  footerCopy,
  navigationItems,
  siteConfig,
  type ChapterId,
} from '@/content/site';

type ShellFallbackProps = { home: boolean };

function chapterHref(home: boolean, href: `#${ChapterId}`) {
  return home ? href : `/${href}`;
}

/** Complete native navigation for a streamed boundary when JavaScript is disabled. */
export function NavFallback({ home }: ShellFallbackProps) {
  return (
    <header id="nav-static" className="site-nav" data-condensed="false">
      <div className="site-nav-surface" aria-hidden="true" />
      <div className="site-nav-inner">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="nav-home" href="/" aria-label={siteConfig.name}>
          <Logo horizontal eager className="nav-logo nav-logo-dark" />
        </a>
        <nav className="desktop-nav" aria-label={accessibilityCopy.mainNavigation}>
          {navigationItems.map((item) => (
            <a
              key={item.id}
              className={`nav-link${item.id === 'contacto' ? ' nav-link-contact' : ''}`}
              href={chapterHref(home, item.href)}
              aria-current={home && item.id === 'estudio' ? 'location' : undefined}
            >
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

/** Static footer shares the content and exact vector boxes, without inert controls. */
export function FooterFallback({ home }: ShellFallbackProps) {
  return (
    <footer id="footer-static" className="site-footer" data-theme="ink" data-visible="true">
      <div className="footer-hairline" aria-hidden="true" />
      <div className="footer-marquee" aria-hidden="true">
        <span>{brandCopy.marquee} {brandCopy.marquee}</span>
      </div>
      <div className="footer-wordmark-mask">
        <div className="footer-wordmark-frame" role="img" aria-label={siteConfig.name}>
          <Logo light eager className="footer-wordmark" />
        </div>
      </div>
      <div className="footer-details">
        <div className="footer-philosophy">
          <p>{footerCopy.philosophy}</p>
          <p className="mono">{siteConfig.location.label}</p>
        </div>
        <nav className="footer-nav" aria-label={accessibilityCopy.footerNavigation}>
          {footerCopy.links.map((link) => (
            <a key={link.href} href={chapterHref(home, link.href)}>{link.label}</a>
          ))}
        </nav>
        <div className="footer-social">
          <a href={siteConfig.emailHref}>{footerCopy.emailLabel} ↗</a>
          <a href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer">
            {footerCopy.instagramLabel} ↗
          </a>
          {siteConfig.availability && <span className="mono">{siteConfig.availability}</span>}
        </div>
      </div>
      <div className="footer-bottom">
        <span className="mono">{footerCopy.copyright} {new Date().getUTCFullYear()} {siteConfig.name}</span>
        <div className="footer-controls">
          <a className="back-to-top" href="#main-content" aria-label={accessibilityCopy.backToTop}>
            <span aria-hidden="true">↑</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
