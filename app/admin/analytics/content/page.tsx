import { AdminPage } from "@/components/admin/admin-page";
import { getContentAnalytics } from "@/lib/services/analytics";

export default async function AdminContentAnalyticsPage() {
  const analytics = await getContentAnalytics(30);
  const hasContentData = analytics.totals.trackedItems > 0;

  return (
    <AdminPage
      title="Content performance"
      description="Observed content performance from real traffic and engagement signals in the last 30 days."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <article className="panel-light p-6">
          <p className="eyebrow">Tracked items</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totals.trackedItems}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Observed views</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totals.views}</h2>
        </article>
        <article className="panel-light p-6">
          <p className="eyebrow">Observed interactions</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">
            {analytics.totals.saves + analytics.totals.ratings + analytics.totals.comments}
          </h2>
        </article>
      </div>

      {hasContentData ? (
        <>
          {analytics.groups.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {analytics.groups.map((group) => (
                <article key={group.source} className="panel-light p-6">
                  <p className="eyebrow">{group.source}</p>
                  <h2 className="mt-3 font-display text-4xl text-charcoal">{group.avgViews} avg views</h2>
                  <p className="mt-3 text-sm text-charcoal/65">
                    {group.avgSaves} avg saves, {group.avgRatings} avg ratings, and {group.avgComments} avg comments across {group.count} tracked item(s).
                  </p>
                </article>
              ))}
            </div>
          ) : null}

          {analytics.topContent.length ? (
            <div className="panel-light p-6">
              <p className="eyebrow">Top performers</p>
              <div className="mt-4 grid gap-4">
                {analytics.topContent.map((item) => (
                  <article key={item.path} className="rounded-[1.5rem] border border-charcoal/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display text-3xl text-charcoal">{item.label}</h2>
                        <p className="mt-2 text-sm text-charcoal/60">
                          {item.source} • {item.path}
                        </p>
                      </div>
                      <div className="text-right text-sm text-charcoal/60">
                        <p>{item.views} views</p>
                        <p>
                          {item.saves + item.ratings + item.comments} interactions
                        </p>
                      </div>
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
            No real content performance signals have been recorded in the last 30 days yet.
          </p>
        </article>
      )}
    </AdminPage>
  );
}
