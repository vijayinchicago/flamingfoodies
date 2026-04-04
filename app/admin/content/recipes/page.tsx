import Link from "next/link";

import { createRecipeAction, updateRecipeStateAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { RecipeEditorForm } from "@/components/admin/recipe-editor-form";
import { getAdminRecipes } from "@/lib/services/content";

export default async function AdminRecipesPage({
  searchParams
}: {
  searchParams?: { created?: string; updated?: string; error?: string };
}) {
  const recipes = await getAdminRecipes();
  const aiReviewQueue = recipes.filter(
    (recipe) => recipe.source === "ai_generated" && recipe.status !== "published"
  );
  const displayRecipes = [
    ...aiReviewQueue,
    ...recipes.filter((recipe) => !aiReviewQueue.some((queued) => queued.id === recipe.id))
  ];

  return (
    <AdminPage
      title="Recipe content"
      description="Recipe inventory with heat level, cuisine, featured state, and performance metrics."
    >
      <ContentTable
        title="Recipes"
        filters={["status", "source", "heat_level", "cuisine_type"]}
        rows={recipes.map((recipe) => ({
          title: recipe.title,
          source: recipe.source,
          cuisine: recipe.cuisineType,
          heat: recipe.heatLevel,
          saves: recipe.saveCount,
          rating: recipe.ratingAvg,
          status: recipe.status
        }))}
      />
      {aiReviewQueue.length ? (
        <section className="panel-light p-6">
          <p className="eyebrow">Review queue</p>
          <h2 className="mt-2 font-display text-4xl text-charcoal">
            AI-generated recipes awaiting review
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
            Successful AI runs land here first. They stay off the public `/recipes` page until you
            publish them or their scheduled publish time arrives.
          </p>
          <div className="mt-6 grid gap-4">
            {aiReviewQueue.slice(0, 6).map((recipe) => (
              <article
                key={`queue-${recipe.id}`}
                className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">
                      {recipe.source.replace(/_/g, " ")} · {recipe.cuisineType} · {recipe.heatLevel}
                    </p>
                    <h3 className="mt-2 font-display text-3xl text-charcoal">{recipe.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-charcoal/65">{recipe.description}</p>
                  </div>
                  <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    {recipe.status}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/55">
                  <span>Slug: {recipe.slug}</span>
                  <span>Hero reviewed: {recipe.heroImageReviewed ? "Yes" : "No"}</span>
                  <span>Cuisine QA: {recipe.cuisineQaReviewed ? "Yes" : "No"}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/admin/content/recipes/${recipe.id}`}
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    Open review
                  </Link>
                  <form action={updateRecipeStateAction} className="flex flex-wrap gap-3">
                    <input type="hidden" name="id" value={recipe.id} />
                    <button
                      name="intent"
                      value="publish"
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Publish now
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <div className="panel-light p-6">
        <h2 className="font-display text-4xl text-charcoal">Create a recipe</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/65">
          Build grouped ingredients, structured method steps, support notes, and FAQ in the same
          shape the public recipe page uses.
        </p>
        <RecipeEditorForm
          formAction={createRecipeAction}
          submitLabel="Save recipe"
          errorMessage={searchParams?.error}
          successMessage={
            searchParams?.created
              ? "Recipe created successfully."
              : searchParams?.updated
                ? "Recipe updated successfully."
                : undefined
          }
        />
      </div>
      <div className="grid gap-4">
        {displayRecipes.map((recipe) => (
          <article key={recipe.id} className="panel-light p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">
                  {recipe.source.replace(/_/g, " ")} · {recipe.cuisineType} · {recipe.heatLevel}
                </p>
                <h2 className="mt-2 font-display text-4xl text-charcoal">{recipe.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                  {recipe.description}
                </p>
              </div>
              <div className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                {recipe.status}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/55">
              <span>Slug: {recipe.slug}</span>
              <span>Saves: {recipe.saveCount}</span>
              <span>Featured: {recipe.featured ? "Yes" : "No"}</span>
              <span>Hero reviewed: {recipe.heroImageReviewed ? "Yes" : "No"}</span>
              <span>Cuisine QA: {recipe.cuisineQaReviewed ? "Yes" : "No"}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/admin/content/recipes/${recipe.id}`}
                className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
              >
                Edit recipe
              </Link>
              <form action={updateRecipeStateAction} className="flex flex-wrap gap-3">
                <input type="hidden" name="id" value={recipe.id} />
                {recipe.status !== "published" ? (
                  <button name="intent" value="publish" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                    Publish
                  </button>
                ) : null}
                {recipe.status !== "archived" ? (
                  <button name="intent" value="archive" className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white">
                    Archive
                  </button>
                ) : null}
                <button name="intent" value={recipe.featured ? "unfeature" : "feature"} className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal">
                  {recipe.featured ? "Remove featured" : "Mark featured"}
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
