import Link from "next/link";

import { RECIPE_TIME_OPTIONS } from "@/lib/recipe-browse";
import type { CuisineType, HeatLevel, Recipe } from "@/lib/types";

function formatCuisineLabel(value: CuisineType) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatHeatLabel(value: HeatLevel) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDifficultyLabel(value: Recipe["difficulty"]) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildRecipesBrowseHref(input: {
  query?: string;
  cuisine?: string;
  heat?: string;
  difficulty?: string;
  maxTime?: string;
}) {
  const params = new URLSearchParams();

  if (input.query?.trim()) params.set("q", input.query.trim());
  if (input.cuisine && input.cuisine !== "all") params.set("cuisine", input.cuisine);
  if (input.heat && input.heat !== "all") params.set("heat", input.heat);
  if (input.difficulty && input.difficulty !== "all") params.set("difficulty", input.difficulty);
  if (input.maxTime && input.maxTime !== "all") params.set("maxTime", input.maxTime);

  const query = params.toString();
  return query ? `/recipes?${query}` : "/recipes";
}

export function RecipeBrowseStrip({
  recipe,
  browseOptions
}: {
  recipe: Recipe;
  browseOptions: {
    cuisines: CuisineType[];
    heatLevels: HeatLevel[];
    difficulties: Recipe["difficulty"][];
  };
}) {
  const filterFieldClass =
    "rounded-2xl border border-charcoal/12 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-ember focus:ring-2 focus:ring-ember/15";
  const chipClass =
    "rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:border-charcoal/25 hover:bg-charcoal/[0.03]";
  const matchingTimeOption =
    RECIPE_TIME_OPTIONS.find(
      (option) => option.maxMinutes && recipe.totalTimeMinutes <= option.maxMinutes
    ) ?? RECIPE_TIME_OPTIONS[RECIPE_TIME_OPTIONS.length - 1];

  return (
    <section className="panel-light p-5 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Find another recipe</p>
          <h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">
            Search the archive without backing out.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/68">
            Jump to another dinner by ingredient, then narrow by cuisine, heat, difficulty, or cook
            time when you want a different fit.
          </p>
        </div>
        <Link
          href="/recipes"
          className="inline-flex rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal"
        >
          Open full recipe archive
        </Link>
      </div>

      <form method="get" action="/recipes" className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <input
          type="search"
          name="q"
          placeholder="Search by dish, ingredient, or tag"
          className={`${filterFieldClass} placeholder:text-charcoal/45`}
        />
        <select name="cuisine" defaultValue="all" className={filterFieldClass}>
          <option value="all">All cuisines</option>
          {browseOptions.cuisines.map((option) => (
            <option key={option} value={option}>
              {formatCuisineLabel(option)}
            </option>
          ))}
        </select>
        <select name="heat" defaultValue="all" className={filterFieldClass}>
          <option value="all">All heat levels</option>
          {browseOptions.heatLevels.map((option) => (
            <option key={option} value={option}>
              {formatHeatLabel(option)}
            </option>
          ))}
        </select>
        <select name="difficulty" defaultValue="all" className={filterFieldClass}>
          <option value="all">Any difficulty</option>
          {browseOptions.difficulties.map((option) => (
            <option key={option} value={option}>
              {formatDifficultyLabel(option)}
            </option>
          ))}
        </select>
        <select name="maxTime" defaultValue="all" className={filterFieldClass}>
          {RECIPE_TIME_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
        <button className="inline-flex justify-center rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white xl:col-start-5">
          Search recipes
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={buildRecipesBrowseHref({ cuisine: recipe.cuisineType })}
          className={chipClass}
        >
          More {formatCuisineLabel(recipe.cuisineType)}
        </Link>
        <Link href={buildRecipesBrowseHref({ heat: recipe.heatLevel })} className={chipClass}>
          {formatHeatLabel(recipe.heatLevel)} heat
        </Link>
        <Link
          href={buildRecipesBrowseHref({ difficulty: recipe.difficulty })}
          className={chipClass}
        >
          {formatDifficultyLabel(recipe.difficulty)}
        </Link>
        <Link
          href={buildRecipesBrowseHref({ maxTime: matchingTimeOption.key })}
          className={chipClass}
        >
          {matchingTimeOption.label}
        </Link>
      </div>
    </section>
  );
}
