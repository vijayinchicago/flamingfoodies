import Link from "next/link";

import { updateNewsletterCampaignStateAction } from "@/lib/actions/admin-newsletter";
import { AdminPage } from "@/components/admin/admin-page";
import { formatNewsletterAudience } from "@/lib/newsletter-segments";
import { getNewsletterCampaigns } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils";

function statusClasses(status: string) {
  if (status === "sent") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "approved") {
    return "bg-sky-100 text-sky-800";
  }

  if (status === "pending_approval" || status === "scheduled") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "rejected") {
    return "bg-rose-100 text-rose-800";
  }

  return "bg-charcoal/5 text-charcoal/70";
}

function formatStatusLabel(status: string) {
  if (status === "pending_approval") {
    return "pending approval";
  }

  return status.replace(/_/g, " ");
}

export default async function AdminCampaignsPage({
  searchParams
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  const campaigns = await getNewsletterCampaigns();

  return (
    <AdminPage
      title="Campaigns"
      description="Track digest drafts, approval-gated sends, and sent history in one place."
    >
      {searchParams?.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {searchParams.error}
        </p>
      ) : null}
      {searchParams?.updated ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Campaign updated.
        </p>
      ) : null}
      <div className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5 text-sm leading-7 text-charcoal/70">
        Scheduling a campaign now creates or refreshes an approval record instead of sending it
        directly. Review queued send proposals in{" "}
        <Link
          href="/admin/automation/approvals"
          className="font-semibold text-ember underline-offset-4 hover:underline"
        >
          automation approvals
        </Link>
        .
      </div>
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="panel-light p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl text-charcoal">{campaign.subject}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClasses(campaign.status)}`}
              >
                {formatStatusLabel(campaign.status)}
              </span>
            </div>
            <div className="mt-4 flex gap-6 text-sm text-charcoal/60">
              <span>Recipients: {campaign.recipientCount ?? "-"}</span>
              <span>Opens: {campaign.openCount ?? "-"}</span>
              <span>Clicks: {campaign.clickCount ?? "-"}</span>
              <span>
                {campaign.status === "sent" ? "Sent at" : "Send at"}:{" "}
                {formatDate(campaign.sendAt || campaign.sentAt || campaign.createdAt)}
              </span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-charcoal/50">
              Audience: {formatNewsletterAudience(campaign.audienceTags)}
            </p>
            {campaign.provider ? (
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-charcoal/45">
                Provider: {campaign.provider}
                {campaign.providerBroadcastId ? ` (${campaign.providerBroadcastId})` : ""}
              </p>
            ) : null}
            {campaign.status === "pending_approval" || campaign.status === "approved" ? (
              <p className="mt-4 rounded-2xl bg-charcoal/5 px-4 py-3 text-sm text-charcoal/65">
                {campaign.status === "approved"
                  ? "This campaign has approval to send. The due-send lane or a direct apply from the approval queue can deliver it."
                  : "This campaign is waiting in the automation approval queue until an admin approves or rejects it."}{" "}
                <Link
                  href="/admin/automation/approvals"
                  className="font-semibold text-ember underline-offset-4 hover:underline"
                >
                  Open approvals
                </Link>
                .
              </p>
            ) : null}
            {campaign.status === "rejected" ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                This send was rejected. Update the send window or return it to draft before
                re-queueing it.
              </p>
            ) : null}
            <form
              action={updateNewsletterCampaignStateAction}
              className="mt-5 flex flex-wrap gap-3"
            >
              <input type="hidden" name="id" value={campaign.id} />
              {campaign.status !== "sent" ? (
                <>
                  <input
                    name="sendAt"
                    type="datetime-local"
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-sm outline-none focus:border-ember"
                  />
                  <button
                    name="intent"
                    value="schedule"
                    className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white"
                  >
                    {campaign.status === "approved" || campaign.status === "pending_approval"
                      ? "Update send window"
                      : "Queue for approval"}
                  </button>
                </>
              ) : null}
              {campaign.status !== "draft" && campaign.status !== "sent" ? (
                <button
                  name="intent"
                  value="draft"
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Return to draft
                </button>
              ) : null}
            </form>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
