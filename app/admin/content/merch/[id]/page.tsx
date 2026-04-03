import Link from "next/link";
import { notFound } from "next/navigation";

import { updateMerchProductAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { merchThemeOptions } from "@/lib/merch";
import { getAdminMerchProductById } from "@/lib/services/content";

export default async function AdminMerchEditPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { updated?: string; error?: string };
}) {
  const product = await getAdminMerchProductById(Number(params.id));

  if (!product) {
    notFound();
  }

  return (
    <AdminPage
      title="Edit Merch"
      description="Adjust storefront messaging, CTA, and launch status without touching code."
    >
      <Link
        href="/admin/content/merch"
        className="inline-flex rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
      >
        Back to merch content
      </Link>
      <form action={updateMerchProductAction} encType="multipart/form-data" className="panel-light mt-6 space-y-4 p-6">
        <input type="hidden" name="id" value={product.id} />
        <input type="hidden" name="redirectTo" value={`/admin/content/merch/${product.id}`} />
        <input
          name="name"
          defaultValue={product.name}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="category"
            defaultValue={product.category}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="badge"
            defaultValue={product.badge}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="priceLabel"
            defaultValue={product.priceLabel}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
        </div>
        <textarea
          name="description"
          defaultValue={product.description}
          rows={4}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-4">
          <select
            name="availability"
            defaultValue={product.availability}
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="preview">preview</option>
            <option value="waitlist">waitlist</option>
            <option value="live">live</option>
          </select>
          <select
            name="themeKey"
            defaultValue={product.themeKey}
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            {merchThemeOptions.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
          <input
            name="ctaLabel"
            defaultValue={product.ctaLabel}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={product.sortOrder}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
        </div>
        <input
          name="href"
          defaultValue={product.href}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <input
            name="imageUrl"
            defaultValue={product.imageUrl}
            placeholder="Image URL"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="imageAlt"
            defaultValue={product.imageAlt}
            placeholder="Image alt text"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="imageFile"
            type="file"
            accept="image/*"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select
            name="status"
            defaultValue={product.status}
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
          <label className="flex items-center gap-3 text-sm text-charcoal/70">
            <input type="checkbox" name="featured" defaultChecked={product.featured} />
            Featured merch
          </label>
        </div>
        {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
        {searchParams?.updated ? <p className="text-sm text-emerald-700">Merch product updated successfully.</p> : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Save changes
        </button>
      </form>
    </AdminPage>
  );
}
