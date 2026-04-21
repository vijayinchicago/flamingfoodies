import type { Festival } from "@/lib/festivals";
import { absoluteUrl } from "@/lib/utils";

export function EventSchema({ festival }: { festival: Festival }) {
  const url = absoluteUrl(`/festivals/${festival.slug}`);

  // Build an approximate ISO date string for the event month
  const year = new Date().getFullYear();
  const startMonth = String(festival.month).padStart(2, "0");
  const endMonth = String(
    festival.month === 12 ? 1 : festival.month + 1
  ).padStart(2, "0");
  const endYear = festival.month === 12 ? year + 1 : year;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: festival.name,
    description: festival.description,
    url,
    location: {
      "@type": "Place",
      name: `${festival.city}, ${festival.state}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: festival.city,
        addressRegion: festival.stateCode,
        addressCountry: "US"
      }
    },
    startDate: `${year}-${startMonth}-01`,
    endDate: `${endYear}-${endMonth}-01`,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      name: "FlamingFoodies",
      url: absoluteUrl("/")
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
