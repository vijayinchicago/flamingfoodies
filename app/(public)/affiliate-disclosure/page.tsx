import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Affiliate Disclosure | FlamingFoodies",
  description:
    "How FlamingFoodies uses Amazon affiliate links and product recommendations across recipes, reviews, and shop pages.",
  path: "/affiliate-disclosure"
});

export default function AffiliateDisclosurePage() {
  return (
    <section className="container-shell py-16">
      <div className="panel mx-auto max-w-4xl p-8 sm:p-10">
        <p className="eyebrow">Affiliate disclosure</p>
        <h1 className="mt-4 font-display text-5xl text-cream sm:text-6xl">
          How commerce links work on FlamingFoodies
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-8 text-cream/78 sm:text-base">
          <p>
            FlamingFoodies may earn a commission when you buy through some outbound links on this
            site. Right now, those commerce links route through Amazon placements featured in
            recipes, reviews, gift guides, and shop collections.
          </p>
          <p>
            Those commissions do not change the price you pay. The goal is to keep commerce links
            next to content where they are genuinely useful, like a skillet next to a smash burger
            recipe or a bottle recommendation next to a sauce review.
          </p>
          <p>
            We do not want commerce modules to replace the cooking utility or editorial judgment of
            the site. Recipes, reviews, and guides should still stand on their own even if you
            never click an offer.
          </p>
          <p>
            When we publish sponsored-style outbound links, we mark them as affiliate links and use
            standard tracking so we can measure what readers actually find useful. That data helps
            us improve the storefront, keep the recommendation quality high, and avoid stuffing
            pages with random products.
          </p>
        </div>
      </div>
    </section>
  );
}
