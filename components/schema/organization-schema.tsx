import { absoluteUrl } from "@/lib/utils";

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FlamingFoodies",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/brand/flamingfoodies-mark.png")
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
