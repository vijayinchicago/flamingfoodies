import Image from "next/image";
import Link from "next/link";

import {
  createRecipeAction,
  deletePendingReviewRecipesAction,
  updateRecipeStateAction
} from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { RecipeEditorForm } from "@/components/admin/recipe-editor-form";
import { formatContentSourceLabel } from "@/lib/content-labels";
import { flags } from "@/lib/env";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { buildRecipeQaReport, getRecipeQaPublishError } from "@/lib/recipe-qa";
import { getAdminRecipes } from "@/lib/services/content";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ADMIN_TIME_ZONE = "America/New_York";

type RecipeAuditSummary = {
  hasHumanTouch: boolean;
  lastHumanAction?: string;
  lastHumanActionAt?: string;
};

async function getRecipeAuditSummaryMap(recipeIds: number[]) {
  const summaries = new Map<number, RecipeAuditSummary>();
  if (!recipeIds.length || !flags.hasSupabaseAdmin) {
    return summaries;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return summaries;
  }

  const { data } = await supabase
    .from("admin_audit_log")
    .select("target_id, action, performed_at")
    .eq("target_type", "recipe")
    .in("target_id", recipeIds.map(String))
    .in("action", ["create_recipe", "edit_recipe", "update_recipe"])
    .order("performed_at", { ascending: false });

  for (const row of data ?? []) {
    const recipeId = Number(row.target_id);
    if (!Number.isFinite(recipeId) || summaries.has(recipeId)) {
      continue;
    }

    summaries.set(recipeId, {
      hasHumanTouch: true,
      lastHumanAction: row.action ?? undefined,
      lastHumanActionAt: row.performed_at ?? undefined
    });
  }

  return summaries;
}

function formatRecipeOriginLabel(
  source?: string,
  status?: string,
  auditSummary?: RecipeAuditSummary
) {
  if (source === "ai_generated") {
    if (auditSummary?.hasHumanTouch) {
      return "Agent + human edit";
    }

    return status === "published" ? "Agent auto-published" : "Agent draft";
  }

  if (source === "community") {
    return "Community";
  }

  return "Manual";
}

function formatRecipeWorkflowLabel(
  source?: string,
  status?: string,
  auditSummary?: RecipeAuditSummary
) {
  if (source === "community") {
    return "Community submission";
  }

  if (source === "editorial") {
    return "Manual editor";
  }

  if (auditSummary?.hasHumanTouch) {
    return "Reviewed by human";
  }

  return status === "published" ? "Autonomous publish" : "Awaiting review";
}

function formatRecipeActionLabel(action?: string) {
  if (action === "create_recipe") {
    return "Created manually";
  }

  if (action === "edit_recipe") {
    return "Edited manually";
  }

  if (action === "update_recipe") {
    return "State updated";
  }

  return "—";
}

function formatAdminTimestamp(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ADMIN_TIME_ZONE
  }).format(new Date(value));
}

export default async function AdminRecipesPage({
  searchParams
}: {
  searchParams?: {
    created?: string;
    updated?: string;
    clearedReviewQueue?: string;
    error?: string;
  };
}) {
  const recipes = await getAdminRecipes();
  const recipeAuditMap = await getRecipeAuditSummaryMap(recipes.map((recipe) => recipe.id));
  const reviewQueue = recipes.filter(
    (recipe) => (recipe.status === "pending_review" || recipe.source === "ai_generated") && recipe.status !== "published"
  );
  const queueEntries = reviewQueue.map((recipe) => {
    const qaReport = buildRecipeQaReport(recipe);
    const publishError = getRecipeQaPublishError(qaReport);
    const hero = getRecipeHeroFields(recipe);

    return {
      recipe,
      hero,
      qaReport,
      publishError,
      publishReady: !publishError
    };
  });
  const displayRecipes = [
    ...reviewQueue,
    ...recipes.filter((recipe) => !reviewQueue.some((queued) => queued.id === recipe.id))
  ];

  return (
    <AdminPage
      title="Recipe content"
      description="Recipe inventory with heat level, cuisine, featured state, and performance metrics."
    >
      {searchParams?.error ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
            Publish blocked
          </p>
          <p className="mt-2 text-sm leading-7">
            {searchParams.error}
          </p>
        </section>
      ) : null}
      {searchParams?.updated ? (
        <section className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Updated
          </p>
          <p className="mt-2 text-sm leading-7">Recipe state updated successfully.</p>
        </section>
      ) : null}
      {searchParams?.clearedReviewQueue ? (
        <section className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Review queue cleared
          </p>
          <p className="mt-2 text-sm leading-7">
            Removed {searchParams.clearedReviewQueue === "mock" ? "the pending-review" : searchParams.clearedReviewQueue} recipe(s) from the review queue.
          </p>
        </section>
      ) : null}
      {queueEntries.length ? (
        <section id="review-queue" className="panel-light p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Review queue</p>
              <h2 className="mt-2 font-display text-4xl text-charcoal">
                Recipe drafts awaiting review
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                New drafts land here first. They stay off the public recipe archive until you
                publish them or their scheduled publish time arrives.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <form action={deletePendingReviewRecipesAction}>
                <input type="hidden" name="redirectTo" value="/admin/content/recipes" />
                <button
                  type="submit"
                  className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700"
                >
                  Delete pending-review recipes
                </button>
              </form>
              <Link
                href={`/admin/content/recipes/${queueEntries[0].recipe.id}`}
                className="rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
              >
                Review latest draft
              </Link>
              <Link
                href={`/admin/content/recipes/${queueEntries[0].recipe.id}`}
                className="rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal"
              >
                Open editor
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {queueEntries.slice(0, 6).map(({ recipe, hero, qaReport, publishError, publishReady }) => (
              <article
                key={`queue-${recipe.id}`}
                className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                  <div className="overflow-hidden rounded-[1.25rem] border border-charcoal/10 bg-charcoal/[0.03]">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={hero.imageUrl}
                        alt={hero.imageAlt}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="border-t border-charcoal/10 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/60">
                        {hero.usesGeneratedHeroCard ? "Illustrated cover" : "Current hero"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">
                          {formatContentSourceLabel(recipe.source)} · {recipe.cuisineType} · {recipe.heatLevel}
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
                      <span>QA score: {qaReport.score}/100</span>
                    </div>
                    {publishError ? (
                      <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          What is blocking publish
                        </p>
                        <p className="mt-2 text-sm leading-7 text-amber-950">{publishError}</p>
                        {qaReport.blockers.length > 1 ? (
                          <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-900">
                            {qaReport.blockers.slice(1).map((issue) => (
                              <li key={issue.code}>• {issue.message}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Ready to publish
                        </p>
                        <p className="mt-2 text-sm leading-7 text-emerald-900">
                          QA blockers are clear. You can publish this recipe now or open it for a
                          final editorial pass.
                        </p>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/admin/content/recipes/${recipe.id}`}
                        className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                      >
                        Open review
                      </Link>
                      {publishReady ? (
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
                      ) : (
                        <Link
                          href={`/admin/content/recipes/${recipe.id}`}
                          className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          Complete QA to publish
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <ContentTable
        title="Recipes"
        filters={["status", "source", "heat_level", "cuisine_type"]}
        rows={displayRecipes.map((recipe) => {
          const auditSummary = recipeAuditMap.get(recipe.id);

          return {
            title: recipe.title,
            origin: formatRecipeOriginLabel(recipe.source, recipe.status, auditSummary),
            workflow: formatRecipeWorkflowLabel(recipe.source, recipe.status, auditSummary),
            source: formatContentSourceLabel(recipe.source),
            created: formatAdminTimestamp(recipe.createdAt),
            published: formatAdminTimestamp(recipe.publishedAt),
            lastHumanTouch: formatAdminTimestamp(auditSummary?.lastHumanActionAt),
            touchType: formatRecipeActionLabel(auditSummary?.lastHumanAction),
            featured: recipe.featured ? "Yes" : "No",
            cuisine: recipe.cuisineType,
            heat: recipe.heatLevel,
            saves: recipe.saveCount,
            rating: recipe.ratingAvg !== undefined ? recipe.ratingAvg.toFixed(1) : "—",
            status: recipe.status
          };
        })}
      />
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
        {displayRecipes.map((recipe) => {
          const auditSummary = recipeAuditMap.get(recipe.id);

          return (
            <article key={recipe.id} className="panel-light p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    {formatContentSourceLabel(recipe.source)} · {recipe.cuisineType} · {recipe.heatLevel}
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
                <span>
                  Origin: {formatRecipeOriginLabel(recipe.source, recipe.status, auditSummary)}
                </span>
                <span>
                  Workflow: {formatRecipeWorkflowLabel(recipe.source, recipe.status, auditSummary)}
                </span>
                <span>Created: {formatAdminTimestamp(recipe.createdAt)}</span>
                <span>Published: {formatAdminTimestamp(recipe.publishedAt)}</span>
                <span>Last human touch: {formatAdminTimestamp(auditSummary?.lastHumanActionAt)}</span>
                <span>Touch type: {formatRecipeActionLabel(auditSummary?.lastHumanAction)}</span>
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
          );
        })}
      </div>
    </AdminPage>
  );
}
