import { privacyDocumentCopy } from '@/content/contact-feedback';

/** Unpublished structure only. Mount from a route after legal copy is approved. */
export function PrivacyDraft() {
  const paragraphs = privacyDocumentCopy.paragraphs;
  if (!paragraphs?.length) return null;
  return <section className="contact-privacy-page" data-theme="cream" aria-labelledby="privacy-heading">
    <h1 id="privacy-heading">{privacyDocumentCopy.title}</h1>
    {paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
  </section>;
}
