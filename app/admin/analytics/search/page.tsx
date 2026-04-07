import { AdminPage } from "@/components/admin/admin-page";
import { getSearchAnalytics } from "@/lib/services/analytics";

export default async function AdminSearchAnalyticsPage() {
  const analytics = await getSearchAnalytics(30);
  const hasSearchData = analytics.totalSearches > 0;

  return (
    <AdminPage
      title="Search analytics"
      description="What people search for, where searches start, and which queries return nothing."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <article className="panel-light p-6">
          <p className="eyebrow">Total searches</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totalSearches}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">No-result searches</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.noResultSearches}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">No-result rate</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.noResultRate}</h2>
        </article>
      </div>

      {hasSearchData ? (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            {analytics.topQueries.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Top queries</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topQueries.map((item) => (
                    <article
                      key={item.query}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm font-semibold text-charcoal">{item.query}</span>
                      <span className="text-sm text-charcoal/60">{item.count}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {analytics.topSources.length ? (
              <div className="panel-light p-6">
                <p className="eyebrow">Search sources</p>
                <div className="mt-4 grid gap-3">
                  {analytics.topSources.map((item) => (
                    <article
                      key={item.source}
                      className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                    >
                      <span className="text-sm font-semibold text-charcoal">{item.source}</span>
                      <span className="text-sm text-charcoal/60">{item.count}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {analytics.noResultQueries.length ? (
            <div className="panel-light p-6">
              <p className="eyebrow">Queries with no results</p>
              <div className="mt-4 grid gap-3">
                {analytics.noResultQueries.map((item) => (
                  <article
                    key={item.query}
                    className="flex items-center justify-between rounded-[1.25rem] border border-charcoal/10 p-4"
                  >
                    <span className="text-sm font-semibold text-charcoal">{item.query}</span>
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
            No real search events have been captured in the last 30 days yet.
          </p>
        </article>
      )}
    </AdminPage>
  );
}
