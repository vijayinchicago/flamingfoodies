import { AdminPage } from "@/components/admin/admin-page";
import { getAdAnalytics } from "@/lib/services/analytics";

export default async function AdminAdsAnalyticsPage() {
  const analytics = await getAdAnalytics(30);

  return (
    <AdminPage
      title="Ads analytics"
      description="Initial AdSense slot impressions so we can validate the rollout before increasing density."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <article className="panel-light p-6">
          <p className="eyebrow">Total slot impressions</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            {analytics.totalImpressions}
          </h2>
        </article>
        <article className="panel-light p-6 md:col-span-2">
          <p className="eyebrow">Rollout guardrail</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/65">
            Ads should stay limited to blog and review surfaces until we confirm the placement mix
            performs without hurting the recipe experience.
          </p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel-light p-6">
          <p className="eyebrow">Top slots</p>
          <div className="mt-4 grid gap-3">
            {analytics.topSlots.length ? (
              analytics.topSlots.map((item) => (
                <article
                  key={item.slotName}
                  className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                >
                  <span className="text-sm font-semibold text-charcoal">{item.slotName}</span>
                  <span className="text-sm text-charcoal/60">{item.count}</span>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">No ad impressions tracked yet.</p>
            )}
          </div>
        </div>

        <div className="panel-light p-6">
          <p className="eyebrow">Placement mix</p>
          <div className="mt-4 grid gap-3">
            {analytics.topPlacements.length ? (
              analytics.topPlacements.map((item) => (
                <article
                  key={item.placement}
                  className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                >
                  <span className="text-sm font-semibold text-charcoal">{item.placement}</span>
                  <span className="text-sm text-charcoal/60">{item.count}</span>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">No placement mix available yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="panel-light p-6">
        <p className="eyebrow">Top pages with ad impressions</p>
        <div className="mt-4 grid gap-3">
          {analytics.topPages.length ? (
            analytics.topPages.map((item) => (
              <article
                key={item.path}
                className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
              >
                <span className="text-sm font-semibold text-charcoal">{item.path}</span>
                <span className="text-sm text-charcoal/60">{item.count}</span>
              </article>
            ))
          ) : (
            <p className="text-sm text-charcoal/60">
              No page-level ad impression data yet.
            </p>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
