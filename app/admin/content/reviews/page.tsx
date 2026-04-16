import Image from "next/image";
import Link from "next/link";

import { createReviewAction, updateReviewStateAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { CUISINE_TYPES, HEAT_LEVELS, formatTaxonomyLabel } from "@/lib/content-taxonomy";
import { formatContentSourceLabel } from "@/lib/content-labels";
import { flags } from "@/lib/env";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildReviewQaReport, getReviewQaPublishError } from "@/lib/review-qa";
import { getAdminReviews } from "@/lib/services/content";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ADMIN_TIME_ZONE = "America/New_York";

type ReviewAuditSummary = {
  hasHumanTouch: boolean;
  lastHumanAction?: string;
  lastHumanActionAt?: string;
};

async function getReviewAuditSummaryMap(reviewIds: number[]) {
  const summaries = new Map<number, ReviewAuditSummary>();
  if (!reviewIds.length || !flags.hasSupabaseAdmin) {
    return summaries;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return summaries;
  }

  const { data } = await supabase
    .from("admin_audit_log")
    .select("target_id, action, performed_at")
    .eq("target_type", "review")
    .in("target_id", reviewIds.map(String))
    .in("action", ["create_review", "edit_review", "update_review"])
    .order("performed_at", { ascending: false });

  for (const row of data ?? []) {
    const reviewId = Number(row.target_id);
    if (!Number.isFinite(reviewId) || summaries.has(reviewId)) {
      continue;
    }

    summaries.set(reviewId, {
      hasHumanTouch: true,
      lastHumanAction: row.action ?? undefined,
      lastHumanActionAt: row.performed_at ?? undefined
    });
  }

  return summaries;
}

function formatReviewOriginLabel(
  source?: string,
  status?: string,
  auditSummary?: ReviewAuditSummary
) {
  if (source === "ai_generated") {
    if (auditSummary?.hasHumanTouch) {
      return "Agent + human edit";
    }
    return status === "published" ? "Agent auto-published" : "Agent draft";
  }
  return "Manual";
}

function formatReviewWorkflowLabel(
  source?: string,
  status?: string,
  auditSummary?: ReviewAuditSummary
) {
  if (source === "editorial") {
    return "Manual editor";
  }
  if (auditSummary?.hasHumanTouch) {
    return "Reviewed by human";
  }
  return status === "published" ? "Autonomous publish" : "Awaiting review";
}

function formatReviewActionLabel(action?: string) {
  if (action === "create_review") return "Created manually";
  if (action === "edit_review") return "Edited manually";
  if (action === "update_review") return "State updated";
  return "—";
}

function formatAdminTimestamp(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ADMIN_TIME_ZONE
  }).format(new Date(value));
}

export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams?: { created?: string; updated?: string; error?: string };
}) {
  const reviews = await getAdminReviews();
  const reviewAuditMap = await getReviewAuditSummaryMap(reviews.map((r) => r.id));
  const reviewQueue = reviews.filter(
    (review) => (review.status === "pending_review" || review.source === "ai_generated") && review.status !== "published"
  );
  const queueEntries = reviewQueue.map((review) => {
    const qaReport = buildReviewQaReport(review);
    const publishError = getReviewQaPublishError(qaReport);
    const hero = getReviewHeroFields(review);

    return {
      review,
      qaReport,
      publishError,
      hero,
      publishReady: !publishError
    };
  });
  const displayReviews = [
    ...reviewQueue,
    ...reviews.filter((review) => !reviewQueue.some((queued) => queued.id === review.id))
  ];

  return (
    <AdminPage
      title="Review content"
      description="Product reviews, affiliate positioning, and recommendation status in one table."
    >
      {searchParams?.error ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5 text-rose-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
            Publish blocked
          </p>
          <p className="mt-2 text-sm leading-7">{searchParams.error}</p>
        </section>
      ) : null}
      {searchParams?.updated ? (
        <section className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            Updated
          </p>
          <p className="mt-2 text-sm leading-7">Review updated successfully.</p>
        </section>
      ) : null}
      {queueEntries.length ? (
        <section id="review-queue" className="panel-light p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Review queue</p>
              <h2 className="mt-2 font-display text-4xl text-charcoal">
                Hot sauce and product drafts awaiting review
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                New review drafts land here first. Open one, confirm the product image and tasting
                notes, then publish once the blocker list is clear.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/admin/content/reviews/${queueEntries[0].review.id}`}
                className="rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
              >
                Review latest draft
              </Link>
              <Link
                href={`/admin/content/reviews/${queueEntries[0].review.id}`}
                className="rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal"
              >
                Open editor
              </Link>
            </div>
          </div>
          <div className="mt-6 grid gap-4">
            {queueEntries.slice(0, 6).map(({ review, qaReport, publishError, hero, publishReady }) => (
              <article
                key={`queue-${review.id}`}
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
                          {formatContentSourceLabel(review.source)} · {review.brand} · {review.category}
                        </p>
                        <h3 className="mt-2 font-display text-3xl text-charcoal">{review.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-charcoal/65">{review.description}</p>
                      </div>
                      <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                        {review.status}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/55">
                      <span>Slug: {review.slug}</span>
                      <span>Rating: {review.rating}</span>
                      <span>Image reviewed: {review.imageReviewed ? "Yes" : "No"}</span>
                      <span>Fact QA: {review.factQaReviewed ? "Yes" : "No"}</span>
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
                          The product image and fact checks are clear. You can publish this review
                          now or open it for a last editorial pass.
                        </p>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/admin/content/reviews/${review.id}`}
                        className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                      >
                        Open review
                      </Link>
                      {publishReady ? (
                        <form action={updateReviewStateAction} className="flex flex-wrap gap-3">
                          <input type="hidden" name="id" value={review.id} />
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
                          href={`/admin/content/reviews/${review.id}`}
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
        title="Reviews"
        filters={["status", "source", "category", "recommended"]}
        rows={displayReviews.map((review) => {
          const auditSummary = reviewAuditMap.get(review.id);

          return {
            title: review.title,
            origin: formatReviewOriginLabel(review.source, review.status, auditSummary),
            workflow: formatReviewWorkflowLabel(review.source, review.status, auditSummary),
            source: formatContentSourceLabel(review.source),
            created: formatAdminTimestamp(review.createdAt),
            published: formatAdminTimestamp(review.publishedAt),
            lastHumanTouch: formatAdminTimestamp(auditSummary?.lastHumanActionAt),
            touchType: formatReviewActionLabel(auditSummary?.lastHumanAction),
            featured: review.featured ? "Yes" : "No",
            brand: review.brand,
            heat: review.heatLevel ?? "—",
            category: review.category,
            rating: review.rating,
            recommended: review.recommended,
            status: review.status
          };
        })}
      />
      <div className="panel-light p-6">
        <h2 className="font-display text-4xl text-charcoal">Create a review</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/65">
          Use this for sauces, gear, books, or subscription boxes. Pros and cons are one item per
          line, and published reviews must clear image plus fact QA before they can go live.
        </p>
        <form action={createReviewAction} encType="multipart/form-data" className="mt-6 space-y-4">
          <input name="title" placeholder="Title" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <textarea name="description" placeholder="Description" rows={3} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <div className="grid gap-4 md:grid-cols-3">
            <input name="productName" placeholder="Product name" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="brand" placeholder="Brand" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="category" placeholder="Category" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <input name="rating" type="number" min="1" max="5" step="0.1" defaultValue="4.5" placeholder="Rating" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="priceUsd" type="number" min="0" step="0.01" placeholder="Price USD" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <select name="heatLevel" className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
              <option value="">Heat level</option>
              {HEAT_LEVELS.map((heatLevel) => (
                <option key={heatLevel} value={heatLevel}>
                  {heatLevel}
                </option>
              ))}
            </select>
            <select name="cuisineOrigin" className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
              <option value="">Cuisine origin</option>
              {CUISINE_TYPES.map((cuisineType) => (
                <option key={cuisineType} value={cuisineType}>
                  {formatTaxonomyLabel(cuisineType)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="affiliateUrl" placeholder="Affiliate URL" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="flavorNotes" placeholder="smoky, fruity, bright" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="scovilleMin" type="number" min="0" placeholder="Scoville min" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <input name="scovilleMax" type="number" min="0" placeholder="Scoville max" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
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
          <RichTextEditor
            name="content"
            label="Review body"
            content="<h2>First impression</h2><p>Lead with flavor, then heat, then the honest tradeoff.</p>"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <textarea name="pros" placeholder="One pro per line" rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <textarea name="cons" placeholder="One con per line" rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <div className="space-y-4">
              <input name="tags" placeholder="tags, comma separated" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
              <select name="status" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
                <option value="draft">draft</option>
                <option value="pending_review">pending review</option>
                <option value="published">published</option>
              </select>
              <label className="flex items-center gap-3 text-sm text-charcoal/70">
                <input type="checkbox" name="featured" />
                Featured
              </label>
              <label className="flex items-center gap-3 text-sm text-charcoal/70">
                <input type="checkbox" name="recommended" />
                Recommended
              </label>
            </div>
          </div>
          <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">QA gate</p>
                <h3 className="mt-3 font-display text-3xl text-charcoal">Publish review guardrails</h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                  Reviews need both a product-image signoff and a fact or tasting signoff before
                  the publish action will clear.
                </p>
              </div>
              <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                New reviews start unreviewed
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 px-4 py-3 text-sm text-charcoal/70">
                <input type="checkbox" name="imageReviewed" />
                Hero or product image manually confirmed
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 px-4 py-3 text-sm text-charcoal/70">
                <input type="checkbox" name="factQaReviewed" />
                Tasting notes, claims, and facts reviewed
              </label>
            </div>
            <textarea
              name="qaNotes"
              placeholder="Internal QA notes, sourcing concerns, or tasting validation details"
              rows={4}
              className="mt-4 w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
          </section>
          {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
          {searchParams?.created ? <p className="text-sm text-emerald-700">Review created successfully.</p> : null}
          {searchParams?.updated ? <p className="text-sm text-emerald-700">Review updated successfully.</p> : null}
          <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
            Save review
          </button>
        </form>
      </div>
      <div className="grid gap-4">
        {displayReviews.map((review) => {
          const qaReport = buildReviewQaReport(review);
          const auditSummary = reviewAuditMap.get(review.id);

          return (
            <article key={review.id} className="panel-light p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">
                    {formatContentSourceLabel(review.source)} · {review.brand} · {review.category}
                  </p>
                  <h2 className="mt-2 font-display text-4xl text-charcoal">{review.title}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                    {review.description}
                  </p>
                </div>
                <div className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                  {review.status}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/55">
                <span>Origin: {formatReviewOriginLabel(review.source, review.status, auditSummary)}</span>
                <span>Workflow: {formatReviewWorkflowLabel(review.source, review.status, auditSummary)}</span>
                <span>Created: {formatAdminTimestamp(review.createdAt)}</span>
                <span>Published: {formatAdminTimestamp(review.publishedAt)}</span>
                <span>Last human touch: {formatAdminTimestamp(auditSummary?.lastHumanActionAt)}</span>
                <span>Touch type: {formatReviewActionLabel(auditSummary?.lastHumanAction)}</span>
                <span>Rating: {review.rating}</span>
                <span>Heat: {review.heatLevel ?? "—"}</span>
                <span>Recommended: {review.recommended ? "Yes" : "No"}</span>
                <span>Featured: {review.featured ? "Yes" : "No"}</span>
                <span>Image reviewed: {review.imageReviewed ? "Yes" : "No"}</span>
                <span>Fact QA: {review.factQaReviewed ? "Yes" : "No"}</span>
                <span>QA: {qaReport.status}</span>
              </div>
              {qaReport.blockers.length ? (
                <div className="mt-4 rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-700">
                  {qaReport.blockers[0]?.message}
                </div>
              ) : qaReport.warnings.length ? (
                <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-700">
                  {qaReport.warnings[0]?.message}
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/admin/content/reviews/${review.id}`}
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Edit review
                </Link>
                <form action={updateReviewStateAction} className="flex flex-wrap gap-3">
                  <input type="hidden" name="id" value={review.id} />
                  {review.status !== "published" ? (
                    <button name="intent" value="publish" className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                      Publish
                    </button>
                  ) : null}
                  {review.status !== "archived" ? (
                    <button name="intent" value="archive" className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white">
                      Archive
                    </button>
                  ) : null}
                  <button name="intent" value={review.featured ? "unfeature" : "feature"} className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal">
                    {review.featured ? "Remove featured" : "Mark featured"}
                  </button>
                  <button name="intent" value={review.recommended ? "unrecommend" : "recommend"} className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal">
                    {review.recommended ? "Remove recommended" : "Recommend"}
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
