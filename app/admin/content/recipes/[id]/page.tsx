import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRecipeAction, updateRecipeStateAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { RecipeEditorForm } from "@/components/admin/recipe-editor-form";
import { buildRecipeQaReport, getRecipeQaPublishError } from "@/lib/recipe-qa";
import { getAdminRecipeById } from "@/lib/services/content";

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

  const qaReport = buildRecipeQaReport(recipe);
  const publishError = getRecipeQaPublishError(qaReport);

  return (
    <AdminPage
      title="Edit Recipe"
      description="Adjust metadata, structure, and imagery without recreating the recipe."
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link
          href="/admin/content/recipes"
          className="inline-flex rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
        >
          Back to recipe content
        </Link>
        {recipe.status !== "published" ? (
          publishError ? (
            <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
              Complete QA to publish
            </div>
          ) : (
            <form action={updateRecipeStateAction}>
              <input type="hidden" name="id" value={recipe.id} />
              <input type="hidden" name="redirectTo" value={`/admin/content/recipes/${recipe.id}`} />
              <button
                name="intent"
                value="publish"
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Publish now
              </button>
            </form>
          )
        ) : (
          <div className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
            Published
          </div>
        )}
      </div>
      <RecipeEditorForm
        formAction={updateRecipeAction}
        recipe={recipe}
        qaReport={qaReport}
        redirectTo={`/admin/content/recipes/${recipe.id}`}
        submitLabel="Save changes"
        errorMessage={searchParams?.error}
        successMessage={searchParams?.updated ? "Recipe updated successfully." : undefined}
      />
    </AdminPage>
  );
}
