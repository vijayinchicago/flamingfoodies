import { updateNewsletterCampaignStateAction } from "@/lib/actions/admin-newsletter";
import { AdminPage } from "@/components/admin/admin-page";
import { formatNewsletterAudience } from "@/lib/newsletter-segments";
import { getNewsletterCampaigns } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminCampaignsPage({
  searchParams
}: {
  searchParams?: { updated?: string; error?: string };
}) {
  const campaigns = await getNewsletterCampaigns();

  return (
    <AdminPage
      title="Campaigns"
      description="Track sent history and weekly digest drafts before they go out."
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
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="panel-light p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl text-charcoal">{campaign.subject}</h2>
              <span className="rounded-full bg-charcoal/5 px-3 py-1 text-xs font-semibold text-charcoal/70">
                {campaign.status}
              </span>
            </div>
            <div className="mt-4 flex gap-6 text-sm text-charcoal/60">
              <span>Recipients: {campaign.recipientCount ?? "-"}</span>
              <span>Opens: {campaign.openCount ?? "-"}</span>
              <span>Clicks: {campaign.clickCount ?? "-"}</span>
              <span>Send at: {formatDate(campaign.sendAt || campaign.createdAt)}</span>
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
            <form action={updateNewsletterCampaignStateAction} className="mt-5 flex flex-wrap gap-3">
              <input type="hidden" name="id" value={campaign.id} />
              {campaign.status !== "scheduled" && campaign.status !== "sent" ? (
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
                    Schedule
                  </button>
                </>
              ) : null}
              {campaign.status !== "sent" ? (
                <button
                  name="intent"
                  value="send"
                  className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Mark sent
                </button>
              ) : null}
              {campaign.status !== "draft" ? (
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
