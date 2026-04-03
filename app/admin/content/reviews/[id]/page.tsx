import Link from "next/link";
import { notFound } from "next/navigation";

import { updateReviewAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
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

  return (
    <AdminPage
      title="Edit Review"
      description="Tune the verdict, affiliate framing, and product imagery from one place."
    >
      <Link
        href="/admin/content/reviews"
        className="inline-flex rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
      >
        Back to review content
      </Link>
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
        {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
        {searchParams?.updated ? <p className="text-sm text-emerald-700">Review updated successfully.</p> : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save changes
        </button>
      </form>
    </AdminPage>
  );
}
