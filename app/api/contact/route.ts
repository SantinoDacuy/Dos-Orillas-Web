import { createContactHandler } from '@/lib/contact/handler';

export const runtime = 'nodejs';
export const maxDuration = 15;
export const POST = createContactHandler();
