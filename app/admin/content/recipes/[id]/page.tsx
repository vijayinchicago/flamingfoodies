import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRecipeAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { getAdminRecipeById } from "@/lib/services/content";

function ingredientLines(
  ingredients: Array<{ amount: string; unit: string; item: string; notes?: string }>
) {
  return ingredients
    .map((ingredient) =>
      [ingredient.amount, ingredient.unit, ingredient.item, ingredient.notes]
        .filter(Boolean)
        .join(" | ")
    )
    .join("\n");
}

function instructionLines(
  instructions: Array<{ step: number; text: string; tip?: string }>
) {
  return instructions
    .map((instruction) => [instruction.text, instruction.tip].filter(Boolean).join(" | "))
    .join("\n");
}

export default async function AdminRecipeEditPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string };
}) {
  const recipe = await getAdminRecipeById(Number(params.id));

  if (!recipe) {
    notFound();
  }

  return (
    <AdminPage
      title="Edit Recipe"
      description="Adjust metadata, structure, and imagery without recreating the recipe."
    >
      <Link
        href="/admin/content/recipes"
        className="inline-flex rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
      >
        Back to recipe content
      </Link>
      <form action={updateRecipeAction} encType="multipart/form-data" className="panel-light mt-6 space-y-4 p-6">
        <input type="hidden" name="id" value={recipe.id} />
        <input type="hidden" name="redirectTo" value={`/admin/content/recipes/${recipe.id}`} />
        <input
          name="title"
          defaultValue={recipe.title}
          placeholder="Title"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <textarea
          name="description"
          defaultValue={recipe.description}
          placeholder="Description"
          rows={3}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <textarea
          name="intro"
          defaultValue={recipe.intro}
          placeholder="Intro / cultural context"
          rows={4}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <select name="heatLevel" defaultValue={recipe.heatLevel} className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
            <option value="medium">medium</option>
            <option value="mild">mild</option>
            <option value="hot">hot</option>
            <option value="inferno">inferno</option>
            <option value="reaper">reaper</option>
          </select>
          <select name="cuisineType" defaultValue={recipe.cuisineType} className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
            <option value="other">other</option>
            <option value="american">american</option>
            <option value="mexican">mexican</option>
            <option value="thai">thai</option>
            <option value="korean">korean</option>
            <option value="indian">indian</option>
            <option value="ethiopian">ethiopian</option>
            <option value="jamaican">jamaican</option>
            <option value="west_african">west_african</option>
            <option value="caribbean">caribbean</option>
            <option value="other">other</option>
          </select>
          <select name="difficulty" defaultValue={recipe.difficulty} className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input name="prepTimeMinutes" type="number" min="0" defaultValue={recipe.prepTimeMinutes} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="cookTimeMinutes" type="number" min="0" defaultValue={recipe.cookTimeMinutes} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="servings" type="number" min="1" defaultValue={recipe.servings} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
        </div>
        <textarea name="ingredients" defaultValue={ingredientLines(recipe.ingredients)} rows={6} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 font-mono text-sm outline-none focus:border-ember" />
        <textarea name="instructions" defaultValue={instructionLines(recipe.instructions)} rows={6} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 font-mono text-sm outline-none focus:border-ember" />
        <div className="grid gap-4 md:grid-cols-2">
          <textarea name="tips" defaultValue={recipe.tips.join("\n")} rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <textarea name="variations" defaultValue={recipe.variations.join("\n")} rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <textarea name="equipment" defaultValue={recipe.equipment.join("\n")} rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="tags" defaultValue={recipe.tags.join(", ")} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <select name="status" defaultValue={recipe.status} className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input name="imageUrl" defaultValue={recipe.imageUrl} placeholder="Image URL" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="imageAlt" defaultValue={recipe.imageAlt} placeholder="Image alt text" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input
            name="imageFile"
            type="file"
            accept="image/*"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
          />
        </div>
        <label className="flex items-center gap-3 text-sm text-charcoal/70">
          <input type="checkbox" name="featured" defaultChecked={recipe.featured} />
          Featured recipe
        </label>
        {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
        {searchParams?.updated ? <p className="text-sm text-emerald-700">Recipe updated successfully.</p> : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save changes
        </button>
      </form>
    </AdminPage>
  );
}
