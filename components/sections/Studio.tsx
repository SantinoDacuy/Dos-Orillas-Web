import { studioCopy, type ContentMedia } from '@/content/site';
import { Media } from '@/components/ui/Media';
import { getAsset } from '@/lib/assets';
import { EditorialLines } from './EditorialLines';
import { staticSection } from '@/lib/static-section';

function StudioPhoto({ media, index }: { media: ContentMedia; index: number }) {
  if (!getAsset(media.src)) return null;
  return <figure className={`studio-photo studio-photo-${index}`} data-editorial-photo
    data-speed={index === 0 ? 1.06 : index === 1 ? 0.94 : 1.03}
    data-photo-real={String(Boolean(getAsset(media.src)))}>
    <div className="editorial-photo-mask"><div className="editorial-photo-camera">
      <Media path={media.src} width={media.width} height={media.height} alt={media.alt}
        focal={media.focal} sizes={index === 1 ? '(min-width: 1024px) 40vw, 90vw' : '(min-width: 1024px) 22vw, 58vw'} />
    </div></div>
  </figure>;
}

export function Studio() {
  // The final paragraph is composed from its literal prefix and the canonical trio.
  const closingPrefix = studioCopy.paragraphs[2].split(studioCopy.statements[0])[0]?.trim() ?? '';
  const hasPhotos = studioCopy.media.some(media => Boolean(getAsset(media.src)));
  const section = <section id="el-estudio" className="studio-section editorial-section" data-editorial="studio"
    data-theme="white" data-nav="light" aria-labelledby="studio-heading">
    <div className="studio-split">
      <header className="studio-sticky">
        <p className="editorial-eyebrow">{studioCopy.title}</p>
        <h2 id="studio-heading" className="studio-headline"><EditorialLines lines={studioCopy.headline} /></h2>
      </header>
      <div className="studio-reading">
        <p className="studio-lead" data-editorial-words>{studioCopy.lead.split(/\s+/).map((word, index) =>
          <span key={`${index}-${word}`}><span data-editorial-word>{word}</span>{' '}</span>)}</p>
        {studioCopy.media[0] && getAsset(studioCopy.media[0].src) && <StudioPhoto media={studioCopy.media[0]} index={0} />}
        <div className="studio-paragraphs">
          {studioCopy.paragraphs.slice(0, 2).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
        {studioCopy.media[1] && getAsset(studioCopy.media[1].src) && <StudioPhoto media={studioCopy.media[1]} index={1} />}
        {closingPrefix && <p className="studio-closing-prefix">{closingPrefix}</p>}
        <ol className="studio-statements">
          {studioCopy.statements.map((statement, index) => <li key={statement}>
            <span>{statement}</span>
            {index < studioCopy.statements.length - 1 && <span className="studio-statement-bridge" aria-hidden="true" data-editorial-bridge />}
          </li>)}
        </ol>
        {studioCopy.media[2] && getAsset(studioCopy.media[2].src) && <StudioPhoto media={studioCopy.media[2]} index={2} />}
      </div>
    </div>
  </section>;
  // Next/Image media keeps its own server/client behavior when real assets arrive.
  return hasPhotos ? section : staticSection(section);
}
