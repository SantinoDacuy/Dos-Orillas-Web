import { serializeJSONLD, type StructuredDataObject } from '@/lib/structured-data';

export function StructuredData({ data }: { data: StructuredDataObject | StructuredDataObject[] | null }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJSONLD(data) }} />;
}
