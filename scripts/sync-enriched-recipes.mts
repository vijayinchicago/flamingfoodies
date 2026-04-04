import { createClient } from "@supabase/supabase-js";

import recipesModule from "../lib/recipes.ts";
import recipeQaModule from "../lib/recipe-qa.ts";
import sampleDataModule from "../lib/sample-data/index.ts";
import type { Recipe } from "../lib/types.ts";

const {
  getRecipeFaqs,
  getRecipeHeroSummary,
  getRecipeIngredientSections,
  getRecipeMethodSteps,
  getRecipeSupportList
} = recipesModule;
const { buildRecipeQaReport, getRecipeManualReviewState } = recipeQaModule;
const { sampleRecipes } = sampleDataModule;

function mapRecipeForUpsert(recipe: Recipe) {
  const manualReview = getRecipeManualReviewState(recipe);
  const qaReport = buildRecipeQaReport({
    ...recipe,
    heroImageReviewed: manualReview.heroImageReviewed,
    cuisineQaReviewed: manualReview.cuisineQaReviewed
  });

  return {
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    intro: recipe.intro ?? null,
    hero_summary: getRecipeHeroSummary(recipe),
    author_name: recipe.authorName,
    heat_level: recipe.heatLevel,
    cuisine_type: recipe.cuisineType,
    prep_time_minutes: recipe.prepTimeMinutes,
    cook_time_minutes: recipe.cookTimeMinutes,
    active_time_minutes: recipe.activeTimeMinutes ?? recipe.prepTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients,
    ingredient_sections: getRecipeIngredientSections(recipe),
    instructions: recipe.instructions,
    method_steps: getRecipeMethodSteps(recipe),
    tips: recipe.tips,
    variations: recipe.variations,
    make_ahead_notes: recipe.makeAheadNotes ?? null,
    storage_notes: recipe.storageNotes ?? null,
    reheat_notes: recipe.reheatNotes ?? null,
    serving_suggestions: getRecipeSupportList(recipe.servingSuggestions),
    substitutions: getRecipeSupportList(recipe.substitutions).length
      ? getRecipeSupportList(recipe.substitutions)
      : recipe.variations,
    faqs: getRecipeFaqs(recipe),
    equipment: recipe.equipment,
    tags: recipe.tags,
    image_url: recipe.imageUrl ?? null,
    image_alt: recipe.imageAlt ?? null,
    hero_image_reviewed: manualReview.heroImageReviewed,
    cuisine_qa_reviewed: manualReview.cuisineQaReviewed,
    qa_notes: manualReview.qaNotes ?? null,
    qa_report: qaReport,
    featured: recipe.featured ?? false,
    status: recipe.status,
    source: recipe.source,
    affiliate_disclosure: true,
    seo_title: recipe.seoTitle ?? recipe.title.slice(0, 60),
    seo_description: recipe.seoDescription ?? recipe.description.slice(0, 160),
    view_count: recipe.viewCount,
    like_count: recipe.likeCount,
    save_count: recipe.saveCount,
    rating_avg: recipe.ratingAvg ?? null,
    rating_count: recipe.ratingCount,
    published_at: recipe.publishedAt ?? null
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script.");
}

const requestedSlugs = process.argv.slice(2);
const recipes =
  requestedSlugs.length > 0
    ? sampleRecipes.filter((recipe) => requestedSlugs.includes(recipe.slug))
    : sampleRecipes;

if (!recipes.length) {
  throw new Error("No sample recipes matched the requested slugs.");
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase
  .from("recipes")
  .upsert(recipes.map(mapRecipeForUpsert), { onConflict: "slug" })
  .select("slug");

if (error) {
  throw error;
}

console.log(`Synced ${data?.length ?? recipes.length} recipes:`);
for (const recipe of recipes) {
  console.log(`- ${recipe.slug}`);
}
