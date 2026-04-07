import { AdminPage } from "@/components/admin/admin-page";
import { getAdAnalytics } from "@/lib/services/analytics";

export default async function AdminAdsAnalyticsPage() {
  const analytics = await getAdAnalytics(30);
  const hasAdData = analytics.totalImpressions > 0;

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
        <article className="panel-light p-6">
          <p className="eyebrow">Tracked slots</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.uniqueSlots}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Pages with impressions</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.uniquePages}</h2>
        </article>
      </div>

      {hasAdData ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            {analytics.topSlots.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Top slots</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topSlots.map((item) => (
                    <article
                      key={item.slotName}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm font-semibold text-charcoal">{item.slotName}</span>
                      <span className="text-sm text-charcoal/60">{item.count}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {analytics.topPlacements.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Placement mix</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topPlacements.map((item) => (
                    <article
                      key={item.placement}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm font-semibold text-charcoal">{item.placement}</span>
                      <span className="text-sm text-charcoal/60">{item.count}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {analytics.topPages.length ? (
            <div className="panel-light p-6">
              <p className="eyebrow">Top pages with ad impressions</p>
              <div className="mt-4 grid gap-3">
                {analytics.topPages.map((item) => (
                  <article
                    key={item.path}
                    className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                  >
                    <span className="text-sm font-semibold text-charcoal">{item.path}</span>
                    <span className="text-sm text-charcoal/60">{item.count}</span>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <article className="panel-light p-6">
          <p className="text-sm text-charcoal/60">
            No real ad impression events have been recorded in the last 30 days yet.
          </p>
        </article>
      )}
    </AdminPage>
  );
}
