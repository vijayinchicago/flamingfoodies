import Link from "next/link";

import {
  createMerchProductAction,
  updateMerchProductStateAction
} from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { ContentTable } from "@/components/admin/content-table";
import { flags } from "@/lib/env";
import { merchThemeOptions } from "@/lib/merch";
import { getAdminMerchProducts } from "@/lib/services/content";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const ADMIN_TIME_ZONE = "America/New_York";

type MerchAuditSummary = {
  hasHumanTouch: boolean;
  lastHumanAction?: string;
  lastHumanActionAt?: string;
};

async function getMerchAuditSummaryMap(productIds: number[]) {
  const summaries = new Map<number, MerchAuditSummary>();
  if (!productIds.length || !flags.hasSupabaseAdmin) {
    return summaries;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return summaries;
  }

  const { data } = await supabase
    .from("admin_audit_log")
    .select("target_id, action, performed_at")
    .eq("target_type", "merch_product")
    .in("target_id", productIds.map(String))
    .in("action", ["create_merch_product", "edit_merch_product", "update_merch_product"])
    .order("performed_at", { ascending: false });

  for (const row of data ?? []) {
    const productId = Number(row.target_id);
    if (!Number.isFinite(productId) || summaries.has(productId)) {
      continue;
    }

    summaries.set(productId, {
      hasHumanTouch: true,
      lastHumanAction: row.action ?? undefined,
      lastHumanActionAt: row.performed_at ?? undefined
    });
  }

  return summaries;
}

function formatMerchActionLabel(action?: string) {
  if (action === "create_merch_product") return "Created manually";
  if (action === "edit_merch_product") return "Edited manually";
  if (action === "update_merch_product") return "State updated";
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

export default async function AdminMerchPage({
  searchParams
}: {
  searchParams?: { created?: string; updated?: string; error?: string };
}) {
  const products = await getAdminMerchProducts();
  const merchAuditMap = await getMerchAuditSummaryMap(products.map((p) => p.id));

  return (
    <AdminPage
      title="Shop picks"
      description="Affiliate-led shop picks, pantry builders, gear, and giftable finds managed from one CMS view."
    >
      <ContentTable
        title="Shop picks"
        filters={["status", "availability", "featured", "category"]}
        rows={products.map((product) => {
          const auditSummary = merchAuditMap.get(product.id);

          return {
            name: product.name,
            created: formatAdminTimestamp(product.createdAt),
            lastHumanTouch: formatAdminTimestamp(auditSummary?.lastHumanActionAt),
            touchType: formatMerchActionLabel(auditSummary?.lastHumanAction),
            category: product.category,
            availability: product.availability,
            price: product.priceLabel,
            featured: product.featured ? "Yes" : "No",
            sortOrder: product.sortOrder,
            status: product.status
          };
        })}
      />
      <div className="panel-light p-6">
        <h2 className="font-display text-4xl text-charcoal">Create a shop pick</h2>
        <p className="mt-3 text-sm leading-7 text-charcoal/65">
          Use this for Amazon-linked shelf picks, pantry builders, gear, subscriptions, or any
          other product that fits the FlamingFoodies world.
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
            placeholder="Shop pick description"
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
              placeholder="View on Amazon"
              defaultValue="View on Amazon"
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
            placeholder="/go/amazon-yellowbird-habanero or https://www.amazon.com/..."
            defaultValue=""
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
              Featured shop pick
            </label>
          </div>
          {searchParams?.error ? <p className="text-sm text-rose-600">{searchParams.error}</p> : null}
          {searchParams?.created ? <p className="text-sm text-emerald-700">Shop pick created successfully.</p> : null}
          {searchParams?.updated ? <p className="text-sm text-emerald-700">Shop pick updated successfully.</p> : null}
          <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
            Save shop pick
          </button>
        </form>
      </div>
      <div className="grid gap-4">
        {products.map((product) => {
          const auditSummary = merchAuditMap.get(product.id);

          return (
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
              <span>Created: {formatAdminTimestamp(product.createdAt)}</span>
              <span>Last human touch: {formatAdminTimestamp(auditSummary?.lastHumanActionAt)}</span>
              <span>Touch type: {formatMerchActionLabel(auditSummary?.lastHumanAction)}</span>
              <span>Price: {product.priceLabel}</span>
              <span>Featured: {product.featured ? "Yes" : "No"}</span>
              <span>Sort order: {product.sortOrder}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/admin/content/merch/${product.id}`}
                className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
              >
                Edit shop pick
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
          );
        })}
      </div>
    </AdminPage>
  );
}
