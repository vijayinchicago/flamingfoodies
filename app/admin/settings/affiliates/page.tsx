import { AdminPage } from "@/components/admin/admin-page";
import { getAffiliateDestinationKind } from "@/lib/affiliates";
import { getAffiliateRegistryHealth } from "@/lib/services/analytics";

function formatTimestamp(value: string | null) {
  if (!value) {
    return "No recent clicks";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getDestinationLabel(kind: ReturnType<typeof getAffiliateDestinationKind>) {
  switch (kind) {
    case "amazon_product":
      return "Exact Amazon product";
    case "amazon_search":
      return "Amazon search fallback";
    case "merchant_page":
    default:
      return "Merchant page";
  }
}

function getHealthClasses(exactAmazonProduct: boolean) {
  return exactAmazonProduct
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-amber-50 text-amber-700 border border-amber-200";
}

export default async function AdminAffiliateSettingsPage() {
  const report = await getAffiliateRegistryHealth(30);
  const searchRiskCount = report.entries.filter((entry) => !entry.exactAmazonProduct).length;

  return (
    <AdminPage
      title="Affiliate registry"
      description="Real link health, recent click pressure, and exact-product coverage across the commerce registry."
    >
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="panel-light p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Catalog size</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{report.totals.catalogSize}</h2>
          <p className="mt-2 text-sm text-charcoal/60">Tracked commerce links in the registry.</p>
        </article>
        <article className="panel-light p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Exact product links</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            {report.totals.exactAmazonProducts}
          </h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Registry entries that currently land on an exact Amazon product page.
          </p>
        </article>
        <article className="panel-light p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">
            Search fallback risk
          </p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{searchRiskCount}</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Links that still fall back to Amazon search instead of an exact product page.
          </p>
        </article>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <article className="panel-light p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">
            Clicked search fallbacks
          </p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            {report.totals.clickedSearchFallbacks}
          </h2>
          <p className="mt-2 text-sm text-charcoal/60">
            These are the highest-priority leak points because readers are clicking them now.
          </p>
        </article>
        <article className="panel-light p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Window</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{report.windowDays} days</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Click pressure and top-risk ordering are based on recent affiliate activity.
          </p>
        </article>
      </div>

      {report.topRisks.length ? (
        <div className="mb-6 panel-light p-6">
          <p className="eyebrow">Fix First</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            Top clicked links that still need exact product pages
          </h2>
          <div className="mt-4 grid gap-3">
            {report.topRisks.map((item) => (
              <article
                key={item.key}
                className="rounded-[1.25rem] border border-charcoal/10 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-charcoal">{item.product}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-charcoal/45">
                      {item.partner}
                    </p>
                  </div>
                  <div className="text-right text-sm text-charcoal/65">
                    <p>{item.clicks} clicks</p>
                    <p>{formatTimestamp(item.lastClickedAt)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-charcoal/65">
                  Destination: {getDestinationLabel(item.destinationKind)}
                </p>
                {item.topSourcePage ? (
                  <p className="mt-1 text-sm text-charcoal/55">
                    Top source: {item.topSourcePage}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        {report.entries.map((link) => (
          <article key={link.key} className="panel-light p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-charcoal">{link.key}</h2>
                <p className="mt-3 text-sm text-charcoal/70">{link.product}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="rounded-full bg-charcoal/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/65">
                  {link.monetizationLabel}
                </div>
                <div
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getHealthClasses(
                    link.exactAmazonProduct
                  )}`}
                >
                  {link.exactAmazonProduct ? "Exact product page" : "Needs exact link"}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-charcoal/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-charcoal/45">
                  Destination
                </p>
                <p className="mt-2 text-sm text-charcoal">
                  {getDestinationLabel(link.destinationKind)}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-charcoal/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-charcoal/45">
                  Recent clicks
                </p>
                <p className="mt-2 text-sm text-charcoal">{link.clicks}</p>
              </div>
              <div className="rounded-[1.25rem] border border-charcoal/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-charcoal/45">
                  Top source page
                </p>
                <p className="mt-2 text-sm text-charcoal">{link.topSourcePage || "No recent source"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-charcoal/55 break-all">{link.destinationUrl}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-charcoal/45">
              Partner: {link.partner} · Last clicked: {formatTimestamp(link.lastClickedAt)}
            </p>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
