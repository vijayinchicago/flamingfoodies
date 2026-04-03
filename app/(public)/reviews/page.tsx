import Link from "next/link";

import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { HOT_SAUCE_SPOTLIGHT_KEYS, getAffiliateLinkEntries } from "@/lib/affiliates";
import { getReviews } from "@/lib/services/content";

export default async function ReviewsIndexPage() {
  const reviews = await getReviews();
  const hotSauceLinks = getAffiliateLinkEntries(HOT_SAUCE_SPOTLIGHT_KEYS).slice(0, 3);

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Reviews"
        title="Heat-tested buying advice that can monetize without losing trust."
        copy="Standardized scoring, flavor notes, and use-case guidance make the review layer useful enough to earn affiliate clicks and push the shop harder."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-8">
          <p className="eyebrow">Shelf upgrade</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            More bottles, more useful reviews, stronger commerce intent.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            This page should feel like the trust layer behind the shop. Once readers are
            comparing sauces, it should be easy to keep moving toward offers that match their taste.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Browse the storefront
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {hotSauceLinks.map((link) => (
            <article key={link.key} className="panel p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
              <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
              <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
              <Link
                href={`/go/${link.key}?source=/reviews&position=index-callout`}
                className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                Open offer
              </Link>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
