import { AdminPage } from "@/components/admin/admin-page";
import { getAuditLog } from "@/lib/services/admin";

export default async function AuditLogPage() {
  const entries = await getAuditLog();

  return (
    <AdminPage
      title="Audit log"
      description="Privileged mutations should always leave a trail."
    >
      <div className="grid gap-4">
        {entries.map((entry) => (
          <article key={entry.id} className="panel-light p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-display text-3xl text-charcoal">{entry.action}</h2>
              <span className="text-sm text-charcoal/55">
                {new Date(entry.performedAt).toLocaleString("en-US")}
              </span>
            </div>
            <p className="mt-3 text-sm text-charcoal/70">
              {entry.admin.username} {"->"} {entry.targetType}:{entry.targetId}
            </p>
            {entry.metadata ? (
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-charcoal px-4 py-4 text-xs text-cream">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            ) : null}
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
