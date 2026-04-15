import Link from "next/link";
import { notFound } from "next/navigation";

import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SectionHeading } from "@/components/layout/section-heading";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getOccasionBySlug, SEASONAL_OCCASIONS } from "@/lib/seasonal/occasions";
import { getRecipes, getReviews } from "@/lib/services/content";
import { filterRecipes } from "@/lib/recipe-browse";
import { absoluteUrl } from "@/lib/utils";

export async function generateStaticParams() {
  return SEASONAL_OCCASIONS.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const occasion = getOccasionBySlug(params.slug);
  if (!occasion) {
    return buildMetadata({ title: "Seasonal Guides | FlamingFoodies", description: "" });
  }
  return buildMetadata({
    title: occasion.seoTitle,
    description: occasion.seoDescription,
    path: `/seasonal/${occasion.slug}`
  });
}

function matchesReviewFilters(
  review: Awaited<ReturnType<typeof getReviews>>[number],
  filters: { heatLevels?: string[]; tags?: string[] }
) {
  if (filters.heatLevels?.length && review.heatLevel) {
    if (!filters.heatLevels.includes(review.heatLevel)) return false;
  }
  if (filters.tags?.length) {
    const reviewText = [review.title, review.description, review.category, ...review.tags]
      .join(" ")
      .toLowerCase();
    if (!filters.tags.some((tag) => reviewText.includes(tag.toLowerCase()))) return false;
  }
  return true;
}

export default async function SeasonalPage({ params }: { params: { slug: string } }) {
  const occasion = getOccasionBySlug(params.slug);
  if (!occasion) notFound();

  const [allRecipes, allReviews] = await Promise.all([getRecipes(), getReviews()]);

  // Filter recipes by the occasion's criteria
  const filteredRecipes = filterRecipes(allRecipes, {
    query: occasion.recipeFilters.query,
    cuisine: occasion.recipeFilters.cuisines?.[0] ?? "all",
    heat: occasion.recipeFilters.heatLevels?.[0] ?? "all"
  }).slice(0, 6);

  // Filter reviews
  const filteredReviews = allReviews
    .filter((r) => matchesReviewFilters(r, occasion.reviewFilters))
    .slice(0, 4);

  // Fall back to top-rated reviews if filter returns nothing
  const reviews = filteredReviews.length >= 2
    ? filteredReviews
    : allReviews.sort((a, b) => b.rating - a.rating).slice(0, 4);

  const recipes = filteredRecipes.length >= 2
    ? filteredRecipes
    : allRecipes.slice(0, 6);

  return (
    <section className="container-shell py-16">
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Seasonal Guides", item: absoluteUrl("/seasonal") },
          { name: occasion.title, item: absoluteUrl(`/seasonal/${occasion.slug}`) }
        ]}
      />
      {reviews.length > 0 ? (
        <ItemListSchema
          name={occasion.title}
          items={reviews.map((r) => ({
            name: r.title,
            url: absoluteUrl(`/reviews/${r.slug}`),
            image: getReviewHeroFields(r).imageUrl
          }))}
        />
      ) : null}

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Seasonal Guides", href: "/seasonal" },
          { label: occasion.title }
        ]}
      />

      <div className="mt-8">
        <SectionHeading
          eyebrow={occasion.eyebrow}
          title={occasion.title}
          copy={occasion.description}
        />
      </div>

      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      {/* Editorial context */}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="panel p-8">
          <p className="eyebrow">Why this matters</p>
          <h2 className="mt-3 font-display text-4xl text-cream">{occasion.tagline}</h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">{occasion.editorialNote}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {occasion.guideLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Buying tip</p>
          <h2 className="mt-3 font-display text-4xl text-cream">What to stock.</h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">{occasion.buyingTip}</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Shop the right picks
          </Link>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 ? (
        <div className="mt-14">
          <SectionHeading
            eyebrow="The bottles"
            title={`Hot sauce picks for ${occasion.title.toLowerCase()}.`}
            copy="These are the sauces that earn their spot for this specific occasion — chosen for flavor, heat range, and real-world use."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/reviews"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Browse all hot sauce reviews
            </Link>
          </div>
        </div>
      ) : null}

      {/* Recipes */}
      {recipes.length > 0 ? (
        <div className="mt-14">
          <SectionHeading
            eyebrow="The recipes"
            title="What to cook for the occasion."
            copy="These recipes work with the sauces above and fit the cooking style of the moment — whether that's quick game-day snacks or a longer grill session."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/recipes"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Browse all recipes
            </Link>
          </div>
        </div>
      ) : null}

      {/* Nav to other occasions */}
      <div className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
        <p className="eyebrow">More seasonal guides</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {SEASONAL_OCCASIONS
            .filter((o) => o.slug !== occasion.slug)
            .map((o) => (
              <Link
                key={o.slug}
                href={`/seasonal/${o.slug}`}
                className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
              >
                {o.title}
              </Link>
            ))}
          <Link
            href="/seasonal"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream hover:border-white/30 hover:text-white"
          >
            All seasonal guides
          </Link>
        </div>
      </div>
    </section>
  );
}
