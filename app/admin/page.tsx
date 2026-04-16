import { importSampleCatalogAction } from "@/lib/actions/admin-content";
import { AdminPage } from "@/components/admin/admin-page";
import { KPICard } from "@/components/admin/kpi-card";
import { getAdminDashboard } from "@/lib/services/admin";
import { getShopGapLog, summariseGapLog } from "@/lib/services/content-shop-signals";
import { getDynamicCatalogEntries } from "@/lib/services/catalog-auto-grow";

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
  const [gapLog, dynamicCatalog] = await Promise.all([
    getShopGapLog(),
    getDynamicCatalogEntries()
  ]);
  const gapSummary = summariseGapLog(gapLog).slice(0, 15);

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
      {dynamicCatalog.length > 0 ? (
        <div className="panel-light p-6">
          <p className="eyebrow">Auto-cataloged products</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Items Claude added to the affiliate catalog from content signals
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/65">
            These entries were auto-created when gap terms crossed the frequency threshold. They are
            live in inline links immediately — no deploy needed.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 text-left text-xs uppercase tracking-widest text-charcoal/45">
                  <th className="pb-2 pr-6">Product</th>
                  <th className="pb-2 pr-6">Category</th>
                  <th className="pb-2 pr-6">Triggered by</th>
                  <th className="pb-2">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {dynamicCatalog.map((entry) => (
                  <tr key={entry.key}>
                    <td className="py-2 pr-6">
                      <p className="font-medium text-charcoal">{entry.product}</p>
                      <p className="text-charcoal/45">{entry.badge}</p>
                    </td>
                    <td className="py-2 pr-6 text-charcoal/60">{entry.category}</td>
                    <td className="py-2 pr-6 text-charcoal/50">&ldquo;{entry.createdFromTerm}&rdquo;</td>
                    <td className="py-2 text-charcoal/50">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {gapSummary.length > 0 ? (
        <div className="panel-light p-6">
          <p className="eyebrow">Shop gaps</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Product terms in content with no affiliate link yet
          </h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/65">
            These terms appeared in published recipes, reviews, or blog posts but don&apos;t match
            any entry in the affiliate catalog. Add SKUs to close the gaps.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 text-left text-xs uppercase tracking-widest text-charcoal/45">
                  <th className="pb-2 pr-6">Term</th>
                  <th className="pb-2 pr-6">Mentions</th>
                  <th className="pb-2 pr-6">Last seen</th>
                  <th className="pb-2">In content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {gapSummary.map((gap) => (
                  <tr key={gap.term}>
                    <td className="py-2 pr-6 font-medium text-charcoal">{gap.term}</td>
                    <td className="py-2 pr-6 text-charcoal/60">{gap.count}</td>
                    <td className="py-2 pr-6 text-charcoal/50">
                      {new Date(gap.lastSeen).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric"
                      })}
                    </td>
                    <td className="py-2 text-charcoal/50">{gap.examples.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
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
