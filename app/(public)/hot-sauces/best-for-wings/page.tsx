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
  getBestForWingsReviews,
  getWingFriendlyRecipes
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

const wingFaqs: RecipeFaq[] = [
  {
    question: "What kind of hot sauce works best on wings and fried chicken?",
    answer:
      "Usually a sauce with cling, garlic, vinegar, smoke, or enough acid to keep rich food from tasting flat. Thin novelty superhots rarely work as well on wings and fried chicken as a balanced bottle with some structure."
  },
  {
    question: "Can the same bottle work on wings and hot chicken sandwiches?",
    answer:
      "Yes. Garlic-heavy sauces, punchy Louisiana-style bottles, and the right hot honeys often pull double duty on wings, fried chicken, and crispy sandwiches."
  },
  {
    question: "Do wings and fried chicken need the hottest bottle on the shelf?",
    answer:
      "No. Rich food can carry more heat, but one balanced hard-hitter is usually smarter than stacking multiple ultra-hot bottles that all taste flat."
  }
];

const defaultWingPageOptimization: SearchLandingPageOptimization = {
  metadataTitle: "Best Hot Sauces for Wings and Fried Chicken | FlamingFoodies",
  metadataDescription:
    "The best hot sauces for wings, fried chicken, and hot chicken sandwiches: garlicky, clingy bottles and bigger hitters that still taste good.",
  heroEyebrow: "Hot sauces for wings and fried chicken",
  heroTitle:
    "Best Hot Sauces for Wings and Fried Chicken — The bottles that hold up on wings, fried chicken, and hot chicken sandwiches.",
  heroCopy:
    "Wing-friendly bottles need more than heat. They need enough garlic, cling, smoke, or vinegar structure to stay interesting on rich food and not disappear into the crust.",
  faqEyebrow: "FAQ",
  faqTitle: "The wings-and-fried-chicken questions that matter most.",
  faqCopy:
    "This is the quick read if you want bottles that work on wings, fried chicken, and hot sandwiches without feeling like a gimmick.",
  faqs: wingFaqs
};

export async function generateMetadata() {
  const runtimeOptimization = await getSearchLandingPageOptimization("/hot-sauces/best-for-wings");
  const pageOptimization = {
    ...defaultWingPageOptimization,
    ...runtimeOptimization,
    faqs: runtimeOptimization?.faqs ?? defaultWingPageOptimization.faqs
  };

  return buildMetadata({
    title: pageOptimization.metadataTitle || defaultWingPageOptimization.metadataTitle || "FlamingFoodies",
    description:
      pageOptimization.metadataDescription ||
      defaultWingPageOptimization.metadataDescription ||
      "Wing-night buying guide.",
    path: "/hot-sauces/best-for-wings"
  });
}

export default async function BestHotSaucesForWingsPage() {
  const [reviews, recipes, runtimeOptimization] = await Promise.all([
    getReviews(),
    getRecipes(),
    getSearchLandingPageOptimization("/hot-sauces/best-for-wings")
  ]);
  const wingSauces = getBestForWingsReviews(reviews, 4);
  const wingRecipes = getWingFriendlyRecipes(recipes, 3);
  const comparisonRows = buildHotSauceComparisonRows(wingSauces, "wings");
  const pageOptimization = {
    ...defaultWingPageOptimization,
    ...runtimeOptimization,
    faqs: runtimeOptimization?.faqs ?? defaultWingPageOptimization.faqs
  };

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="Best hot sauces for wings and fried chicken"
        items={wingSauces.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow={pageOptimization.heroEyebrow || defaultWingPageOptimization.heroEyebrow || "Hot sauces"}
        title={pageOptimization.heroTitle || defaultWingPageOptimization.heroTitle || "FlamingFoodies"}
        copy={pageOptimization.heroCopy || defaultWingPageOptimization.heroCopy || ""}
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="eyebrow">What works on wings</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Rich food can carry more aggression, but it still needs flavor.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            Wings, fried chicken, and hot sandwiches can take bolder garlic, thicker texture, and higher heat than tacos or seafood. The trick is picking bottles that still taste distinct after the first hit.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hot-sauces/best-for-fried-chicken"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Fried-chicken picks
            </Link>
            <Link
              href="/hot-sauces/under-15"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Budget-friendly picks
            </Link>
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Quick buying rule</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Pick cling, garlic, or smoke.</h2>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-cream/72">
            <li>Garlic-forward sauces overperform on wings, fried chicken, and cheesy food.</li>
            <li>Thicker sauces cling better when you want a real coating instead of a disappearing drizzle.</li>
            <li>One reaper-level bottle is enough; most shelves do better with a single heavy hitter.</li>
            <li>Keep a balanced wing sauce and a brighter fried-chicken bottle instead of three novelty superhots.</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Recommended bottles"
          title="Start with these wing-night winners."
          copy="These picks either cling well, cut through richer food, or hit hard without turning one-dimensional on wings or fried chicken."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {wingSauces.map((review) => (
            <div key={review.id} className="flex flex-col">
              <ReviewCard review={review} />
              <AffiliateLink
                href={review.affiliateUrl}
                productName={review.productName}
                sourcePage="/hot-sauces/best-for-wings"
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
        eyebrow="Wing-night comparison"
        title="See which bottle earns the late-night slot."
        copy="These picks all work on richer food, but they solve different problems. Compare the heat, flavor lane, and why-buy case before you fill the cart."
        rows={comparisonRows}
      />

      <div className="mt-12">
        <SectionHeading
          eyebrow="Use them tonight"
          title="Recipes that make the wing-night lane useful right away."
          copy="If someone lands here from search, the best next move is food that rewards one of these bottles immediately."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {wingRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>

      <FaqSchema faqs={pageOptimization.faqs ?? wingFaqs} />
      <HotSauceFaqSection
        eyebrow={pageOptimization.faqEyebrow || "FAQ"}
        title={pageOptimization.faqTitle || defaultWingPageOptimization.faqTitle || "FAQ"}
        copy={pageOptimization.faqCopy || ""}
        faqs={pageOptimization.faqs ?? wingFaqs}
      />

      <ShareBar
        title="Best Hot Sauces for Wings and Fried Chicken"
        description="Garlicky, clingy bottles and bigger hitters that still taste good — the picks that hold up on wing night."
        url={absoluteUrl("/hot-sauces/best-for-wings")}
        contentType="hot-sauce-list"
        contentId={0}
        contentSlug="best-for-wings"
        className="mt-12"
      />
    </section>
  );
}
