import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { RecipeCard } from "@/components/cards/recipe-card";
import { SectionHeading } from "@/components/layout/section-heading";
import { ItemListSchema } from "@/components/schema/item-list-schema";
import {
  KITCHEN_GEAR_KEYS,
  getAffiliateLinkEntries,
  resolveAffiliateLink
} from "@/lib/affiliates";
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
  const kitchenGear = getAffiliateLinkEntries(KITCHEN_GEAR_KEYS).slice(0, 3);
  const resolvedKitchenGear = kitchenGear
    .map((link) => ({
      link,
      resolved: resolveAffiliateLink(link.key, {
        sourcePage: "/recipes",
        position: "index-callout"
      })
    }))
    .filter((entry): entry is { link: (typeof kitchenGear)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved));

  return (
    <section className="container-shell py-16">
      <ItemListSchema
        name="FlamingFoodies recipe archive"
        items={recipes.map((recipe) => ({
          name: recipe.title,
          url: absoluteUrl(`/recipes/${recipe.slug}`),
          image: getRecipeHeroFields(recipe).imageUrl
        }))}
      />
      <SectionHeading
        eyebrow="Recipes"
        title="Searchable spicy cooking, built to scale."
        copy="Recipes are the anchor inventory for organic growth, affiliate placements, and future community saves."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-8">
          <p className="eyebrow">Cook better, not just hotter</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Recipes pull harder when the gear is close by.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            The best affiliate placements on this site sit next to actual cooking utility.
            Here are the pieces readers are most likely to need once they land on the recipe layer.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Shop sauces and gear
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {resolvedKitchenGear.map(({ link, resolved }) => (
            <article key={link.key} className="panel p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
              <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
              <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
              <AffiliateLink
                href={resolved.href}
                partnerKey={resolved.key}
                trackingMode={resolved.trackingMode}
                sourcePage="/recipes"
                position="index-callout"
                className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                View on Amazon
              </AffiliateLink>
            </article>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </section>
  );
}
