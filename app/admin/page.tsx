import { importSampleCatalogAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { KPICard } from "@/components/admin/kpi-card";
import { getAdminDashboard } from "@/lib/services/admin";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams?: {
    imported?: string;
    blogs?: string;
    recipes?: string;
    reviews?: string;
    merch?: string;
    error?: string;
  };
}) {
  const dashboard = await getAdminDashboard();

  return (
    <AdminPage
      title="Command center"
      description="Traffic, moderation pressure, queue health, and affiliate motion in one place."
    >
      <div className="grid gap-6 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <KPICard key={metric.label} metric={metric} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel-light p-6">
          <p className="eyebrow">Top recipe</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{dashboard.topRecipe}</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/65">
            This now reflects the strongest observed recipe traffic instead of a stale stored counter.
          </p>
        </div>
        <div className="panel-light p-6">
          <p className="eyebrow">Queue health</p>
          <ul className="mt-4 space-y-3 text-sm text-charcoal/70">
            <li>Pending moderation: {dashboard.pendingModerationCount}</li>
            <li>Queued social posts: {dashboard.queuedSocialPosts}</li>
            <li>Subscriber and source signal: {dashboard.subscriberGrowth}</li>
          </ul>
        </div>
      </div>
      <div className="panel-light p-6">
        <p className="eyebrow">Catalog bootstrap</p>
        <h2 className="mt-3 font-display text-4xl text-charcoal">
          Copy the current fallback catalog into Supabase.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/65">
          This seeds the real CMS tables for blog posts, recipes, reviews, and merch so the public
          site can stop depending on static fallback arrays once your Supabase project is wired.
          Merch import now bootstraps the expanded seasonal commerce catalog plus the branded
          waitlist items.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {[
            { label: "Import blogs", value: "blogs" },
            { label: "Import recipes", value: "recipes" },
            { label: "Import reviews", value: "reviews" },
            { label: "Import merch", value: "merch" },
            { label: "Import everything", value: "all" }
          ].map((item) => (
            <form key={item.value} action={importSampleCatalogAction}>
              <input type="hidden" name="catalog" value={item.value} />
              <input type="hidden" name="redirectTo" value="/admin" />
              <button className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal">
                {item.label}
              </button>
            </form>
          ))}
        </div>
        {searchParams?.error ? (
          <p className="mt-4 text-sm text-rose-600">{searchParams.error}</p>
        ) : null}
        {searchParams?.imported ? (
          <p className="mt-4 text-sm text-emerald-700">
            Imported {searchParams.imported}. Blogs: {searchParams.blogs || 0}, recipes:{" "}
            {searchParams.recipes || 0}, reviews: {searchParams.reviews || 0}, merch:{" "}
            {searchParams.merch || 0}.
          </p>
        ) : null}
      </div>
    </AdminPage>
  );
}
