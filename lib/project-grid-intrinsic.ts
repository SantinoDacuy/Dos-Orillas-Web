import type { Project } from '@/data/projects';
import { getProjectGridLayout } from '@/lib/project-grid';

/** Mobile flow estimate from rendered N/ratios/text lines and current CSS tokens.
 * This is a placeholder, not a certified measured height. `auto` learns real size. */
export function estimateProjectGridIntrinsicHeight(visible: readonly Project[], hasMore = false): string {
  let imageWidths = 0;
  let titleLines = 0;
  let metadata = 0;
  let infoGaps = 0;
  visible.forEach((project, index) => {
    const layout = getProjectGridLayout(index);
    const [width = 1, height = 1] = layout.ratio.split('/').map(Number);
    imageWidths += (layout.side === 'left' ? .88 : .78) * height / width;
    titleLines += Math.max(1, project.titleLines.length);
    const hasMetadata = Boolean(project.categoryLabel || project.year !== null);
    metadata += Number(hasMetadata);
    infoGaps += hasMetadata ? 2 : 1;
  });
  const count = visible.length;
  const titleFont = 'clamp(1.5rem, 6.5vw, 3.5rem)';
  const headingFont = 'clamp(2.6rem, 8.6vw, 8.75rem)';
  return `calc(${imageWidths.toFixed(6)} * (100vw - 2 * var(--gutter, 20px))
    + ${titleLines} * 1.02 * ${titleFont} + ${metadata} * 1.125rem + ${infoGaps} * 12px
    + ${count} * (clamp(20px, 2.2vw, 32px) + 44px + clamp(64px, 10vw, 104px))
    + 180px + (var(--project-grid-estimate-header-lines, 2) * .94 + .22) * ${headingFont}
    + clamp(48px, 8vw, 112px) + clamp(80px, 12svh, 150px) + clamp(88px, 12svh, 160px)
    ${hasMore ? '+ clamp(48px, 8vw, 100px) + 44px' : ''})`.replace(/\s+/g, ' ');
}
