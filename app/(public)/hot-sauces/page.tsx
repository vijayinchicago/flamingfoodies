import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ContentCard } from "@/components/cards/content-card";
import { EmailCapture } from "@/components/forms/email-capture";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import {
  HOT_SAUCE_LANDING_LINKS,
  getFilteredHotSauceReviews,
  getHotSauceGuidePosts,
  getTopHotSaucePicks
} from "@/lib/hot-sauces";
import {
  findAffiliateLinkByUrl,
  getAffiliateCtaLabel,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getBlogPosts, getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Hot Sauces | FlamingFoodies",
  description:
    "Browse the FlamingFoodies hot sauce hub for everyday bottles, giftable picks, big-heat favorites, and flavor-first review guides.",
  path: "/hot-sauces"
});

export default async function HotSaucesHubPage() {
  const [reviews, posts] = await Promise.all([getReviews(), getBlogPosts()]);
  const popularSearchGuides = HOT_SAUCE_LANDING_LINKS.slice(0, 6);
  const topPicks = getTopHotSaucePicks(reviews, 4);
  const topPickOffers = topPicks.map((review, index) => {
    const offer = findAffiliateLinkByUrl(review.affiliateUrl);

    return {
      review,
      resolved: offer
        ? resolveAffiliateLink(offer.key, {
            sourcePage: "/hot-sauces",
            position: `hub-top-picks-${index + 1}`
          })
        : null
    };
  });
  const everydayPours = getFilteredHotSauceReviews(reviews, "everyday").slice(0, 4);
  const giftableHeat = getFilteredHotSauceReviews(reviews, "giftable").slice(0, 3);
  const bigHeat = getFilteredHotSauceReviews(reviews, "big-heat").slice(0, 3);
  const guidePosts = getHotSauceGuidePosts(posts, 3);

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="FlamingFoodies hot sauce hub"
        items={topPicks.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Hot sauce hub"
        title="Find the right hot sauce for tacos, eggs, wings, gifts, and more."
        copy="Start with the exact bottle question you have, then open the reviews and comparison notes when you want more buying detail."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-6 sm:p-8">
          <p className="eyebrow">Search by meal</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">
            Open the page that matches the food on your table.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/70">
            The best entry point is usually meal-first: tacos, eggs, wings, fried chicken,
            seafood, pizza, or a hard budget cap. Use the search-style guides first, then go deeper.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/reviews"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Browse all reviews
            </Link>
            <Link
              href="/shop"
              className="inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Shop pantry and gear picks
            </Link>
            <Link
              href="/hot-sauces/under-15"
              className="inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Best bottles under $15
            </Link>
            <Link
              href="/hot-sauces/best-for-fried-chicken"
              className="inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Fried-chicken picks
            </Link>
            <Link
              href="/hot-sauces/gifts-under-50"
              className="inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Gifts under $50
            </Link>
            <Link
              href="/hot-sauces/compare"
              className="inline-flex rounded-full border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Compare two sauces
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {popularSearchGuides.map((item) => (
            <article key={item.href} className="panel p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{item.eyebrow}</p>
              <h2 className="mt-3 font-display text-2xl text-charcoal sm:text-3xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-charcoal/70">{item.description}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal"
              >
                Explore
              </Link>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {HOT_SAUCE_LANDING_LINKS.slice(6).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[1.35rem] border border-charcoal/10 bg-charcoal/[0.04] px-4 py-4 text-sm text-charcoal/75 transition hover:border-charcoal/20 hover:bg-charcoal/[0.06]"
          >
            <span className="text-xs uppercase tracking-[0.18em] text-ember">{item.eyebrow}</span>
            <span className="mt-2 block font-semibold text-charcoal">{item.title}</span>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Top picks"
          title="Start with these favorites."
          copy="These are the easiest bottles to recommend first when you want range, flavor, and fewer bad blind buys."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {topPickOffers.map(({ review, resolved }, index) => (
            <div key={review.id}>
              <ReviewCard review={review} />
              <div className="mt-3 pl-1">
                <AffiliateLink
                  href={resolved?.href || review.affiliateUrl}
                  partnerKey={resolved?.key}
                  trackingMode={resolved?.trackingMode}
                  partnerName={resolved ? undefined : review.brand}
                  productName={review.productName}
                  sourcePage="/hot-sauces"
                  position={`hub-top-picks-${index + 1}`}
                  className="inline-flex rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  {resolved ? getAffiliateCtaLabel(resolved) : "View retailer offer"}
                </AffiliateLink>
              </div>
            </div>
          ))}
        </div>
      </div>

      {guidePosts.length ? (
        <div className="mt-12">
          <SectionHeading
            eyebrow="Read before you buy"
            title="Guides that help you choose."
            copy="These posts answer common buying questions and point you toward the right bottles."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {guidePosts.map((post) => (
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
        </div>
      ) : null}

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="panel p-6">
          <p className="eyebrow">Everyday pours</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Use it all week.</h2>
          <div className="mt-5 space-y-3 text-sm text-charcoal/70">
            {everydayPours.map((review) => (
              <Link key={review.slug} href={`/reviews/${review.slug}`} className="block rounded-[1.25rem] border border-charcoal/10 bg-charcoal/[0.04] px-4 py-3 hover:border-charcoal/20">
                {review.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Giftable heat</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Safer buys for other people.</h2>
          <div className="mt-5 space-y-3 text-sm text-charcoal/70">
            {giftableHeat.map((review) => (
              <Link key={review.slug} href={`/reviews/${review.slug}`} className="block rounded-[1.25rem] border border-charcoal/10 bg-charcoal/[0.04] px-4 py-3 hover:border-charcoal/20">
                {review.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Big heat</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">When you really do want the bigger hit.</h2>
          <div className="mt-5 space-y-3 text-sm text-charcoal/70">
            {bigHeat.map((review) => (
              <Link key={review.slug} href={`/reviews/${review.slug}`} className="block rounded-[1.25rem] border border-charcoal/10 bg-charcoal/[0.04] px-4 py-3 hover:border-charcoal/20">
                {review.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-14 rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.04] p-6 sm:p-8">
        <EmailCapture
          source="hot-sauce-hub"
          variant="email-only"
          defaultSegments={["hot-sauce-shelf"]}
          heading="Get better bottle picks every Friday."
          buttonLabel="Join Flame Club"
          description="One honest sauce review, one sharp bottle guide, and one pick worth trying."
        />
      </div>
    </section>
  );
}
