"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { RecipeCard } from "@/components/cards/recipe-card";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import {
  RECIPE_SORT_OPTIONS,
  RECIPE_TIME_OPTIONS,
  filterRecipes,
  sortRecipes,
  paginateRecipes,
  type RecipeSortKey
} from "@/lib/recipe-browse";
import type { RecipeEditorialSection } from "@/lib/recipe-editorial-sections";
import type { CuisineType, HeatLevel, Recipe } from "@/lib/types";

const RECIPES_PER_PAGE = 12;

function formatCuisineLabel(value: CuisineType) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatHeatLabel(value: HeatLevel) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseSort(value: string | null): RecipeSortKey {
  return RECIPE_SORT_OPTIONS.some((o) => o.key === value)
    ? (value as RecipeSortKey)
    : "featured";
}

interface BrowseOptions {
  cuisines: CuisineType[];
  heatLevels: HeatLevel[];
  difficulties: Array<Recipe["difficulty"]>;
}

interface KitchenGearEntry {
  link: {
    key: string;
    badge: string;
    product: string;
    description: string;
    bestFor: string;
    priceLabel?: string;
  };
  resolved: {
    href: string;
    key: string;
    trackingMode: "client_beacon" | "server_redirect";
  };
}

interface Props {
  allRecipes: Recipe[];
  browseOptions: BrowseOptions;
  editorialSections: RecipeEditorialSection[];
  kitchenGear: KitchenGearEntry[];
}

export function RecipeBrowseClient({
  allRecipes,
  browseOptions,
  editorialSections,
  kitchenGear
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Initialise state from URL
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [cuisine, setCuisine] = useState(searchParams.get("cuisine") ?? "all");
  const [heat, setHeat] = useState(searchParams.get("heat") ?? "all");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") ?? "all");
  const [maxTimeKey, setMaxTimeKey] = useState(searchParams.get("maxTime") ?? "all");
  const [sort, setSort] = useState<RecipeSortKey>(parseSort(searchParams.get("sort")));
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1"));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce text search 300ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Sync filters → URL (without full navigation)
  const syncUrl = useCallback(
    (overrides: Record<string, string> = {}) => {
      const params = new URLSearchParams();
      const vals = {
        q: debouncedQuery,
        cuisine,
        heat,
        difficulty,
        maxTime: maxTimeKey,
        sort,
        page: String(page),
        ...overrides
      };
      if (vals.q) params.set("q", vals.q);
      if (vals.cuisine !== "all") params.set("cuisine", vals.cuisine);
      if (vals.heat !== "all") params.set("heat", vals.heat);
      if (vals.difficulty !== "all") params.set("difficulty", vals.difficulty);
      if (vals.maxTime !== "all") params.set("maxTime", vals.maxTime);
      if (vals.sort !== "featured") params.set("sort", vals.sort);
      if (Number(vals.page) > 1) params.set("page", vals.page);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/recipes?${qs}` : "/recipes", { scroll: false });
      });
    },
    [router, debouncedQuery, cuisine, heat, difficulty, maxTimeKey, sort, page]
  );

  // Re-sync whenever derived state changes
  useEffect(() => {
    syncUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, cuisine, heat, difficulty, maxTimeKey, sort, page]);

  const maxTimeOption = useMemo(
    () => RECIPE_TIME_OPTIONS.find((o) => o.key === maxTimeKey) ?? RECIPE_TIME_OPTIONS[0],
    [maxTimeKey]
  );

  const filteredAndSorted = useMemo(() => {
    const filtered = filterRecipes(allRecipes, {
      query: debouncedQuery,
      cuisine: cuisine as CuisineType | "all",
      heat: heat as HeatLevel | "all",
      difficulty: difficulty as Recipe["difficulty"] | "all",
      maxMinutes: maxTimeOption.maxMinutes ?? undefined
    });
    return sortRecipes(filtered, sort);
  }, [allRecipes, debouncedQuery, cuisine, heat, difficulty, maxTimeOption, sort]);

  const paginated = useMemo(
    () => paginateRecipes(filteredAndSorted, page, RECIPES_PER_PAGE),
    [filteredAndSorted, page]
  );

  const hasActiveFilters =
    Boolean(debouncedQuery) ||
    cuisine !== "all" ||
    heat !== "all" ||
    difficulty !== "all" ||
    maxTimeKey !== "all" ||
    sort !== "featured";

  function clearAll() {
    setQuery("");
    setDebouncedQuery("");
    setCuisine("all");
    setHeat("all");
    setDifficulty("all");
    setMaxTimeKey("all");
    setSort("featured");
    setPage(1);
  }

  const filterFieldClass =
    "rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15";
  const chipBase = "rounded-full border px-4 py-2 text-sm font-semibold transition";
  const chipActive = "border-white bg-white text-charcoal shadow-sm";
  const chipInactive =
    "border-white/18 bg-white/[0.04] text-cream/90 hover:border-white/30 hover:bg-white/[0.07]";
  const chipHeatActive = "border-ember bg-ember text-white shadow-sm";

  return (
    <>
      {/* Editorial sections — hidden when filters are active */}
      {!hasActiveFilters && editorialSections.length > 0 ? (
        <div className="mt-10 space-y-10">
          {editorialSections.map((section) => (
            <div key={section.key}>
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="eyebrow">{section.eyebrow}</p>
                  <h2 className="mt-3 font-display text-4xl text-cream">{section.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-cream/70">
                    {section.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const anchor = document.getElementById("recipe-browse");
                    anchor?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
                >
                  Browse the full archive
                </button>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {section.items.map((recipe) => (
                  <RecipeCard key={`${section.key}-${recipe.id}`} recipe={recipe} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Filter panel */}
      <div id="recipe-browse" className="panel-light mt-10 p-6">
        <div className="grid gap-4 xl:grid-cols-[2fr_repeat(4,minmax(0,1fr))_0.9fr]">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by dish, ingredient, or tag"
            className={`${filterFieldClass} placeholder:text-charcoal/45`}
          />
          <select
            value={cuisine}
            onChange={(e) => { setCuisine(e.target.value); setPage(1); }}
            className={filterFieldClass}
          >
            <option value="all">All cuisines</option>
            {browseOptions.cuisines.map((c) => (
              <option key={c} value={c}>{formatCuisineLabel(c)}</option>
            ))}
          </select>
          <select
            value={heat}
            onChange={(e) => { setHeat(e.target.value); setPage(1); }}
            className={filterFieldClass}
          >
            <option value="all">All heat levels</option>
            {browseOptions.heatLevels.map((h) => (
              <option key={h} value={h}>{formatHeatLabel(h)}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            className={filterFieldClass}
          >
            <option value="all">Any difficulty</option>
            {browseOptions.difficulties.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
          <select
            value={maxTimeKey}
            onChange={(e) => { setMaxTimeKey(e.target.value); setPage(1); }}
            className={filterFieldClass}
          >
            {RECIPE_TIME_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as RecipeSortKey); setPage(1); }}
            className={filterFieldClass}
          >
            {RECIPE_SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Clear all
            </button>
          ) : null}
          <p className="text-sm text-charcoal/60">
            {hasActiveFilters
              ? `${filteredAndSorted.length} recipe${filteredAndSorted.length === 1 ? "" : "s"} match your filters`
              : "Filter by cuisine, heat, time, and difficulty — results update as you type"}
          </p>
        </div>
      </div>

      {/* Quick chips */}
      <div className="mt-6 flex flex-wrap gap-3">
        {browseOptions.cuisines.slice(0, 6).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => { setCuisine(cuisine === c ? "all" : c); setPage(1); }}
            className={`${chipBase} ${cuisine === c ? chipActive : chipInactive}`}
          >
            {formatCuisineLabel(c)}
          </button>
        ))}
        {browseOptions.heatLevels.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => { setHeat(heat === h ? "all" : h); setPage(1); }}
            className={`${chipBase} ${heat === h ? chipHeatActive : chipInactive}`}
          >
            {formatHeatLabel(h)}
          </button>
        ))}
      </div>

      {/* Results header */}
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Recipe archive</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            {paginated.totalResults > 0
              ? `Showing ${paginated.startResult}–${paginated.endResult} of ${paginated.totalResults}`
              : "No recipes match those filters yet"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-cream/70">
            {paginated.totalResults > 0
              ? "Tighten the filters to narrow the list, or sort for quickest dinners and hottest cooks."
              : "Try a broader search, clear one filter, or switch to another cuisine or heat level."}
          </p>
        </div>
        {paginated.totalPages > 1 ? (
          <p className="text-sm text-cream/60">
            Page {paginated.currentPage} of {paginated.totalPages}
          </p>
        ) : null}
      </div>

      {/* Recipe grid */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {paginated.items.length > 0 ? (
          paginated.items.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
        ) : (
          <div className="panel-light col-span-full p-8">
            <p className="eyebrow">No matches</p>
            <h3 className="mt-3 font-display text-4xl text-charcoal">
              Nothing hit all of those filters yet.
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-charcoal/65">
              Clear one or two filters, or search for a broader lane like curry, noodles, tacos,
              chicken, or shrimp.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-6 rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginated.totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {paginated.currentPage > 1 ? (
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Previous page
            </button>
          ) : <span />}
          {paginated.currentPage < paginated.totalPages ? (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Next page
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Gear callout */}
      {kitchenGear.length > 0 ? (
        <div className="mt-14 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="panel p-8">
            <p className="eyebrow">Cook better, not just hotter</p>
            <h2 className="mt-3 font-display text-4xl text-cream">
              A few good tools make spicy cooking easier to repeat.
            </h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">
              If a recipe earns a spot in your rotation, these are the pieces that help it come out
              the way it should without making the kitchen feel overbuilt.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Shop sauces and gear
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {kitchenGear.map(({ link, resolved }) => (
              <article key={link.key} className="panel p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage="/recipes"
                  position="index-callout"
                  className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  View on Amazon
                </AffiliateLink>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <AffiliateDisclosure className="mt-8 max-w-3xl" compact />
    </>
  );
}
