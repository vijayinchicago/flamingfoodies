import {
  clearAffiliateLinkOverrideAction,
  saveAffiliateLinkOverrideAction
} from "@/lib/actions/admin-affiliates";
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

function renderCopyableUrlField(label: string, value: string, muted = false) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/45">
        {label}
      </span>
      <input
        readOnly
        value={value}
        spellCheck={false}
        className={`rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm outline-none ${
          muted ? "text-charcoal/55" : "text-charcoal"
        }`}
      />
    </label>
  );
}

function renderOverrideEditor(link: {
  key: string;
  partner: string;
  product: string;
  destinationUrl: string;
  hasOverride: boolean;
  override?: {
    url: string;
    partner?: string;
    product?: string;
    note?: string;
  } | null;
}) {
  return (
    <div className="mt-5 rounded-[1.5rem] border border-charcoal/10 bg-charcoal/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-ember">Runtime override</p>
      <p className="mt-2 text-sm text-charcoal/60">
        Paste an exact product page URL here to override the fallback destination without a code deploy.
      </p>
      <form action={saveAffiliateLinkOverrideAction} className="mt-4 grid gap-3">
        <input type="hidden" name="affiliateKey" value={link.key} />
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/45">
            Exact product URL
          </span>
          <input
            name="overrideUrl"
            type="url"
            required
            defaultValue={link.override?.url ?? ""}
            placeholder={link.destinationUrl}
            className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-ember"
          />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/45">
              Partner override
            </span>
            <input
              name="partnerOverride"
              defaultValue={link.override?.partner ?? ""}
              placeholder={link.partner}
              className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-ember"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/45">
              Product name override
            </span>
            <input
              name="productOverride"
              defaultValue={link.override?.product ?? ""}
              placeholder={link.product}
              className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-ember"
            />
          </label>
        </div>
        <label className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal/45">
            Note
          </span>
          <input
            name="note"
            defaultValue={link.override?.note ?? ""}
            placeholder="Optional note about the chosen exact link"
            className="rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-ember"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white">
            Save exact link
          </button>
          {link.hasOverride ? (
            <button
              formAction={clearAffiliateLinkOverrideAction}
              className="rounded-full border border-charcoal/15 px-4 py-2 text-sm font-semibold text-charcoal/75"
            >
              Clear override
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export default async function AdminAffiliateSettingsPage({
  searchParams
}: {
  searchParams?: { updated?: string; cleared?: string; error?: string };
}) {
  const report = await getAffiliateRegistryHealth(30);
  const searchRiskCount = report.entries.filter((entry) => !entry.exactAmazonProduct).length;

  return (
    <AdminPage
      title="Affiliate registry"
      description="Real link health, recent click pressure, and exact-product coverage across the commerce registry."
    >
      {searchParams?.error ? (
        <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </p>
      ) : null}
      {searchParams?.updated ? (
        <p className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Affiliate override updated.
        </p>
      ) : null}
      {searchParams?.cleared ? (
        <p className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Affiliate override cleared.
        </p>
      ) : null}
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
                <div className="mt-3">
                  {renderCopyableUrlField("Current destination URL", item.destinationUrl)}
                </div>
                {item.hasOverride ? (
                  <div className="mt-3">
                    {renderCopyableUrlField(
                      "Base destination URL",
                      item.baseDestinationUrl,
                      true
                    )}
                  </div>
                ) : null}
                {item.topSourcePage ? (
                  <p className="mt-1 text-sm text-charcoal/55">
                    Top source: {item.topSourcePage}
                  </p>
                ) : null}
                {renderOverrideEditor(item)}
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
                {link.hasOverride ? (
                  <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    Runtime override
                  </div>
                ) : null}
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
            <div className="mt-4">
              {renderCopyableUrlField("Current destination URL", link.destinationUrl)}
            </div>
            {link.hasOverride ? (
              <div className="mt-3">
                {renderCopyableUrlField("Base destination URL", link.baseDestinationUrl, true)}
              </div>
            ) : null}
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-charcoal/45">
              Partner: {link.partner} · Last clicked: {formatTimestamp(link.lastClickedAt)}
            </p>
            {(!link.exactAmazonProduct || link.hasOverride) ? renderOverrideEditor(link) : null}
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
