import type { Recipe } from "@/lib/types";

export function RecipeSchema({ recipe }: { recipe: Recipe }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: recipe.imageUrl,
    author: { "@type": "Person", name: recipe.authorName },
    datePublished: recipe.publishedAt,
    prepTime: `PT${recipe.prepTimeMinutes}M`,
    cookTime: `PT${recipe.cookTimeMinutes}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeCategory: recipe.cuisineType,
    recipeIngredient: recipe.ingredients.map(
      (ingredient) => `${ingredient.amount} ${ingredient.unit} ${ingredient.item}`
    ),
    recipeInstructions: recipe.instructions.map((instruction) => ({
      "@type": "HowToStep",
      text: instruction.text
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
