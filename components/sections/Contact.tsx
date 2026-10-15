import { contactCopy, footerCopy, siteConfig } from '@/content/site';
import { ContactForm } from './ContactForm';
import { CopyEmail } from './CopyEmail';

export function Contact() {
  return <section id="contacto" className="contact-section" data-theme="navy-deep" data-nav="dark" aria-labelledby="contact-heading">
    <div className="contact-split">
      <div className="contact-information">
        <h2 id="contact-heading">{contactCopy.title}</h2>
        <div className="contact-channel">
          <p className="contact-channel-label">{footerCopy.emailLabel}</p>
          <a className="contact-email" href={siteConfig.emailHref}>{siteConfig.email}</a>
          <CopyEmail />
        </div>
        <div className="contact-channel">
          <p className="contact-channel-label">{siteConfig.instagram.label}</p>
          <a className="contact-instagram" href={siteConfig.instagram.url} target="_blank" rel="noopener noreferrer">{siteConfig.instagram.handle}</a>
        </div>
        <p className="contact-location">{siteConfig.location.label}</p>
      </div>
      <ContactForm />
    </div>
  </section>;
}
