import { AdminPage } from "@/components/admin/admin-page";
import { AFFILIATE_LINKS } from "@/lib/affiliates";

export default function AdminAffiliateSettingsPage() {
  return (
    <AdminPage
      title="Affiliate registry"
      description="Keyed partner links ready for redirect tracking."
    >
      <div className="grid gap-4">
        {Object.entries(AFFILIATE_LINKS).map(([key, link]) => (
          <article key={key} className="panel-light p-5">
            <h2 className="font-display text-3xl text-charcoal">{key}</h2>
            <p className="mt-3 text-sm text-charcoal/70">{link.product}</p>
            <p className="mt-1 text-sm text-charcoal/55">{link.url}</p>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
