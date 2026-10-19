import React from 'react';
import { Network, Database as LucideDatabase } from 'lucide-react';

export interface TechMeta {
  brandColor: string;
}

export const TECH_METADATA: Record<string, TechMeta> = {
  'Next.js': { brandColor: '#ffffff' },
  'React': { brandColor: '#61DAFB' },
  'TypeScript': { brandColor: '#3178C6' },
  'JavaScript': { brandColor: '#F7DF1E' },
  'GSAP': { brandColor: '#88CE02' },
  'Tailwind': { brandColor: '#38BDF8' },
  'Figma': { brandColor: '#F24E1E' },
  'Node.js': { brandColor: '#5FA04E' },
  'Python': { brandColor: '#3776AB' },
  'APIs REST': { brandColor: '#38BDF8' },
  'Supabase': { brandColor: '#3ECF8E' },
  'Docker': { brandColor: '#2496ED' },
  'AWS': { brandColor: '#FF9900' },
  'PostgreSQL': { brandColor: '#4169E1' },
  'SQL': { brandColor: '#38BDF8' },
  'Redis': { brandColor: '#DC382D' },
  'MongoDB': { brandColor: '#47A248' },
};

export function TechIcon({ name }: { name: string }) {
  switch (name) {
    case 'Next.js':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.69 17.514L9.124 6.786h1.792l7.294 9.614-.52.114zm-1.89-6.494l-1.543-2.03v7.766h1.543v-5.736z" />
        </svg>
      );

    case 'React':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16" aria-hidden="true">
          <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(0 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        </svg>
      );

    case 'TypeScript':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M2.5 2.5h19v19h-19v-19zm8.25 6.5H5.8v2.1h1.9v7.9h2.3V11.1h1.9V9zm3.5 10c1.3 0 2.4-.4 3.3-1.1l-1.1-1.6c-.6.5-1.3.8-2.1.8-1 0-1.6-.4-1.6-1.1 0-.6.5-.9 1.5-1.3l.8-.3c1.7-.7 2.4-1.5 2.4-2.8 0-1.8-1.4-2.8-3.4-2.8-1.2 0-2.2.3-3 .9l1 1.6c.6-.4 1.3-.7 1.9-.7.9 0 1.4.4 1.4 1 0 .5-.4.8-1.4 1.2l-.8.3c-1.8.7-2.5 1.6-2.5 2.9 0 1.8 1.4 3 3.6 3z" />
        </svg>
      );

    case 'JavaScript':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M2.5 2.5h19v19h-19v-19zm7.7 13.9c.7 0 1.2-.4 1.2-1.2v-5.4h-2v4.8c0 .4-.2.6-.5.6-.4 0-.6-.3-.9-.6l-1 1.2c.7.9 1.7 1.4 3.2 1.4zm5.5 0c1.4 0 2.5-.5 3.3-1.3l-1.1-1.5c-.6.5-1.3.8-2.1.8-.9 0-1.5-.4-1.5-1 0-.6.4-.8 1.4-1.2l.8-.3c1.7-.7 2.4-1.4 2.4-2.8 0-1.8-1.4-2.8-3.3-2.8-1.2 0-2.2.4-3 .9l1 1.6c.5-.4 1.2-.6 1.9-.6.8 0 1.3.4 1.3 1 0 .5-.4.8-1.3 1.2l-.8.3c-1.8.7-2.5 1.5-2.5 2.8 0 1.9 1.5 3 3.6 3z" />
        </svg>
      );

    case 'GSAP':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5l-5-2.8V9.3l5-2.8 5 2.8v2.2h-2.5V10.2l-2.5-1.4-2.5 1.4v3.6l2.5 1.4 2.5-1.4v-1h-2.5v-2H18v4.3l-5 2.8z" />
        </svg>
      );

    case 'Tailwind':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.336 6.182 14.975 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.336 13.382 8.975 12 6.001 12z" />
        </svg>
      );

    case 'Figma':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M8 2a4 4 0 0 0 0 8h4V2H8zm8 0h-4v8h4a4 4 0 1 0 0-8zm-4 8H8a4 4 0 0 0 0 8h4v-8zm4 0h-4v8h4a4 4 0 1 0 0-8zm-4 8H8a4 4 0 1 0 4 4v-4z" />
        </svg>
      );

    case 'Node.js':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M12 2l9 5.2v10.4L12 23l-9-5.4V7.2L12 2zm0 2.3L4.8 8.5v7.6L12 20.3l7.2-4.2V8.5L12 4.3zm-1 4.2h2v4.8c0 .8-.5 1.4-1.3 1.4-.4 0-.8-.1-1.1-.4l-.6 1.4c.5.4 1.1.6 1.8.6 1.9 0 3.2-1.2 3.2-3.1v-4.7h-4V8.5z" />
        </svg>
      );

    case 'Python':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M11.9 2C8.3 2 8.5 3.5 8.5 3.5v3.1h6.9v1H6.1s-4.1-.5-4.1 4.1 3.6 4.3 3.6 4.3h2.1v-2.9s-.1-3.6 3.5-3.6h5.8s3.4.1 3.4-3.3c0-3.4-2.8-4.2-5.9-4.2h-2.6zm-1.8 1.8c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1zm1.9 18.2c3.6 0 3.4-1.5 3.4-1.5v-3.1H8.5v-1h9.3s4.1.5 4.1-4.1-3.6-4.3-3.6-4.3h-2.1v2.9s.1 3.6-3.5 3.6H6.9s-3.4-.1-3.4 3.3c0 3.4 2.8 4.2 5.9 4.2h2.6zm1.8-1.8c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z" />
        </svg>
      );

    case 'APIs REST':
      return <Network size={16} strokeWidth={1.75} aria-hidden="true" />;

    case 'Supabase':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M13.3 2.1c-.8-.9-2.3-.4-2.4.9l-.6 9.4h8.3c1.3 0 1.9 1.6 1 2.5L9.7 23.3c-.9.9-2.4.3-2.3-1l.7-9.5H.8c-1.2 0-1.9-1.5-1.1-2.4L13.3 2.1z" />
        </svg>
      );

    case 'Docker':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M22.5 10.8c-.3-.2-1.3-.3-2.2.3-.4-.5-.9-.8-1.6-.9l-.3-1.4h-1.9v2.2c-.3 0-.6.1-.9.2-1-.7-2.6-.6-3.5 0H1V14c0 3.9 3.2 7 7.1 7 4.9 0 8.9-3.4 9.7-8 1.7-.1 3.5-.8 4.7-2.2zm-12.8-1h1.9v1.9H9.7V9.8zm0-2.4h1.9v1.9H9.7V7.4zm-2.4 2.4h1.9v1.9H7.3V9.8zm0-2.4h1.9v1.9H7.3V7.4zm-2.4 2.4h1.9v1.9H4.9V9.8zm4.8-4.8h1.9v1.9H9.7V5zm-2.4 0h1.9v1.9H7.3V5zm4.8 2.4h1.9v1.9h-1.9V7.4zm0 2.4h1.9v1.9h-1.9V9.8z" />
        </svg>
      );

    case 'AWS':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M7.4 9.2c0 .7.1 1.3.4 1.7.3.4.7.6 1.2.6.4 0 .8-.2 1.1-.5.3-.3.5-.8.5-1.4V8.4H9.4c-.6 0-1.1.2-1.4.5-.4.3-.6.7-.6 1.3zm5.7 3.9c-.3.4-.8.7-1.4.9-.6.2-1.2.3-1.9.3-1.1 0-2-.3-2.6-1-.6-.7-1-1.6-1-2.8 0-1.2.3-2.1 1-2.8.7-.7 1.6-1.1 2.8-1.1.7 0 1.3.1 1.9.4.6.2 1 .6 1.2.9V6.2h2.2v9.3H13v-2.4zm8.3-4.7l-1.9 6.9h-2.1l-1.4-5.3-1.4 5.3h-2.1l-1.9-6.9h2.2l1 4.4 1.3-4.4h1.8l1.3 4.4 1-4.4h2.1zM3 18.6c4.6 2.6 10.5 2.6 15.6-.4.4-.3.1-.7-.3-.5-4.7 2.7-10.2 2.7-14.7-.2-.4-.3-.8.4-.6 1.1zm15.7-.3c.4-.5.9-1.2 1.3-1.9.1-.2-.1-.3-.2-.2-.6.4-1.4.7-2.1.9-.3.1-.2.4.1.4.3.3.6.5.9.8z" />
        </svg>
      );

    case 'PostgreSQL':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M12 2C7.5 2 4.1 4.9 3.2 8.8c-.4 1.9-.2 4 .6 5.8.7 1.6 2 2.9 3.5 3.8.3.2.7.4 1 .6-.1.8-.1 1.7.1 2.5.1.4.5.6.9.5.4-.1.6-.5.5-.9-.2-.7-.2-1.4 0-2.1.9.3 1.8.5 2.7.5 1.5 0 3-.4 4.3-1.1 2.2-1.2 3.8-3.4 4.1-5.9.3-2.4-.6-4.9-2.3-6.6C16.8 3.5 14.5 2 12 2zm-.2 3.6c2 0 3.7 1.2 4.3 3 .5 1.4.2 3-.7 4.1-.7.9-1.8 1.4-3 1.5h-.7c-.6-.1-1.2-.3-1.7-.7-.8-.7-1.3-1.7-1.2-2.8.1-1.2.8-2.3 1.8-2.9 1-.7 2.2-1 3.4-.9-.4-1-.9-1.3-1.9-1.3z" />
        </svg>
      );

    case 'SQL':
      return <LucideDatabase size={16} strokeWidth={1.75} aria-hidden="true" />;

    case 'Redis':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M2 15.6l9.6 4.3c.3.1.6.1.9 0l9.5-4.3c.6-.3.6-1.1 0-1.4l-2.6-1.2-6.9 3.1c-.6.3-1.3.3-1.9 0L3.7 13l-1.7.8c-.6.3-.6 1.1 0 1.4v.4zm0-4.4l9.6 4.3c.3.1.6.1.9 0l9.5-4.3c.6-.3.6-1.1 0-1.4l-2.6-1.2-6.9 3.1c-.6.3-1.3.3-1.9 0L3.7 8.6 2 9.4c-.6.3-.6 1.1 0 1.4v.4zm10.1-9.2c-.3-.1-.6-.1-.9 0L1.6 6.3c-.6.3-.6 1.1 0 1.4l9.6 4.3c.3.1.6.1.9 0l9.6-4.3c.6-.3.6-1.1 0-1.4L12.1 2z" />
        </svg>
      );

    case 'MongoDB':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path d="M12.2 2c-.3 0-.5.2-.6.4C10.7 4.3 7 11.2 7 14.8c0 3.7 2.6 6.7 5.2 7.2.1 0 .2 0 .2-.1v-4.6c0-.5.2-1 .6-1.3.4.3.6.8.6 1.3v4.6c0 .1.1.1.2.1 2.6-.5 5.2-3.5 5.2-7.2 0-3.6-3.7-10.5-4.6-12.4-.1-.2-.3-.4-.6-.4h-.1z" />
        </svg>
      );

    default:
      return null;
  }
}
