import { brandCopy } from '@/content/site';
export function Logo({ light = false, horizontal = false, eager = false, className = '' }: { light?: boolean; horizontal?: boolean; eager?: boolean; className?: string }) {
  const src = horizontal ? `/brand/logo-horizontal${light ? '-light' : ''}.svg` : `/brand/logo${light ? '-light' : ''}.svg`;
  // Official vectors need no raster optimizer; intrinsic dimensions reserve their exact box.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={`brand-logo ${className}`} src={src} alt={brandCopy.accessibleName} width={horizontal ? 894 : 870} height={horizontal ? 121 : 492} style={{ aspectRatio: horizontal ? '894 / 121' : '870 / 492' }} loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority="low" />;
}
