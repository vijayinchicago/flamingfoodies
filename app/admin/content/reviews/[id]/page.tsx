import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { updateReviewAction, updateReviewStateAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { getReviewHeroFields } from "@/lib/review-hero";
import { buildReviewQaReport, getReviewQaPublishError } from "@/lib/review-qa";
import { getAdminReviewById } from "@/lib/services/content";

export default async function AdminReviewEditPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string };
}) {
  const review = await getAdminReviewById(Number(params.id));

  if (!review) {
    notFound();
  }

  const qaReport = buildReviewQaReport(review);
  const publishError = getReviewQaPublishError(qaReport);
  const hero = getReviewHeroFields(review);

  return (
    <AdminPage
      title="Edit Review"
      description="Tune the verdict, affiliate framing, and product imagery from one place."
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link
          href="/admin/content/reviews"
          className="inline-flex rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
        >
          Back to review content
        </Link>
        {review.status !== "published" ? (
          publishError ? (
            <div className="rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
              Complete QA to publish
            </div>
          ) : (
            <form action={updateReviewStateAction}>
              <input type="hidden" name="id" value={review.id} />
              <input type="hidden" name="redirectTo" value={`/admin/content/reviews/${review.id}`} />
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
      <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Hero preview</p>
              <h2 className="mt-2 font-display text-3xl text-charcoal">Review the product image</h2>
            </div>
            <span className="rounded-full bg-charcoal px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              {hero.usesGeneratedHeroCard ? "Illustrated cover" : "Current hero"}
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-charcoal/10 bg-white">
            <div className="relative aspect-[4/3] bg-charcoal/5">
              <Image src={hero.imageUrl} alt={hero.imageAlt} fill className="object-cover" />
            </div>
            <div className="border-t border-charcoal/10 p-4">
              <p className="text-sm leading-7 text-charcoal/68">
                This is the exact hero asset readers will see. Confirm that it matches the product
                before you sign off the image review checkbox below.
              </p>
              <p className="mt-3 text-xs leading-6 text-charcoal/55">Alt text: {hero.imageAlt}</p>
            </div>
          </div>
        </aside>
        <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">QA gate</p>
              <h2 className="mt-2 font-display text-3xl text-charcoal">
                Review QA {qaReport.status} · {qaReport.score}/100
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/65">
                Publishing is blocked until the product image and tasting or fact review are both
                signed off.
              </p>
            </div>
            <div className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
              {qaReport.blockers.length} blockers · {qaReport.warnings.length} warnings
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Blockers</p>
              {qaReport.blockers.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-rose-700">
                  {qaReport.blockers.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">No blocker-level issues right now.</p>
              )}
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Warnings</p>
              {qaReport.warnings.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-700">
                  {qaReport.warnings.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">No warning-level issues right now.</p>
              )}
            </div>
          </div>
        </section>
      </section>
      <form action={updateReviewAction} encType="multipart/form-data" className="panel-light mt-6 space-y-4 p-6">
        <input type="hidden" name="id" value={review.id} />
        <input type="hidden" name="redirectTo" value={`/admin/content/reviews/${review.id}`} />
        <input name="title" defaultValue={review.title} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
        <textarea name="description" defaultValue={review.description} rows={3} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
        <div className="grid gap-4 md:grid-cols-3">
          <input name="productName" defaultValue={review.productName} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="brand" defaultValue={review.brand} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="category" defaultValue={review.category} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <input name="rating" type="number" min="1" max="5" step="0.1" defaultValue={review.rating} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="priceUsd" type="number" min="0" step="0.01" defaultValue={review.priceUsd} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <select name="heatLevel" defaultValue={review.heatLevel || ""} className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
            <option value="">Heat level</option>
            <option value="mild">mild</option>
            <option value="medium">medium</option>
            <option value="hot">hot</option>
            <option value="inferno">inferno</option>
            <option value="reaper">reaper</option>
          </select>
          <select name="cuisineOrigin" defaultValue={review.cuisineOrigin || ""} className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
            <option value="">Cuisine origin</option>
            <option value="mexican">mexican</option>
            <option value="korean">korean</option>
            <option value="thai">thai</option>
            <option value="caribbean">caribbean</option>
            <option value="west_african">west_african</option>
            <option value="other">other</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input name="affiliateUrl" defaultValue={review.affiliateUrl} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="flavorNotes" defaultValue={review.flavorNotes.join(", ")} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <input name="scovilleMin" type="number" min="0" defaultValue={review.scovilleMin} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="scovilleMax" type="number" min="0" defaultValue={review.scovilleMax} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <input name="imageUrl" defaultValue={review.imageUrl} placeholder="Image URL" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input name="imageAlt" defaultValue={review.imageAlt} placeholder="Image alt text" className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <input
            name="imageFile"
            type="file"
            accept="image/*"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
          />
        </div>
        <RichTextEditor name="content" label="Review body" content={review.content} />
        <div className="grid gap-4 md:grid-cols-3">
          <textarea name="pros" defaultValue={review.pros.join("\n")} rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <textarea name="cons" defaultValue={review.cons.join("\n")} rows={4} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
          <div className="space-y-4">
            <input name="tags" defaultValue={review.tags.join(", ")} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember" />
            <select name="status" defaultValue={review.status} className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
              <option value="draft">draft</option>
              <option value="pending_review">pending review</option>
              <option value="published">published</option>
            </select>
            <label className="flex items-center gap-3 text-sm text-charcoal/70">
              <input type="checkbox" name="featured" defaultChecked={review.featured} />
              Featured
            </label>
            <label className="flex items-center gap-3 text-sm text-charcoal/70">
              <input type="checkbox" name="recommended" defaultChecked={review.recommended} />
              Recommended
            </label>
          </div>
        </div>
        <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">QA gate</p>
              <h2 className="mt-3 font-display text-3xl text-charcoal">
                Review QA {qaReport.status} · {qaReport.score}/100
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                Publishing is blocked until the product image and tasting or fact review are both
                signed off.
              </p>
            </div>
            <div className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
              {qaReport.blockers.length} blockers · {qaReport.warnings.length} warnings
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 px-4 py-3 text-sm text-charcoal/70">
              <input type="checkbox" name="imageReviewed" defaultChecked={review.imageReviewed} />
              Product image manually confirmed
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 px-4 py-3 text-sm text-charcoal/70">
              <input type="checkbox" name="factQaReviewed" defaultChecked={review.factQaReviewed} />
              Tasting notes and factual claims reviewed
            </label>
          </div>
          <textarea
            name="qaNotes"
            defaultValue={review.qaNotes}
            placeholder="Internal QA notes, sourcing concerns, or tasting validation details"
            rows={4}
            className="mt-4 w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Blockers</p>
              {qaReport.blockers.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-rose-700">
                  {qaReport.blockers.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">No blocker-level issues right now.</p>
              )}
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Warnings</p>
              {qaReport.warnings.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-700">
                  {qaReport.warnings.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">No warning-level issues right now.</p>
              )}
            </div>
          </div>
        </section>
        {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
        {searchParams?.updated ? <p className="text-sm text-emerald-700">Review updated successfully.</p> : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save changes
        </button>
      </form>
    </AdminPage>
  );
}
