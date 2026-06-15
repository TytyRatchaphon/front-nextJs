/**
 * Reusable server component for injecting JSON-LD structured data.
 *
 * Usage:
 *   <JsonLd data={generateBookSchema({ ... })} />
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
