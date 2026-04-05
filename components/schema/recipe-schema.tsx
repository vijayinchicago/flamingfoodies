import type { Recipe } from "@/lib/types";
import { buildRecipeStructuredData } from "@/lib/structured-data";

export function RecipeSchema({ recipe }: { recipe: Recipe }) {
  const schema = buildRecipeStructuredData(recipe);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
