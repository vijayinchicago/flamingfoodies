import { AdminPage } from "@/components/admin/admin-page";
import {
  getAffiliateRegistry,
  getAffiliateMonetizationLabel
} from "@/lib/affiliates";

export default function AdminAffiliateSettingsPage() {
  const registry = getAffiliateRegistry();
  const skimlinksCount = registry.filter(
    (entry) => entry.monetizationStrategy === "skimlinks_javascript"
  ).length;
  const amazonCount = registry.filter(
    (entry) => entry.monetizationStrategy === "amazon_tag_redirect"
  ).length;

  return (
    <AdminPage
      title="Affiliate registry"
      description="Keyed partner links, monetization mode, and disclosure readiness."
    >
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="panel-light p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Catalog size</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{registry.length}</h2>
          <p className="mt-2 text-sm text-charcoal/60">Tracked commerce links in the registry.</p>
        </article>
        <article className="panel-light p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Amazon-tagged</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{amazonCount}</h2>
          <p className="mt-2 text-sm text-charcoal/60">Links monetized directly with the Amazon tag.</p>
        </article>
        <article className="panel-light p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-charcoal/45">Skimlinks-ready</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{skimlinksCount}</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Non-Amazon merchant links that can monetize through the client-side Skimlinks script.
          </p>
        </article>
      </div>
      <div className="grid gap-4">
        {registry.map((link) => (
          <article key={link.key} className="panel-light p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-charcoal">{link.key}</h2>
                <p className="mt-3 text-sm text-charcoal/70">{link.product}</p>
              </div>
              <div className="rounded-full bg-charcoal/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/65">
                {getAffiliateMonetizationLabel(link.monetizationStrategy)}
              </div>
            </div>
            <p className="mt-3 text-sm text-charcoal/55">{link.url}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-charcoal/45">
              Partner: {link.partner}
            </p>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
