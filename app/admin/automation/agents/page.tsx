import Link from "next/link";

import { AdminPage } from "@/components/admin/admin-page";
import { getAgentRunsReport } from "@/lib/services/agent-runs";

function formatObservedAt(value?: string) {
  if (!value) {
    return "No observed run yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminAutomationAgentsPage() {
  const agents = await getAgentRunsReport();

  return (
    <AdminPage
      title="Agent runs"
      description="See which autonomous agents are live, where they are sending output, and what they have actually produced recently."
    >
      <div className="grid gap-6">
        {agents.map((agent) => (
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
