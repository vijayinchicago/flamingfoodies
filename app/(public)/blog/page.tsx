import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { ContentCard } from "@/components/cards/content-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { getAdRuntimeConfig } from "@/lib/ads";
import {
  BLOG_SORT_OPTIONS,
  filterBlogPosts,
  formatBlogCategoryLabel,
  formatBlogCuisineLabel,
  formatBlogHeatLabel,
  getBlogBrowseOptions,
  paginateBlogPosts,
  parseBlogSort,
  sortBlogPosts
} from "@/lib/blog-browse";
import { getEditorialFranchises } from "@/lib/editorial-franchises";
import { buildMetadata } from "@/lib/seo";
import { getBlogPosts } from "@/lib/services/content";
import type { CuisineType, HeatLevel } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Spicy Food Blog | FlamingFoodies",
  description:
    "Editorial coverage on spicy food culture, hot sauce gear, chili techniques, and heat-forward cooking.",
  path: "/blog"
});

const BLOG_POSTS_PER_PAGE = 10;

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildBlogBrowseHref(input: {
  query?: string;
  category?: string;
  cuisine?: string;
  heat?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (input.query?.trim()) params.set("q", input.query.trim());
  if (input.category && input.category !== "all") params.set("category", input.category);
  if (input.cuisine && input.cuisine !== "all") params.set("cuisine", input.cuisine);
  if (input.heat && input.heat !== "all") params.set("heat", input.heat);
  if (input.sort && input.sort !== "featured") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));

  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

export default async function BlogIndexPage({
  searchParams
}: {
  searchParams?: {
    q?: string | string[];
    category?: string | string[];
    cuisine?: string | string[];
    heat?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  };
}) {
  const posts = await getBlogPosts();
  const ads = await getAdRuntimeConfig();
  const franchises = getEditorialFranchises(posts);
  const browseOptions = getBlogBrowseOptions(posts);
  const query = getSingleSearchParam(searchParams?.q)?.trim() ?? "";
  const category = getSingleSearchParam(searchParams?.category) ?? "all";
  const cuisine = (getSingleSearchParam(searchParams?.cuisine) ?? "all") as CuisineType | "all";
  const heat = (getSingleSearchParam(searchParams?.heat) ?? "all") as HeatLevel | "all";
  const sort = parseBlogSort(getSingleSearchParam(searchParams?.sort));
  const page = Number.parseInt(getSingleSearchParam(searchParams?.page) ?? "1", 10);
  const filteredPosts = filterBlogPosts(posts, {
    query,
    category,
    cuisine,
    heat
  });
  const sortedPosts = sortBlogPosts(filteredPosts, sort);
  const paginatedPosts = paginateBlogPosts(sortedPosts, Number.isFinite(page) ? page : 1, BLOG_POSTS_PER_PAGE);
  const hasActiveFilters = Boolean(
    query || category !== "all" || cuisine !== "all" || heat !== "all" || sort !== "featured"
  );

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="FlamingFoodies blog archive"
        items={paginatedPosts.items.map((post) => ({
          name: post.title,
          url: absoluteUrl(`/blog/${post.slug}`),
          image: post.imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Blog"
        title="Search spicy food stories by topic, cuisine, and heat lane."
        copy="Longer reads on spicy food culture, shelf-building, gear, ingredients, and the ideas that make the rest of the site more useful."
      />
      <div className="mt-10 grid gap-6 xl:grid-cols-3">
        {franchises.map((franchise) => (
          <article key={franchise.key} className="panel p-6">
            <p className="eyebrow">{franchise.eyebrow}</p>
            <h2 className="mt-3 font-display text-4xl text-cream">{franchise.title}</h2>
            <p className="mt-4 text-sm leading-7 text-cream/72">{franchise.description}</p>
            {franchise.posts.length ? (
              <div className="mt-5 space-y-3">
                {franchise.posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="block rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4 text-sm text-cream/78 transition hover:bg-white/[0.08]"
                  >
                    <span className="text-xs uppercase tracking-[0.18em] text-ember">
                      Recent angle
                    </span>
                    <span className="mt-2 block font-semibold text-cream">{post.title}</span>
                  </Link>
                ))}
              </div>
            ) : null}
            <Link
              href={franchise.href}
              className="mt-5 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              {franchise.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
      <form method="get" action="/blog" className="panel-light mt-10 p-6">
        <div className="grid gap-4 xl:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))_0.9fr]">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by topic, bottle, ingredient, or idea"
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition placeholder:text-charcoal/45 focus:border-ember focus:ring-2 focus:ring-ember/15"
          />
          <select
            name="category"
            defaultValue={category}
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
          >
            <option value="all">All topics</option>
            {browseOptions.categories.map((option) => (
              <option key={option} value={option}>
                {formatBlogCategoryLabel(option)}
              </option>
            ))}
          </select>
          <select
            name="cuisine"
            defaultValue={cuisine}
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
          >
            <option value="all">All cuisines</option>
            {browseOptions.cuisines.map((option) => (
              <option key={option} value={option}>
                {formatBlogCuisineLabel(option)}
              </option>
            ))}
          </select>
          <select
            name="heat"
            defaultValue={heat}
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
          >
            <option value="all">All heat levels</option>
            {browseOptions.heatLevels.map((option) => (
              <option key={option} value={option}>
                {formatBlogHeatLabel(option)}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15"
          >
            {BLOG_SORT_OPTIONS.map((option) => (
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
              href="/blog"
              className="rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Clear all
            </Link>
          ) : null}
          <p className="text-sm text-charcoal/60">
            Browse the archive by topic and cuisine instead of scrolling one long editorial feed.
          </p>
        </div>
      </form>
      <div className="mt-6 flex flex-wrap gap-3">
        {browseOptions.categories.slice(0, 6).map((option) => (
          <Link
            key={option}
            href={buildBlogBrowseHref({
              query,
              category: option,
              cuisine,
              heat,
              sort
            })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              category === option
                ? "border-white bg-white text-charcoal shadow-sm"
                : "border-white/15 bg-white/[0.04] text-cream/90 hover:border-white/30 hover:bg-white/[0.07]"
            }`}
          >
            {formatBlogCategoryLabel(option)}
          </Link>
        ))}
        {browseOptions.cuisines.slice(0, 4).map((option) => (
          <Link
            key={option}
            href={buildBlogBrowseHref({
              query,
              category,
              cuisine: option,
              heat,
              sort
            })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              cuisine === option
                ? "border-ember bg-ember text-white shadow-sm"
                : "border-white/15 bg-white/[0.04] text-cream/90 hover:border-white/30 hover:bg-white/[0.07]"
            }`}
          >
            {formatBlogCuisineLabel(option)}
          </Link>
        ))}
      </div>
      {ads.manualSlotsEnabled && ads.clientId && ads.slotIds.blogArchive && posts.length ? (
        <div className="mt-10 max-w-4xl">
          <AdSlot
            clientId={ads.clientId}
            slotId={ads.slotIds.blogArchive}
            slotName="blog_archive_feature"
            placement="blog_archive"
            className="bg-white/[0.04]"
          />
        </div>
      ) : null}
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Editorial archive</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            {paginatedPosts.totalResults
              ? `Showing ${paginatedPosts.startResult}-${paginatedPosts.endResult} of ${paginatedPosts.totalResults}`
              : "No blog posts match those filters yet"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-cream/70">
            {paginatedPosts.totalResults
              ? "Sort for the newest reads or tighten the archive around one topic or cuisine."
              : "Try a broader search, clear one filter, or switch to another topic lane."}
          </p>
        </div>
        {paginatedPosts.totalPages > 1 ? (
          <p className="text-sm text-cream/60">
            Page {paginatedPosts.currentPage} of {paginatedPosts.totalPages}
          </p>
        ) : null}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {paginatedPosts.items.length ? (
          paginatedPosts.items.map((post) => (
            <ContentCard
              key={post.id}
              href={`/blog/${post.slug}`}
              image={post.imageUrl}
              imageAlt={post.imageAlt}
              eyebrow={post.category}
              title={post.title}
              description={post.description}
              meta={post.publishedAt}
            />
          ))
        ) : (
          <div className="panel p-8 lg:col-span-2">
            <p className="eyebrow">Blog</p>
            <h3 className="mt-3 font-display text-4xl text-cream">
              Fresh blog posts are on the way.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/72">
              Check back soon for more spicy food culture, gear, and hot sauce guides.
            </p>
          </div>
        )}
      </div>
      {paginatedPosts.totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {paginatedPosts.currentPage > 1 ? (
            <Link
              href={buildBlogBrowseHref({
                query,
                category,
                cuisine,
                heat,
                sort,
                page: paginatedPosts.currentPage - 1
              })}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Previous page
            </Link>
          ) : (
            <span />
          )}
          {paginatedPosts.currentPage < paginatedPosts.totalPages ? (
            <Link
              href={buildBlogBrowseHref({
                query,
                category,
                cuisine,
                heat,
                sort,
                page: paginatedPosts.currentPage + 1
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
