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
import { absoluteUrl, formatDate } from "@/lib/utils";

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

  return (
    <article className="container-shell py-16">
      <RecipeSchema recipe={recipe} />
      <BreadcrumbSchema
        items={[
          { name: "Home", item: absoluteUrl("/") },
          { name: "Recipes", item: absoluteUrl("/recipes") },
          { name: recipe.title, item: absoluteUrl(`/recipes/${recipe.slug}`) }
        ]}
      />
      <p className="eyebrow">
        {recipe.cuisineType} · {recipe.heatLevel}
      </p>
      <h1 className="mt-4 max-w-4xl font-display text-6xl leading-tight text-cream">
        {recipe.title}
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-cream/75">{recipe.description}</p>
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-cream/60">
        <span>{recipe.totalTimeMinutes} minutes</span>
        <span>{recipe.servings} servings</span>
        <span>{recipe.ratingCount} ratings</span>
        <span>{formatDate(recipe.publishedAt)}</span>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {profile ? (
          <>
            <form action={toggleRecipeSaveAction}>
              <input type="hidden" name="recipeId" value={recipe.id} />
              <input type="hidden" name="recipeSlug" value={recipe.slug} />
              <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream">
                {userState.saved ? "Saved to your recipe box" : "Save recipe"}
              </button>
            </form>
            <form action={rateRecipeAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="recipeId" value={recipe.id} />
              <input type="hidden" name="recipeSlug" value={recipe.slug} />
              <select
                name="rating"
                defaultValue={String(userState.rating || 5)}
                className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-sm font-semibold text-cream"
              >
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
              <input
                name="reviewText"
                placeholder="Optional quick note"
                className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-sm text-cream placeholder:text-cream/40"
              />
              <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal">
                {userState.rating ? "Update rating" : "Rate recipe"}
              </button>
            </form>
          </>
        ) : null}
      </div>
      {searchParams?.saved ? (
        <p className="mt-4 text-sm text-emerald-300">Recipe box updated.</p>
      ) : null}
      {searchParams?.rated ? (
        <p className="mt-4 text-sm text-emerald-300">Rating saved.</p>
      ) : null}
      {searchParams?.error ? (
        <p className="mt-4 text-sm text-rose-300">{searchParams.error}</p>
      ) : null}

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <aside className="panel p-6">
          <h2 className="font-display text-3xl text-cream">Ingredients</h2>
          <ul className="mt-5 space-y-3 text-sm text-cream/75">
            {recipe.ingredients.map((ingredient: (typeof recipe.ingredients)[number]) => (
              <li key={`${ingredient.item}-${ingredient.amount}`}>
                {ingredient.amount} {ingredient.unit} {ingredient.item}
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-ember">
            Equipment
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-cream/75">
            {recipe.equipment.map((item: string) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </aside>
        <div className="space-y-8">
          <section className="panel p-6">
            <h2 className="font-display text-3xl text-cream">Why it works</h2>
            <p className="mt-4 text-sm leading-7 text-cream/75">{recipe.intro}</p>
          </section>
          <section className="panel p-6">
            <h2 className="font-display text-3xl text-cream">Instructions</h2>
            <ol className="mt-5 space-y-5">
              {recipe.instructions.map((instruction: (typeof recipe.instructions)[number]) => (
                <li key={instruction.step} className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ember">
                    Step {instruction.step}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-cream/75">{instruction.text}</p>
                  {instruction.tip ? (
                    <p className="mt-2 text-sm text-cream/55">Tip: {instruction.tip}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
          <section className="grid gap-6 md:grid-cols-2">
            <div className="panel p-6">
              <h3 className="font-display text-3xl text-cream">Tips</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-cream/75">
                {recipe.tips.map((tip: string) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
            <div className="panel p-6">
              <h3 className="font-display text-3xl text-cream">Variations</h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-cream/75">
                {recipe.variations.map((variation: string) => (
                  <li key={variation}>{variation}</li>
                ))}
              </ul>
            </div>
          </section>
          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="panel p-6">
              <p className="eyebrow">Cook it with the right gear</p>
              <h3 className="mt-3 font-display text-3xl text-cream">
                Contextual picks for this recipe.
              </h3>
              <div className="mt-6 grid gap-4">
                {recommendedLinks.map((link) => (
                  <article
                    key={link.key}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                      {link.priceLabel ? (
                        <span className="text-xs text-cream/55">{link.priceLabel}</span>
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
            <div className="panel p-6">
              <p className="eyebrow">FlamingFoodies merch</p>
              <h3 className="mt-3 font-display text-3xl text-cream">
                Push the brand while the appetite is high.
              </h3>
              <div className="mt-6 space-y-4">
                {merchPreview.map((item) => (
                  <article
                    key={item.slug}
                    className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-br ${getMerchThemeClasses(item.themeKey)} p-5`}
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
        </div>
      </div>
      <div className="mt-12">
        <CommentSection
          contentType="recipe"
          contentId={recipe.id}
          contentPath={`/recipes/${recipe.slug}`}
        />
      </div>
    </article>
  );
}
