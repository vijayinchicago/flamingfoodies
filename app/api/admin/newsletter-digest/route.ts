import { env } from "@/lib/env";
import { createWeeklyDigest } from "@/lib/services/automation";
import { processScheduledNewsletterCampaigns } from "@/lib/services/newsletter";
import { jsonResponse } from "@/lib/utils";

function authorize(request: Request) {
  if (!env.CRON_SECRET) return true;
  return request.headers.get("authorization") === `Bearer ${env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "draft";

  if (mode === "send_due") {
    const result = await processScheduledNewsletterCampaigns();
    return jsonResponse({ ok: true, requestMode: mode, ...result });
  }

  if (mode === "draft_and_send_due") {
    const [digest, sending] = await Promise.all([
      createWeeklyDigest(),
      processScheduledNewsletterCampaigns()
    ]);

    return jsonResponse({
      ok: true,
      requestMode: mode,
      digest,
      sending
    });
  }

  const result = await createWeeklyDigest();
  return jsonResponse({ ok: true, requestMode: mode, ...result });
}
