import { env, flags } from "@/lib/env";
import {
  normalizeNewsletterSegmentTags
} from "@/lib/newsletter-segments";
import { sampleSubscribers } from "@/lib/sample-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { NewsletterCampaign } from "@/lib/types";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

function extractKitBroadcastId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const broadcast =
    record.broadcast && typeof record.broadcast === "object"
      ? (record.broadcast as Record<string, unknown>)
      : null;

  const rawId = broadcast?.id ?? record.id;
  if (rawId === undefined || rawId === null) {
    return undefined;
  }

  return String(rawId);
}

async function getActiveRecipientCount(
  supabase: AdminClient,
  audienceTags?: string[]
) {
  let query = supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const normalizedTags = normalizeNewsletterSegmentTags(audienceTags);
  if (normalizedTags.length) {
    query = query.overlaps("tags", normalizedTags);
  }

  const { count } = await query;

  return count ?? 0;
}

async function getCampaignRow(supabase: AdminClient, id: number) {
  const { data, error } = await supabase
    .from("newsletter_campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Newsletter campaign not found.");
  }

  return data;
}

function mapCampaignRow(row: any): NewsletterCampaign {
  return {
    id: row.id,
    subject: row.subject,
    previewText: row.preview_text ?? undefined,
    htmlContent: row.html_content,
    textContent: row.text_content ?? undefined,
    audienceTags: row.audience_tags ?? [],
    provider: row.provider ?? undefined,
    providerBroadcastId: row.provider_broadcast_id ?? undefined,
    status: row.status,
    sendAt: row.send_at ?? undefined,
    sentAt: row.sent_at ?? undefined,
    recipientCount: row.recipient_count ?? undefined,
    openCount: row.open_count ?? undefined,
    clickCount: row.click_count ?? undefined,
    createdAt: row.created_at
  };
}

async function syncCampaignToKit({
  campaign,
  sendAt
}: {
  campaign: NewsletterCampaign;
  sendAt?: string | null;
}) {
  if (!flags.hasConvertKitBroadcast) {
    return {
      mode: "mock" as const,
      provider: undefined,
      providerBroadcastId: campaign.providerBroadcastId
    };
  }

  const endpoint = campaign.providerBroadcastId
    ? `https://api.convertkit.com/v3/broadcasts/${campaign.providerBroadcastId}`
    : "https://api.convertkit.com/v3/broadcasts";
  const response = await fetch(endpoint, {
    method: campaign.providerBroadcastId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_secret: env.CONVERTKIT_API_SECRET,
      subject: campaign.subject,
      content: campaign.htmlContent,
      description: campaign.previewText || `FlamingFoodies campaign ${campaign.id}`,
      send_at: sendAt ?? undefined
    })
  });

  if (!response.ok) {
    throw new Error("Kit broadcast sync failed.");
  }

  const payload = await response.json().catch(() => ({}));

  return {
    mode: "live" as const,
    provider: "kit",
    providerBroadcastId:
      extractKitBroadcastId(payload) ?? campaign.providerBroadcastId ?? undefined
  };
}

export async function subscribeToNewsletter({
  email,
  firstName,
  source,
  tag,
  tags
}: {
  email: string;
  firstName?: string;
  source?: string;
  tag?: string;
  tags?: string[];
}) {
  const mergedInputTags = normalizeNewsletterSegmentTags([
    ...(tags ?? []),
    ...(tag ? [tag] : [])
  ]);

  const payload = {
    email_address: email,
    first_name: firstName,
    tags: mergedInputTags,
    fields: {
      source
    }
  };

  let subscriberCount = sampleSubscribers.length + 1;

  if (flags.hasSupabaseAdmin) {
    const supabase = createSupabaseAdminClient();

    if (supabase) {
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("id, tags")
        .eq("email", email)
        .maybeSingle();

      const mergedTags = Array.from(
        new Set([...(existing?.tags ?? []), ...mergedInputTags].filter(Boolean))
      );

      const { error } = await supabase.from("newsletter_subscribers").upsert(
        {
          id: existing?.id,
          email,
          first_name: firstName || null,
          status: "active",
          source: source || null,
          tags: mergedTags,
          unsubscribed_at: null
        },
        {
          onConflict: "email"
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      subscriberCount = await getActiveRecipientCount(supabase);
    }
  }

  if (flags.hasConvertKit) {
    const response = await fetch(
      `https://api.convertkit.com/v3/forms/${env.CONVERTKIT_FORM_ID}/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          api_key: env.CONVERTKIT_API_KEY,
          ...payload
        })
      }
    );

    if (!response.ok) {
      throw new Error("ConvertKit subscription failed.");
    }
  }

  return {
    mode: flags.hasSupabaseAdmin || flags.hasConvertKit ? "live" : "mock",
    subscriberCount,
    payload
  };
}

export async function scheduleNewsletterCampaign(campaignId: number, sendAt: string) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      mode: flags.hasConvertKitBroadcast ? "live" : "mock",
      recipientCount: sampleSubscribers.length,
      provider: flags.hasConvertKitBroadcast ? "kit" : undefined,
      providerBroadcastId: undefined
    };
  }

  const campaignRow = await getCampaignRow(supabase, campaignId);
  const recipientCount = await getActiveRecipientCount(supabase, campaignRow.audience_tags ?? []);
  const campaign = mapCampaignRow(campaignRow);
  const providerSync = await syncCampaignToKit({
    campaign,
    sendAt
  });

  const { error } = await supabase
    .from("newsletter_campaigns")
    .update({
      status: "scheduled",
      send_at: sendAt,
      sent_at: null,
      recipient_count: recipientCount,
      audience_tags: campaign.audienceTags ?? [],
      provider: providerSync.provider ?? null,
      provider_broadcast_id: providerSync.providerBroadcastId ?? null
    })
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: providerSync.mode,
    recipientCount,
    provider: providerSync.provider,
    providerBroadcastId: providerSync.providerBroadcastId
  };
}

export async function sendNewsletterCampaign(campaignId: number) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      mode: flags.hasConvertKitBroadcast ? "live" : "mock",
      recipientCount: sampleSubscribers.length,
      provider: flags.hasConvertKitBroadcast ? "kit" : undefined,
      providerBroadcastId: undefined,
      sentAt: new Date().toISOString()
    };
  }

  const sentAt = new Date().toISOString();
  const campaignRow = await getCampaignRow(supabase, campaignId);
  const recipientCount = await getActiveRecipientCount(supabase, campaignRow.audience_tags ?? []);
  const campaign = mapCampaignRow(campaignRow);
  const providerSync = await syncCampaignToKit({
    campaign,
    sendAt: sentAt
  });

  const { error } = await supabase
    .from("newsletter_campaigns")
    .update({
      status: "sent",
      send_at: sentAt,
      sent_at: sentAt,
      recipient_count: recipientCount,
      audience_tags: campaign.audienceTags ?? [],
      provider: providerSync.provider ?? null,
      provider_broadcast_id: providerSync.providerBroadcastId ?? null
    })
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: providerSync.mode,
    recipientCount,
    provider: providerSync.provider,
    providerBroadcastId: providerSync.providerBroadcastId,
    sentAt
  };
}

export async function processScheduledNewsletterCampaigns() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      mode: flags.hasConvertKitBroadcast ? "live" : "mock",
      processed: 0,
      sent: 0,
      failures: 0
    };
  }

  const { data: dueCampaigns, error } = await supabase
    .from("newsletter_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .not("send_at", "is", null)
    .lte("send_at", new Date().toISOString())
    .order("send_at", { ascending: true })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;
  let failures = 0;

  for (const campaign of dueCampaigns ?? []) {
    try {
      await sendNewsletterCampaign(campaign.id);
      sent += 1;
    } catch {
      failures += 1;
    }
  }

  return {
    mode: flags.hasConvertKitBroadcast ? "live" : "mock",
    processed: (dueCampaigns ?? []).length,
    sent,
    failures
  };
}

export { extractKitBroadcastId };
