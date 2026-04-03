import { notFound } from "next/navigation";

import { buildMetadata } from "@/lib/seo";
import { getGuideBySlug, getGuides } from "@/lib/content/guides";

export async function generateStaticParams() {
  const guides = await getGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const guides = await getGuides();
  const guide = guides.find((entry) => entry.slug === params.slug);

  return buildMetadata({
    title: guide?.title || "Guide | FlamingFoodies",
    description: guide?.description || "Evergreen spicy food guide.",
    path: `/guides/${params.slug}`
  });
}

export default async function GuidePage({
  params
}: {
  params: { slug: string };
}) {
  try {
    const guide = await getGuideBySlug(params.slug);

    return (
      <article className="container-shell py-16">
        <p className="eyebrow">Guide</p>
        <h1 className="mt-4 max-w-4xl font-display text-6xl leading-tight text-cream">
          {guide.title}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-cream/75">{guide.description}</p>
        <div
          className="prose-guide mt-12"
          dangerouslySetInnerHTML={{ __html: guide.html }}
        />
      </article>
    );
  } catch {
    notFound();
  }
}
