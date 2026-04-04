import Link from "next/link";
import { notFound } from "next/navigation";

import { updateRecipeAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { RecipeEditorForm } from "@/components/admin/recipe-editor-form";
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
      <RecipeEditorForm
        formAction={updateRecipeAction}
        recipe={recipe}
        redirectTo={`/admin/content/recipes/${recipe.id}`}
        submitLabel="Save changes"
        errorMessage={searchParams?.error}
        successMessage={searchParams?.updated ? "Recipe updated successfully." : undefined}
      />
    </AdminPage>
  );
}
