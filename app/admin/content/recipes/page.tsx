import Link from "next/link";

import { createRecipeAction, updateRecipeStateAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { getAdminRecipes } from "@/lib/services/content";

export default async function AdminRecipesPage({
  searchParams
}: {
  searchParams?: { created?: string; updated?: string; error?: string };
}) {
  const recipes = await getAdminRecipes();

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
          cuisine: recipe.cuisineType,
          heat: recipe.heatLevel,
          saves: recipe.saveCount,
          rating: recipe.ratingAvg,
          status: recipe.status
        }))}
      />
      <div className="panel-light p-6">
        <h2 className="font-display text-4xl text-charcoal">Create a recipe</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/65">
          Ingredients use one line per item in `amount | unit | item | notes` format.
          Instructions use one line per step in `step text | optional tip` format.
        </p>
        <form action={createRecipeAction} encType="multipart/form-data" className="mt-6 space-y-4">
          <input
            name="title"
            placeholder="Title"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <textarea
            name="description"
            placeholder="Description"
            rows={3}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <textarea
            name="intro"
            placeholder="Intro / cultural context"
            rows={4}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <select name="heatLevel" className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
              <option value="medium">medium</option>
              <option value="mild">mild</option>
              <option value="hot">hot</option>
              <option value="inferno">inferno</option>
              <option value="reaper">reaper</option>
            </select>
            <select name="cuisineType" className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
              <option value="other">other</option>
              <option value="american">american</option>
              <option value="mexican">mexican</option>
              <option value="thai">thai</option>
              <option value="korean">korean</option>
              <option value="indian">indian</option>
              <option value="ethiopian">ethiopian</option>
              <option value="jamaican">jamaican</option>
            </select>
            <select name="difficulty" className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <input name="prepTimeMinutes" type="number" min="0" defaultValue="15" placeholder="Prep time" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="cookTimeMinutes" type="number" min="0" defaultValue="20" placeholder="Cook time" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="servings" type="number" min="1" defaultValue="4" placeholder="Servings" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          </div>
          <textarea name="ingredients" placeholder="1 | tbsp | gochujang | fermented chilli paste" rows={6} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 font-mono text-sm outline-none focus:border-ember" />
          <textarea name="instructions" placeholder="Whisk the sauce until glossy | reserve noodle water" rows={6} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 font-mono text-sm outline-none focus:border-ember" />
          <div className="grid gap-4 md:grid-cols-2">
            <textarea name="tips" placeholder="One tip per line" rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <textarea name="variations" placeholder="One variation per line" rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <textarea name="equipment" placeholder="One item per line" rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="tags" placeholder="spicy, weeknight, noodles" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <select name="status" className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <input name="imageUrl" placeholder="Image URL" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="imageAlt" placeholder="Image alt text" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input
              name="imageFile"
              type="file"
              accept="image/*"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-charcoal/70">
            <input type="checkbox" name="featured" />
            Featured recipe
          </label>
          {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
          {searchParams?.created ? <p className="text-sm text-emerald-700">Recipe created successfully.</p> : null}
          {searchParams?.updated ? <p className="text-sm text-emerald-700">Recipe updated successfully.</p> : null}
          <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
            Save recipe
          </button>
        </form>
      </div>
      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <article key={recipe.id} className="panel-light p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">
                  {recipe.cuisineType} · {recipe.heatLevel}
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
