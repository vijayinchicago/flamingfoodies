import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { getRecipeIngredientSections, getRecipeMethodSteps } from "@/lib/recipes";
import type { BlogPost, Recipe, RecipeFaq } from "@/lib/types";
import { buildAuthorStructuredData } from "@/lib/authors";
import { absoluteUrl } from "@/lib/utils";

export type ItemListEntry = {
  name: string;
  url: string;
  image?: string;
};

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function buildArticleStructuredData(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    headline: post.title,
    description: post.description,
    image: post.imageUrl ? [post.imageUrl] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: buildAuthorStructuredData(post.authorName),
    publisher: {
      "@type": "Organization",
      name: "FlamingFoodies",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/flamingfoodies-mark.png")
      }
    },
    articleSection: post.category,
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
    wordCount: countWords(post.content)
  };
}

function formatCuisineLabel(value?: string) {
  if (!value || value === "other") {
    return undefined;
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildRecipeStepFallbackImage(recipe: Recipe, stepNumber: number, stepTitle: string) {
  const params = new URLSearchParams({
    title: `Step ${stepNumber}`,
    eyebrow: recipe.title,
    subtitle: stepTitle
  });

  return absoluteUrl(`/api/og?${params.toString()}`);
}

export function buildRecipeStructuredData(recipe: Recipe) {
  const ingredientSections = getRecipeIngredientSections(recipe);
  const methodSteps = getRecipeMethodSteps(recipe);
  const hero = getRecipeHeroFields(recipe);
  const recipeUrl = absoluteUrl(`/recipes/${recipe.slug}`);
  const recipeCuisine = formatCuisineLabel(recipe.cuisineType);
  const keywords = Array.from(
    new Set(
      [recipe.heatLevel, recipe.cuisineType, ...recipe.tags]
        .map((value) => value?.replace(/_/g, " ").trim())
        .filter(Boolean)
    )
  ).join(", ");

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    mainEntityOfPage: recipeUrl,
    url: recipeUrl,
    name: recipe.title,
    description: recipe.description,
    image: [hero.imageUrl],
    author: buildAuthorStructuredData(recipe.authorName),
    datePublished: recipe.publishedAt,
    prepTime: `PT${recipe.prepTimeMinutes}M`,
    cookTime: `PT${recipe.cookTimeMinutes}M`,
    totalTime: `PT${recipe.totalTimeMinutes}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeCategory: "spicy recipe",
    recipeCuisine,
    keywords: keywords || undefined,
    recipeIngredient: ingredientSections.flatMap((section) =>
      section.items.map(
        (ingredient) => `${ingredient.amount} ${ingredient.unit} ${ingredient.item}`.replace(/\s+/g, " ").trim()
      )
    ),
    recipeInstructions: methodSteps.map((instruction) => ({
      "@type": "HowToStep",
      name: instruction.title,
      text: instruction.body,
      url: absoluteUrl(`/recipes/${recipe.slug}#recipe-step-${instruction.step}`),
      image:
        instruction.imageUrl ||
        buildRecipeStepFallbackImage(recipe, instruction.step, instruction.title)
    })),
    aggregateRating:
      recipe.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: recipe.ratingAvg,
            reviewCount: recipe.ratingCount
          }
        : undefined
  };
}

export function buildFaqStructuredData(faqs: RecipeFaq[]) {
  if (!faqs.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function buildItemListStructuredData(name: string, items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name,
      image: item.image
    }))
  };
}
