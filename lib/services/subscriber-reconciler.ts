import { env, flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const MAILERLITE_API_BASE = "https://connect.mailerlite.com/api";
const MAX_PAGES = 25; // protects against runaway loops; ~6,250 subs at 250/page

export type ReconcilerRunResult = {
  mode: "live" | "skipped";
  reason?: string;
  supabaseActiveCount: number;
  mailerLiteActiveCount: number;
  pushedToMailerLite: number;
  markedInactiveInSupabase: number;
  failures: number;
};

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

async function fetchAllMailerLiteSubscribersInGroup(groupId: string): Promise<{
  emails: Set<string>;
  inactiveEmails: Set<string>;
}> {
  const emails = new Set<string>();
  const inactiveEmails = new Set<string>();

  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(`${MAILERLITE_API_BASE}/subscribers`);
    url.searchParams.set("filter[group]", groupId);
    url.searchParams.set("limit", "250");
    if (cursor) url.searchParams.set("cursor", cursor);

    const resp = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.MAILERLITE_API_KEY}`
      }
    });

    if (!resp.ok) break;

    const json = (await resp.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json) break;
    const items = Array.isArray(json.data) ? (json.data as Array<Record<string, unknown>>) : [];

    for (const item of items) {
      const email = typeof item.email === "string" ? item.email.toLowerCase() : null;
      if (!email) continue;
      const status = typeof item.status === "string" ? item.status : "active";
      if (status === "active") {
        emails.add(email);
      } else {
        inactiveEmails.add(email);
      }
    }

    const meta = json.meta as Record<string, unknown> | undefined;
    const nextCursor =
      typeof meta?.next_cursor === "string"
        ? meta.next_cursor
        : typeof (json.links as Record<string, unknown> | undefined)?.next === "string"
          ? null // some MailerLite responses use links.next; cursor lives elsewhere
          : null;

    if (!nextCursor) break;
    cursor = nextCursor;
  }

  return { emails, inactiveEmails };
}

async function pushSubscriberToMailerLite(input: {
  email: string;
  firstName: string | null;
  referralToken: string | null;
  groupId: string;
}) {
  return fetch(`${MAILERLITE_API_BASE}/subscribers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${env.MAILERLITE_API_KEY}`
    },
    body: JSON.stringify({
      email: input.email,
      fields: {
        ...(input.firstName ? { name: input.firstName } : {}),
        ...(input.referralToken ? { referral_token: input.referralToken } : {})
      },
      groups: [input.groupId],
      status: "active"
    })
  });
}

export async function reconcileNewsletterSubscribers(): Promise<ReconcilerRunResult> {
  if (!flags.hasMailerLite) {
    return {
      mode: "skipped",
      reason: "MailerLite API key not configured.",
      supabaseActiveCount: 0,
      mailerLiteActiveCount: 0,
      pushedToMailerLite: 0,
      markedInactiveInSupabase: 0,
      failures: 0
    };
  }
  if (!flags.hasSupabaseAdmin) {
    return {
      mode: "skipped",
      reason: "Supabase admin not configured.",
      supabaseActiveCount: 0,
      mailerLiteActiveCount: 0,
      pushedToMailerLite: 0,
      markedInactiveInSupabase: 0,
      failures: 0
    };
  }

  const groupMap = getMailerLiteGroupMap();
  const groupId = groupMap["weekly-roundup"];
  if (!groupId) {
    return {
      mode: "skipped",
      reason: "MAILERLITE_GROUPS missing 'weekly-roundup' key.",
      supabaseActiveCount: 0,
      mailerLiteActiveCount: 0,
      pushedToMailerLite: 0,
      markedInactiveInSupabase: 0,
      failures: 0
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: "skipped",
      reason: "Supabase client unavailable.",
      supabaseActiveCount: 0,
      mailerLiteActiveCount: 0,
      pushedToMailerLite: 0,
      markedInactiveInSupabase: 0,
      failures: 0
    };
  }

  const { data: supabaseRows } = await supabase
    .from("newsletter_subscribers")
    .select("email, first_name, referral_token, status")
    .eq("status", "active");

  const supabaseActive = new Map<string, { firstName: string | null; referralToken: string | null }>();
  for (const row of supabaseRows ?? []) {
    if (typeof row.email !== "string") continue;
    supabaseActive.set(row.email.toLowerCase(), {
      firstName: (row.first_name as string | null) ?? null,
      referralToken: (row.referral_token as string | null) ?? null
    });
  }

  const { emails: mailerLiteActive, inactiveEmails: mailerLiteInactive } =
    await fetchAllMailerLiteSubscribersInGroup(groupId);

  // Direction A: Supabase active but missing from MailerLite → push to MailerLite
  let pushed = 0;
  let failures = 0;
  const supabaseActiveEntries = Array.from(supabaseActive.entries());
  for (const [email, fields] of supabaseActiveEntries) {
    if (mailerLiteActive.has(email)) continue;
    if (mailerLiteInactive.has(email)) continue; // they unsubscribed; respect that
    try {
      const resp = await pushSubscriberToMailerLite({
        email,
        firstName: fields.firstName,
        referralToken: fields.referralToken,
        groupId
      });
      if (resp.ok) pushed += 1;
      else failures += 1;
    } catch {
      failures += 1;
    }
  }

  // Direction B: MailerLite shows them as unsubscribed/bounced but Supabase
  // still says active → flip Supabase to unsubscribed (catches webhook misses)
  let markedInactive = 0;
  if (mailerLiteInactive.size > 0) {
    const candidateEmails = Array.from(mailerLiteInactive).filter((email) =>
      supabaseActive.has(email)
    );
    if (candidateEmails.length > 0) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          status: "unsubscribed",
          unsubscribed_at: new Date().toISOString()
        })
        .in("email", candidateEmails);
      if (!error) markedInactive = candidateEmails.length;
    }
  }

  return {
    mode: "live",
    supabaseActiveCount: supabaseActive.size,
    mailerLiteActiveCount: mailerLiteActive.size,
    pushedToMailerLite: pushed,
    markedInactiveInSupabase: markedInactive,
    failures
  };
}
