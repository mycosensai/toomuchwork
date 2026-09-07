/**
 * JsonLd — tiny structured-data (JSON-LD / Schema.org) injector.
 * Renders a <script type="application/ld+json"> for the current page so
 * search engines and AI answer engines can extract Service/FAQ content.
 * Client-rendered JSON-LD is executed by Google's renderer; server-side
 * injection would be stronger but this SPA renders client-side.
 */
export default function JsonLd({ schema }: { schema: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/** Base Organization node shared by page schemas. */
export const VAULT_ORG = {
  '@type': 'Organization',
  name: 'The Vault DFW',
  url: 'https://thevaultdfw.win',
  description: 'Premium marketplace for rare and luxury collectibles — verified by AI expert review.',
}

/** Service schema for a premium report page. */
export function serviceSchema(opts: {
  name: string
  description: string
  price: string
  priceRange?: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    provider: VAULT_ORG,
    areaServed: 'Worldwide',
    serviceType: opts.name,
    offers: {
      '@type': 'Offer',
      price: opts.price,
      priceCurrency: 'USD',
      ...(opts.priceRange ? { priceRange: opts.priceRange } : {}),
    },
  }
}

/** FAQPage schema — questions must be genuinely asked by users. */
export function faqSchema(faqs: { q: string; a: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}
