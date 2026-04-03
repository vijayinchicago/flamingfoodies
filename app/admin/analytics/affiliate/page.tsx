import { AdminPage } from "@/components/admin/admin-page";
import { getAffiliateAnalytics } from "@/lib/services/analytics";

export default async function AdminAffiliatePage() {
  const partners = await getAffiliateAnalytics();

  return (
    <AdminPage
      title="Affiliate analytics"
      description="Clicks, estimated revenue, and partner-level CTR."
    >
      <div className="grid gap-4">
        {partners.map((partner) => (
          <article key={partner.partner} className="panel-light p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-3xl text-charcoal">{partner.partner}</h2>
              <div className="flex gap-6 text-sm text-charcoal/60">
                <span>{partner.clicks} clicks</span>
                <span>{partner.clickShare} click share</span>
                <span>{partner.estimatedRevenue} est. revenue</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-charcoal/65">Top product: {partner.topProduct}</p>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
