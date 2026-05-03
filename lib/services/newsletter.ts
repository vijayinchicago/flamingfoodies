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

// Referral milestones: hitting a threshold adds a Kit tag that triggers
// the matching reward Sequence. Order matters — first match wins per signup.
const REFERRAL_TIERS: Array<{ tier: number; threshold: number; tag: string }> = [
  { tier: 1, threshold: 3, tag: "referrer-tier-1" },
  { tier: 2, threshold: 5, tag: "referrer-tier-2" },
  { tier: 3, threshold: 10, tag: "referrer-tier-3" }
];

async function syncSubscriberToKit(payload: {
  email_address: string;
  first_name?: string;
  tags: string[];
  fields: Record<string, unknown>;
}) {
  if (!flags.hasConvertKit) {
    return;
  }

  const response = await fetch(
    `https://api.convertkit.com/v3/forms/${env.CONVERTKIT_FORM_ID}/subscribe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

let cachedMailerLiteGroupMap: Record<string, string> | null = null;

function getMailerLiteGroupMap(): Record<string, string> {
  if (cachedMailerLiteGroupMap) return cachedMailerLiteGroupMap;
  const raw = env.MAILERLITE_GROUPS?.trim();
  if (!raw) {
    cachedMailerLiteGroupMap = {};
    return cachedMailerLiteGroupMap;
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      cachedMailerLiteGroupMap = Object.fromEntries(
        Object.entries(parsed)
          .filter(([, value]) => typeof value === "string" && value.length > 0)
          .map(([key, value]) => [key, value as string])
      );
      return cachedMailerLiteGroupMap;
    }
  } catch {
    // fall through
  }
  cachedMailerLiteGroupMap = {};
  return cachedMailerLiteGroupMap;
}

async function syncSubscriberToMailerLite(payload: {
  email: string;
  firstName?: string;
  tags: string[];
  fields: Record<string, unknown>;
}) {
  if (!flags.hasMailerLite) return;

  const groupMap = getMailerLiteGroupMap();
  const groupIds = payload.tags
    .map((tag) => groupMap[tag])
    .filter((id): id is string => Boolean(id));

  // MailerLite "fields" use snake_case keys mapped to your account's custom
  // field aliases. `name` is built-in. Custom fields must exist in MailerLite
  // under Subscribers → Fields with matching aliases or this is a no-op.
  const mailerLiteFields: Record<string, unknown> = {};
  if (payload.firstName) mailerLiteFields.name = payload.firstName;
  for (const [key, value] of Object.entries(payload.fields)) {
    if (value !== undefined && value !== null && value !== "") {
      mailerLiteFields[key] = value;
    }
  }

  const response = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${env.MAILERLITE_API_KEY}`
    },
    body: JSON.stringify({
      email: payload.email,
      fields: mailerLiteFields,
      groups: groupIds,
      status: "active"
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`MailerLite subscription failed (${response.status}): ${detail}`);
  }
}

async function syncSubscriberToProvider(payload: {
  email: string;
  firstName?: string;
  tags: string[];
  fields: Record<string, unknown>;
}) {
  // MailerLite takes precedence if configured. ConvertKit remains as a
  // fallback so existing deployments keep working until the env is swapped.
  if (flags.hasMailerLite) {
    await syncSubscriberToMailerLite(payload);
    return;
  }
  if (flags.hasConvertKit) {
    await syncSubscriberToKit({
      email_address: payload.email,
      first_name: payload.firstName,
      tags: payload.tags,
      fields: payload.fields
    });
  }
}

async function recordReferralAndMaybeReward(input: {
  supabase: AdminClient;
  refereeEmail: string;
  referrerToken: string;
  source?: string;
}) {
  const { supabase, refereeEmail, referrerToken, source } = input;

  const { data: referrer } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, tags, referral_count, referral_tier, first_name")
    .eq("referral_token", referrerToken)
    .maybeSingle();

  if (!referrer || referrer.email === refereeEmail) {
    return;
  }

  // Insert audit row; UNIQUE on referee_email prevents double-credit if the
  // same person signs up twice with the same ref token.
  const { error: insertError } = await supabase
    .from("newsletter_referrals")
    .insert({
      referrer_token: referrerToken,
      referrer_email: referrer.email,
      referee_email: refereeEmail,
      source: source ?? null
    });

  if (insertError) {
    return;
  }

  const newCount = (referrer.referral_count ?? 0) + 1;
  const previousTier = referrer.referral_tier ?? 0;
  const reachedTier = REFERRAL_TIERS.filter(
    (tier) => newCount >= tier.threshold && tier.tier > previousTier
  ).pop();

  const updatedTags = reachedTier
    ? Array.from(new Set([...(referrer.tags ?? []), reachedTier.tag]))
    : referrer.tags ?? [];

  await supabase
    .from("newsletter_subscribers")
    .update({
      referral_count: newCount,
      referral_tier: reachedTier ? reachedTier.tier : previousTier,
      tags: updatedTags
    })
    .eq("id", referrer.id);

  // Re-sync the referrer to the email provider so the new tier group/tag
  // flows over and the matching reward Automation can fire. Failures are
  // non-fatal — the next signup-related sync will catch up.
  if (reachedTier && (flags.hasMailerLite || flags.hasConvertKit)) {
    try {
      await syncSubscriberToProvider({
        email: referrer.email,
        firstName: referrer.first_name ?? undefined,
        tags: updatedTags,
        fields: { referral_count: newCount, referral_tier: reachedTier.tier }
      });
    } catch {
      // swallow — provider retry will happen on the referrer's next signup-related event
    }
  }
}

export async function subscribeToNewsletter({
  email,
  firstName,
  source,
  tag,
  tags,
  referrerToken
}: {
  email: string;
  firstName?: string;
  source?: string;
  tag?: string;
  tags?: string[];
  referrerToken?: string;
}) {
  const mergedInputTags = normalizeNewsletterSegmentTags([
    ...(tags ?? []),
    ...(tag ? [tag] : [])
  ]);

  let subscriberCount = sampleSubscribers.length + 1;
  let referralToken: string | undefined;
  let isNewSubscriber = false;

  if (flags.hasSupabaseAdmin) {
    const supabase = createSupabaseAdminClient();

    if (supabase) {
      const { data: existing } = await supabase
        .from("newsletter_subscribers")
        .select("id, tags, referral_token")
        .eq("email", email)
        .maybeSingle();

      isNewSubscriber = !existing;

      const mergedTags = Array.from(
        new Set([...(existing?.tags ?? []), ...mergedInputTags].filter(Boolean))
      );

      const { data: upserted, error } = await supabase
        .from("newsletter_subscribers")
        .upsert(
          {
            id: existing?.id,
            email,
            first_name: firstName || null,
            status: "active",
            source: source || null,
            tags: mergedTags,
            referrer_token: existing ? undefined : referrerToken ?? null,
            unsubscribed_at: null
          },
          { onConflict: "email" }
        )
        .select("referral_token")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      referralToken = upserted?.referral_token ?? existing?.referral_token ?? undefined;

      if (isNewSubscriber && referrerToken) {
        await recordReferralAndMaybeReward({
          supabase,
          refereeEmail: email,
          referrerToken,
          source
        });
      }

      subscriberCount = await getActiveRecipientCount(supabase);
    }
  }

  const providerFields: Record<string, unknown> = { source };
  if (referralToken) {
    providerFields.referral_token = referralToken;
  }

  await syncSubscriberToProvider({
    email,
    firstName,
    tags: mergedInputTags,
    fields: providerFields
  });

  const hasProvider = flags.hasMailerLite || flags.hasConvertKit;

  return {
    mode: flags.hasSupabaseAdmin || hasProvider ? "live" : "mock",
    subscriberCount,
    referralToken,
    isNewSubscriber,
    payload: {
      email,
      firstName,
      tags: mergedInputTags,
      fields: providerFields
    }
  };
}

export async function getReferralStats(referralToken: string) {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("first_name, referral_count, referral_tier")
    .eq("referral_token", referralToken)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    firstName: data.first_name as string | null,
    referralCount: (data.referral_count ?? 0) as number,
    referralTier: (data.referral_tier ?? 0) as number,
    tiers: REFERRAL_TIERS.map((tier) => ({
      tier: tier.tier,
      threshold: tier.threshold
    }))
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
