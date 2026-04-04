import { requireCronAuthorization } from "@/lib/cron";
import { createWeeklyDigest } from "@/lib/services/automation";
import { processScheduledNewsletterCampaigns } from "@/lib/services/newsletter";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
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

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
