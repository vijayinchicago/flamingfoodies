import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ShareBar } from "@/components/content/share-bar";
import { RecipeCard } from "@/components/cards/recipe-card";
import { ReviewCard } from "@/components/cards/review-card";
import { HotSauceComparisonTable } from "@/components/hot-sauces/hot-sauce-comparison-table";
import { HotSauceFaqSection } from "@/components/hot-sauces/hot-sauce-faq-section";
import { SectionHeading } from "@/components/layout/section-heading";
import { FaqSchema } from "@/components/schema/faq-schema";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import {
  buildHotSauceComparisonRows,
  getBestForFriedChickenReviews,
  getFriedChickenFriendlyRecipes
} from "@/lib/hot-sauces";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getRecipes, getReviews } from "@/lib/services/content";
import {
  getSearchLandingPageOptimization,
  type SearchLandingPageOptimization
} from "@/lib/services/search-insights";
import type { RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

const friedChickenFaqs: RecipeFaq[] = [
  {
    question: "What is the best hot sauce for fried chicken?",
    answer:
      "Usually a bottle with vinegar, garlic, or enough texture to stay present on the crust. Louisiana-style sauces, garlic-heavy wing sauces, and the right hot honeys tend to beat thin novelty superhots."
  },
  {
    question: "Should fried chicken get a table sauce or a thicker wing sauce?",
    answer:
      "It depends on the job. A table sauce is great when you want a sharp, vinegary splash. A thicker garlic-forward sauce or hot honey works better when you want more cling on sandwiches, tenders, or cutlets."
  },
  {
    question: "Can the same bottle work on fried chicken and hot chicken sandwiches?",
    answer:
      "Yes. The most useful fried-chicken bottles often pull double duty on hot chicken sandwiches, tenders, fries, and even pizza if they bring enough acid or garlic to stay lively."
  }
];

const defaultFriedChickenPageOptimization: SearchLandingPageOptimization = {
  metadataTitle: "Best Hot Sauces for Fried Chicken and Hot Sandwiches | FlamingFoodies",
  metadataDescription:
    "The best hot sauces for fried chicken, hot chicken sandwiches, tenders, and crispy cutlets: bottles with enough vinegar, garlic, or sweet heat to cut through the crust.",
  heroEyebrow: "Hot sauces for fried chicken",
  heroTitle:
    "Best Hot Sauces for Fried Chicken — The bottles that make crispy chicken taste sharper, louder, and more alive.",
  heroCopy:
    "Fried chicken wants more than raw heat. It wants vinegar, garlic, cling, or sweet heat that can cut the crust and fat without turning every bite into a novelty stunt.",
  faqEyebrow: "FAQ",
  faqTitle: "The fried-chicken buying questions worth answering first.",
  faqCopy:
    "This is the quick read if you want bottles that actually improve fried chicken, tenders, and hot sandwiches instead of just making them hotter.",
  faqs: friedChickenFaqs
};

export async function generateMetadata() {
  const runtimeOptimization = await getSearchLandingPageOptimization(
    "/hot-sauces/best-for-fried-chicken"
  );
  const pageOptimization = {
    ...defaultFriedChickenPageOptimization,
    ...runtimeOptimization,
    faqs: runtimeOptimization?.faqs ?? defaultFriedChickenPageOptimization.faqs
  };

  return buildMetadata({
    title:
      pageOptimization.metadataTitle ||
      defaultFriedChickenPageOptimization.metadataTitle ||
      "FlamingFoodies",
    description:
      pageOptimization.metadataDescription ||
      defaultFriedChickenPageOptimization.metadataDescription ||
      "Fried-chicken buying guide.",
    path: "/hot-sauces/best-for-fried-chicken"
  });
}

export default async function BestHotSaucesForFriedChickenPage() {
  const [reviews, recipes, runtimeOptimization] = await Promise.all([
    getReviews(),
    getRecipes(),
    getSearchLandingPageOptimization("/hot-sauces/best-for-fried-chicken")
  ]);
  const friedChickenSauces = getBestForFriedChickenReviews(reviews, 4);
  const friedChickenRecipes = getFriedChickenFriendlyRecipes(recipes, 3);
  const comparisonRows = buildHotSauceComparisonRows(friedChickenSauces, "fried_chicken");
  const pageOptimization = {
    ...defaultFriedChickenPageOptimization,
    ...runtimeOptimization,
    faqs: runtimeOptimization?.faqs ?? defaultFriedChickenPageOptimization.faqs
  };

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces for fried chicken"
        items={friedChickenSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow={
          pageOptimization.heroEyebrow ||
          defaultFriedChickenPageOptimization.heroEyebrow ||
          "Hot sauces"
        }
        title={
          pageOptimization.heroTitle || defaultFriedChickenPageOptimization.heroTitle || "FlamingFoodies"
        }
        copy={pageOptimization.heroCopy || defaultFriedChickenPageOptimization.heroCopy || ""}
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="eyebrow">What works on fried chicken</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Crisp breading needs acid, aroma, or a little stick.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            The best fried-chicken bottles either cut through the crust with vinegar, hang on with
            a thicker texture, or bring the sweet-savory contrast that makes sandwiches and tenders
            more memorable.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/recipes/nashville-hot-chicken-sandwiches"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Nashville sandwich recipe
            </Link>
            <Link
              href="/hot-sauces/best-for-wings"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Wings and fried chicken
            </Link>
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Quick buying rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Start with vinegar, garlic, or hot honey.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Vinegar-forward sauces cut rich breading fast and keep the plate moving.</li>
            <li>Garlic-heavy bottles work especially well on sandwiches, tenders, and fries.</li>
            <li>Hot honey is best when you want sweet heat, crisp edges, and late-night utility.</li>
            <li>One serious heat bottle is enough; most fried chicken does better with flavor first.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Recommended bottles"
          title="Start with these fried-chicken favorites."
          copy="These picks either cut the crust well, cling where they should, or bring the right sweet-heat contrast for sandwiches and tenders."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {friedChickenSauces.map((review) => (
            <div key={review.id} className="flex flex-col">
              <ReviewCard review={review} />
              <AffiliateLink
                href={review.affiliateUrl}
                productName={review.productName}
                sourcePage="/hot-sauces/best-for-fried-chicken"
                position="picks-grid"
                className="mt-3 flex items-center justify-center rounded-full bg-ember px-5 py-3 text-sm font-semibold text-charcoal transition hover:bg-ember/90"
              >
                Check price on Amazon
              </AffiliateLink>
            </div>
          ))}
        </div>
      </div>

      <HotSauceComparisonTable
        eyebrow="Fried-chicken comparison"
        title="See which bottle earns space next to the crispy stuff."
        copy="This is the quick-buy table for fried chicken, hot sandwiches, tenders, and cutlets when you want better contrast instead of random heat."
        rows={comparisonRows}
      />

      {friedChickenRecipes.length ? (
        <div className="mt-12">
          <SectionHeading
            eyebrow="Cook with them"
            title="Recipes that make the fried-chicken lane useful right away."
            copy="If the bottle works here, it should pay you back on a sandwich or another crispy chicken dinner immediately."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {friedChickenRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      ) : null}

      <FaqSchema faqs={pageOptimization.faqs ?? friedChickenFaqs} />
      <HotSauceFaqSection
        eyebrow={pageOptimization.faqEyebrow || "FAQ"}
        title={
          pageOptimization.faqTitle ||
          defaultFriedChickenPageOptimization.faqTitle ||
          "FAQ"
        }
        copy={pageOptimization.faqCopy || ""}
        faqs={pageOptimization.faqs ?? friedChickenFaqs}
      />

      <ShareBar
        title="Best Hot Sauces for Fried Chicken and Hot Sandwiches"
        description="The bottles that cling, cut through crispy coatings, and make fried chicken taste like more than just heat."
        url={absoluteUrl("/hot-sauces/best-for-fried-chicken")}
        contentType="hot-sauce-list"
        contentId={0}
        contentSlug="best-for-fried-chicken"
        className="mt-12"
      />
    </section>
  );
}
