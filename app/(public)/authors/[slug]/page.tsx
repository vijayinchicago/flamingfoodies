import Link from "next/link";
import { notFound } from "next/navigation";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import {
  EDITORIAL_PERSONA_DISCLOSURE,
  buildAuthorProfileStructuredData,
  getAllPublicAuthors,
  getPublicAuthorBySlug,
  matchesPublicAuthorName
} from "@/lib/authors";
import { shouldPromoteBlogPost } from "@/lib/editorial-guards";
import { buildMetadata } from "@/lib/seo";
import { getBlogPosts, getRecipes, getReviews } from "@/lib/services/content";

const LAST_UPDATED = "September 6, 2026";

export async function generateStaticParams() {
  return getAllPublicAuthors().map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const author = getPublicAuthorBySlug(params.slug);

  if (!author) {
    return buildMetadata({
      title: "Contributor | FlamingFoodies",
      description: "Contributor details for FlamingFoodies."
    });
  }

  return buildMetadata({
    title: `${author.displayName} | FlamingFoodies`,
    description: `${author.role} at FlamingFoodies. ${author.shortBio}`,
    path: `/authors/${author.slug}`
  });
}

export default async function AuthorPage({
  params
}: {
  params: { slug: string };
}) {
  const author = getPublicAuthorBySlug(params.slug);

  if (!author) notFound();

  const [blogPosts, recipes, reviews] = await Promise.all([
    getBlogPosts(),
    getRecipes(),
    getReviews()
  ]);

  const authoredPosts = blogPosts
    .filter(
      (post) =>
        matchesPublicAuthorName(author, post.authorName) &&
        shouldPromoteBlogPost({ slug: post.slug, source: post.source })
    )
    .slice(0, 4);
  const authoredRecipes = recipes
    .filter((recipe) => matchesPublicAuthorName(author, recipe.authorName))
    .slice(0, 4);
  const authoredReviews = reviews
    .filter((review) => matchesPublicAuthorName(author, review.authorName))
    .slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildAuthorProfileStructuredData(author))
        }}
      />
      <TrustPageShell
        eyebrow="Editorial pen name"
        title={author.displayName}
        description={`${author.role}. ${author.personality}`}
        lastUpdated={LAST_UPDATED}
      >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="panel p-8">
          <p className="eyebrow">About this byline</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">What you’ll find here.</h2>
          <p className="mt-4 rounded-[1.25rem] border border-ember/20 bg-ember/[0.06] p-4 text-sm leading-7 text-charcoal/75">
            {EDITORIAL_PERSONA_DISCLOSURE}
          </p>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">{author.longBio}</p>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-charcoal/70">
            {author.focusAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
          {author.alsoWritesAt ? (
            <p className="mt-6 text-sm text-charcoal/65">
              Also writes at{" "}
              <a
                href={author.alsoWritesAt.url}
                rel="noopener author"
                className="font-semibold text-charcoal underline underline-offset-4 hover:text-ember"
              >
                {author.alsoWritesAt.name}
              </a>
              .
            </p>
          ) : null}
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Our standards</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">How we write and review.</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/75">
            Read our policies on writing, product reviews, and correcting mistakes.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/editorial-policy"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Editorial policy
            </Link>
            <Link
              href="/review-methodology"
              className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Review methodology
            </Link>
            <Link
              href="/corrections"
              className="rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Corrections policy
            </Link>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="panel p-8">
          <p className="eyebrow">Stories</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Articles</h2>
          <div className="mt-5 space-y-3">
            {authoredPosts.length ? (
              authoredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block rounded-[1.35rem] border border-charcoal/10 bg-charcoal/[0.04] px-4 py-4 text-sm text-charcoal/75"
                >
                  <span className="text-xs uppercase tracking-[0.18em] text-ember">{post.category}</span>
                  <span className="mt-2 block font-semibold text-charcoal">{post.title}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-charcoal/70">No published blog stories are listed for this byline yet.</p>
            )}
          </div>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Recipes</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Kitchen work</h2>
          <div className="mt-5 space-y-3">
            {authoredRecipes.length ? (
              authoredRecipes.map((recipe) => (
                <Link
                  key={recipe.slug}
                  href={`/recipes/${recipe.slug}`}
                  className="block rounded-[1.35rem] border border-charcoal/10 bg-charcoal/[0.04] px-4 py-4 text-sm text-charcoal/75"
                >
                  <span className="text-xs uppercase tracking-[0.18em] text-ember">{recipe.cuisineType}</span>
                  <span className="mt-2 block font-semibold text-charcoal">{recipe.title}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-charcoal/70">No published recipes are listed for this byline yet.</p>
            )}
          </div>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal">Product reviews</h2>
          <div className="mt-5 space-y-3">
            {authoredReviews.length ? (
              authoredReviews.map((review) => (
                <Link
                  key={review.slug}
                  href={`/reviews/${review.slug}`}
                  className="block rounded-[1.35rem] border border-charcoal/10 bg-charcoal/[0.04] px-4 py-4 text-sm text-charcoal/75"
                >
                  <span className="text-xs uppercase tracking-[0.18em] text-ember">{review.brand}</span>
                  <span className="mt-2 block font-semibold text-charcoal">{review.title}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-charcoal/70">No published reviews are listed for this byline yet.</p>
            )}
          </div>
        </article>
      </div>
      </TrustPageShell>
    </>
  );
}
