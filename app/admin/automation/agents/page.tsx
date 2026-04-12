import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { getAgentRunsReport } from "@/lib/services/agent-runs";

function summaryToneClasses(tone: "neutral" | "good" | "warning") {
  if (tone === "good") {
    return "border-emerald-200 bg-emerald-50/80";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50/80";
  }

  return "border-charcoal/10 bg-white";
}

function formatObservedAt(value?: string) {
  if (!value) {
    return "No observed run yet";
  }

  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value))} ET`;
}

export default async function AdminAutomationAgentsPage() {
  const report = await getAgentRunsReport();

  return (
    <AdminPage
      title="Agent runs"
      description="See what ran today, what published on its own, what still needs attention, and when each autonomous lane is scheduled to move next."
    >
      <div className="grid gap-6">
        <section className="panel-light p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Today</p>
              <h2 className="mt-3 font-display text-4xl text-charcoal">What happened today</h2>
              <p className="mt-4 text-sm leading-7 text-charcoal/70">
                This is the fast read: how many automation runs finished, what published by itself,
                what still needed manual help, and what is waiting for review right now.
              </p>
            </div>
            <p className="text-sm text-charcoal/55">All times below are shown in Eastern Time.</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {report.todaySummary.map((card) => (
              <article
                key={card.label}
                className={`rounded-[1.5rem] border px-5 py-5 ${summaryToneClasses(card.tone)}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  {card.label}
                </p>
                <p className="mt-3 font-display text-4xl text-charcoal">{card.value}</p>
                <p className="mt-3 text-sm leading-6 text-charcoal/70">{card.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel-light p-6">
          <div className="max-w-3xl">
            <p className="eyebrow">Next Up</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">Upcoming runs</h2>
            <p className="mt-4 text-sm leading-7 text-charcoal/70">
              These are the next scheduled windows so you do not have to translate cron timing in
              your head.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {report.nextRuns.map((run) => (
              <article
                key={`${run.label}-${run.at}`}
                className="rounded-[1.5rem] border border-charcoal/10 px-5 py-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  {run.label}
                </p>
                <p className="mt-3 font-semibold text-charcoal">{run.at}</p>
                <p className="mt-3 text-sm leading-6 text-charcoal/70">{run.note}</p>
              </article>
            ))}
          </div>
        </section>

        {report.agents.map((agent) => (
          <article key={agent.id} className="panel-light p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="eyebrow">{agent.cadence}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      agent.status === "live"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {agent.status === "live" ? "Live" : "Needs config"}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-4xl text-charcoal">{agent.name}</h2>
                <p className="mt-4 text-sm leading-7 text-charcoal/70">{agent.purpose}</p>
                <p className="mt-4 text-sm leading-7 text-charcoal/65">{agent.summary}</p>
              </div>
              <div className="rounded-[1.5rem] bg-charcoal/5 px-5 py-4 text-sm text-charcoal/65 lg:min-w-[230px]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  Last observed
                </p>
                <p className="mt-2 font-semibold text-charcoal">{formatObservedAt(agent.lastObservedAt)}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                  Next scheduled
                </p>
                <p className="mt-2 font-semibold text-charcoal">
                  {agent.nextScheduledAt && agent.nextScheduledLabel
                    ? `${agent.nextScheduledLabel} · ${formatObservedAt(agent.nextScheduledAt)}`
                    : "No upcoming schedule detected"}
                </p>
                <p className="mt-4 text-sm leading-7">{agent.dependencyNote}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {agent.stats.map((stat) => (
                <div key={`${agent.id}-${stat.label}`} className="rounded-[1.25rem] border border-charcoal/10 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                    {stat.label}
                  </p>
                  <p className="mt-3 font-display text-3xl text-charcoal">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {agent.links.map((link) => (
                <Link
                  key={`${agent.id}-${link.href}`}
                  href={link.href}
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
