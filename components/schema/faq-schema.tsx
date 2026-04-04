import type { RecipeFaq } from "@/lib/types";
import { buildFaqStructuredData } from "@/lib/structured-data";

export function FaqSchema({ faqs }: { faqs: RecipeFaq[] }) {
  const schema = buildFaqStructuredData(faqs);

  if (!schema) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
