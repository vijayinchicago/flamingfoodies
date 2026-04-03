import { absoluteUrl } from "@/lib/utils";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FlamingFoodies",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/api/og?title=FlamingFoodies")
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
