import Link from "next/link";

import {
  createMerchProductAction,
  updateMerchProductStateAction
} from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { merchThemeOptions } from "@/lib/merch";
import { getAdminMerchProducts } from "@/lib/services/content";

export default async function AdminMerchPage({
  searchParams
}: {
  searchParams?: { created?: string; updated?: string; error?: string };
}) {
  const products = await getAdminMerchProducts();

  return (
    <AdminPage
      title="Merch content"
      description="Owned storefront inventory, drop previews, and waitlist offers managed from one CMS view."
    >
      <ContentTable
        title="Merch"
        filters={["status", "availability", "featured", "category"]}
        rows={products.map((product) => ({
          name: product.name,
          category: product.category,
          availability: product.availability,
          price: product.priceLabel,
          featured: product.featured,
          status: product.status
        }))}
      />
      <div className="panel-light p-6">
        <h2 className="font-display text-4xl text-charcoal">Create a merch product</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/65">
          Use this for launch-preview merch, waitlist drops, or live products once checkout is ready.
        </p>
        <form action={createMerchProductAction} encType="multipart/form-data" className="mt-6 space-y-4">
          <input
            name="name"
            placeholder="Product name"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="category"
              placeholder="Category"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="badge"
              placeholder="Badge"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="priceLabel"
              placeholder="$32"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
          </div>
          <textarea
            name="description"
            placeholder="Merch description"
            rows={4}
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <div className="grid gap-4 md:grid-cols-4">
            <select
              name="availability"
              className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            >
              <option value="preview">preview</option>
              <option value="waitlist">waitlist</option>
              <option value="live">live</option>
            </select>
            <select
              name="themeKey"
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
              placeholder="Join merch waitlist"
              defaultValue="Join merch waitlist"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="sortOrder"
              type="number"
              min="0"
              defaultValue="0"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
          </div>
          <input
            name="href"
            placeholder="/shop#merch-waitlist or https://checkout.example.com"
            defaultValue="/shop#merch-waitlist"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <input
              name="imageUrl"
              placeholder="Image URL"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="imageAlt"
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
              className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
            <label className="flex items-center gap-3 text-sm text-charcoal/70">
              <input type="checkbox" name="featured" />
              Featured merch
            </label>
          </div>
          {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
          {searchParams?.created ? <p className="text-sm text-emerald-700">Merch product created successfully.</p> : null}
          {searchParams?.updated ? <p className="text-sm text-emerald-700">Merch product updated successfully.</p> : null}
          <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
            Save merch product
          </button>
        </form>
      </div>
      <div className="grid gap-4">
        {products.map((product) => (
          <article key={product.id} className="panel-light p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">
                  {product.category} · {product.availability}
                </p>
                <h2 className="mt-2 font-display text-4xl text-charcoal">{product.name}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-charcoal/65">
                  {product.description}
                </p>
              </div>
              <div className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                {product.status}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-charcoal/55">
              <span>Price: {product.priceLabel}</span>
              <span>Featured: {product.featured ? "Yes" : "No"}</span>
              <span>Sort order: {product.sortOrder}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/admin/content/merch/${product.id}`}
                className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
              >
                Edit merch
              </Link>
              <form action={updateMerchProductStateAction} className="flex flex-wrap gap-3">
                <input type="hidden" name="id" value={product.id} />
                {product.status !== "published" ? (
                  <button
                    name="intent"
                    value="publish"
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Publish
                  </button>
                ) : null}
                {product.status !== "archived" ? (
                  <button
                    name="intent"
                    value="archive"
                    className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white"
                  >
                    Archive
                  </button>
                ) : null}
                <button
                  name="intent"
                  value={product.featured ? "unfeature" : "feature"}
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  {product.featured ? "Remove featured" : "Mark featured"}
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
