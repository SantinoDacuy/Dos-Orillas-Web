import { checkpointSections } from '@/content/checkpoint';
import { siteConfig } from '@/content/site';
export function SceneScaffold({ after }: { after?: (typeof checkpointSections)[number]['id'] }) {
  const completed = after ? checkpointSections.findIndex(section => section.id === after) : -1;
  return <>{checkpointSections.slice(completed + 1).map(section => <section key={section.id} id={section.id} className="scene-scaffold" data-theme={section.theme} aria-labelledby={`${section.id}-scaffold-title`}>
    <h2 id={`${section.id}-scaffold-title`} className="sr-only">{section.title}</h2>
    {section.id === 'contacto' && <a className="checkpoint-email" href={siteConfig.emailHref}>{siteConfig.email}</a>}
  </section>)}</>;
}
