import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/community/comment-section";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { ReviewSchema } from "@/components/schema/review-schema";
import {
  findAffiliateLinkByUrl,
  getReviewAffiliateRecommendations
} from "@/lib/affiliates";
import { getMerchThemeClasses } from "@/lib/merch";
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

  return buildMetadata({
    title: review.title,
    description: review.description,
    path: `/reviews/${review.slug}`,
    images: review.imageUrl ? [review.imageUrl] : undefined
  });
}

export default async function ReviewPage({
  params
}: {
  params: { slug: string };
}) {
  const review = await getReview(params.slug);

  if (!review) notFound();

  const html = await markdownToHtml(review.content);
  const primaryOffer = findAffiliateLinkByUrl(review.affiliateUrl);
  const relatedOffers = getReviewAffiliateRecommendations({
    category: review.category,
    cuisineType: review.cuisineOrigin,
    heatLevel: review.heatLevel,
    excludeKeys: primaryOffer ? [primaryOffer.key] : [],
    limit: 2
  });
  const merchPreview = await getFeaturedMerchProducts(2);

  return (
    <article className="container-shell py-16">
      <ReviewSchema review={review} />
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Reviews", item: absoluteUrl("/reviews") },
          { name: review.title, item: absoluteUrl(`/reviews/${review.slug}`) }
        ]}
      />
      <p className="eyebrow">{review.brand}</p>
      <h1 className="mt-4 max-w-4xl font-display text-6xl leading-tight text-cream">
        {review.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-cream/75">{review.description}</p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-cream/60">
        <span>{review.rating.toFixed(1)}/5</span>
        <span>{review.heatLevel || "all heat levels"}</span>
        <span>{formatDate(review.publishedAt)}</span>
      </div>
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="prose-guide" dangerouslySetInnerHTML={{ __html: html }} />
        <aside className="space-y-6">
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
              You want a review framework with enough depth to justify an affiliate click.
            </p>
            <Link
              href={
                primaryOffer
                  ? `/go/${primaryOffer.key}?source=/reviews/${review.slug}&position=review-primary`
                  : review.affiliateUrl
              }
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white"
            >
              View partner offer
            </Link>
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-3xl text-cream">More shelf builders</h2>
            <div className="mt-4 space-y-4">
              {relatedOffers.map((offer) => (
                <article
                  key={offer.key}
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{offer.badge}</p>
                  <h3 className="mt-2 font-display text-2xl text-cream">{offer.product}</h3>
                  <p className="mt-2 text-sm leading-6 text-cream/72">{offer.description}</p>
                  <Link
                    href={`/go/${offer.key}?source=/reviews/${review.slug}&position=review-related`}
                    className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                  >
                    Open offer
                  </Link>
                </article>
              ))}
            </div>
          </div>
          <div className="panel p-6">
            <h2 className="font-display text-3xl text-cream">FlamingFoodies merch</h2>
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
