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

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel-light p-6">
          <p className="eyebrow">Platforms</p>
          <div className="mt-4 grid gap-3">
            {analytics.platforms.length ? (
              analytics.platforms.map((item) => (
                <article
                  key={item.platform}
                  className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                >
                  <span className="text-sm font-semibold capitalize text-charcoal">
                    {formatPlatform(String(item.platform))}
                  </span>
                  <span className="text-sm text-charcoal/60">{item.count}</span>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                Share tracking is live, but no share events have been recorded in this window yet.
              </p>
            )}
          </div>
        </div>

        <div className="panel-light p-6">
          <p className="eyebrow">Share actions</p>
          <div className="mt-4 grid gap-3">
            {analytics.actions.length ? (
              analytics.actions.map((item) => (
                <article
                  key={item.action}
                  className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                >
                  <span className="text-sm font-semibold text-charcoal">{item.action}</span>
                  <span className="text-sm text-charcoal/60">{item.count}</span>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                No share-action breakdown is available yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel-light p-6">
          <p className="eyebrow">Top shared content</p>
          <div className="mt-4 grid gap-3">
            {analytics.topContent.length ? (
              analytics.topContent.map((item) => (
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
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                No content has been shared through the tracked UI yet.
              </p>
            )}
          </div>
        </div>

        <div className="panel-light p-6">
          <p className="eyebrow">Traffic returning from shares</p>
          <div className="mt-4 grid gap-3">
            {analytics.shareTrafficSources.length ? (
              analytics.shareTrafficSources.map((item) => (
                <article
                  key={item.source}
                  className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                >
                  <span className="text-sm font-semibold text-charcoal">{formatPlatform(String(item.source))}</span>
                  <span className="text-sm text-charcoal/60">{item.count} sessions</span>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                Shared links have not driven attributed sessions back yet.
              </p>
            )}
          </div>
          <div className="mt-6 border-t border-charcoal/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">
              Landing pages from shared links
            </p>
            <div className="mt-4 grid gap-3">
              {analytics.landingPages.length ? (
                analytics.landingPages.map((item) => (
                  <article
                    key={item.path}
                    className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                  >
                    <span className="text-sm text-charcoal">{item.path}</span>
                    <span className="text-sm text-charcoal/60">{item.count} sessions</span>
                  </article>
                ))
              ) : (
                <p className="text-sm text-charcoal/60">
                  No share-attributed landing pages in the current window yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-light p-6">
        <p className="eyebrow">Recent share activity</p>
        <div className="mt-4 grid gap-3">
          {analytics.recentShares.length ? (
            analytics.recentShares.map((item) => (
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
            ))
          ) : (
            <p className="text-sm text-charcoal/60">
              No recent share events yet.
            </p>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
