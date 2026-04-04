import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/community/comment-section";
import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { PinterestSaveButton } from "@/components/content/pinterest-save-button";
import { ShareBar } from "@/components/content/share-bar";
import { RecipeDisplayControls } from "@/components/recipes/recipe-display-controls";
import { RecipeIngredientRail } from "@/components/recipes/recipe-ingredient-rail";
import { RecipeMethodSection } from "@/components/recipes/recipe-method-section";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { FaqSchema } from "@/components/schema/faq-schema";
import { RecipeSchema } from "@/components/schema/recipe-schema";
import {
  rateRecipeAction,
  toggleRecipeSaveAction
} from "@/lib/actions/engagement";
import {
  getRecipeAffiliateRecommendations,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { getMerchThemeClasses } from "@/lib/merch";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import {
  getRecipeFaqs,
  getRecipeHeroSummary,
  getRecipeIngredientSections,
  getRecipeMethodSteps,
  getRecipeSupportList
} from "@/lib/recipes";
import { buildMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/supabase/auth";
import {
  getFeaturedMerchProducts,
  getRecipe,
  getRecipeUserState
} from "@/lib/services/content";
import type { HeatLevel, Recipe } from "@/lib/types";
import { absoluteUrl, formatDate } from "@/lib/utils";

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

function getPrintNoteBlocks(recipe: Recipe, substitutions: string[], servingSuggestions: string[]) {
  const blocks: Array<{ label: string; lines: string[] }> = [];

  if (recipe.equipment.length) {
    blocks.push({
      label: "Equipment",
      lines: recipe.equipment.slice(0, 6)
    });
  }

  if (recipe.makeAheadNotes) {
    blocks.push({
      label: "Make ahead",
      lines: [recipe.makeAheadNotes]
    });
  }

  if (recipe.storageNotes) {
    blocks.push({
      label: "Storage",
      lines: [recipe.storageNotes]
    });
  }

  if (recipe.reheatNotes) {
    blocks.push({
      label: "Reheat",
      lines: [recipe.reheatNotes]
    });
  }

  if (recipe.tips.length) {
    blocks.push({
      label: "Top tips",
      lines: recipe.tips.slice(0, 3)
    });
  }

  if (substitutions.length) {
    blocks.push({
      label: "Substitutions",
      lines: substitutions.slice(0, 3)
    });
  }

  if (servingSuggestions.length) {
    blocks.push({
      label: "Serve with",
      lines: servingSuggestions.slice(0, 3)
    });
  }

  return blocks;
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

  const hero = getRecipeHeroFields(recipe);

  return buildMetadata({
    title: recipe.seoTitle || recipe.title,
    description: recipe.seoDescription || recipe.description,
    path: `/recipes/${recipe.slug}`,
    images: [hero.imageUrl]
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

  if (!recipe) {
    notFound();
  }

  const profile = await getCurrentProfile();
  const [userState, merchPreview] = await Promise.all([
    getRecipeUserState(recipe.id, profile?.id),
    getFeaturedMerchProducts(2)
  ]);
  const recommendedLinks = getRecipeAffiliateRecommendations({
    cuisineType: recipe.cuisineType,
    heatLevel: recipe.heatLevel,
    limit: 3
  });
  const resolvedRecommendedLinks = recommendedLinks
    .map((link) => ({
      link,
      resolved: resolveAffiliateLink(link.key, {
        sourcePage: `/recipes/${recipe.slug}`,
        position: "recipe-detail"
      })
    }))
    .filter((entry): entry is { link: (typeof recommendedLinks)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved));
  const ingredientSections = getRecipeIngredientSections(recipe);
  const methodSteps = getRecipeMethodSteps(recipe);
  const faqs = getRecipeFaqs(recipe);
  const substitutions = getRecipeSupportList(recipe.substitutions);
  const servingSuggestions = getRecipeSupportList(recipe.servingSuggestions);
  const heroSummary = getRecipeHeroSummary(recipe);
  const hero = getRecipeHeroFields(recipe);
  const projectCard = getProjectCard(recipe);
  const occasionCard = getOccasionCard(recipe);
  const printNoteBlocks = getPrintNoteBlocks(recipe, substitutions, servingSuggestions);
  const planningStats = [
    { label: "Prep", value: formatCookTime(recipe.prepTimeMinutes) },
    { label: "Cook", value: formatCookTime(recipe.cookTimeMinutes) },
    recipe.activeTimeMinutes
      ? { label: "Active", value: formatCookTime(recipe.activeTimeMinutes) }
      : null,
    { label: "Total", value: formatCookTime(recipe.totalTimeMinutes) },
    { label: "Yield", value: `${recipe.servings} servings` }
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <article className="container-shell py-10 sm:py-16">
      <RecipeSchema recipe={recipe} />
      <FaqSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Recipes", item: absoluteUrl("/recipes") },
          { name: recipe.title, item: absoluteUrl(`/recipes/${recipe.slug}`) }
        ]}
      />

      <section className="recipe-print-header print-only">
        <p className="eyebrow">FlamingFoodies recipe</p>
        <h1 className="mt-3 font-display text-5xl text-charcoal">{recipe.title}</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-charcoal/80">{recipe.description}</p>
        <div className="recipe-print-meta mt-6">
          {planningStats.map((stat) => (
            <div key={`print-${stat.label}`}>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
            </div>
          ))}
          <div>
            <p>Heat</p>
            <strong>{formatLabel(recipe.heatLevel)}</strong>
          </div>
          <div>
            <p>Difficulty</p>
            <strong>{formatLabel(recipe.difficulty)}</strong>
          </div>
          <div>
            <p>Published</p>
            <strong>{formatDate(recipe.publishedAt)}</strong>
          </div>
        </div>
        <p className="mt-5 text-base leading-7 text-charcoal/78">{heroSummary}</p>
      </section>

      <section className="recipe-print-sheet print-only">
        <div className="recipe-print-grid">
          <section className="recipe-print-card">
            <h2>Ingredients</h2>
            {ingredientSections.map((section, index) => (
              <div key={`print-ingredients-${section.title}-${index}`} className="recipe-print-block">
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((ingredient, ingredientIndex) => (
                    <li key={`print-ingredient-${index}-${ingredientIndex}-${ingredient.item}`}>
                      <strong>{[ingredient.amount, ingredient.unit].filter(Boolean).join(" ")}</strong>
                      <span>
                        {ingredient.item}
                        {ingredient.notes ? `, ${ingredient.notes}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="recipe-print-card">
            <h2>Method</h2>
            <ol className="recipe-print-steps">
              {methodSteps.map((step) => (
                <li key={`print-step-${step.step}`}>
                  <p>
                    <strong>
                      {step.step}. {step.title}
                    </strong>
                    {` ${step.body}`}
                  </p>
                  {step.cue ? <p className="recipe-print-note">Watch for: {step.cue}</p> : null}
                  {step.tip ? <p className="recipe-print-note">Tip: {step.tip}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {printNoteBlocks.length ? (
          <section className="recipe-print-notes">
            {printNoteBlocks.map((block) => (
              <div key={`print-note-${block.label}`} className="recipe-print-note-card">
                <h3>{block.label}</h3>
                <ul>
                  {block.lines.map((line) => (
                    <li key={`${block.label}-${line}`}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ) : null}
      </section>

      <div
        id="recipe-detail-shell"
        className="recipe-detail-shell recipe-screen-content space-y-10"
      >
        <section className="recipe-hero-shell recipe-core-panel relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#140b09] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="recipe-hero-bg absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(230,57,70,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(244,162,97,0.18),transparent_30%)]" />
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
                  Jump to method
                </a>
                <a
                  href="#comments"
                  className="rounded-full border border-white/15 px-5 py-3 font-semibold text-cream"
                >
                  Community notes
                </a>
                <RecipeDisplayControls targetId="recipe-detail-shell" />
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {planningStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-ember">{stat.label}</p>
                    <p className="mt-2 font-display text-3xl text-cream">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-cream/65">
                <span>{recipe.authorName}</span>
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

              <div className="mt-8 max-w-3xl print-hidden">
                <ShareBar
                  title={recipe.title}
                  description={recipe.description}
                  url={absoluteUrl(`/recipes/${recipe.slug}`)}
                  imageUrl={hero.imageUrl}
                  contentType="recipe"
                  contentId={recipe.id}
                  contentSlug={recipe.slug}
                />
              </div>
              <div className="mt-4 max-w-3xl print-hidden">
                <AffiliateDisclosure compact />
              </div>
            </div>

            <div className="recipe-hero-media relative min-h-[340px] border-t border-white/10 xl:min-h-full xl:border-l xl:border-t-0">
              <PinterestSaveButton
                title={recipe.title}
                description={recipe.description}
                url={absoluteUrl(`/recipes/${recipe.slug}`)}
                imageUrl={hero.imageUrl}
                contentType="recipe"
                contentId={recipe.id}
                contentSlug={recipe.slug}
                className="absolute right-4 top-4 z-10 inline-flex rounded-full border border-white/15 bg-charcoal/70 px-4 py-2 text-sm font-semibold text-cream backdrop-blur-md transition hover:border-white/30 hover:bg-charcoal/80"
              />
              <Image
                src={hero.imageUrl}
                alt={hero.imageAlt || recipe.title}
                fill
                sizes="(min-width: 1280px) 460px, 100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="rounded-[2rem] border border-white/10 bg-charcoal/75 p-6 backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">Why this one lands</p>
                  <p className="mt-3 text-base leading-7 text-cream/78">{heroSummary}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-cream/72">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-ember">Heat</p>
                      <p className="mt-2 font-semibold text-cream">{heatNotes[recipe.heatLevel].title}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-ember">Difficulty</p>
                      <p className="mt-2 font-semibold text-cream">{formatLabel(recipe.difficulty)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4 print-hidden">
          <article className="recipe-core-panel rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-ember">Heat profile</p>
            <h2 className="mt-3 font-display text-3xl text-cream">{heatNotes[recipe.heatLevel].title}</h2>
            <p className="mt-3 text-sm leading-7 text-cream/72">{heatNotes[recipe.heatLevel].copy}</p>
          </article>
          <article className="recipe-core-panel rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-ember">Skill level</p>
            <h2 className="mt-3 font-display text-3xl text-cream">{formatLabel(recipe.difficulty)}</h2>
            <p className="mt-3 text-sm leading-7 text-cream/72">{difficultyNotes[recipe.difficulty]}</p>
          </article>
          <article className="recipe-core-panel rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-ember">Cooking mode</p>
            <h2 className="mt-3 font-display text-3xl text-cream">{projectCard.title}</h2>
            <p className="mt-3 text-sm leading-7 text-cream/72">{projectCard.copy}</p>
          </article>
          <article className="recipe-core-panel rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-ember">Best moment</p>
            <h2 className="mt-3 font-display text-3xl text-cream">{occasionCard.title}</h2>
            <p className="mt-3 text-sm leading-7 text-cream/72">{occasionCard.copy}</p>
          </article>
        </section>

        {searchParams?.saved ? (
          <p className="text-sm text-emerald-300">Recipe box updated.</p>
        ) : null}
        {searchParams?.rated ? (
          <p className="text-sm text-emerald-300">Rating saved.</p>
        ) : null}
        {searchParams?.error ? (
          <p className="text-sm text-rose-300">{searchParams.error}</p>
        ) : null}

        <div className="recipe-print-layout grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <RecipeIngredientRail sections={ingredientSections} baseServings={recipe.servings} />

            <section className="recipe-core-panel panel p-6 sm:p-7">
              <p className="eyebrow">Planning tools</p>
              <h2 className="mt-3 font-display text-4xl text-cream">Equipment and setup</h2>
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
              {recipe.makeAheadNotes ? (
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">Make ahead</p>
                  <p className="mt-3 text-sm leading-7 text-cream/68">{recipe.makeAheadNotes}</p>
                </div>
              ) : null}
            </section>

            <section className="recipe-core-panel panel print-hidden p-6 sm:p-7">
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
            <section className="recipe-print-section recipe-core-panel panel p-6 sm:p-8">
              <p className="eyebrow">Why this recipe works</p>
              <h2 className="mt-3 font-display text-5xl text-cream">Editorial notes before you cook</h2>
              <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_0.8fr]">
                <div>
                  <p className="text-base leading-8 text-cream/78">{recipe.intro || heroSummary}</p>
                  <p className="mt-4 text-base leading-8 text-cream/62">
                    The goal here is not just heat. It is contrast, pacing, and texture: enough
                    richness to feel satisfying, enough brightness to keep the plate moving, and
                    enough chile character that the spice actually tastes like something.
                  </p>
                </div>
                <div className="grid gap-4">
                <div className="recipe-print-keep rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-ember">Best use</p>
                    <p className="mt-2 font-display text-3xl text-cream">
                      {recipe.totalTimeMinutes >= 90 ? "Slow meal, big payoff" : "Fast table win"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-cream/65">{projectCard.copy}</p>
                  </div>
                  <div className="recipe-print-keep rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-xs uppercase tracking-[0.22em] text-ember">Why readers stick with it</p>
                    <p className="mt-2 font-display text-3xl text-cream">{occasionCard.title}</p>
                    <p className="mt-2 text-sm leading-7 text-cream/65">{occasionCard.copy}</p>
                  </div>
                </div>
              </div>
            </section>

            <RecipeMethodSection steps={methodSteps} ingredientSections={ingredientSections} />

            <section className="grid gap-6 lg:grid-cols-2">
              {recipe.tips.length ? (
                <div className="recipe-print-section recipe-core-panel panel p-6 sm:p-7">
                  <p className="eyebrow">Troubleshooting</p>
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

              {(substitutions.length || recipe.variations.length) ? (
                <div className="recipe-print-section recipe-core-panel panel p-6 sm:p-7">
                  <p className="eyebrow">Substitutions and variations</p>
                  <h3 className="mt-3 font-display text-4xl text-cream">Remix without losing the point</h3>
                  <div className="mt-6 space-y-4">
                    {substitutions.map((substitution) => (
                      <div
                        key={substitution}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-cream/72"
                      >
                        {substitution}
                      </div>
                    ))}
                    {recipe.variations.map((variation) => (
                      <div
                        key={variation}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-cream/72"
                      >
                        {variation}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(recipe.storageNotes || recipe.reheatNotes || recipe.makeAheadNotes) ? (
                <div className="recipe-print-section recipe-core-panel panel p-6 sm:p-7">
                  <p className="eyebrow">Storage and leftovers</p>
                  <h3 className="mt-3 font-display text-4xl text-cream">Plan ahead and reheat well</h3>
                  <div className="mt-6 space-y-4">
                    {recipe.makeAheadNotes ? (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-ember">Make ahead</p>
                        <p className="mt-3 text-sm leading-7 text-cream/72">{recipe.makeAheadNotes}</p>
                      </div>
                    ) : null}
                    {recipe.storageNotes ? (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-ember">Storage</p>
                        <p className="mt-3 text-sm leading-7 text-cream/72">{recipe.storageNotes}</p>
                      </div>
                    ) : null}
                    {recipe.reheatNotes ? (
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-ember">Reheat</p>
                        <p className="mt-3 text-sm leading-7 text-cream/72">{recipe.reheatNotes}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {servingSuggestions.length ? (
                <div className="recipe-print-section recipe-core-panel panel p-6 sm:p-7">
                  <p className="eyebrow">Serve it like you mean it</p>
                  <h3 className="mt-3 font-display text-4xl text-cream">Finish, pair, and plate</h3>
                  <ul className="mt-6 space-y-4">
                    {servingSuggestions.map((suggestion) => (
                      <li
                        key={suggestion}
                        className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-7 text-cream/72"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            {faqs.length ? (
              <section id="faqs" className="recipe-print-section recipe-core-panel panel p-6 sm:p-7">
                <p className="eyebrow">FAQ</p>
                <h3 className="mt-3 font-display text-4xl text-cream">The repeat questions</h3>
                <div className="mt-6 space-y-4">
                  {faqs.map((faq) => (
                    <details
                      key={faq.question}
                      className="recipe-print-keep rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-4"
                    >
                      <summary className="cursor-pointer list-none text-base font-semibold text-cream">
                        {faq.question}
                      </summary>
                      <p className="mt-4 text-sm leading-7 text-cream/72">{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="recipe-core-panel print-hidden">
              <CommentSection
                contentType="recipe"
                contentId={recipe.id}
                contentPath={`/recipes/${recipe.slug}`}
                title="Community notes"
              />
            </section>
          </div>
        </div>

        {(resolvedRecommendedLinks.length || merchPreview.length) ? (
          <section className="recipe-secondary-utility grid gap-6 lg:grid-cols-[1.05fr_0.95fr] print-hidden">
            {resolvedRecommendedLinks.length ? (
              <div className="panel p-6 sm:p-7">
                <p className="eyebrow">Gear and pantry upgrades</p>
                <h3 className="mt-3 font-display text-4xl text-cream">Smart affiliate picks for this cook</h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-cream/64">
                  The point here is not random product stuffing. These are the pieces that actually
                  make this style of recipe cleaner, faster, or more repeatable.
                </p>
                <div className="mt-6 grid gap-4">
                  {resolvedRecommendedLinks.map(({ link, resolved }) => (
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
                      <AffiliateLink
                        href={resolved.href}
                        partnerKey={resolved.key}
                        trackingMode={resolved.trackingMode}
                        sourcePage={`/recipes/${recipe.slug}`}
                        position="recipe-detail"
                        contentType="recipe"
                        contentId={recipe.id}
                        contentSlug={recipe.slug}
                        className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                      >
                        View on Amazon
                      </AffiliateLink>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {merchPreview.length ? (
              <div className="panel p-6 sm:p-7">
                <p className="eyebrow">FlamingFoodies merch</p>
                <h3 className="mt-3 font-display text-4xl text-cream">Brand pieces that belong next to the food</h3>
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
            ) : null}
          </section>
        ) : null}
      </div>
    </article>
  );
}
