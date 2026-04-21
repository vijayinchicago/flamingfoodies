import { env, flags } from "@/lib/env";
import {
  createAutomationApproval,
  getAutomationApproval,
  updateAutomationApproval
} from "@/lib/services/automation-control";
import {
  normalizeNewsletterSegmentTags
} from "@/lib/newsletter-segments";
import { sampleSubscribers } from "@/lib/sample-data";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  NewsletterCampaign,
  NewsletterCampaignStatus
} from "@/lib/types";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type NewsletterSendApprovalPayload = {
  newsletterCampaign: {
    campaignId: number;
    subject: string;
    previewText: string | null;
    sendAt: string | null;
    audienceTags: string[];
    recipientCount: number;
    provider: string | null;
    providerBroadcastId: string | null;
  };
};

type ExistingAutomationApproval = NonNullable<
  Awaited<ReturnType<typeof getAutomationApproval>>
>;

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

async function updateCampaignStatus(
  supabase: AdminClient,
  campaignId: number,
  status: NewsletterCampaignStatus,
  extraUpdates?: Record<string, unknown>
) {
  const { error } = await supabase
    .from("newsletter_campaigns")
    .update({
      status,
      ...extraUpdates
    })
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }
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

export function buildNewsletterSendApprovalSubjectKey(campaignId: number) {
  return `newsletter-campaign:${campaignId}`;
}

async function findNewsletterSendApproval(campaignId: number) {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("automation_approvals")
    .select("id")
    .eq("agent_id", "newsletter-digest-agent")
    .eq("subject_type", "newsletter_campaign")
    .eq("subject_key", buildNewsletterSendApprovalSubjectKey(campaignId))
    .eq("proposed_action", "send_newsletter_campaign")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data?.id !== "number") {
    return null;
  }

  return getAutomationApproval(data.id);
}

function buildNewsletterSendApprovalPayload(input: {
  campaign: NewsletterCampaign;
  recipientCount: number;
  provider: string | null;
  providerBroadcastId: string | null;
  sendAt: string | null;
}): NewsletterSendApprovalPayload {
  return {
    newsletterCampaign: {
      campaignId: input.campaign.id,
      subject: input.campaign.subject,
      previewText: input.campaign.previewText ?? null,
      sendAt: input.sendAt,
      audienceTags: input.campaign.audienceTags ?? [],
      recipientCount: input.recipientCount,
      provider: input.provider,
      providerBroadcastId: input.providerBroadcastId
    }
  };
}

function getNewsletterApprovalCampaignPayload(
  payload: Record<string, unknown> | undefined
) {
  const campaign =
    payload?.newsletterCampaign
    && typeof payload.newsletterCampaign === "object"
    && !Array.isArray(payload.newsletterCampaign)
      ? (payload.newsletterCampaign as Record<string, unknown>)
      : null;

  if (!campaign) {
    return null;
  }

  return {
    campaignId: Number(campaign.campaignId ?? 0),
    subject: String(campaign.subject ?? "").trim(),
    previewText:
      typeof campaign.previewText === "string" ? campaign.previewText : null,
    sendAt: typeof campaign.sendAt === "string" ? campaign.sendAt : null,
    audienceTags: Array.isArray(campaign.audienceTags)
      ? campaign.audienceTags
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      : []
  };
}

function hasNewsletterApprovalDecisionChanged(
  approval: ExistingAutomationApproval | null,
  nextPayload: NewsletterSendApprovalPayload
) {
  if (!approval || approval.status !== "approved") {
    return false;
  }

  const previous = getNewsletterApprovalCampaignPayload(approval.payload);
  const next = nextPayload.newsletterCampaign;

  if (!previous) {
    return true;
  }

  return (
    previous.campaignId !== next.campaignId
    || previous.subject !== next.subject
    || previous.previewText !== next.previewText
    || previous.sendAt !== next.sendAt
    || previous.audienceTags.join("|") !== (next.audienceTags ?? []).join("|")
  );
}

function getCampaignApprovalStatus(
  approvalStatus: ExistingAutomationApproval["status"]
): NewsletterCampaignStatus {
  if (approvalStatus === "approved") {
    return "approved";
  }

  return "pending_approval";
}

async function ensureNewsletterSendApproval(input: {
  campaign: NewsletterCampaign;
  recipientCount: number;
  provider: string | null;
  providerBroadcastId: string | null;
  sendAt: string | null;
}) {
  const existingApproval = await findNewsletterSendApproval(input.campaign.id);
  const nextPayload = buildNewsletterSendApprovalPayload(input);
  const result = await createAutomationApproval({
    agentId: "newsletter-digest-agent",
    subjectType: "newsletter_campaign",
    subjectKey: buildNewsletterSendApprovalSubjectKey(input.campaign.id),
    proposedAction: "send_newsletter_campaign",
    payload: nextPayload,
    status: "pending"
  });

  let approval = result.approval;

  if (hasNewsletterApprovalDecisionChanged(existingApproval, nextPayload)) {
    approval = await updateAutomationApproval({
      approvalId: approval.id,
      status: "pending",
      decisionReason:
        "Newsletter send approval reopened after campaign details changed."
    });
  }

  if (
    approval.status === "rejected"
    || approval.status === "expired"
    || approval.status === "applied"
  ) {
    approval = await updateAutomationApproval({
      approvalId: approval.id,
      status: "pending",
      decisionReason: "Newsletter send approval reopened after scheduling update."
    });
  }

  return approval;
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
      providerBroadcastId: undefined,
      approvalStatus: "pending" as const
    };
  }

  const campaignRow = await getCampaignRow(supabase, campaignId);
  const recipientCount = await getActiveRecipientCount(supabase, campaignRow.audience_tags ?? []);
  const campaign = mapCampaignRow(campaignRow);
  const providerSync = await syncCampaignToKit({
    campaign,
    sendAt: null
  });
  const approval = await ensureNewsletterSendApproval({
    campaign,
    recipientCount,
    provider: providerSync.provider ?? null,
    providerBroadcastId: providerSync.providerBroadcastId ?? null,
    sendAt
  });

  await updateCampaignStatus(supabase, campaignId, getCampaignApprovalStatus(approval.status), {
    send_at: sendAt,
    sent_at: null,
    recipient_count: recipientCount,
    audience_tags: campaign.audienceTags ?? [],
    provider: providerSync.provider ?? null,
    provider_broadcast_id: providerSync.providerBroadcastId ?? null
  });

  return {
    mode: providerSync.mode,
    recipientCount,
    provider: providerSync.provider,
    providerBroadcastId: providerSync.providerBroadcastId,
    approvalStatus: approval.status
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

export async function syncNewsletterCampaignApprovalStatus(input: {
  approvalId: number;
  status: "approved" | "rejected";
}) {
  const approval = await getAutomationApproval(input.approvalId);
  if (
    !approval
    || approval.agentId !== "newsletter-digest-agent"
    || approval.subjectType !== "newsletter_campaign"
    || approval.proposedAction !== "send_newsletter_campaign"
  ) {
    return null;
  }

  const payload = getNewsletterApprovalCampaignPayload(approval.payload);
  if (!payload) {
    throw new Error("Newsletter send approval is missing its campaign payload.");
  }

  const campaignId = Number(payload.campaignId ?? 0);
  if (!Number.isFinite(campaignId) || campaignId <= 0) {
    throw new Error("Newsletter send approval is missing a valid campaign id.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return approval;
  }

  await updateCampaignStatus(
    supabase,
    campaignId,
    input.status === "approved" ? "approved" : "rejected"
  );

  return approval;
}

export async function resetNewsletterCampaignApproval(campaignId: number) {
  const approval = await findNewsletterSendApproval(campaignId);
  if (!approval || approval.status === "applied") {
    return approval;
  }

  return updateAutomationApproval({
    approvalId: approval.id,
    status: "expired",
    decisionReason: "Newsletter campaign was returned to draft."
  });
}

export async function applyNewsletterSendApproval(approvalId: number) {
  const approval = await getAutomationApproval(approvalId);
  if (
    !approval
    || approval.agentId !== "newsletter-digest-agent"
    || approval.subjectType !== "newsletter_campaign"
    || approval.proposedAction !== "send_newsletter_campaign"
  ) {
    throw new Error("This automation approval is not a supported newsletter send proposal.");
  }

  if (approval.status !== "approved") {
    throw new Error("Approve this newsletter send proposal before applying it.");
  }

  const payload = getNewsletterApprovalCampaignPayload(approval.payload);
  if (!payload) {
    throw new Error("Newsletter send approval is missing its campaign payload.");
  }

  const campaignId = Number(payload.campaignId ?? 0);
  if (!Number.isFinite(campaignId) || campaignId <= 0) {
    throw new Error("Newsletter send approval is missing a valid campaign id.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Newsletter sending is not available in this environment.");
  }

  const campaignRow = await getCampaignRow(supabase, campaignId);
  const campaign = mapCampaignRow(campaignRow);

  if (campaign.status === "sent" && campaign.sentAt) {
    await updateAutomationApproval({
      approvalId,
      status: "applied",
      decisionReason: `Newsletter campaign ${campaignId} was already sent at ${campaign.sentAt}.`
    });

    return {
      approvalId,
      campaignId,
      subject: campaign.subject,
      sentAt: campaign.sentAt,
      alreadySent: true
    };
  }

  const result = await sendNewsletterCampaign(campaignId);
  await updateAutomationApproval({
    approvalId,
    status: "applied",
    decisionReason: `Approved and sent newsletter campaign ${campaignId}.`
  });

  return {
    approvalId,
    campaignId,
    subject: campaign.subject,
    sentAt: result.sentAt,
    alreadySent: false
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
    .select("*")
    .in("status", ["scheduled", "pending_approval", "approved"])
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
      const mappedCampaign = mapCampaignRow(campaign);
      const recipientCount = await getActiveRecipientCount(supabase, campaign.audience_tags ?? []);
      const approval = await ensureNewsletterSendApproval({
        campaign: mappedCampaign,
        recipientCount,
        provider: mappedCampaign.provider ?? null,
        providerBroadcastId: mappedCampaign.providerBroadcastId ?? null,
        sendAt: mappedCampaign.sendAt ?? null
      });

      if (approval.status === "approved") {
        if (mappedCampaign.status !== "approved") {
          await updateCampaignStatus(supabase, mappedCampaign.id, "approved");
        }

        await applyNewsletterSendApproval(approval.id);
        sent += 1;
      } else if (mappedCampaign.status !== "pending_approval") {
        await updateCampaignStatus(supabase, mappedCampaign.id, "pending_approval");
      }
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
