import { notFoundCopy } from '@/content/site';
import '@/styles/not-found.css';

export default function NotFound() {
  return <section className="not-found-page" data-theme="cream" aria-labelledby="not-found-title">
    <h1 id="not-found-title">{notFoundCopy.title}</h1>
    <a className="not-found-link mono" href={notFoundCopy.cta.href}>
      <span className="not-found-bridge" aria-hidden="true"><span /><span /></span>
      <span>{notFoundCopy.cta.label}</span>
    </a>
  </section>;
}
