import { AdminPage } from "@/components/admin/admin-page";
import { getTrafficAnalytics } from "@/lib/services/analytics";

export default async function AdminTrafficPage() {
  const analytics = await getTrafficAnalytics();

  return (
    <AdminPage
      title="Traffic analytics"
      description="High-signal content traffic from the data already stored in the platform."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <article className="panel-light p-6">
          <p className="eyebrow">Total tracked views</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{analytics.totalViews}</h2>
        </article>
        {analytics.bySection.slice(0, 2).map((section) => (
          <article key={section.section} className="panel-light p-6">
            <p className="eyebrow">{section.section}</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">{section.views} views</h2>
          </article>
        ))}
      </div>
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
    </AdminPage>
  );
}
