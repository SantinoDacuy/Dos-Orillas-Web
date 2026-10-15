import { Fragment, isValidElement, type ReactNode } from 'react';

// Closed serializer for code-owned diagram bodies, never arbitrary HTML.
const tags = new Set(['g', 'path', 'circle', 'rect', 'text', 'tspan']);
const attributes = new Set(['className', 'd', 'pathLength', 'markerEnd', 'x', 'y', 'cx', 'cy', 'r', 'rx',
  'width', 'height', 'textAnchor', 'dominantBaseline', 'dy', 'data-kv-from', 'data-kv-to', 'data-kv-node']);
const names: Record<string, string> = {
  className: 'class', markerEnd: 'marker-end', textAnchor: 'text-anchor', dominantBaseline: 'dominant-baseline',
};
const escape = (value: string | number) => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[character]!);

function styleMarkup(style: unknown): string {
  if (!style || typeof style !== 'object' || Array.isArray(style)) throw new Error('Invalid diagram style.');
  return Object.entries(style).map(([name, value]) => {
    if (name === '--kv-delay' && typeof value === 'string' && /^\d+(?:\.\d+)?ms$/.test(value)) return `${name}:${value}`;
    if (name === 'offsetPath' && typeof value === 'string' && /^path\('[a-zA-Z0-9.,+\- ]+'\)$/.test(value)) return `offset-path:${value}`;
    throw new Error('Unsupported diagram style.');
  }).join(';');
}

/** Reduce Flight/hydration element graphs while preserving the native SVG DOM. */
export function svgMarkup(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return escape(node);
  if (Array.isArray(node)) return node.map(svgMarkup).join('');
  if (!isValidElement<Record<string, unknown>>(node)) throw new Error('Invalid diagram node.');
  if (node.type === Fragment) return svgMarkup(node.props.children as ReactNode);
  if (typeof node.type !== 'string' || !tags.has(node.type)) throw new Error('Unsupported diagram element.');
  const attrs = Object.entries(node.props).filter(([name, value]) => name !== 'children' && value !== null && value !== undefined)
    .map(([name, value]) => {
      if (name === 'style') return ` style="${escape(styleMarkup(value))}"`;
      if (!attributes.has(name) || typeof value !== 'string' && typeof value !== 'number') throw new Error('Unsupported diagram attribute.');
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Invalid diagram number.');
      if (name === 'markerEnd' && !/^url\(#[a-zA-Z0-9_-]+\)$/.test(String(value))) throw new Error('Invalid diagram marker.');
      return ` ${names[name] ?? name}="${escape(value)}"`;
    }).join('');
  return `<${node.type}${attrs}>${svgMarkup(node.props.children as ReactNode)}</${node.type}>`;
}
