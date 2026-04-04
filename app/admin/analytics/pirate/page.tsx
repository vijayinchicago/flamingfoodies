import { AdminPage } from "@/components/admin/admin-page";
import { getPirateMetrics } from "@/lib/services/telemetry";

export default async function AdminPirateMetricsPage() {
  const metrics = await getPirateMetrics(30);

  return (
    <AdminPage
      title="Pirate metrics"
      description="AARRR across acquisition, activation, retention, referral, and revenue. This should be the operating scoreboard for the next growth sprint."
    >
      <div className="grid gap-6 md:grid-cols-5">
        <article className="panel-light p-6">
          <p className="eyebrow">Acquisition</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{metrics.acquisition.visitors}</h2>
          <p className="mt-2 text-sm text-charcoal/65">
            visitors across {metrics.acquisition.sessions} sessions
          </p>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Activation</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{metrics.activation.activationRate}</h2>
          <p className="mt-2 text-sm text-charcoal/65">
            {metrics.activation.activatedVisitors} activated visitors
          </p>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Retention</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{metrics.retention.retentionRate}</h2>
          <p className="mt-2 text-sm text-charcoal/65">
            {metrics.retention.returningVisitors} returning visitors
          </p>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Referral</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{metrics.referral.socialSessions}</h2>
          <p className="mt-2 text-sm text-charcoal/65">
            social sessions, {metrics.referral.shareEvents} share events
          </p>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Revenue</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{metrics.revenue.estimatedRevenue}</h2>
          <p className="mt-2 text-sm text-charcoal/65">
            {metrics.revenue.affiliateClicks} affiliate clicks
          </p>
        </article>
      </div>

      <div className="panel-light p-6">
        <p className="eyebrow">Coverage status</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {metrics.coverage.map((item) => (
            <article key={item.stage} className="rounded-[1.5rem] border border-charcoal/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-3xl text-charcoal">{item.stage}</h2>
                <span className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/60">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-charcoal/65">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel-light p-6">
          <p className="eyebrow">Acquisition breakdown</p>
          <div className="mt-4 grid gap-4">
            {metrics.acquisition.topSources.length ? (
              metrics.acquisition.topSources.map((source) => (
                <article
                  key={source.source}
                  className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                >
                  <span className="font-semibold text-charcoal">{source.source}</span>
                  <span className="text-sm text-charcoal/60">{source.visits} sessions</span>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                Telemetry is live, but page-view data is still warming up.
              </p>
            )}
          </div>
          <div className="mt-6 border-t border-charcoal/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">
              Top landing pages
            </p>
            <div className="mt-4 grid gap-3">
              {metrics.acquisition.topLandingPages.map((page) => (
                <article key={page.path} className="flex items-center justify-between text-sm text-charcoal/70">
                  <span>{page.path}</span>
                  <span>{page.views} landings</span>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-light p-6">
          <p className="eyebrow">Activation events</p>
          <div className="mt-4 grid gap-3">
            {metrics.activation.keyEvents.map((event) => (
              <article
                key={event.name}
                className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
              >
                <span className="text-sm font-semibold text-charcoal">{event.label}</span>
                <span className="text-sm text-charcoal/60">{event.count}</span>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="panel-light p-6">
          <p className="eyebrow">Referral inputs</p>
          <div className="mt-4 grid gap-3">
            {metrics.referral.topReferrers.length ? (
              metrics.referral.topReferrers.map((referrer) => (
                <article
                  key={referrer.host}
                  className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                >
                  <span className="text-sm font-semibold text-charcoal">{referrer.host}</span>
                  <span className="text-sm text-charcoal/60">{referrer.visits} visits</span>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                No external referrer traffic has been recorded in the current window yet.
              </p>
            )}
          </div>
        </div>

        <div className="panel-light p-6">
          <p className="eyebrow">Revenue proxies</p>
          <div className="mt-4 grid gap-3">
            {metrics.revenue.topPartners.length ? (
              metrics.revenue.topPartners.map((partner) => (
                <article
                  key={partner.partner}
                  className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{partner.partner}</p>
                    <p className="text-xs text-charcoal/55">{partner.clicks} clicks</p>
                  </div>
                  <span className="text-sm text-charcoal/60">{partner.estimatedRevenue}</span>
                </article>
              ))
            ) : (
              <p className="text-sm text-charcoal/60">
                No affiliate clicks have been recorded in the current window yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="panel-light p-6">
        <p className="eyebrow">Notes</p>
        <p className="mt-4 text-sm leading-7 text-charcoal/65">
          Internal telemetry is now the source of truth for AARRR. The share-event side of
          referral is still lighter than it should be because public share controls are not fully
          rolled out yet. Use this dashboard to decide what to build next, not just what to
          report on.
        </p>
        <p className="mt-3 text-sm leading-7 text-charcoal/55">
          Current window: last {metrics.windowDays} days. Total tracked events: {metrics.totals.eventCount}.
        </p>
      </div>
    </AdminPage>
  );
}
