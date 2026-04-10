import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { RecipeCard } from "@/components/cards/recipe-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import {
  KITCHEN_GEAR_KEYS,
  getAffiliateLinkEntries,
  resolveAffiliateLink
} from "@/lib/affiliates";
import {
  RECIPE_SORT_OPTIONS,
  RECIPE_TIME_OPTIONS,
  filterRecipes,
  getRecipeBrowseOptions,
  paginateRecipes,
  sortRecipes,
  type RecipeSortKey
} from "@/lib/recipe-browse";
import { getRecipeEditorialSections } from "@/lib/recipe-editorial-sections";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { buildMetadata } from "@/lib/seo";
import { getRecipes } from "@/lib/services/content";
import type { CuisineType, HeatLevel, Recipe } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Spicy Recipes | FlamingFoodies",
  description:
    "Browse spicy recipes for tacos, noodles, burgers, chicken, seafood, and high-heat weeknight cooking.",
  path: "/recipes"
});

const RECIPES_PER_PAGE = 12;

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatCuisineLabel(value: CuisineType) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatHeatLabel(value: HeatLevel) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function parseSort(value: string | undefined): RecipeSortKey {
  return RECIPE_SORT_OPTIONS.some((option) => option.key === value)
    ? (value as RecipeSortKey)
    : "featured";
}

function buildRecipesBrowseHref(input: {
  query?: string;
  cuisine?: string;
  heat?: string;
  difficulty?: string;
  maxTime?: string;
  sort?: string;
  page?: number;
}) {
  const params = new URLSearchParams();

  if (input.query?.trim()) params.set("q", input.query.trim());
  if (input.cuisine && input.cuisine !== "all") params.set("cuisine", input.cuisine);
  if (input.heat && input.heat !== "all") params.set("heat", input.heat);
  if (input.difficulty && input.difficulty !== "all") params.set("difficulty", input.difficulty);
  if (input.maxTime && input.maxTime !== "all") params.set("maxTime", input.maxTime);
  if (input.sort && input.sort !== "featured") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));

  const query = params.toString();
  return query ? `/recipes?${query}` : "/recipes";
}

export default async function RecipesIndexPage({
  searchParams
}: {
  searchParams?: {
    q?: string | string[];
    cuisine?: string | string[];
    heat?: string | string[];
    difficulty?: string | string[];
    maxTime?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  };
}) {
  const recipes = await getRecipes();
  const browseOptions = getRecipeBrowseOptions(recipes);
  const editorialSections = getRecipeEditorialSections(recipes);
  const query = getSingleSearchParam(searchParams?.q)?.trim() ?? "";
  const cuisine = getSingleSearchParam(searchParams?.cuisine) ?? "all";
  const heat = getSingleSearchParam(searchParams?.heat) ?? "all";
  const difficulty = getSingleSearchParam(searchParams?.difficulty) ?? "all";
  const maxTimeKey = getSingleSearchParam(searchParams?.maxTime) ?? "all";
  const page = Number.parseInt(getSingleSearchParam(searchParams?.page) ?? "1", 10);
  const sort = parseSort(getSingleSearchParam(searchParams?.sort));
  const maxTimeOption =
    RECIPE_TIME_OPTIONS.find((option) => option.key === maxTimeKey) ?? RECIPE_TIME_OPTIONS[0];
  const filteredRecipes = filterRecipes(recipes, {
    query,
    cuisine: cuisine as CuisineType | "all",
    heat: heat as HeatLevel | "all",
    difficulty: difficulty as Recipe["difficulty"] | "all",
    maxMinutes: maxTimeOption.maxMinutes,
    sort
  });
  const sortedRecipes = sortRecipes(filteredRecipes, sort);
  const paginatedRecipes = paginateRecipes(sortedRecipes, Number.isFinite(page) ? page : 1, RECIPES_PER_PAGE);
  const hasActiveFilters = Boolean(
    query ||
      cuisine !== "all" ||
      heat !== "all" ||
      difficulty !== "all" ||
      maxTimeKey !== "all" ||
      sort !== "featured"
  );
  const kitchenGear = getAffiliateLinkEntries(KITCHEN_GEAR_KEYS).slice(0, 3);
  const resolvedKitchenGear = kitchenGear
    .map((link) => ({
      link,
      resolved: resolveAffiliateLink(link.key, {
        sourcePage: "/recipes",
        position: "index-callout"
      })
    }))
    .filter((entry): entry is { link: (typeof kitchenGear)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved));
  const filterFieldClass =
    "rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15";
  const chipBaseClass =
    "rounded-full border px-4 py-2 text-sm font-semibold transition";

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="FlamingFoodies recipe archive"
        items={paginatedRecipes.items.map((recipe) => ({
          name: recipe.title,
          url: absoluteUrl(`/recipes/${recipe.slug}`),
          image: getRecipeHeroFields(recipe).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Recipes"
        title="Search spicy recipes by cuisine, heat, cook time, and difficulty."
        copy="Find tacos, noodles, burgers, braises, and fiery comfort food without digging through an endless wall of cards."
      />
      {editorialSections.length ? (
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
                <Link
                  href="/recipes#recipe-browse"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
                >
                  Browse the full archive
                </Link>
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
      <form id="recipe-browse" method="get" action="/recipes" className="panel-light mt-10 p-6">
        <div className="grid gap-4 xl:grid-cols-[2fr_repeat(4,minmax(0,1fr))_0.9fr]">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by dish, ingredient, or tag"
            className={`${filterFieldClass} placeholder:text-charcoal/45`}
          />
          <select
            name="cuisine"
            defaultValue={cuisine}
            className={filterFieldClass}
          >
            <option value="all">All cuisines</option>
            {browseOptions.cuisines.map((option) => (
              <option key={option} value={option}>
                {formatCuisineLabel(option)}
              </option>
            ))}
          </select>
          <select
            name="heat"
            defaultValue={heat}
            className={filterFieldClass}
          >
            <option value="all">All heat levels</option>
            {browseOptions.heatLevels.map((option) => (
              <option key={option} value={option}>
                {formatHeatLabel(option)}
              </option>
            ))}
          </select>
          <select
            name="difficulty"
            defaultValue={difficulty}
            className={filterFieldClass}
          >
            <option value="all">Any difficulty</option>
            {browseOptions.difficulties.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
          <select
            name="maxTime"
            defaultValue={maxTimeKey}
            className={filterFieldClass}
          >
            {RECIPE_TIME_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className={filterFieldClass}
          >
            {RECIPE_SORT_OPTIONS.map((option) => (
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
              href="/recipes"
              className="rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Clear all
            </Link>
          ) : null}
          <p className="text-sm text-charcoal/60">
            Browse by cuisine, heat, time, and difficulty instead of scrolling one giant archive.
          </p>
        </div>
      </form>
      <div className="mt-6 flex flex-wrap gap-3">
        {browseOptions.cuisines.slice(0, 6).map((option) => (
          <Link
            key={option}
            href={buildRecipesBrowseHref({
              query,
              cuisine: option,
              heat,
              difficulty,
              maxTime: maxTimeKey,
              sort
            })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              cuisine === option
                ? `${chipBaseClass} border-white bg-white text-charcoal shadow-sm`
                : `${chipBaseClass} border-white/18 bg-white/[0.04] text-cream/90 hover:border-white/30 hover:bg-white/[0.07]`
            }`}
          >
            {formatCuisineLabel(option)}
          </Link>
        ))}
        {browseOptions.heatLevels.map((option) => (
          <Link
            key={option}
            href={buildRecipesBrowseHref({
              query,
              cuisine,
              heat: option,
              difficulty,
              maxTime: maxTimeKey,
              sort
            })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              heat === option
                ? `${chipBaseClass} border-ember bg-ember text-white shadow-sm`
                : `${chipBaseClass} border-white/18 bg-white/[0.04] text-cream/90 hover:border-white/30 hover:bg-white/[0.07]`
            }`}
          >
            {formatHeatLabel(option)}
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Recipe archive</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            {paginatedRecipes.totalResults
              ? `Showing ${paginatedRecipes.startResult}-${paginatedRecipes.endResult} of ${paginatedRecipes.totalResults}`
              : "No recipes match those filters yet"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-cream/70">
            {paginatedRecipes.totalResults
              ? "Tighten the filters to narrow the list, or sort for quickest dinners and hottest cooks."
              : "Try a broader search, clear one filter, or switch to another cuisine or heat level."}
          </p>
        </div>
        {paginatedRecipes.totalPages > 1 ? (
          <p className="text-sm text-cream/60">
            Page {paginatedRecipes.currentPage} of {paginatedRecipes.totalPages}
          </p>
        ) : null}
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {paginatedRecipes.items.length ? (
          paginatedRecipes.items.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)
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
          </div>
        )}
      </div>
      {paginatedRecipes.totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {paginatedRecipes.currentPage > 1 ? (
            <Link
              href={buildRecipesBrowseHref({
                query,
                cuisine,
                heat,
                difficulty,
                maxTime: maxTimeKey,
                sort,
                page: paginatedRecipes.currentPage - 1
              })}
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Previous page
            </Link>
          ) : (
            <span />
          )}
          {paginatedRecipes.currentPage < paginatedRecipes.totalPages ? (
            <Link
              href={buildRecipesBrowseHref({
                query,
                cuisine,
                heat,
                difficulty,
                maxTime: maxTimeKey,
                sort,
                page: paginatedRecipes.currentPage + 1
              })}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Next page
            </Link>
          ) : null}
        </div>
      ) : null}
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
          {resolvedKitchenGear.map(({ link, resolved }) => (
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
      <AffiliateDisclosure className="mt-8 max-w-3xl" compact />
    </section>
  );
}
