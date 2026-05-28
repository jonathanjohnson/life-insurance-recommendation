/**
 * Renders an array of JSON-LD schemas as separate <script> tags in the
 * server stream. We render plain <script type="application/ld+json"> rather
 * than next/script so the structured data ships in the initial HTML — that
 * matches the Breadcrumbs component and is the Next.js App Router pattern
 * for SEO data. next/script's loader strategies defer execution after
 * hydration, which is fine for executable JS but suboptimal for crawlers
 * that don't run JavaScript.
 */
interface SchemaInjectorProps {
  schemas: object[];
}

export function SchemaInjector({ schemas }: SchemaInjectorProps) {
  if (schemas.length === 0) return null;
  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
