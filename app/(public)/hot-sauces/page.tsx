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
  const topPicks = getTopHotSaucePicks(reviews, 4);
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
        title="Find the right bottle for tacos, eggs, wings, gifts, and more."
        copy="Start with everyday pours, giftable sets, taco-night bottles, and the sauces serious heat lovers keep reaching for."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-6 sm:p-8">
          <p className="eyebrow">Start here</p>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Find the bottles that fit how you actually cook.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/72">
            Browse everyday favorites, taco-night bottles, gift sets, and bigger-heat picks, then
            open the full reviews when you want more detail.
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
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Shop pantry and gear picks
            </Link>
            <Link
              href="/hot-sauces/under-15"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Best bottles under $15
            </Link>
            <Link
              href="/hot-sauces/best-for-fried-chicken"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Fried-chicken picks
            </Link>
            <Link
              href="/hot-sauces/gifts-under-50"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Gifts under $50
            </Link>
            <Link
              href="/hot-sauces/compare"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Compare two sauces
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {HOT_SAUCE_LANDING_LINKS.map((item) => (
            <article key={item.href} className="panel p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{item.eyebrow}</p>
              <h2 className="mt-3 font-display text-2xl text-cream sm:text-3xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-cream/72">{item.description}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                Explore
              </Link>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading
          eyebrow="Top picks"
          title="Start with these favorites."
          copy="These are easy bottles to recommend when someone asks what to buy first."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {topPicks.map((review) => (
            <div key={review.id}>
              <ReviewCard review={review} />
              <div className="mt-3 pl-1">
                <AffiliateLink
                  href={review.affiliateUrl}
                  partnerName={review.brand}
                  productName={review.productName}
                  sourcePage="/hot-sauces"
                  position="hub-top-picks"
                  className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Check price on Amazon
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
          <h2 className="mt-3 font-display text-4xl text-cream">Use it all week.</h2>
          <div className="mt-5 space-y-3 text-sm text-cream/72">
            {everydayPours.map((review) => (
              <Link key={review.slug} href={`/reviews/${review.slug}`} className="block rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20">
                {review.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Giftable heat</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Safer buys for other people.</h2>
          <div className="mt-5 space-y-3 text-sm text-cream/72">
            {giftableHeat.map((review) => (
              <Link key={review.slug} href={`/reviews/${review.slug}`} className="block rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20">
                {review.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Big heat</p>
          <h2 className="mt-3 font-display text-4xl text-cream">For people who want consequences.</h2>
          <div className="mt-5 space-y-3 text-sm text-cream/72">
            {bigHeat.map((review) => (
              <Link key={review.slug} href={`/reviews/${review.slug}`} className="block rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 hover:border-white/20">
                {review.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-14 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
        <EmailCapture
          source="hot-sauce-hub"
          defaultSegments={["hot-sauce-shelf"]}
          heading="Weekly sauce picks, reviews, and bottle guides."
          description="New hot sauces reviewed every week. Join the shelf."
        />
      </div>
    </section>
  );
}
