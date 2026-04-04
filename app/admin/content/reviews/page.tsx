import Link from "next/link";

import { createReviewAction, updateReviewStateAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { buildReviewQaReport } from "@/lib/review-qa";
import { getAdminReviews } from "@/lib/services/content";

export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams?: { created?: string; updated?: string; error?: string };
}) {
  const reviews = await getAdminReviews();

  return (
    <AdminPage
      title="Review content"
      description="Product reviews, affiliate positioning, and recommendation status in one table."
    >
      <ContentTable
        title="Reviews"
        filters={["status", "category", "recommended"]}
        rows={reviews.map((review) => ({
          title: review.title,
          brand: review.brand,
          category: review.category,
          rating: review.rating,
          recommended: review.recommended,
          status: review.status
        }))}
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
              <option value="mild">mild</option>
              <option value="medium">medium</option>
              <option value="hot">hot</option>
              <option value="inferno">inferno</option>
              <option value="reaper">reaper</option>
            </select>
            <select name="cuisineOrigin" className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember">
              <option value="">Cuisine origin</option>
              <option value="mexican">mexican</option>
              <option value="korean">korean</option>
              <option value="thai">thai</option>
              <option value="caribbean">caribbean</option>
              <option value="other">other</option>
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
        {reviews.map((review) => {
          const qaReport = buildReviewQaReport(review);

          return (
            <article key={review.id} className="panel-light p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">
                  {review.brand} · {review.category}
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
              <span>Rating: {review.rating}</span>
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
