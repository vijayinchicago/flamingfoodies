import { updateGenerationScheduleAction } from "@/lib/actions/admin-automation";
import { AdminPage } from "@/components/admin/admin-page";
import { getGenerationSchedule } from "@/lib/services/admin";

export default async function AdminSchedulePage({
  searchParams
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  const schedule = await getGenerationSchedule();

  return (
    <AdminPage
      title="Generation schedule"
      description="Edit cron cadence, quantities, and defaults before pushing the automation harder."
    >
      {searchParams?.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </p>
      ) : null}
      {searchParams?.updated ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Schedule updated.
        </p>
      ) : null}
      <div className="grid gap-4">
        {schedule.map((row) => (
          <form key={row.id} action={updateGenerationScheduleAction} className="panel-light p-6">
            <input type="hidden" name="id" value={row.id} />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Automation</p>
                <h2 className="mt-2 font-display text-4xl text-charcoal">{row.jobType}</h2>
              </div>
              <label className="flex items-center gap-3 text-sm text-charcoal/70">
                <input type="checkbox" name="isActive" defaultChecked={row.isActive} />
                Active
              </label>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-charcoal/70">
                <span className="block">Quantity</span>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue={row.quantity}
                  className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                />
              </label>
              <label className="space-y-2 text-sm text-charcoal/70">
                <span className="block">Cron expression</span>
                <input
                  name="cronExpr"
                  defaultValue={row.cronExpr}
                  className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 font-mono text-sm outline-none focus:border-ember"
                />
              </label>
            </div>
            <label className="mt-4 block space-y-2 text-sm text-charcoal/70">
              <span className="block">Parameters JSON</span>
              <textarea
                name="parameters"
                rows={5}
                defaultValue={JSON.stringify(row.parameters || {}, null, 2)}
                className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 font-mono text-sm outline-none focus:border-ember"
              />
            </label>
            <button className="mt-5 rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white">
              Save schedule
            </button>
          </form>
        ))}
      </div>
    </AdminPage>
  );
}
