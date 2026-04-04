import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { getGuides } from "@/lib/content/guides";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Spicy Food Guides | FlamingFoodies",
  description:
    "Evergreen guides for Scoville heat, fermentation, hot sauce technique, and spicy cooking reference.",
  path: "/guides"
});

export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Guides"
        title="Evergreen reference pieces for the spicy food rabbit hole."
        copy="Guides stay handcrafted and static so they can go deeper than the high-volume AI pipeline."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {guides.map((guide) => (
          <Link key={guide.slug} href={`/guides/${guide.slug}`} className="panel p-7">
            <p className="eyebrow">Guide</p>
            <h2 className="mt-4 font-display text-4xl text-cream">{guide.title}</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">{guide.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
