import Link from "next/link";
import { notFound } from "next/navigation";

import { TrustPageShell } from "@/components/layout/trust-page-shell";
import {
  getAllPublicAuthors,
  getPublicAuthorBySlug,
  matchesPublicAuthorName
} from "@/lib/authors";
import { shouldPromoteBlogPost } from "@/lib/editorial-guards";
import { buildMetadata } from "@/lib/seo";
import { getBlogPosts, getRecipes, getReviews } from "@/lib/services/content";

const LAST_UPDATED = "April 27, 2026";

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
    <TrustPageShell
      eyebrow="Contributor"
      title={author.displayName}
      description={`${author.role}. ${author.shortBio}`}
      lastUpdated={LAST_UPDATED}
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="panel p-8">
          <p className="eyebrow">About this byline</p>
          <h2 className="mt-3 font-display text-4xl text-cream">What this lane covers.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">{author.longBio}</p>
          <ul className="mt-6 space-y-3 text-sm leading-7 text-cream/72">
            {author.focusAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Trust links</p>
          <h2 className="mt-3 font-display text-4xl text-cream">How this work gets framed.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            Contributor pages work best alongside the site-wide policies that explain how
            editorial pages, corrections, and review coverage are handled.
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
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Review methodology
            </Link>
            <Link
              href="/corrections"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Corrections policy
            </Link>
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="panel p-8">
          <p className="eyebrow">Stories</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Blog coverage</h2>
          <div className="mt-5 space-y-3">
            {authoredPosts.length ? (
              authoredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-cream/78"
                >
                  <span className="text-xs uppercase tracking-[0.18em] text-ember">{post.category}</span>
                  <span className="mt-2 block font-semibold text-cream">{post.title}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-cream/65">No published blog stories are listed for this byline yet.</p>
            )}
          </div>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Recipes</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Kitchen work</h2>
          <div className="mt-5 space-y-3">
            {authoredRecipes.length ? (
              authoredRecipes.map((recipe) => (
                <Link
                  key={recipe.slug}
                  href={`/recipes/${recipe.slug}`}
                  className="block rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-cream/78"
                >
                  <span className="text-xs uppercase tracking-[0.18em] text-ember">{recipe.cuisineType}</span>
                  <span className="mt-2 block font-semibold text-cream">{recipe.title}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-cream/65">No published recipes are listed for this byline yet.</p>
            )}
          </div>
        </article>

        <article className="panel p-8">
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-3 font-display text-3xl text-cream">Product coverage</h2>
          <div className="mt-5 space-y-3">
            {authoredReviews.length ? (
              authoredReviews.map((review) => (
                <Link
                  key={review.slug}
                  href={`/reviews/${review.slug}`}
                  className="block rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-cream/78"
                >
                  <span className="text-xs uppercase tracking-[0.18em] text-ember">{review.brand}</span>
                  <span className="mt-2 block font-semibold text-cream">{review.title}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm leading-7 text-cream/65">No published reviews are listed for this byline yet.</p>
            )}
          </div>
        </article>
      </div>
    </TrustPageShell>
  );
}
