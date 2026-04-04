import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { ReviewCard } from "@/components/cards/review-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getAdRuntimeConfig } from "@/lib/ads";
import {
  HOT_SAUCE_SPOTLIGHT_KEYS,
  getAffiliateLinkEntries,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Hot Sauce Reviews | FlamingFoodies",
  description:
    "Heat-tested reviews of hot sauces, spicy pantry staples, and flavor-first products worth buying.",
  path: "/reviews"
});

export default async function ReviewsIndexPage() {
  const reviews = await getReviews();
  const ads = await getAdRuntimeConfig();
  const hotSauceLinks = getAffiliateLinkEntries(HOT_SAUCE_SPOTLIGHT_KEYS).slice(0, 3);
  const resolvedHotSauceLinks = hotSauceLinks
    .map((link) => ({
      link,
      resolved: resolveAffiliateLink(link.key, {
        sourcePage: "/reviews",
        position: "index-callout"
      })
    }))
    .filter((entry): entry is { link: (typeof hotSauceLinks)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved));

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="FlamingFoodies review archive"
        items={reviews.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: review.imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Hot Sauces"
        title="Heat-tested buying advice that can monetize without losing trust."
        copy="Standardized scoring, flavor notes, and use-case guidance make the review layer useful enough to earn affiliate clicks and push the shop harder."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
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
          {resolvedHotSauceLinks.map(({ link, resolved }) => (
            <article key={link.key} className="panel p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
              <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
              <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
              <AffiliateLink
                href={resolved.href}
                partnerKey={resolved.key}
                trackingMode={resolved.trackingMode}
                sourcePage="/reviews"
                position="index-callout"
                className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                Open offer
              </AffiliateLink>
            </article>
          ))}
        </div>
      </div>
      {ads.manualSlotsEnabled && ads.clientId && ads.slotIds.reviewArchive && reviews.length ? (
        <div className="mt-10 max-w-4xl">
          <AdSlot
            clientId={ads.clientId}
            slotId={ads.slotIds.reviewArchive}
            slotName="review_archive_feature"
            placement="review_archive"
            className="bg-white/[0.04]"
          />
        </div>
      ) : null}
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}
