import { env, flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MAILERLITE_API_BASE = "https://connect.mailerlite.com/api";
// Look back this far for campaigns whose stats we should refresh. Daily
// runs ensure stats stay fresh without hammering the API for old campaigns.
const STATS_REFRESH_WINDOW_DAYS = 14;

export type MailerLiteStatsRunResult = {
  mode: "live" | "skipped";
  reason?: string;
  campaignsChecked: number;
  campaignsUpdated: number;
  failures: number;
};

type CampaignReport = {
  opens_count?: number;
  clicks_count?: number;
  unsubscribes_count?: number;
  recipients_count?: number;
};

async function fetchCampaignReport(campaignId: string): Promise<CampaignReport | null> {
  const resp = await fetch(`${MAILERLITE_API_BASE}/campaigns/${campaignId}/reports`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${env.MAILERLITE_API_KEY}`
    }
  });

  if (!resp.ok) return null;

  const json = (await resp.json().catch(() => null)) as Record<string, unknown> | null;
  if (!json) return null;
  const data = (json.data as Record<string, unknown> | undefined) ?? json;
  const stats = (data?.stats as Record<string, unknown> | undefined) ?? data;

  const opens = Number(stats?.opens_count ?? 0);
  const clicks = Number(stats?.clicks_count ?? 0);
  const unsubs = Number(stats?.unsubscribes_count ?? 0);
  const recipients = Number(stats?.recipients_count ?? data?.emails_sent ?? 0);

  return {
    opens_count: Number.isFinite(opens) ? opens : 0,
    clicks_count: Number.isFinite(clicks) ? clicks : 0,
    unsubscribes_count: Number.isFinite(unsubs) ? unsubs : 0,
    recipients_count: Number.isFinite(recipients) ? recipients : 0
  };
}

export async function refreshMailerLiteCampaignStats(): Promise<MailerLiteStatsRunResult> {
  if (!flags.hasMailerLite) {
    return {
      mode: "skipped",
      reason: "MailerLite API key not configured.",
      campaignsChecked: 0,
      campaignsUpdated: 0,
      failures: 0
    };
  }

  if (!flags.hasSupabaseAdmin) {
    return {
      mode: "skipped",
      reason: "Supabase admin not configured.",
      campaignsChecked: 0,
      campaignsUpdated: 0,
      failures: 0
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: "skipped",
      reason: "Supabase client unavailable.",
      campaignsChecked: 0,
      campaignsUpdated: 0,
      failures: 0
    };
  }

  const sinceIso = new Date(
    Date.now() - STATS_REFRESH_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: campaigns, error } = await supabase
    .from("newsletter_campaigns")
    .select("id, provider, provider_broadcast_id, sent_at")
    .eq("status", "sent")
    .eq("provider", "mailerlite")
    .gte("sent_at", sinceIso)
    .not("provider_broadcast_id", "is", null)
    .order("sent_at", { ascending: false })
    .limit(40);

  if (error) {
    throw new Error(`Failed to load campaigns: ${error.message}`);
  }

  const list = campaigns ?? [];
  let updated = 0;
  let failures = 0;

  for (const campaign of list) {
    const broadcastId = campaign.provider_broadcast_id as string | null;
    if (!broadcastId) continue;

    try {
      const report = await fetchCampaignReport(broadcastId);
      if (!report) {
        failures += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from("newsletter_campaigns")
        .update({
          open_count: report.opens_count ?? 0,
          click_count: report.clicks_count ?? 0,
          unsubscribe_count: report.unsubscribes_count ?? 0,
          recipient_count: report.recipients_count ?? campaign.id
        })
        .eq("id", campaign.id);

      if (updateError) {
        failures += 1;
      } else {
        updated += 1;
      }
    } catch {
      failures += 1;
    }
  }

  return {
    mode: "live",
    campaignsChecked: list.length,
    campaignsUpdated: updated,
    failures
  };
}
