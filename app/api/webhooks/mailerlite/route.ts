import { z } from "zod";

import { flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

// MailerLite sends webhooks as POST with JSON body. Different event types
// have different shapes; we handle the lifecycle ones we care about for
// keeping our Supabase mirror in sync. Everything else returns 200 (ack)
// so MailerLite doesn't retry forever.
//
// Set the webhook URL in MailerLite Account → Integrations → Webhooks for:
//   - subscriber.unsubscribed
//   - subscriber.bounced
//   - subscriber.spam_complaint
//
// Note: MailerLite does not currently sign webhook payloads on the free
// plan, so we accept all hits and only mutate based on parsed event shape.
// If/when signing is available, validate the X-MailerLite-Signature header
// with a shared secret stored in env.

const subscriberSchema = z.object({
  email: z.string().email().optional(),
  fields: z
    .object({
      email: z.string().email().optional()
    })
    .partial()
    .optional()
});

const eventSchema = z.object({
  event: z.string().optional(),
  type: z.string().optional(),
  data: z
    .object({
      subscriber: subscriberSchema.optional(),
      email: z.string().email().optional()
    })
    .partial()
    .optional()
});

type SubscriberStatusUpdate = "unsubscribed" | "bounced";

function resolveStatus(eventName?: string): SubscriberStatusUpdate | null {
  if (!eventName) return null;
  const lower = eventName.toLowerCase();
  if (lower.includes("unsubscribe")) return "unsubscribed";
  if (lower.includes("bounce")) return "bounced";
  if (lower.includes("spam") || lower.includes("complaint")) return "unsubscribed";
  return null;
}

function extractEmail(body: unknown): string | null {
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return null;
  const data = parsed.data.data;
  return (
    data?.subscriber?.email
    ?? data?.subscriber?.fields?.email
    ?? data?.email
    ?? null
  );
}

async function handleSingleEvent(event: unknown) {
  const eventName = (() => {
    if (event && typeof event === "object") {
      const record = event as Record<string, unknown>;
      const value = record.event ?? record.type;
      return typeof value === "string" ? value : null;
    }
    return null;
  })();

  const status = resolveStatus(eventName ?? undefined);
  if (!status) return { skipped: true, reason: "event-not-actionable" };

  const email = extractEmail(event);
  if (!email) return { skipped: true, reason: "email-not-found" };

  if (!flags.hasSupabaseAdmin) return { skipped: true, reason: "supabase-not-configured" };

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { skipped: true, reason: "supabase-client-unavailable" };

  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({
      status,
      unsubscribed_at: status === "unsubscribed" ? new Date().toISOString() : null
    })
    .eq("email", email);

  if (error) {
    return { skipped: false, error: error.message };
  }

  return { skipped: false, email, status };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  // MailerLite sometimes sends single events, sometimes batched arrays under
  // a top-level `events` key. Normalize both to a uniform list.
  const events = Array.isArray(body)
    ? body
    : body && typeof body === "object" && Array.isArray((body as Record<string, unknown>).events)
      ? ((body as Record<string, unknown>).events as unknown[])
      : [body];

  const results = await Promise.all(events.map((event) => handleSingleEvent(event)));

  return jsonResponse({ ok: true, processed: results.length, results });
}

// Some webhook providers ping the URL with GET to verify reachability.
export async function GET() {
  return jsonResponse({ ok: true, service: "mailerlite-webhook" });
}
