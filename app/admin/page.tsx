import { AdminPage } from "@/components/admin/admin-page";
import { KPICard } from "@/components/admin/kpi-card";
import { getAdminDashboard } from "@/lib/services/admin";

export default async function AdminDashboardPage() {
  const dashboard = await getAdminDashboard();

  return (
    <AdminPage
      title="Command center"
      description="Traffic, moderation pressure, queue health, and affiliate motion in one place."
    >
      <div className="grid gap-6 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <KPICard key={metric.label} metric={metric} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel-light p-6">
          <p className="eyebrow">Top recipe</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">{dashboard.topRecipe}</h2>
          <p className="mt-4 text-sm leading-7 text-charcoal/65">
            Use this slot to decide what gets pushed harder in the newsletter and on social.
          </p>
        </div>
        <div className="panel-light p-6">
          <p className="eyebrow">Queue health</p>
          <ul className="mt-4 space-y-3 text-sm text-charcoal/70">
            <li>Pending moderation: {dashboard.pendingModerationCount}</li>
            <li>Queued social posts: {dashboard.queuedSocialPosts}</li>
            <li>Subscriber growth: {dashboard.subscriberGrowth}</li>
          </ul>
        </div>
      </div>
    </AdminPage>
  );
}
