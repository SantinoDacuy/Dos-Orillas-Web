import { Media } from '@/components/ui/Media';
import type { MediaRef } from '@/data/projects';

export function ProjectGallery({ media }: { media: readonly (MediaRef & { src: string })[] }) {
  if (!media.length) return null;
  return <div className="case-gallery" data-project-gallery>
    {media.map((item, index) => <figure className="case-gallery-item" key={`${item.src}-${index}`} data-project-image-reveal
      style={{ aspectRatio: `${item.width} / ${item.height}` }}>
      <div className="case-gallery-parallax" data-project-parallax>
        <Media path={item.src} alt={item.alt} width={item.width} height={item.height}
          focal={item.focal} sizes="(max-width: 767px) 84vw, (max-width: 1023px) 70vw, 50vw" />
      </div>
    </figure>)}
  </div>;
}
