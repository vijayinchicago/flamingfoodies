import Link from "next/link";

import { AdminSubmitButton } from "@/components/admin/admin-submit-button";
import { AdminPage } from "@/components/admin/admin-page";
import {
  approveAutomationApprovalAction,
  applyAutomationApprovalAction,
  rejectAutomationApprovalAction
} from "@/lib/actions/admin-automation";
import {
  getAutomationApprovalSummary,
  listAutomationApprovals,
  type AutomationApprovalRecord
} from "@/lib/services/automation-control";

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Not yet";
  }

  return `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York"
  }).format(new Date(value))} ET`;
}

function formatLabel(value: string) {
  return value.replace(/[-_]/g, " ");
}

function statusClasses(status: AutomationApprovalRecord["status"]) {
  if (status === "approved") {
    return "bg-sky-100 text-sky-800";
  }

  if (status === "applied") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "rejected") {
    return "bg-rose-100 text-rose-800";
  }

  if (status === "expired") {
    return "bg-charcoal/10 text-charcoal/70";
  }

  return "bg-amber-100 text-amber-800";
}

function getReleaseProposal(approval: AutomationApprovalRecord) {
  const release = approval.payload.release;
  if (!release || typeof release !== "object" || Array.isArray(release)) {
    return null;
  }

  const record = release as Record<string, unknown>;
  const title = String(record.title ?? "").trim();
  const brand = String(record.brand ?? "").trim();

  if (!title || !brand) {
    return null;
  }

  return {
    title,
    brand,
    type: String(record.type ?? "").trim() || "new-product",
    description: String(record.description ?? "").trim(),
    body: String(record.body ?? "").trim(),
    sourceUrl:
      typeof record.sourceUrl === "string" && record.sourceUrl.trim().length
        ? record.sourceUrl.trim()
        : null,
    proposedSlug:
      typeof record.proposedSlug === "string" && record.proposedSlug.trim().length
        ? record.proposedSlug.trim()
        : null
  };
}

function getNewsletterProposal(approval: AutomationApprovalRecord) {
  const campaign = approval.payload.newsletterCampaign;
  if (!campaign || typeof campaign !== "object" || Array.isArray(campaign)) {
    return null;
  }

  const record = campaign as Record<string, unknown>;
  const subject = String(record.subject ?? "").trim();
  const campaignId = Number(record.campaignId ?? 0);

  if (!subject || !Number.isFinite(campaignId) || campaignId <= 0) {
    return null;
  }

  return {
    campaignId,
    subject,
    previewText:
      typeof record.previewText === "string" && record.previewText.trim().length
        ? record.previewText.trim()
        : null,
    sendAt:
      typeof record.sendAt === "string" && record.sendAt.trim().length
        ? record.sendAt.trim()
        : null,
    audienceTags: Array.isArray(record.audienceTags)
      ? record.audienceTags.filter((value): value is string => typeof value === "string")
      : [],
    recipientCount: Number(record.recipientCount ?? 0),
    provider:
      typeof record.provider === "string" && record.provider.trim().length
        ? record.provider.trim()
        : null,
    providerBroadcastId:
      typeof record.providerBroadcastId === "string" && record.providerBroadcastId.trim().length
        ? record.providerBroadcastId.trim()
        : null
  };
}

function supportsDirectApply(approval: AutomationApprovalRecord) {
  return (
    (
      approval.agentId === "release-monitor"
      && approval.subjectType === "release"
      && approval.proposedAction === "publish_release"
    )
    || (
      approval.agentId === "newsletter-digest-agent"
      && approval.subjectType === "newsletter_campaign"
      && approval.proposedAction === "send_newsletter_campaign"
    )
  );
}

function getDirectApplyLabel(approval: AutomationApprovalRecord) {
  if (
    approval.agentId === "newsletter-digest-agent"
    && approval.subjectType === "newsletter_campaign"
    && approval.proposedAction === "send_newsletter_campaign"
  ) {
    return "Send now";
  }

  return "Apply now";
}

function ApprovalActions({ approval }: { approval: AutomationApprovalRecord }) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {approval.status !== "approved" && approval.status !== "applied" ? (
        <form action={approveAutomationApprovalAction}>
          <input type="hidden" name="approvalId" value={approval.id} />
          <AdminSubmitButton
            idleLabel="Approve"
            pendingLabel="Approving..."
            className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800"
          />
        </form>
      ) : null}
      {approval.status !== "rejected" && approval.status !== "applied" ? (
        <form action={rejectAutomationApprovalAction}>
          <input type="hidden" name="approvalId" value={approval.id} />
          <AdminSubmitButton
            idleLabel="Reject"
            pendingLabel="Rejecting..."
            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800"
          />
        </form>
      ) : null}
      {approval.status === "approved" && supportsDirectApply(approval) ? (
        <form action={applyAutomationApprovalAction}>
          <input type="hidden" name="approvalId" value={approval.id} />
          <AdminSubmitButton
            idleLabel={getDirectApplyLabel(approval)}
            pendingLabel="Applying..."
            className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
          />
        </form>
      ) : null}
    </div>
  );
}

export default async function AdminAutomationApprovalsPage({
  searchParams
}: {
  searchParams?: {
    notice?: string;
    error?: string;
  };
}) {
  const [approvals, summary] = await Promise.all([
    listAutomationApprovals({ limit: 100 }),
    getAutomationApprovalSummary()
  ]);

  return (
    <AdminPage
      title="Automation approvals"
      description="This is the guarded handoff between autonomous discovery and live mutations. Approval-required lanes stop here until an admin decides what should proceed, what should be rejected, and what can safely be applied."
    >
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Guardrail queue</p>
            <h2 className="mt-3 font-display text-4xl text-charcoal">
              Approval-required work pauses here before it can touch live state.
            </h2>
            <p className="mt-4 text-sm leading-7 text-charcoal/70">
              Release publishing and newsletter delivery already use this queue. More higher-risk
              automations can plug into the same pattern so research, recommendation, and
              execution stay separated.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/automation/trigger"
              className="inline-flex rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
            >
              Open trigger panel
            </Link>
            <Link
              href="/admin/automation/agents"
              className="inline-flex rounded-full border border-charcoal/10 px-5 py-3 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
            >
              Open agent runs
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Total proposals
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">{summary.total}</p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              Approval records currently stored in the control plane queue.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Needs decision
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">{summary.pendingCount}</p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              New proposals waiting for an admin to approve or reject them.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Ready to apply
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">{summary.approvedCount}</p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              Proposals that have been approved and can now be applied by the executor lane.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-charcoal/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
              Applied
            </p>
            <p className="mt-3 font-display text-3xl text-charcoal">{summary.appliedCount}</p>
            <p className="mt-3 text-sm leading-6 text-charcoal/70">
              Approved proposals that have already been turned into live mutations.
            </p>
          </article>
        </div>
      </section>

      {approvals.length ? (
        <section className="grid gap-4">
          {approvals.map((approval) => {
            const release = getReleaseProposal(approval);
            const newsletter = getNewsletterProposal(approval);
            const appliedHref =
              approval.status === "applied"
                ? release
                  ? "/new-releases"
                  : newsletter
                    ? "/admin/newsletter/campaigns"
                    : null
                : null;
            const appliedLabel = release
              ? "Open releases"
              : newsletter
                ? "Open campaigns"
                : null;
            const recipientCountLabel = newsletter
              ? new Intl.NumberFormat("en-US").format(
                  Number.isFinite(newsletter.recipientCount) ? newsletter.recipientCount : 0
                )
              : null;

            return (
              <article key={approval.id} className="panel-light p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      <span className={`rounded-full px-3 py-1 ${statusClasses(approval.status)}`}>
                        {formatLabel(approval.status)}
                      </span>
                      <span className="rounded-full bg-charcoal/5 px-3 py-1 text-charcoal/70">
                        {formatLabel(approval.agentId)}
                      </span>
                      <span className="rounded-full bg-charcoal/5 px-3 py-1 text-charcoal/70">
                        {formatLabel(approval.proposedAction)}
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-3xl text-charcoal">
                      {release
                        ? release.title
                        : newsletter
                          ? newsletter.subject
                          : `${formatLabel(approval.subjectType)} proposal`}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-charcoal/70">
                      {release
                        ? `${release.brand} · ${formatLabel(release.type)}`
                        : newsletter
                          ? `${recipientCountLabel} recipient(s)${newsletter.sendAt ? ` · send after ${formatDateTime(newsletter.sendAt)}` : ""}`
                          : `Subject key: ${approval.subjectKey}`}
                    </p>
                    {release?.description ? (
                      <p className="mt-4 text-sm leading-7 text-charcoal/70">
                        {release.description}
                      </p>
                    ) : null}
                    {newsletter?.previewText ? (
                      <p className="mt-4 text-sm leading-7 text-charcoal/70">
                        {newsletter.previewText}
                      </p>
                    ) : null}
                    {release?.body ? (
                      <p className="mt-4 text-sm leading-7 text-charcoal/65">{release.body}</p>
                    ) : null}
                    {newsletter?.audienceTags.length ? (
                      <p className="mt-4 text-sm leading-7 text-charcoal/65">
                        Audience: {newsletter.audienceTags.join(", ")}
                      </p>
                    ) : null}
                    {approval.decisionReason ? (
                      <p className="mt-4 rounded-2xl bg-charcoal/5 px-4 py-3 text-sm text-charcoal/65">
                        {approval.decisionReason}
                      </p>
                    ) : null}
                    <ApprovalActions approval={approval} />
                  </div>

                  <div className="rounded-[1.5rem] bg-charcoal/5 px-5 py-4 text-sm text-charcoal/65 lg:min-w-[300px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Created
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {formatDateTime(approval.createdAt)}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Updated
                    </p>
                    <p className="mt-2 font-semibold text-charcoal">
                      {formatDateTime(approval.updatedAt)}
                    </p>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                      Subject key
                    </p>
                    <p className="mt-2 break-all font-mono text-xs text-charcoal">
                      {approval.subjectKey}
                    </p>
                    {newsletter?.sendAt ? (
                      <>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                          Send window
                        </p>
                        <p className="mt-2 font-semibold text-charcoal">
                          {formatDateTime(newsletter.sendAt)}
                        </p>
                      </>
                    ) : null}
                    {newsletter ? (
                      <>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                          Campaign
                        </p>
                        <p className="mt-2 font-semibold text-charcoal">
                          #{newsletter.campaignId} · {recipientCountLabel} recipient(s)
                        </p>
                      </>
                    ) : null}
                    {newsletter?.provider ? (
                      <>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                          Provider
                        </p>
                        <p className="mt-2 font-semibold text-charcoal">
                          {newsletter.provider}
                          {newsletter.providerBroadcastId
                            ? ` (${newsletter.providerBroadcastId})`
                            : ""}
                        </p>
                      </>
                    ) : null}
                    {release?.proposedSlug ? (
                      <>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                          Proposed slug
                        </p>
                        <p className="mt-2 font-semibold text-charcoal">
                          /new-releases/{release.proposedSlug}
                        </p>
                      </>
                    ) : null}
                    {release?.sourceUrl ? (
                      <>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
                          Source
                        </p>
                        <Link
                          href={release.sourceUrl}
                          className="mt-2 inline-flex break-all text-sm font-semibold text-ember underline-offset-4 hover:underline"
                        >
                          {release.sourceUrl}
                        </Link>
                      </>
                    ) : null}
                    {approval.status === "applied" && appliedHref && appliedLabel ? (
                      <Link
                        href={appliedHref}
                        className="mt-4 inline-flex rounded-full border border-charcoal/10 bg-white px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-charcoal/5"
                      >
                        {appliedLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="panel-light p-6">
          <p className="eyebrow">Empty queue</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">No approvals yet</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/70">
            No approval-required automation has queued anything yet. Run the release monitor,
            newsletter scheduling flow, or other guarded lanes from the trigger panel to create
            the first proposals.
          </p>
          <Link
            href="/admin/automation/trigger"
            className="mt-6 inline-flex rounded-full bg-charcoal px-5 py-3 text-sm font-semibold text-white"
          >
            Open trigger panel
          </Link>
        </section>
      )}
    </AdminPage>
  );
}
