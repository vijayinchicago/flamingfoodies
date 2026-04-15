import { Suspense } from "react";

import { RecipeBrowseClient } from "@/components/recipes/recipe-browse-client";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  KITCHEN_GEAR_KEYS,
  getAffiliateLinkEntries,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { getRecipeBrowseOptions } from "@/lib/recipe-browse";
import { getRecipeEditorialSections } from "@/lib/recipe-editorial-sections";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { buildMetadata } from "@/lib/seo";
import { getRecipes } from "@/lib/services/content";
import { absoluteUrl } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Spicy Recipes | FlamingFoodies",
  description:
    "Browse spicy recipes for tacos, noodles, burgers, chicken, seafood, and high-heat weeknight cooking.",
  path: "/recipes"
});

export default async function RecipesIndexPage() {
  const recipes = await getRecipes();
  const browseOptions = getRecipeBrowseOptions(recipes);
  const editorialSections = getRecipeEditorialSections(recipes);

  const kitchenGear = getAffiliateLinkEntries(KITCHEN_GEAR_KEYS).slice(0, 3);
  const resolvedKitchenGear = kitchenGear
    .map((link) => ({
      link,
      resolved: resolveAffiliateLink(link.key, {
        sourcePage: "/recipes",
        position: "index-callout"
      })
    }))
    .filter(
      (
        entry
      ): entry is {
        link: (typeof kitchenGear)[number];
        resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>>;
      } => Boolean(entry.resolved)
    );

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="FlamingFoodies recipe archive"
        items={recipes.slice(0, 20).map((recipe) => ({
          name: recipe.title,
          url: absoluteUrl(`/recipes/${recipe.slug}`),
          image: getRecipeHeroFields(recipe).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Recipes"
        title="Search spicy recipes by cuisine, heat, cook time, and difficulty."
        copy="Find tacos, noodles, burgers, braises, and fiery comfort food — results update live as you filter."
      />
      <Suspense>
        <RecipeBrowseClient
          allRecipes={recipes}
          browseOptions={browseOptions}
          editorialSections={editorialSections}
          kitchenGear={resolvedKitchenGear}
        />
      </Suspense>
    </section>
  );
}
