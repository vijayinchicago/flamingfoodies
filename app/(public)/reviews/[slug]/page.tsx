import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ads/ad-slot";
import { CommentSection } from "@/components/community/comment-section";
import { ReviewStickyBuyBar } from "@/components/reviews/review-sticky-buy-bar";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { PinterestSaveButton } from "@/components/content/pinterest-save-button";
import { ShareBar } from "@/components/content/share-bar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { ReviewSchema } from "@/components/schema/review-schema";
import {
  findAffiliateLinkByUrl,
  getReviewAffiliateRecommendations,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { getAdRuntimeConfig } from "@/lib/ads";
import { injectInlineAffiliateLinks } from "@/lib/inline-affiliate-links";
import { getDynamicInlineTerms } from "@/lib/services/catalog-auto-grow";
import {
  getHotSauceBestForCopy,
  getHotSauceSkipIfCopy,
  getHotSauceWhyBuy
} from "@/lib/hot-sauces";
import { getMerchThemeClasses } from "@/lib/merch";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getFeaturedMerchProducts, getReview } from "@/lib/services/content";
import { absoluteUrl, formatDate, markdownToHtml } from "@/lib/utils";

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const review = await getReview(params.slug);

  if (!review) {
    return buildMetadata({
      title: "Reviews | FlamingFoodies",
      description: "Hot sauce and spicy gear reviews."
    });
  }

  const hero = getReviewHeroFields(review);

  return buildMetadata({
    title: review.title,
    description: review.description,
    path: `/reviews/${review.slug}`,
    images: hero.imageUrl ? [hero.imageUrl] : undefined
  });
}

export default async function ReviewPage({
  params
}: {
  params: { slug: string };
}) {
  const review = await getReview(params.slug);

  if (!review) notFound();
  const hero = getReviewHeroFields(review);

  const [rawHtml, dynamicTerms] = await Promise.all([
    markdownToHtml(review.content),
    getDynamicInlineTerms()
  ]);
  const html = injectInlineAffiliateLinks(rawHtml, `/reviews/${review.slug}`, dynamicTerms);
  const primaryOffer = findAffiliateLinkByUrl(review.affiliateUrl);
  const relatedOffers = getReviewAffiliateRecommendations({
    category: review.category,
    cuisineType: review.cuisineOrigin,
    heatLevel: review.heatLevel,
    excludeKeys: primaryOffer ? [primaryOffer.key] : [],
    limit: 2
  });
  const resolvedPrimaryOffer = primaryOffer
    ? resolveAffiliateLink(primaryOffer.key, {
        sourcePage: `/reviews/${review.slug}`,
        position: "review-primary"
      })
    : null;
  const resolvedRelatedOffers = relatedOffers
    .map((offer) => ({
      offer,
      resolved: resolveAffiliateLink(offer.key, {
        sourcePage: `/reviews/${review.slug}`,
        position: "review-related"
      })
    }))
    .filter((entry): entry is { offer: (typeof relatedOffers)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved));
  const merchPreview = await getFeaturedMerchProducts(2);
  const ads = await getAdRuntimeConfig();
  const whyThisPick = getHotSauceWhyBuy(review);
  const bestFor = getHotSauceBestForCopy(review);
  const skipIf = getHotSauceSkipIfCopy(review);

  return (
    <article className="container-shell py-16">
      <ReviewSchema review={review} />
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Hot Sauces", item: absoluteUrl("/hot-sauces") },
          { name: review.title, item: absoluteUrl(`/reviews/${review.slug}`) }
        ]}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Hot Sauces", href: "/hot-sauces" },
          { label: review.title }
        ]}
      />
      <p className="eyebrow">{review.brand}</p>
      <h1 className="mt-4 max-w-4xl font-display text-4xl leading-tight text-cream sm:text-5xl lg:text-6xl">
        {review.title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-7 text-cream/75 sm:text-lg sm:leading-8">{review.description}</p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-cream/60">
        <span>{review.rating.toFixed(1)}/5</span>
        <span>{review.heatLevel || "all heat levels"}</span>
        {(review.scovilleMin != null || review.scovilleMax != null) ? (
          <span>
            {review.scovilleMin != null && review.scovilleMax != null
              ? `${review.scovilleMin.toLocaleString()}–${review.scovilleMax.toLocaleString()} SHU`
              : review.scovilleMin != null
              ? `${review.scovilleMin.toLocaleString()}+ SHU`
              : `up to ${review.scovilleMax!.toLocaleString()} SHU`}
          </span>
        ) : null}
        <span>{formatDate(review.publishedAt)}</span>
        {review.authorName ? (
          <span>By {review.authorName}</span>
        ) : null}
      </div>
      {review.flavorNotes && review.flavorNotes.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.flavorNotes.map((note: string) => (
            <span
              key={note}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-cream/65"
            >
              {note}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-8 max-w-3xl">
        <ShareBar
          title={review.title}
          description={review.description}
          url={absoluteUrl(`/reviews/${review.slug}`)}
          imageUrl={hero.imageUrl}
          contentType="review"
          contentId={review.id}
          contentSlug={review.slug}
        />
      </div>
      <div className="mt-6 max-w-3xl">
        <AffiliateDisclosure compact />
      </div>
      {hero.imageUrl ? (
        <div className="relative mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05]">
          <PinterestSaveButton
            title={review.title}
            description={review.description}
            url={absoluteUrl(`/reviews/${review.slug}`)}
            imageUrl={hero.imageUrl}
            contentType="review"
            contentId={review.id}
            contentSlug={review.slug}
            className="absolute right-4 top-4 z-10 inline-flex rounded-full border border-white/15 bg-charcoal/70 px-4 py-2 text-sm font-semibold text-cream backdrop-blur-md transition hover:border-white/30 hover:bg-charcoal/80"
          />
          <div className="relative h-[260px] sm:h-[340px]">
            <Image
              src={hero.imageUrl}
              alt={hero.imageAlt}
              fill
              sizes="(min-width: 1280px) 960px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}
      <ReviewStickyBuyBar
        productName={review.productName}
        affiliateUrl={review.affiliateUrl}
        reviewSlug={review.slug}
        reviewId={review.id}
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="prose-guide" dangerouslySetInnerHTML={{ __html: html }} />
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-6">
            <h2 className="font-display text-3xl text-cream">Why this pick</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">{whyThisPick}</p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-ember">Best for</p>
                <p className="mt-2 text-sm leading-7 text-cream/78">{bestFor}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-ember">Skip if</p>
                <p className="mt-2 text-sm leading-7 text-cream/78">{skipIf}</p>
              </div>
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-3xl text-cream">Pros</h2>
            <ul className="mt-4 space-y-3 text-sm text-cream/75">
              {review.pros.map((pro: string) => (
                <li key={pro}>{pro}</li>
              ))}
            </ul>
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-3xl text-cream">Cons</h2>
            <ul className="mt-4 space-y-3 text-sm text-cream/75">
              {review.cons.map((con: string) => (
                <li key={con}>{con}</li>
              ))}
            </ul>
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-3xl text-cream">Buy this if</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">
              You want a bottle recommendation that maps cleanly to how you actually cook and eat.
            </p>
            {resolvedPrimaryOffer ? (
              <AffiliateLink
                href={resolvedPrimaryOffer.href}
                partnerKey={resolvedPrimaryOffer.key}
                trackingMode={resolvedPrimaryOffer.trackingMode}
                sourcePage={`/reviews/${review.slug}`}
                position="review-primary"
                contentType="review"
                contentId={review.id}
                contentSlug={review.slug}
                className="mt-6 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white"
              >
                Check price on Amazon
              </AffiliateLink>
            ) : (
              <AffiliateLink
                href={review.affiliateUrl}
                partnerName={review.brand}
                productName={review.productName}
                className="mt-6 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white"
              >
                Check price on Amazon
              </AffiliateLink>
            )}
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-3xl text-cream">More Amazon shelf builders</h2>
            <div className="mt-4 space-y-4">
              {resolvedRelatedOffers.map(({ offer, resolved }) => (
                <article
                  key={offer.key}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{offer.badge}</p>
                  <h3 className="mt-2 font-display text-2xl text-cream">{offer.product}</h3>
                  <p className="mt-2 text-sm leading-6 text-cream/72">{offer.description}</p>
                  <AffiliateLink
                    href={resolved.href}
                    partnerKey={resolved.key}
                    trackingMode={resolved.trackingMode}
                    sourcePage={`/reviews/${review.slug}`}
                    position="review-related"
                    contentType="review"
                    contentId={review.id}
                    contentSlug={review.slug}
                    className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                  >
                    Check price on Amazon
                  </AffiliateLink>
                </article>
              ))}
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-3xl text-cream">FlamingFoodies picks</h2>
            <div className="mt-4 space-y-4">
              {merchPreview.map((item) => (
                <article
                  key={item.slug}
                  className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-br ${getMerchThemeClasses(item.themeKey)} p-4`}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{item.badge}</p>
                  <h3 className="mt-2 font-display text-2xl text-cream">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-cream/72">{item.description}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    {item.ctaLabel}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
      {ads.manualSlotsEnabled && ads.clientId && ads.slotIds.reviewInArticle ? (
        <div className="mt-10 max-w-4xl">
          <AdSlot
            clientId={ads.clientId}
            slotId={ads.slotIds.reviewInArticle}
            slotName="review_detail_in_article"
            placement="review_detail_body"
            format="in-article"
            contentType="review"
            contentId={review.id}
            contentSlug={review.slug}
          />
        </div>
      ) : null}
      {ads.manualSlotsEnabled && ads.clientId && ads.slotIds.reviewInline ? (
        <div className="mt-6 max-w-4xl">
          <AdSlot
            clientId={ads.clientId}
            slotId={ads.slotIds.reviewInline}
            slotName="review_detail_inline"
            placement="review_detail"
            contentType="review"
            contentId={review.id}
            contentSlug={review.slug}
          />
        </div>
      ) : null}
      <div className="mt-12">
        <CommentSection
          contentType="review"
          contentId={review.id}
          contentPath={`/reviews/${review.slug}`}
        />
      </div>
    </article>
  );
}
