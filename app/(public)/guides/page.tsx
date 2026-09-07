import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { getGuides } from "@/lib/content/guides";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Spicy Food Guides | FlamingFoodies",
  description:
    "Practical guides to Scoville heat, fermentation, hot sauce, and cooking with chilies.",
  path: "/guides"
});

export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Guides"
        title="Guides to peppers, hot sauce, and spicy cooking."
        copy="Reference guides go deeper on Scoville heat, fermentation, pantry technique, and spicy cooking fundamentals."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {guides.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="panel p-7">
            <p className="eyebrow">Guide</p>
            <h2 className="mt-4 font-display text-4xl text-charcoal">{guide.title}</h2>
            <p className="mt-4 text-sm leading-7 text-charcoal/75">{guide.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
