import { ContentCard } from "@/components/cards/content-card";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import type { Recipe } from "@/lib/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const hero = getRecipeHeroFields(recipe);

  return (
    <ContentCard
      href={`/recipes/${recipe.slug}`}
      image={hero.imageUrl}
      imageAlt={hero.imageAlt}
      eyebrow={`${recipe.cuisineType} · ${recipe.heatLevel}`}
      title={recipe.title}
      description={`${recipe.description} ${recipe.totalTimeMinutes} min · ${recipe.saveCount} saves.`}
      meta={recipe.publishedAt}
    />
  );
}
