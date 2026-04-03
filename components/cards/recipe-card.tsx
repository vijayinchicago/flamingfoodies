import { ContentCard } from "@/components/cards/content-card";
import type { Recipe } from "@/lib/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <ContentCard
      href={`/recipes/${recipe.slug}`}
      image={recipe.imageUrl}
      imageAlt={recipe.imageAlt}
      eyebrow={`${recipe.cuisineType} · ${recipe.heatLevel}`}
      title={recipe.title}
      description={`${recipe.description} ${recipe.totalTimeMinutes} min · ${recipe.saveCount} saves.`}
      meta={recipe.publishedAt}
    />
  );
}
