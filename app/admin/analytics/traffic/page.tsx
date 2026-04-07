import { AdminPage } from "@/components/admin/admin-page";
import { getTrafficAnalytics } from "@/lib/services/analytics";

export default async function AdminTrafficPage() {
  const analytics = await getTrafficAnalytics(30);
  const hasTrafficData = analytics.totalViews > 0;

  return (
    <AdminPage
      title="Traffic analytics"
      description="Real page-view telemetry from the last 30 days."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <article className="panel-light p-6">
          <p className="eyebrow">Total tracked views</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totalViews}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Tracked sessions</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totalSessions}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Unique pages seen</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.uniquePages}</h2>
        </article>
      </div>

      {hasTrafficData ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            {analytics.bySection.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Traffic by section</p>
                <div className="mt-4 grid gap-3">
                  {analytics.bySection.map((section) => (
                    <article
                      key={section.section}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm text-charcoal">{section.section}</span>
                      <span className="text-sm text-charcoal/60">{section.views} views</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {analytics.topSources.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Top acquisition sources</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topSources.map((source) => (
                    <article
                      key={source.source}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm text-charcoal">{source.source}</span>
                      <span className="text-sm text-charcoal/60">{source.sessions} sessions</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {analytics.topPages.length ? (
            <div className="panel-light p-6">
              <p className="eyebrow">Top pages</p>
              <div className="mt-4 grid gap-4">
                {analytics.topPages.map((page) => (
                  <article key={page.path} className="rounded-[1.5rem] border border-charcoal/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display text-3xl text-charcoal">{page.label}</h2>
                        <p className="mt-2 text-sm text-charcoal/60">
                          {page.section} • {page.path}
                        </p>
                      </div>
                      <span className="text-sm text-charcoal/60">{page.views} views</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <article className="panel-light p-6">
          <p className="text-sm text-charcoal/60">
            No real page-view telemetry has been recorded in the last 30 days yet.
          </p>
        </article>
      )}
    </AdminPage>
  );
}
