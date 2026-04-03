import { AdminPage } from "@/components/admin/admin-page";
import { getContentAnalytics } from "@/lib/services/analytics";

export default async function AdminContentAnalyticsPage() {
  const analytics = await getContentAnalytics();

  return (
    <AdminPage
      title="Content performance"
      description="Compare AI vs editorial performance across views, likes, and saves."
    >
      <div className="grid gap-6 md:grid-cols-3">
        {analytics.groups.map((group) => (
          <article key={group.source} className="panel-light p-6">
            <p className="eyebrow">{group.source}</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">{group.avgViews} avg views</h2>
            <p className="mt-3 text-sm text-charcoal/65">
              {group.avgLikes} avg likes, {group.avgSaves} avg saves across {group.count} item(s).
            </p>
          </article>
        ))}
      </div>
      <div className="panel-light p-6">
        <p className="eyebrow">Top performers</p>
        <div className="mt-4 grid gap-4">
          {analytics.topContent.map((item) => (
            <article key={item.path} className="rounded-[1.5rem] border border-charcoal/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl text-charcoal">{item.label}</h2>
                  <p className="mt-2 text-sm text-charcoal/60">{item.path}</p>
                </div>
                <span className="text-sm text-charcoal/60">{item.views} views</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </AdminPage>
  );
}
