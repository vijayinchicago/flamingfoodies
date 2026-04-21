import Link from "next/link";

import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AdminPage } from "@/components/admin/admin-page";
import {
  pauseAutomationAgentAction,
  resumeAutomationAgentAction
} from "@/lib/actions/admin-automation";
import { getAutomationPolicyState } from "@/lib/services/automation-control";
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

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatQuietHoursLabel(start: number | null, end: number | null) {
  if (start === null || end === null || start === end) {
    return "Not set";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: true,
    timeZone: "America/New_York"
  });
  const formatHour = (hour: number) =>
    formatter.format(new Date(Date.UTC(2026, 0, 1, hour, 0, 0)));

  return `${formatHour(start)} to ${formatHour(end)} ET`;
}

export default async function AdminAutomationAgentsPage({
  searchParams
}: {
  searchParams?: {
    notice?: string;
    error?: string;
  };
}) {
  const [report, policyState] = await Promise.all([
    getAgentRunsReport(),
    getAutomationPolicyState()
  ]);

  return (
    <AdminPage
      title="Agent runs"
      description="Operate the automation system from one place: see what ran, which lanes are paused, how close each agent is to its daily caps, and where the higher-risk work still needs tighter policy."
    >
      <div className="grid gap-6">
        {searchParams?.error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {searchParams.error}
          </p>
        ) : null}
        {searchParams?.notice ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {searchParams.notice}
          </p>
        ) : null}

        <section className="panel-light p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Safety Switches</p>
              <h2 className="mt-3 font-display text-4xl text-charcoal">Site-wide automation policy</h2>
              <p className="mt-4 text-sm leading-7 text-charcoal/70">
                These controls sit above individual agent toggles. Global and class-based pauses
                are enforced by the automation control plane, while ET quiet hours now gate cron,
                callback, and system-triggered runs.
              </p>
            </div>
            <Link
              href="/admin/settings/general"
              className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
            >
              Manage settings
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[1.5rem] border border-charcoal/10 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                Global pause
              </p>
              <p className="mt-3 font-display text-3xl text-charcoal">
                {policyState.globalPause ? "On" : "Off"}
              </p>
              <p className="mt-3 text-sm leading-6 text-charcoal/70">
                Blocks every automation lane, including manual admin-triggered runs, until it is
                switched off.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-charcoal/10 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                External-send pause
              </p>
              <p className="mt-3 font-display text-3xl text-charcoal">
                {policyState.externalSendPause ? "On" : "Off"}
              </p>
              <p className="mt-3 text-sm leading-6 text-charcoal/70">
                Freezes lanes that send to third-party audiences, like newsletter and social
                distribution.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-charcoal/10 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                Draft-creation pause
              </p>
              <p className="mt-3 font-display text-3xl text-charcoal">
                {policyState.draftCreationPause ? "On" : "Off"}
              </p>
              <p className="mt-3 text-sm leading-6 text-charcoal/70">
                Stops draft-only discovery and research lanes from creating fresh backlog items
                until you reopen the intake.
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-charcoal/10 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                Default quiet hours
              </p>
              <p className="mt-3 font-display text-3xl text-charcoal">
                {formatQuietHoursLabel(
                  policyState.defaultQuietHoursStartEt,
                  policyState.defaultQuietHoursEndEt
                )}
              </p>
              <p className="mt-3 text-sm leading-6 text-charcoal/70">
                Used when an individual lane does not define its own ET quiet-hours window.
              </p>
            </article>
          </div>
        </section>

        <section className="panel-light p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">Today</p>
              <h2 className="mt-3 font-display text-4xl text-charcoal">What happened today</h2>
              <p className="mt-4 text-sm leading-7 text-charcoal/70">
                The control plane is now the first source of truth here. These cards reflect
                explicit automation runs and paused lane state, with supporting content metrics
                layered in where they help explain the result.
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
                {card.links.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.links.map((link) => (
                      <Link
                        key={`${card.label}-${link.href}`}
                        href={link.href}
                        className="rounded-full border border-charcoal/10 bg-white/80 px-3 py-2 text-xs font-semibold text-charcoal transition hover:bg-white"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
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

        {report.sections.map((section) => (
          <section key={section.key} className="grid gap-4">
            <div className="panel-light p-6">
              <p className="eyebrow">{section.label}</p>
              <h2 className="mt-3 font-display text-4xl text-charcoal">{section.label}</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/70">
                {section.description}
              </p>
            </div>

            {section.agents.map((agent) => (
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
                        {agent.status === "live" ? "Configured" : "Needs config"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          agent.isEnabled
                            ? "bg-sky-100 text-sky-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {agent.isEnabled ? "Enabled" : "Paused"}
                      </span>
                      <span className="rounded-full bg-charcoal/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                        Risk: {formatLabel(agent.riskClass)}
                      </span>
                      <span className="rounded-full bg-charcoal/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                        Mode: {formatLabel(agent.autonomyMode)}
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-4xl text-charcoal">{agent.name}</h3>
                    <p className="mt-4 text-sm leading-7 text-charcoal/70">{agent.purpose}</p>
                    <p className="mt-4 text-sm leading-7 text-charcoal/65">{agent.summary}</p>
                  </div>

                  <div className="rounded-[1.5rem] bg-charcoal/5 px-5 py-4 text-sm text-charcoal/65 lg:min-w-[280px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Last observed
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {formatObservedAt(agent.lastObservedAt)}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Last successful
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {formatObservedAt(agent.lastSuccessfulRunAt)}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Last failed
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {formatObservedAt(agent.lastFailedRunAt)}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Next scheduled
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {agent.nextScheduledAt && agent.nextScheduledLabel
                        ? `${agent.nextScheduledLabel} · ${formatObservedAt(agent.nextScheduledAt)}`
                        : "No upcoming schedule detected"}
                    </p>
                    <p className="mt-4 text-sm leading-7">{agent.dependencyNote}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form
                        action={
                          agent.isEnabled ? pauseAutomationAgentAction : resumeAutomationAgentAction
                        }
                      >
                        <input type="hidden" name="agentId" value={agent.id} />
                        <input type="hidden" name="returnTo" value="/admin/automation/agents" />
                        <AdminSubmitButton
                          idleLabel={agent.isEnabled ? "Pause lane" : "Resume lane"}
                          pendingLabel={agent.isEnabled ? "Pausing..." : "Resuming..."}
                          className={`rounded-full px-4 py-2 text-sm font-semibold ${
                            agent.isEnabled
                              ? "bg-charcoal text-white"
                              : "border border-charcoal/10 bg-white text-charcoal"
                          }`}
                        />
                      </form>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.25rem] border border-charcoal/10 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Runs today
                    </p>
                    <p className="mt-3 font-display text-3xl text-charcoal">{agent.runsToday}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-charcoal/10 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Succeeded today
                    </p>
                    <p className="mt-3 font-display text-3xl text-charcoal">
                      {agent.successfulRunsToday}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-charcoal/10 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Failed today
                    </p>
                    <p className="mt-3 font-display text-3xl text-charcoal">
                      {agent.failedRunsToday}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-charcoal/10 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Consecutive failures
                    </p>
                    <p className="mt-3 font-display text-3xl text-charcoal">
                      {agent.consecutiveFailures}
                    </p>
                  </div>
                </div>

                {agent.capUsage.length ? (
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {agent.capUsage.map((cap) => (
                      <div
                        key={`${agent.id}-${cap.label}`}
                        className="rounded-[1.25rem] bg-charcoal/5 px-4 py-4 text-sm text-charcoal/70"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                          {cap.label}
                        </p>
                        <p className="mt-2 font-semibold text-charcoal">{cap.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {agent.stats.length ? (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {agent.stats.map((stat) => (
                      <div
                        key={`${agent.id}-${stat.label}`}
                        className="rounded-[1.25rem] border border-charcoal/10 px-4 py-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                          {stat.label}
                        </p>
                        <p className="mt-3 font-display text-3xl text-charcoal">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

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
          </section>
        ))}
      </div>
    </AdminPage>
  );
}
