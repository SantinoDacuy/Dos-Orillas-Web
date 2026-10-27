'use client';

import { CrowdCanvas } from '@/components/ui/skiper39';
import { ContactForm } from './ContactForm';

export function Contact() {
  return (
    <section
      id="contacto"
      className="contact-section radiant-section-wrap"
      data-editorial="contact"
      data-theme="navy-deep"
      data-nav="dark"
      aria-labelledby="contact-heading"
    >
      {/* Ambient background glows */}
      <div
        className="radiant-ambient-glow radiant-glow-teal"
        style={{ width: '600px', height: '600px', top: '10%', left: '-5%' }}
        aria-hidden="true"
      />
      <div
        className="radiant-ambient-glow radiant-glow-cyan"
        style={{ width: '650px', height: '650px', bottom: '0%', right: '-5%' }}
        aria-hidden="true"
      />

      <div className="contact-card-container relative z-10">
        {/* Left Visual Panel with Light/Cream Background & CrowdCanvas */}
        <div className="contact-visual-panel contact-visual-panel-light">
          <div className="contact-visual-content">
            <div className="contact-light-badge mb-4">
              <span className="contact-light-beacon" />
              <span>NUEVOS PROYECTOS</span>
            </div>
            <h3 className="contact-visual-title-light">
              Cada gran producto <br />
              <span className="contact-accent-text-light">empieza con una charla</span>
            </h3>
          </div>

          {/* Interactive Crowd Canvas on light background */}
          <div className="contact-canvas-wrapper" aria-hidden="true">
            <CrowdCanvas src="/images/crowd-peeps.png" rows={15} cols={7} />
            <div className="contact-canvas-gradient-top-light" />
            <div className="contact-canvas-gradient-bottom-light" />
          </div>

          <div className="contact-visual-footer">
            <span className="contact-location-pill-light">
              <span className="contact-status-dot" />
              <span>Concepción del Uruguay · Entre Ríos · Argentina</span>
            </span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="contact-form-panel">
          <div className="contact-form-header">
            <span className="contact-eyebrow">
              CANAL DIRECTO
            </span>
            <h2 id="contact-heading" className="contact-main-title">
              Conversemos
            </h2>
            <p className="contact-main-desc">
              Completá el formulario para contarnos sobre tu proyecto. Respondemos dentro de las 24 horas hábiles
            </p>
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}

export default Contact;
