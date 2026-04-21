import type { Tutorial } from "@/lib/tutorials";
import { absoluteUrl } from "@/lib/utils";

export function HowToSchema({ tutorial }: { tutorial: Tutorial }) {
  const url = absoluteUrl(`/how-to/${tutorial.slug}`);

  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tutorial.title,
    description: tutorial.description,
    url,
    step: tutorial.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.heading,
      text: step.body,
      url: `${url}#step-${index + 1}`
    })),
    tool: tutorial.affiliateKeys.length
      ? tutorial.affiliateKeys.map((key) => ({
          "@type": "HowToTool",
          name: key
        }))
      : undefined
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
