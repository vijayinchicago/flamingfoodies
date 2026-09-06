import { AdminPage } from "@/components/admin/admin-page";
import { getAffiliateAnalytics } from "@/lib/services/analytics";

export default async function AdminAffiliatePage() {
  const analytics = await getAffiliateAnalytics(36500);

  return (
    <AdminPage
      title="Affiliate analytics"
      description="Session-verified outbound clicks. Automated crawlers are excluded."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <article className="panel-light p-6">
          <p className="eyebrow">Verified clicks · lifetime</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totals.clicks}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Active partners</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totals.partners}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Actual earnings</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Network only</h2>
          <p className="mt-2 text-sm leading-6 text-charcoal/60">
            Order and commission reports are not connected to this dashboard.
          </p>
        </article>
      </div>

      <article className="panel-light p-6">
        <p className="eyebrow">What counts here</p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-charcoal/65">
          A verified click carries the browser session created when a person uses an affiliate
          link. Raw requests from crawlers opening public redirect URLs are ignored. Amazon
          Associates remains the source of truth for ordered items and commission income.
        </p>
      </article>

      {analytics.partners.length ? (
        <>
          <div className="grid gap-4">
            {analytics.partners.map((partner) => (
              <article key={partner.partner} className="panel-light p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-display text-3xl text-charcoal">{partner.partner}</h2>
                  <div className="flex gap-6 text-sm text-charcoal/60">
                    <span>{partner.clicks} clicks</span>
                    <span>{partner.clickShare} click share</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-charcoal/65">Top product: {partner.topProduct}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {analytics.topProducts.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Top clicked products</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topProducts.map((item) => (
                    <article
                      key={`${item.partner}-${item.product}`}
                      className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{item.product}</p>
                        <p className="text-xs uppercase tracking-[0.24em] text-charcoal/45">
                          {item.partner}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-charcoal/60">
                        {item.clicks} clicks
                      </span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {analytics.topSourcePages.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Top source pages</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topSourcePages.map((item) => (
                    <article
                      key={item.path}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm text-charcoal">{item.path}</span>
                      <span className="text-sm text-charcoal/60">{item.clicks} clicks</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {analytics.topPositions.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Top positions</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topPositions.map((item) => (
                    <article
                      key={item.position}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm text-charcoal">{item.position}</span>
                      <span className="text-sm text-charcoal/60">{item.clicks} clicks</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <article className="panel-light p-6">
          <p className="text-sm text-charcoal/60">
            No session-verified affiliate clicks have been recorded yet.
          </p>
        </article>
      )}
    </AdminPage>
  );
}
