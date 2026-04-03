import type { DashboardMetric } from "@/lib/types";

export function KPICard({ metric }: { metric: DashboardMetric }) {
  const max = Math.max(...metric.sparkline);

  return (
    <article className="panel-light p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-charcoal/55">{metric.label}</p>
          <div className="mt-3 font-display text-5xl text-charcoal">{metric.value}</div>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {metric.delta}
        </span>
      </div>
      <div className="mt-6 flex h-12 items-end gap-2">
        {metric.sparkline.map((point, index) => (
          <div
            key={`${metric.label}-${index}`}
            className="flex-1 rounded-full bg-gradient-to-t from-flame to-ember"
            style={{ height: `${(point / max) * 100}%` }}
          />
        ))}
      </div>
    </article>
  );
}
