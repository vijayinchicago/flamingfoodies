import { z } from "zod";

import { env, flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const heatLevelSchema = z.enum(["mild", "medium", "hot", "inferno"]);

function buildRedirectUrl(level: string) {
  const base = env.NEXT_PUBLIC_SITE_URL || "https://flamingfoodies.com";
  return `${base.replace(/\/$/, "")}/recipes?heat=${level}&utm_source=flameclub&utm_medium=email&utm_campaign=welcome-1-instant&utm_content=heat-vote-${level}`;
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

async function tagSubscriberInMailerLite(input: { email: string; heatLevel: string }) {
  if (!flags.hasMailerLite) return;
  const groupMap = getMailerLiteGroupMap();
  // Heat-level keys are not in MAILERLITE_GROUPS by default — they'd need
  // their own MailerLite groups + entries in the env JSON. If absent, fall
  // back to setting a custom field instead, which always works.
  const groupId = groupMap[`heat-${input.heatLevel}`];

  if (groupId) {
    // Add to group via the upsert subscriber endpoint with groups array.
    await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${env.MAILERLITE_API_KEY}`
      },
      body: JSON.stringify({
        email: input.email,
        groups: [groupId],
        status: "active"
      })
    }).catch(() => {
      // best-effort; we still record the vote in Supabase
    });
    return;
  }

  // No matching group — set the custom field 'heat_level' instead.
  await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${env.MAILERLITE_API_KEY}`
    },
    body: JSON.stringify({
      email: input.email,
      fields: { heat_level: input.heatLevel },
      status: "active"
    })
  }).catch(() => {
    // best-effort
  });
}

async function recordVote(input: { email: string; heatLevel: string; source: string | null }) {
  if (!flags.hasSupabaseAdmin) return;
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase
    .from("subscriber_heat_votes")
    .upsert(
      {
        email: input.email,
        heat_level: input.heatLevel,
        source: input.source
      },
      { onConflict: "email,heat_level" }
    );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const levelParam = url.searchParams.get("level");
  const emailParam = url.searchParams.get("email");
  const source = url.searchParams.get("source");

  const parsedLevel = heatLevelSchema.safeParse(levelParam);
  if (!parsedLevel.success) {
    return Response.redirect(
      buildRedirectUrl("mild").replace("heat=mild", "heat=mild&heat-vote=invalid"),
      302
    );
  }

  const heatLevel = parsedLevel.data;

  // Email may be missing if the link is shared rather than clicked from the
  // original recipient's email. We still redirect — the analytics row just
  // won't be recorded for that click.
  if (emailParam) {
    try {
      await Promise.all([
        recordVote({ email: emailParam, heatLevel, source }),
        tagSubscriberInMailerLite({ email: emailParam, heatLevel })
      ]);
    } catch {
      // never block the redirect on attribution failures
    }
  }

  return Response.redirect(buildRedirectUrl(heatLevel), 302);
}
