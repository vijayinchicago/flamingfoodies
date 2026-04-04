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
        title="The bottle guide for everyday pours, giftable picks, and serious heat."
        copy="Compare hot sauces by flavor, heat, and real-world use so it feels obvious which bottle belongs on eggs, wings, tacos, pizza, or the next gift box."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-8">
          <p className="eyebrow">Hot sauce map</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Find the right bottle faster, not just the loudest one.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            The strongest hot-sauce UX is part tasting guide and part buying guide. Readers should
            be able to tell at a glance which sauces are everyday staples, which ones hit harder,
            and which ones make the best gifts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Shop the full sauce shelf
            </Link>
            <Link
              href="/subscriptions"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Explore gift sets
            </Link>
          </div>
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
                View on Amazon
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
