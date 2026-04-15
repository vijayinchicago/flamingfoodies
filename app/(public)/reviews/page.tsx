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
import {
  getHotSauceFilterMeta,
  getHotSauceIntentLabel,
  getTopHotSaucePicks,
} from "@/lib/hot-sauces";
import {
  REVIEW_SORT_OPTIONS,
  filterReviews,
  formatReviewCategoryLabel,
  formatReviewHeatLabel,
  getReviewBrowseOptions,
  paginateReviews,
  parseReviewIntent,
  parseReviewSort,
  sortReviews
} from "@/lib/review-browse";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildMetadata } from "@/lib/seo";
import { getReviews } from "@/lib/services/content";
import type { HeatLevel, Review } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Hot Sauce Reviews | FlamingFoodies",
  description:
    "Heat-tested reviews of hot sauces, spicy pantry staples, and flavor-first products worth buying.",
  path: "/reviews"
});

const REVIEWS_PER_PAGE = 10;

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildReviewsBrowseHref(input: {
  query?: string;
  intent?: string;
  category?: string;
  heat?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (input.query?.trim()) params.set("q", input.query.trim());
  if (input.intent && input.intent !== "all") params.set("intent", input.intent);
  if (input.category && input.category !== "all") params.set("category", input.category);
  if (input.heat && input.heat !== "all") params.set("heat", input.heat);
  if (input.sort && input.sort !== "featured") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));

  const query = params.toString();
  return query ? `/reviews?${query}` : "/reviews";
}

export default async function ReviewsIndexPage({
  searchParams
}: {
  searchParams?: {
    q?: string | string[];
    intent?: string | string[];
    category?: string | string[];
    heat?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  };
}) {
  const reviews = await getReviews();
  const ads = await getAdRuntimeConfig();
  const browseOptions = getReviewBrowseOptions(reviews);
  const query = getSingleSearchParam(searchParams?.q)?.trim() ?? "";
  const activeIntent = parseReviewIntent(getSingleSearchParam(searchParams?.intent));
  const activeCategory = getSingleSearchParam(searchParams?.category) ?? "all";
  const activeHeat = (getSingleSearchParam(searchParams?.heat) ?? "all") as HeatLevel | "all";
  const activeSort = parseReviewSort(getSingleSearchParam(searchParams?.sort));
  const page = Number.parseInt(getSingleSearchParam(searchParams?.page) ?? "1", 10);
  const filteredReviews = filterReviews(reviews, {
    query,
    intent: activeIntent,
    category: activeCategory,
    heat: activeHeat
  });
  const sortedReviews = sortReviews(filteredReviews, activeSort);
  const paginatedReviews = paginateReviews(sortedReviews, Number.isFinite(page) ? page : 1, REVIEWS_PER_PAGE);
  const filterMeta = getHotSauceFilterMeta(activeIntent);
  const hasActiveFilters = Boolean(
    query || activeIntent !== "all" || activeCategory !== "all" || activeHeat !== "all" || activeSort !== "featured"
  );
  const topPicks = getTopHotSaucePicks(reviews, 3);
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
        items={paginatedReviews.items.map((review) => ({
          name: review.title,
          url: absoluteUrl(`/reviews/${review.slug}`),
          image: getReviewHeroFields(review).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Hot Sauces"
        title="The bottle guide for everyday pours, giftable picks, and serious heat."
        copy="Compare hot sauces by flavor, heat, and real-world use so it feels obvious which bottle belongs on eggs, wings, tacos, pizza, or the next gift box."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-6 sm:p-8">
          <p className="eyebrow">Hot sauce map</p>
          <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
            Find the right bottle faster, not just the loudest one.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            This page should help you tell, at a glance, which sauces are everyday staples, which
            ones hit harder, and which ones make the best gifts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hot-sauces"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Visit the hot sauce hub
            </Link>
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
            <article key={link.key} className="panel p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
              <h3 className="mt-3 font-display text-2xl text-cream sm:text-3xl">{link.product}</h3>
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
      <div className="mt-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Top picks</p>
            <h2 className="mt-3 font-display text-3xl text-cream sm:text-4xl">
              Start with the bottles we would hand someone first.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/72">
              Start with an everyday favorite, a giftable pick, and a bottle with a little more heat
              or personality.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/hot-sauces/best-for-tacos"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Best for tacos
            </Link>
            <Link
              href="/hot-sauces/under-15"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Best under $15
            </Link>
            <Link
              href="/hot-sauces/gifts-under-50"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Gifts under $50
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {topPicks.map((review) => (
            <div key={review.id} className="space-y-3">
              <ReviewCard review={review} />
              <div className="px-2">
                <p className="text-xs uppercase tracking-[0.24em] text-ember">
                  {getHotSauceIntentLabel(review)}
                </p>
                <p className="mt-2 text-sm leading-7 text-cream/65">
                  {typeof review.priceUsd === "number"
                    ? `Quick take: ${review.brand} at $${review.priceUsd.toFixed(2)} is an easy bottle to start with.`
                    : `Quick take: ${review.brand} is an easy bottle to start with.`}
                </p>
              </div>
            </div>
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
      <form method="get" action="/reviews" className="panel-light mt-10 p-6">
        <div className="grid gap-4 xl:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))_0.9fr]">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by bottle, brand, flavor, or what it is good on"
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition placeholder:text-charcoal/45 focus:border-ember focus:ring-2 focus:ring-ember/15"
          />
          <select
            name="intent"
            defaultValue={activeIntent}
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
          >
            {browseOptions.intents.map((intent) => (
              <option key={intent.key} value={intent.key}>
                {intent.label}
              </option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={activeCategory}
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
          >
            <option value="all">All categories</option>
            {browseOptions.categories.map((category) => (
              <option key={category} value={category}>
                {formatReviewCategoryLabel(category)}
              </option>
            ))}
          </select>
          <select
            name="heat"
            defaultValue={activeHeat}
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
          >
            <option value="all">All heat levels</option>
            {browseOptions.heatLevels.map((heat) => (
              <option key={heat} value={heat}>
                {formatReviewHeatLabel(heat)}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={activeSort}
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
          >
            {REVIEW_SORT_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white">
            Apply filters
          </button>
          {hasActiveFilters ? (
            <Link
              href="/reviews"
              className="rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Clear all
            </Link>
          ) : null}
          <p className="text-sm text-charcoal/60">
            Search by bottle, browse by best use, or sort by heat, rating, and newest reviews.
          </p>
        </div>
      </form>
      <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Browse by intent</p>
            <h2 className="mt-3 font-display text-4xl text-cream">Browse reviews your way.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/72">
              Showing <span className="font-semibold text-cream">{paginatedReviews.totalResults}</span>{" "}
              results for <span className="font-semibold text-cream">{filterMeta.label}</span>.{" "}
              {filterMeta.description}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {browseOptions.intents.map((filter) => {
            const href = buildReviewsBrowseHref({
              query,
              intent: filter.key,
              category: activeCategory,
              heat: activeHeat,
              sort: activeSort
            });
            const isActive = filter.key === activeIntent;

            return (
              <Link
                key={filter.key}
                href={href}
                className={
                  isActive
                    ? "rounded-full border border-white bg-white px-4 py-2 text-sm font-semibold text-charcoal shadow-sm"
                    : "rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-cream/90 hover:border-white/30 hover:bg-white/[0.07]"
                }
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Review archive</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            {paginatedReviews.totalResults
              ? `Showing ${paginatedReviews.startResult}-${paginatedReviews.endResult} of ${paginatedReviews.totalResults}`
              : "No reviews match those filters yet"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-cream/70">
            {paginatedReviews.totalResults
              ? "Narrow things down by best use, then sort for the bottles you want to compare."
              : "Try a broader search, switch the intent tab, or clear a filter to see more bottles."}
          </p>
        </div>
        {paginatedReviews.totalPages > 1 ? (
          <p className="text-sm text-cream/60">
            Page {paginatedReviews.currentPage} of {paginatedReviews.totalPages}
          </p>
        ) : null}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {paginatedReviews.items.length ? (
          paginatedReviews.items.map((review) => <ReviewCard key={review.id} review={review} />)
        ) : (
          <div className="panel p-8 text-sm leading-7 text-cream/72 lg:col-span-2">
            No hot sauce reviews match that filter yet. Try another browse lane or head back to the{" "}
            <Link href="/hot-sauces" className="font-semibold text-cream underline underline-offset-4">
              hot sauce hub
            </Link>
            .
          </div>
        )}
      </div>
      {paginatedReviews.totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {paginatedReviews.currentPage > 1 ? (
            <Link
              href={buildReviewsBrowseHref({
                query,
                intent: activeIntent,
                category: activeCategory,
                heat: activeHeat,
                sort: activeSort,
                page: paginatedReviews.currentPage - 1
              })}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Previous page
            </Link>
          ) : (
            <span />
          )}
          {paginatedReviews.currentPage < paginatedReviews.totalPages ? (
            <Link
              href={buildReviewsBrowseHref({
                query,
                intent: activeIntent,
                category: activeCategory,
                heat: activeHeat,
                sort: activeSort,
                page: paginatedReviews.currentPage + 1
              })}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Next page
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
