import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/community/comment-section";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { RecipeSchema } from "@/components/schema/recipe-schema";
import {
  rateRecipeAction,
  toggleRecipeSaveAction
} from "@/lib/actions/engagement";
import { getRecipeAffiliateRecommendations } from "@/lib/affiliates";
import { getMerchThemeClasses } from "@/lib/merch";
import { buildMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/supabase/auth";
import {
  getFeaturedMerchProducts,
  getRecipe,
  getRecipeUserState
} from "@/lib/services/content";
import type { HeatLevel, Recipe } from "@/lib/types";
import { absoluteUrl, formatDate } from "@/lib/utils";

const stepStopwords = new Set([
  "and",
  "with",
  "from",
  "then",
  "into",
  "until",
  "your",
  "this",
  "that",
  "just",
  "have",
  "make",
  "keep",
  "more",
  "them",
  "very",
  "over",
  "side",
  "about",
  "need",
  "best"
]);

const heatNotes: Record<HeatLevel, { title: string; copy: string }> = {
  mild: {
    title: "Low-lift heat",
    copy: "Flavor leads and the spice stays approachable, so the whole table can lean in."
  },
  medium: {
    title: "Balanced burn",
    copy: "You get a real chile presence without blowing out the rest of the dish."
  },
  hot: {
    title: "Assertive heat",
    copy: "This one should feel exciting, not punishing, with enough punch to cut through rich bites."
  },
  inferno: {
    title: "Serious firepower",
    copy: "Built for spice people who still want the dish to taste complete and not one-note."
  },
  reaper: {
    title: "Challenge-level spice",
    copy: "The heat is the event here, so keep your garnishes and sides ready to balance it."
  }
};

const difficultyNotes: Record<Recipe["difficulty"], string> = {
  beginner: "Straightforward technique, forgiving timing, and a very manageable workflow.",
  intermediate: "A little sequencing matters, but nothing here should feel restaurant-only.",
  advanced: "There is some project energy here, but the payoff is exactly why the recipe is worth doing."
};

function formatCookTime(minutes: number) {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours} hr${hours === 1 ? "" : "s"}${remainder ? ` ${remainder} min` : ""}`;
  }

  return `${minutes} min`;
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getProjectCard(recipe: Recipe) {
  if (recipe.totalTimeMinutes >= 150) {
    return {
      title: "Weekend project payoff",
      copy:
        "Most of the clock is passive cooking, so the real job is getting your prep and assembly clean before the pot goes on."
    };
  }

  if (recipe.totalTimeMinutes <= 35) {
    return {
      title: "Weeknight-capable heat",
      copy: "This moves fast enough for a real dinner plan, not just a fantasy one."
    };
  }

  return {
    title: "Planned but practical",
    copy:
      "Give yourself a little space to cook and this lands in the sweet spot between special and repeatable."
  };
}

function getOccasionCard(recipe: Recipe) {
  if (recipe.servings >= 6) {
    return {
      title: "Built for a crowd",
      copy: "This is the kind of recipe that pays you back when more people show up hungry."
    };
  }

  if (recipe.servings <= 2) {
    return {
      title: "Dialed in for a smaller table",
      copy: "The recipe reads intimate and focused, with just enough yield for a tight dinner."
    };
  }

  return {
    title: "Great for repeat meals",
    copy: "Cook once, eat well now, and still have enough left for another sharp meal."
  };
}

function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]+/g, " ");
}

function getIngredientTokens(value: string) {
  return normalizeForMatch(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stepStopwords.has(token));
}

function getStepTitleAndBody(text: string) {
  const normalized = text.trim();
  const commaIndex = normalized.indexOf(",");
  const sentenceIndex = normalized.indexOf(".");
  const splitIndex = [commaIndex, sentenceIndex]
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];

  if (splitIndex === undefined) {
    return {
      title: normalized.replace(/\.$/, ""),
      body: ""
    };
  }

  const title = normalized.slice(0, splitIndex).replace(/[,.]\s*$/, "").trim();
  const body = normalized.slice(splitIndex + 1).trim();

  return {
    title: title || normalized.replace(/\.$/, ""),
    body
  };
}

function getStepPhaseLabel(stepIndex: number, totalSteps: number) {
  if (stepIndex === 0) return "Prep and build flavor";
  if (stepIndex === totalSteps - 1) return "Finish and serve";
  if (stepIndex <= Math.max(1, Math.floor((totalSteps - 1) / 3))) return "Set the foundation";
  return "Cook and develop";
}

function getStepIngredientMatches(
  recipe: Recipe,
  instruction: Recipe["instructions"][number]
) {
  const haystack = normalizeForMatch(`${instruction.text} ${instruction.tip || ""}`);

  return recipe.ingredients.filter((ingredient) => {
    const ingredientTokens = getIngredientTokens(
      `${ingredient.item} ${ingredient.notes || ""}`
    );

    return ingredientTokens.some((token) => haystack.includes(token));
  });
}

function getMethodPrepNotes(recipe: Recipe) {
  const earlyIngredients = Array.from(
    new Set(
      recipe.instructions
        .slice(0, Math.min(2, recipe.instructions.length))
        .flatMap((instruction) =>
          getStepIngredientMatches(recipe, instruction).map((ingredient) => ingredient.item)
        )
    )
  ).slice(0, 4);

  return [
    {
      label: "Before you start",
      title: recipe.totalTimeMinutes >= 90 ? "Set up for a longer cook" : "Set your station first",
      copy:
        recipe.totalTimeMinutes >= 90
          ? "Read the full method once, prep the first moves before heat starts, and give yourself room for the passive cooking stretch."
          : "Measure the fast-moving ingredients up front so you can stay with the pan instead of stopping to search."
    },
    {
      label: "Pull first",
      title: earlyIngredients.length
        ? earlyIngredients.join(", ")
        : recipe.equipment.slice(0, 3).join(", "),
      copy:
        earlyIngredients.length
          ? "These show up early in the recipe, so having them ready makes the first phase feel much cleaner."
          : "Set out the tools you need before you start so the method reads like one continuous flow."
    },
    {
      label: "Best cue",
      title: "Cook to sight, smell, and texture",
      copy:
        "The strongest recipe experiences tell you what done looks like, not just what the clock says. Use the notes inside each step before moving on."
    }
  ];
}

export async function generateMetadata({
  params
}: {
  params: { slug: string };
}) {
  const recipe = await getRecipe(params.slug);

  if (!recipe) {
    return buildMetadata({
      title: "Recipes | FlamingFoodies",
      description: "Spicy recipes built for flavor-first heat seekers."
    });
  }

  return buildMetadata({
    title: recipe.seoTitle || recipe.title,
    description: recipe.seoDescription || recipe.description,
    path: `/recipes/${recipe.slug}`,
    images: recipe.imageUrl ? [recipe.imageUrl] : undefined
  });
}

export default async function RecipePage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams?: { saved?: string; rated?: string; error?: string };
}) {
  const recipe = await getRecipe(params.slug);

  if (!recipe) notFound();

  const profile = await getCurrentProfile();
  const userState = await getRecipeUserState(recipe.id, profile?.id);
  const recommendedLinks = getRecipeAffiliateRecommendations({
    cuisineType: recipe.cuisineType,
    heatLevel: recipe.heatLevel,
    limit: 3
  });
  const merchPreview = await getFeaturedMerchProducts(2);

  const quickStats = [
    { label: "Prep", value: formatCookTime(recipe.prepTimeMinutes) },
    { label: "Cook", value: formatCookTime(recipe.cookTimeMinutes) },
    { label: "Total", value: formatCookTime(recipe.totalTimeMinutes) },
    { label: "Yield", value: `${recipe.servings} servings` }
  ];

  const overviewCards = [
    {
      label: "Heat profile",
      title: heatNotes[recipe.heatLevel].title,
      copy: heatNotes[recipe.heatLevel].copy
    },
    {
      label: "Skill level",
      title: formatLabel(recipe.difficulty),
      copy: difficultyNotes[recipe.difficulty]
    },
    {
      label: "Cooking mode",
      ...getProjectCard(recipe)
    },
    {
      label: "Best moment",
      ...getOccasionCard(recipe)
    }
  ];
  const prepNotes = getMethodPrepNotes(recipe);

  return (
    <article className="container-shell py-10 sm:py-16">
      <RecipeSchema recipe={recipe} />
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Recipes", item: absoluteUrl("/recipes") },
          { name: recipe.title, item: absoluteUrl(`/recipes/${recipe.slug}`) }
        ]}
      />

      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#140b09] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,57,70,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(244,162,97,0.18),transparent_30%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_460px]">
          <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
            <div className="flex flex-wrap items-center gap-3 text-sm text-cream/65">
              <span className="eyebrow">{formatLabel(recipe.cuisineType)}</span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                {formatLabel(recipe.heatLevel)} heat
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                {formatLabel(recipe.difficulty)}
              </span>
            </div>

            <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.98] text-cream sm:text-6xl lg:text-7xl">
              {recipe.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-cream/74 sm:text-xl">
              {recipe.description}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">{stat.label}</p>
                  <p className="mt-2 font-display text-3xl text-cream">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <a
                href="#ingredients"
                className="rounded-full bg-white px-5 py-3 font-semibold text-charcoal"
              >
                Jump to ingredients
              </a>
              <a
                href="#method"
                className="rounded-full border border-white/15 px-5 py-3 font-semibold text-cream"
              >
                See the method
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-cream/65">
              <span>{recipe.ratingAvg?.toFixed(1) || "New"} average rating</span>
              <span>{recipe.ratingCount} ratings</span>
              <span>{recipe.saveCount} saves</span>
              <span>{recipe.likeCount} likes</span>
              <span>Published {formatDate(recipe.publishedAt)}</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-cream/65"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-h-[340px] border-t border-white/10 xl:min-h-full xl:border-l xl:border-t-0">
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.imageAlt || recipe.title}
                fill
                sizes="(min-width: 1280px) 460px, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-flame/40 via-ember/10 to-charcoal" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="rounded-[2rem] border border-white/10 bg-charcoal/75 p-6 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.24em] text-ember">Why it lands</p>
                <p className="mt-3 text-base leading-7 text-cream/78">
                  {recipe.intro || recipe.description}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-cream/72">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-ember">Author</p>
                    <p className="mt-2 font-semibold text-cream">{recipe.authorName}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-ember">Format</p>
                    <p className="mt-2 font-semibold text-cream">
                      {recipe.totalTimeMinutes >= 90 ? "Slow-cook payoff" : "Fast flavor build"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-ember">{card.label}</p>
            <h2 className="mt-3 font-display text-3xl text-cream">{card.title}</h2>
            <p className="mt-3 text-sm leading-7 text-cream/72">{card.copy}</p>
          </article>
        ))}
      </section>

      {searchParams?.saved ? (
        <p className="mt-6 text-sm text-emerald-300">Recipe box updated.</p>
      ) : null}
      {searchParams?.rated ? (
        <p className="mt-3 text-sm text-emerald-300">Rating saved.</p>
      ) : null}
      {searchParams?.error ? (
        <p className="mt-3 text-sm text-rose-300">{searchParams.error}</p>
      ) : null}

      <div className="mt-12 grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <section id="ingredients" className="panel p-6 sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Shopping list</p>
                <h2 className="mt-3 font-display text-4xl text-cream">Ingredients</h2>
              </div>
              <p className="text-sm text-cream/55">Serves {recipe.servings}</p>
            </div>

            <ul className="mt-6 space-y-3">
              {recipe.ingredients.map((ingredient) => (
                <li
                  key={`${ingredient.item}-${ingredient.amount}-${ingredient.unit}`}
                  className="grid grid-cols-[90px_minmax(0,1fr)] gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                >
                  <div className="text-sm font-semibold text-cream">
                    {[ingredient.amount, ingredient.unit].filter(Boolean).join(" ")}
                  </div>
                  <div>
                    <p className="text-base text-cream">{ingredient.item}</p>
                    {ingredient.notes ? (
                      <p className="mt-1 text-sm text-cream/55">{ingredient.notes}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-6 sm:p-7">
            <p className="eyebrow">Need-to-have tools</p>
            <h2 className="mt-3 font-display text-4xl text-cream">Equipment</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {recipe.equipment.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-cream/72"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="panel p-6 sm:p-7">
            <p className="eyebrow">Cook along</p>
            <h2 className="mt-3 font-display text-4xl text-cream">Save and rate</h2>
            <p className="mt-3 text-sm leading-7 text-cream/72">
              Keep this one in your recipe box, then leave a quick note after you cook it.
            </p>
            <div className="mt-6 space-y-4">
              {profile ? (
                <>
                  <form action={toggleRecipeSaveAction}>
                    <input type="hidden" name="recipeId" value={recipe.id} />
                    <input type="hidden" name="recipeSlug" value={recipe.slug} />
                    <button className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal">
                      {userState.saved ? "Saved to your recipe box" : "Save this recipe"}
                    </button>
                  </form>
                  <form action={rateRecipeAction} className="space-y-3">
                    <input type="hidden" name="recipeId" value={recipe.id} />
                    <input type="hidden" name="recipeSlug" value={recipe.slug} />
                    <select
                      name="rating"
                      defaultValue={String(userState.rating || 5)}
                      className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm font-semibold text-cream"
                    >
                      <option value="5">5 stars</option>
                      <option value="4">4 stars</option>
                      <option value="3">3 stars</option>
                      <option value="2">2 stars</option>
                      <option value="1">1 star</option>
                    </select>
                    <input
                      name="reviewText"
                      placeholder="What worked, what you tweaked, what you would make again"
                      className="w-full rounded-2xl border border-white/15 bg-transparent px-4 py-3 text-sm text-cream placeholder:text-cream/40"
                    />
                    <button className="w-full rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream">
                      {userState.rating ? "Update your rating" : "Rate this recipe"}
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex w-full justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
                >
                  Log in to save and rate
                </Link>
              )}
            </div>
          </section>
        </aside>

        <div className="space-y-8">
          <section className="panel p-6 sm:p-8">
            <p className="eyebrow">Flavor map</p>
            <h2 className="mt-3 font-display text-5xl text-cream">Why this recipe works</h2>
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_0.8fr]">
              <div>
                <p className="text-base leading-8 text-cream/78">
                  {recipe.intro || recipe.description}
                </p>
                <p className="mt-4 text-base leading-8 text-cream/62">
                  The goal here is not just heat. It is contrast, pacing, and texture: enough
                  richness to feel satisfying, enough brightness to keep the plate moving, and
                  enough chile character that the spice actually tastes like something.
                </p>
              </div>
              <div className="grid gap-4">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">Heat</p>
                  <p className="mt-2 font-display text-3xl text-cream">
                    {formatLabel(recipe.heatLevel)}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-cream/65">
                    {heatNotes[recipe.heatLevel].copy}
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">Best use</p>
                  <p className="mt-2 font-display text-3xl text-cream">
                    {recipe.totalTimeMinutes >= 90 ? "Slow meal, big payoff" : "Fast table win"}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-cream/65">
                    {recipe.servings >= 6
                      ? "Plan on people reaching for seconds, because this is built to command the table."
                      : "This one fits best when you want the spice level to feel focused and personal."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="method" className="panel p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Method</p>
                <h2 className="mt-3 font-display text-5xl text-cream">How to cook it</h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-cream/58">
                Read the whole method once before starting. The page is designed so you can cook
                from top to bottom without bouncing around.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {prepNotes.map((note) => (
                <article
                  key={note.label}
                  className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{note.label}</p>
                  <h3 className="mt-3 font-display text-3xl text-cream">{note.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-cream/68">{note.copy}</p>
                </article>
              ))}
            </div>

            <ol className="mt-8 space-y-5">
              {recipe.instructions.map((instruction, index) => {
                const splitInstruction = getStepTitleAndBody(instruction.text);
                const matchedIngredients = getStepIngredientMatches(recipe, instruction).slice(0, 5);
                const phaseLabel = getStepPhaseLabel(index, recipe.instructions.length);

                return (
                  <li
                    key={instruction.step}
                    className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6"
                  >
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-flame to-ember font-display text-3xl text-white">
                          {instruction.step}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xs uppercase tracking-[0.24em] text-ember">
                              Step {instruction.step} of {recipe.instructions.length}
                            </p>
                            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cream/60">
                              {phaseLabel}
                            </span>
                          </div>
                          <h3 className="mt-3 font-display text-4xl leading-tight text-cream">
                            {splitInstruction.title}
                          </h3>
                          <p className="mt-3 text-lg leading-8 text-cream/82">
                            {splitInstruction.body || instruction.text}
                          </p>
                          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-flame to-ember"
                              style={{
                                width: `${((instruction.step || index + 1) / recipe.instructions.length) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <aside className="space-y-4 rounded-[1.75rem] border border-white/10 bg-charcoal/35 p-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-ember">
                            You&apos;ll use
                          </p>
                          {matchedIngredients.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {matchedIngredients.map((ingredient) => (
                                <span
                                  key={`${instruction.step}-${ingredient.item}`}
                                  className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cream/72"
                                >
                                  {ingredient.item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm leading-7 text-cream/58">
                              Focus on the technique here and keep your setup tight before moving on.
                            </p>
                          )}
                        </div>

                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-ember">
                            What to watch for
                          </p>
                          <p className="mt-3 text-sm leading-7 text-cream/68">
                            {instruction.tip
                              ? instruction.tip
                              : "Move on when the texture, color, and aroma match the direction instead of blindly trusting the clock."}
                          </p>
                        </div>
                      </aside>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {(recipe.tips.length || recipe.variations.length) ? (
            <section className="grid gap-6 lg:grid-cols-2">
              {recipe.tips.length ? (
                <div className="panel p-6 sm:p-7">
                  <p className="eyebrow">Cook smarter</p>
                  <h3 className="mt-3 font-display text-4xl text-cream">Tips that matter</h3>
                  <ul className="mt-6 space-y-4">
                    {recipe.tips.map((tip) => (
                      <li
                        key={tip}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-cream/72"
                      >
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {recipe.variations.length ? (
                <div className="panel p-6 sm:p-7">
                  <p className="eyebrow">Remix it</p>
                  <h3 className="mt-3 font-display text-4xl text-cream">Variations and swaps</h3>
                  <ul className="mt-6 space-y-4">
                    {recipe.variations.map((variation) => (
                      <li
                        key={variation}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-cream/72"
                      >
                        {variation}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="panel p-6 sm:p-7">
              <p className="eyebrow">Gear and pantry upgrades</p>
              <h3 className="mt-3 font-display text-4xl text-cream">
                Smart affiliate picks for this cook.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-cream/64">
                The point here is not random product stuffing. These are the pieces that actually
                make this style of recipe cleaner, faster, or more repeatable.
              </p>

              <div className="mt-6 grid gap-4">
                {recommendedLinks.map((link) => (
                  <article
                    key={link.key}
                    className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                      {link.priceLabel ? (
                        <span className="text-xs text-cream/52">{link.priceLabel}</span>
                      ) : null}
                    </div>
                    <h4 className="mt-3 font-display text-3xl text-cream">{link.product}</h4>
                    <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                    <Link
                      href={`/go/${link.key}?source=/recipes/${recipe.slug}&position=recipe-detail`}
                      className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                    >
                      Shop this pick
                    </Link>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel p-6 sm:p-7">
              <p className="eyebrow">FlamingFoodies merch</p>
              <h3 className="mt-3 font-display text-4xl text-cream">
                Brand pieces that belong next to the food.
              </h3>
              <div className="mt-6 space-y-4">
                {merchPreview.map((item) => (
                  <article
                    key={item.slug}
                    className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${getMerchThemeClasses(item.themeKey)} p-5`}
                  >
                    <p className="text-xs uppercase tracking-[0.24em] text-ember">{item.badge}</p>
                    <h4 className="mt-3 font-display text-3xl text-cream">{item.name}</h4>
                    <p className="mt-3 text-sm leading-7 text-cream/72">{item.description}</p>
                    <Link
                      href={item.href}
                      className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal"
                    >
                      {item.ctaLabel}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="panel p-6 sm:p-8">
            <p className="eyebrow">Comments and swaps</p>
            <h2 className="mt-3 font-display text-5xl text-cream">Community notes</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cream/62">
              Ask questions, post your substitutions, and leave the tweaks that made the recipe
              better in your kitchen.
            </p>
            <div className="mt-8">
              <CommentSection
                contentType="recipe"
                contentId={recipe.id}
                contentPath={`/recipes/${recipe.slug}`}
              />
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
