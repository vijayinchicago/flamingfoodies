import Link from "next/link";

import { SearchForm } from "@/components/search/search-form";
import { SearchTracker } from "@/components/search/search-tracker";
import { buildMetadata } from "@/lib/seo";
import { searchSite } from "@/lib/search";

export const metadata = buildMetadata({
  title: "Search FlamingFoodies",
  description:
    "Search recipes, reviews, blog posts, and guides across FlamingFoodies.",
  path: "/search",
  noIndex: true
});

const quickLinks = [
  { label: "Birria tacos", query: "birria tacos" },
  { label: "Habanero", query: "habanero" },
  { label: "Hot sauce reviews", query: "hot sauce review" },
  { label: "Fermented sauce", query: "ferment hot sauce" },
  { label: "Korean heat", query: "gochujang" }
];

function formatType(type: string) {
  if (type === "blog_post") return "Blog";
  if (type === "review") return "Review";
  if (type === "guide") return "Guide";
  return "Recipe";
}

export default async function SearchPage({
  searchParams
}: {
  searchParams?: {
    q?: string;
    source?: string;
  };
}) {
  const query = String(searchParams?.q || "").trim();
  const source = String(searchParams?.source || "").trim() || "direct";
  const results = query ? await searchSite(query) : [];

  return (
    <section className="container-shell py-16">
      {query ? <SearchTracker query={query} resultCount={results.length} source={source} /> : null}
      <div className="max-w-4xl">
        <p className="eyebrow">Search</p>
        <h1 className="mt-4 font-display text-6xl text-cream">
          Find the right recipe, review, or guide faster.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-cream/72">
          Search across the cooking layer, hot sauce reviews, and editorial library without
          bouncing around the site.
        </p>
      </div>

      <div className="mt-8 max-w-4xl">
        <SearchForm defaultValue={query} source="search-page" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {quickLinks.map((item) => (
          <Link
            key={item.query}
            href={`/search?q=${encodeURIComponent(item.query)}&source=quick-link`}
            className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-cream transition hover:border-white/25 hover:bg-white/[0.1]"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {query ? (
        <div className="mt-10">
          <div className="panel p-6">
            <p className="eyebrow">Search results</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-4xl text-cream">
                {results.length ? `${results.length} matches for “${query}”` : `No matches for “${query}”`}
              </h2>
            </div>
          </div>

          {results.length ? (
            <div className="mt-6 grid gap-4">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.href}`}
                  href={result.href}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-6 transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-ember">
                      {formatType(result.type)}
                    </p>
                    <span className="text-sm text-cream/55">{result.meta}</span>
                  </div>
                  <h3 className="mt-3 font-display text-4xl text-cream">{result.title}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-cream/72">
                    {result.description}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 panel p-6">
              <p className="text-sm leading-7 text-cream/70">
                Try broader terms like a cuisine, sauce, or ingredient. Search works best with
                things like “habanero”, “taco”, “gochujang”, or “hot sauce review”.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 panel p-6">
          <p className="text-sm leading-7 text-cream/70">
            Start with a dish, pepper, cuisine, or product name. We search recipes, reviews, blog
            posts, and guides together so the results feel like one connected content system.
          </p>
        </div>
      )}
    </section>
  );
}
