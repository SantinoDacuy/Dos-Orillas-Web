import 'server-only';
import { cloneElement, Fragment, isValidElement, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { EditorialLines } from '@/components/sections/EditorialLines';

// This serializer accepts only the code-owned editorial section bodies.
// Interactive islands and image components must retain their ordinary JSX.
const tags = new Set(['div', 'header', 'article', 'p', 'h2', 'h3', 'span', 'ol', 'ul', 'li', 'a']);
const attributes = new Set(['className', 'id', 'href', 'tabIndex', 'aria-hidden', 'aria-label',
  'aria-labelledby', 'aria-describedby', 'data-editorial-line', 'data-editorial-word',
  'data-editorial-words', 'data-editorial-bridge', 'data-team-member', 'data-marquee-direction',
  'data-final-cta', 'data-editorial', 'data-theme', 'data-nav']);
const escape = (value: string | number | boolean) => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[character]!);

/** Closed HTML serialization: no events, styles, raw HTML or arbitrary components. */
export function sectionMarkup(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return escape(node);
  if (Array.isArray(node)) return node.map(sectionMarkup).join('');
  if (!isValidElement<Record<string, unknown>>(node)) throw new Error('Invalid editorial node.');
  if (node.type === Fragment) {
    if (Object.keys(node.props).some(name => name !== 'children')) throw new Error('Unsupported editorial fragment.');
    return sectionMarkup(node.props.children as ReactNode);
  }
  if (node.type === EditorialLines) {
    if (Object.keys(node.props).some(name => name !== 'lines' && name !== 'accentLast') ||
      !Array.isArray(node.props.lines) || !node.props.lines.every(line => typeof line === 'string') ||
      node.props.accentLast !== undefined && typeof node.props.accentLast !== 'boolean') {
      throw new Error('Invalid editorial lines.');
    }
    return sectionMarkup(EditorialLines(node.props as Parameters<typeof EditorialLines>[0]));
  }
  if (typeof node.type !== 'string' || !tags.has(node.type)) throw new Error('Unsupported editorial element.');
  const attrs = Object.entries(node.props)
    .filter(([name, value]) => name !== 'children' && value !== null && value !== undefined)
    .map(([name, value]) => {
      if (!attributes.has(name) || typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        throw new Error('Unsupported editorial attribute.');
      }
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid editorial number.');
      if (typeof value === 'boolean' && !name.startsWith('aria-') && !name.startsWith('data-')) {
        throw new Error('Invalid editorial boolean.');
      }
      if (name === 'href' && (typeof value !== 'string' || !/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(value))) {
        throw new Error('Unsupported editorial link.');
      }
      const attribute = name === 'className' ? 'class' : name === 'tabIndex' ? 'tabindex' : name;
      return ` ${attribute}="${escape(value)}"`;
    }).join('');
  return `<${node.type}${attrs}>${sectionMarkup(node.props.children as ReactNode)}</${node.type}>`;
}

/** Keep the native section/SSR content while avoiding a duplicate Flight element graph. */
export function staticSection(section: ReactElement<HTMLAttributes<HTMLElement>>): ReactElement {
  if (section.type !== 'section') throw new Error('Expected an editorial section.');
  if (Object.keys(section.props).some(name => name !== 'children' && !attributes.has(name))) {
    throw new Error('Unsupported editorial section attribute.');
  }
  return cloneElement(section, {
    children: undefined,
    dangerouslySetInnerHTML: { __html: sectionMarkup(section.props.children) },
  });
}
