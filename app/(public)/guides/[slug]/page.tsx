import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentCard } from "@/components/cards/content-card";
import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PeppersInContent } from "@/components/peppers/peppers-in-content";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { getGuideBySlug, getGuides, getGuidesWithBody } from "@/lib/content/guides";
import {
  getBlogPostsForGuide,
  getPeppersInGuide,
  getRecipesForGuide,
  getRelatedGuides,
  getReviewsForGuide
} from "@/lib/content-cross-links";
import { shouldPromoteBlogPost } from "@/lib/editorial-guards";
import { buildMetadata } from "@/lib/seo";
import { getBlogPosts, getRecipes, getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

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
  const guide = await getGuideBySlug(params.slug).catch(() => null);
  if (!guide) notFound();

  const [allGuides, allRecipes, allReviews, allPosts] = await Promise.all([
    getGuidesWithBody(),
    getRecipes(),
    getReviews(),
    getBlogPosts()
  ]);

  const currentGuide = allGuides.find((entry) => entry.slug === params.slug);
  // Fall back gracefully — if the body lookup misses, the page still renders
  // its core content but skips the cross-link sections.
  const peppersInGuide = currentGuide ? getPeppersInGuide(currentGuide) : [];
  const recipesForGuide = currentGuide
    ? getRecipesForGuide(
        currentGuide,
        allRecipes.filter((recipe) => recipe.status === "published"),
        3
      )
    : [];
  const reviewsForGuide = currentGuide
    ? getReviewsForGuide(
        currentGuide,
        allReviews.filter((review) => review.status === "published"),
        3
      )
    : [];
  const postsForGuide = currentGuide
    ? getBlogPostsForGuide(
        currentGuide,
        allPosts.filter((post) =>
          shouldPromoteBlogPost({ slug: post.slug, source: post.source })
        ),
        3
      )
    : [];
  const relatedGuides = currentGuide
    ? getRelatedGuides(currentGuide, allGuides, 2)
    : [];

  return (
    <article className="container-shell py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Guides", item: absoluteUrl("/guides") },
          { name: guide.title, item: absoluteUrl(`/guides/${guide.slug}`) }
        ]}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: guide.title }
        ]}
      />
      <p className="eyebrow mt-5">Guide</p>
      <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight text-charcoal sm:text-5xl lg:text-6xl">
        {guide.title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-charcoal/75 sm:text-lg sm:leading-8">
        {guide.description}
      </p>
      <div
        className="prose-guide mt-12"
        dangerouslySetInnerHTML={{ __html: guide.html }}
      />
      {peppersInGuide.length > 0 ? (
        <div className="mt-10 max-w-3xl">
          <PeppersInContent peppers={peppersInGuide} heading="Peppers covered in this guide" />
        </div>
      ) : null}
      {recipesForGuide.length > 0 ? (
        <section className="mt-14">
          <p className="eyebrow">Put it into practice</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Recipes that use what this guide explains.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/70">
            Matched on the vocabulary, techniques, and ingredients above.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {recipesForGuide.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <Link
            href="/recipes"
            className="mt-6 inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal hover:border-charcoal/30"
          >
            Browse all recipes
          </Link>
        </section>
      ) : null}
      {reviewsForGuide.length > 0 ? (
        <section className="mt-14">
          <p className="eyebrow">Bottles to try</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Hot sauces to try.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/70">
            Reviewed picks that map to the heat tiers and styles covered here.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {reviewsForGuide.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <Link
            href="/hot-sauces"
            className="mt-6 inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal hover:border-charcoal/30"
          >
            Browse all hot sauces
          </Link>
        </section>
      ) : null}
      {postsForGuide.length > 0 ? (
        <section className="mt-14">
          <p className="eyebrow">From the blog</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Editorial that touches the same ground.
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {postsForGuide.map((post) => (
              <ContentCard
                key={post.slug}
                href={`/blog/${post.slug}`}
                image={post.imageUrl}
                imageAlt={post.imageAlt}
                eyebrow={post.category}
                title={post.title}
                description={post.description}
                meta={post.publishedAt}
              />
            ))}
          </div>
        </section>
      ) : null}
      {relatedGuides.length > 0 ? (
        <section className="mt-14 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-7 sm:p-8">
          <p className="eyebrow">Keep reading</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">
            More guides on this topic.
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {relatedGuides.map((entry) => (
              <Link
                key={entry.slug}
                href={`/guides/${entry.slug}`}
                className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5 transition hover:border-charcoal/20"
              >
                <p className="eyebrow">Guide</p>
                <h3 className="mt-2 font-display text-2xl text-charcoal">{entry.title}</h3>
                <p className="mt-3 text-sm leading-6 text-charcoal/70">{entry.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
