import { AdminPage } from "@/components/admin/admin-page";
import { getShareAnalytics } from "@/lib/services/analytics";

function formatPlatform(platform: string) {
  if (platform === "x") return "X";
  if (platform === "copy") return "Copy link";
  if (platform === "native") return "Native share";
  if (platform === "pinterest") return "Pinterest";
  if (platform === "whatsapp") return "WhatsApp";
  return platform.replace(/_/g, " ");
}

export default async function AdminShareAnalyticsPage() {
  const analytics = await getShareAnalytics(30);
  const hasShareData =
    analytics.totals.shareEvents > 0 || analytics.totals.shareAttributedSessions > 0;

  return (
    <AdminPage
      title="Share analytics"
      description="Platform-level sharing behavior and the sessions that return from shared links."
    >
      <div className="grid gap-6 md:grid-cols-5">
        <article className="panel-light p-6">
          <p className="eyebrow">Share events</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totals.shareEvents}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Attributed sessions</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            {analytics.totals.shareAttributedSessions}
          </h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Attributed page views</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            {analytics.totals.shareAttributedPageViews}
          </h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Copy link</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totals.copyShares}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Pinterest saves</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            {analytics.totals.pinterestSaves}
          </h2>
        </article>
      </div>

      {hasShareData ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            {analytics.platforms.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Platforms</p>
                <div className="mt-4 grid gap-3">
                  {analytics.platforms.map((item) => (
                    <article
                      key={item.platform}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm font-semibold capitalize text-charcoal">
                        {formatPlatform(String(item.platform))}
                      </span>
                      <span className="text-sm text-charcoal/60">{item.count}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {analytics.actions.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Share actions</p>
                <div className="mt-4 grid gap-3">
                  {analytics.actions.map((item) => (
                    <article
                      key={item.action}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm font-semibold text-charcoal">{item.action}</span>
                      <span className="text-sm text-charcoal/60">{item.count}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {analytics.topContent.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Top shared content</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topContent.map((item) => (
                    <article
                      key={`${item.contentType}-${item.path}`}
                      className="rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="font-display text-3xl text-charcoal">{item.label}</h2>
                          <p className="mt-2 text-sm text-charcoal/60">
                            {item.contentType} • {item.path}
                          </p>
                        </div>
                        <span className="text-sm text-charcoal/60">{item.shares} shares</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {(analytics.shareTrafficSources.length || analytics.landingPages.length) ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Traffic returning from shares</p>
                {analytics.shareTrafficSources.length ? (
                  <div className="mt-4 grid gap-3">
                    {analytics.shareTrafficSources.map((item) => (
                      <article
                        key={item.source}
                        className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                      >
                        <span className="text-sm font-semibold text-charcoal">
                          {formatPlatform(String(item.source))}
                        </span>
                        <span className="text-sm text-charcoal/60">{item.count} sessions</span>
                      </article>
                    ))}
                  </div>
                ) : null}
                {analytics.landingPages.length ? (
                  <div className="mt-6 border-t border-charcoal/10 pt-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">
                      Landing pages from shared links
                    </p>
                    <div className="mt-4 grid gap-3">
                      {analytics.landingPages.map((item) => (
                        <article
                          key={item.path}
                          className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                        >
                          <span className="text-sm text-charcoal">{item.path}</span>
                          <span className="text-sm text-charcoal/60">{item.count} sessions</span>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {analytics.recentShares.length ? (
            <div className="panel-light p-6">
              <p className="eyebrow">Recent share activity</p>
              <div className="mt-4 grid gap-3">
                {analytics.recentShares.map((item) => (
                  <article
                    key={`${item.occurredAt}-${item.platform}-${item.path}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-charcoal/10 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-charcoal">
                        {formatPlatform(item.platform)} • {item.action}
                      </p>
                      <p className="mt-1 text-sm text-charcoal/60">{item.path}</p>
                    </div>
                    <span className="text-sm text-charcoal/50">{item.occurredAt}</span>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <article className="panel-light p-6">
          <p className="text-sm text-charcoal/60">
            No real share events or share-attributed sessions have been recorded in the last 30
            days yet.
          </p>
        </article>
      )}
    </AdminPage>
  );
}
