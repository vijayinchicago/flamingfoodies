import { createWeeklyDigest } from "@/lib/services/automation";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { processScheduledNewsletterCampaigns } from "@/lib/services/newsletter";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

type NewsletterRequestMode = "draft" | "send_due" | "draft_and_send_due";
type NewsletterDraftResult = Awaited<ReturnType<typeof createWeeklyDigest>>;
type NewsletterSendingResult = Awaited<ReturnType<typeof processScheduledNewsletterCampaigns>>;
type NewsletterCronResult =
  | ({
      requestMode: "draft";
    } & NewsletterDraftResult)
  | ({
      requestMode: "send_due";
    } & NewsletterSendingResult)
  | {
      requestMode: "draft_and_send_due";
      digest: NewsletterDraftResult;
      sending: NewsletterSendingResult;
    };

async function handleRequest(request: Request) {
  const { pathname, searchParams } = new URL(request.url);
  const rawMode = searchParams.get("mode");
  const mode: NewsletterRequestMode =
    rawMode === "send_due" || rawMode === "draft_and_send_due" ? rawMode : "draft";
  const task = await runCronAutomationTask({
    request,
    agentId: "newsletter-digest-agent",
    triggerReference: pathname,
    inputPayload: {
      mode
    },
    execute: async (): Promise<NewsletterCronResult> => {
      if (mode === "send_due") {
        return {
          requestMode: mode,
          ...await processScheduledNewsletterCampaigns()
        };
      }

      if (mode === "draft_and_send_due") {
        const [digest, sending] = await Promise.all([
          createWeeklyDigest(),
          processScheduledNewsletterCampaigns()
        ]);

        return {
          requestMode: mode,
          digest,
          sending
        };
      }

      return {
        requestMode: mode,
        ...await createWeeklyDigest()
      };
    },
    summarize: (result) => {
      if (result.requestMode === "draft_and_send_due") {
        return {
          summary: `Drafted newsletter digest and processed ${result.sending.processed} scheduled campaign(s).`,
          rowsCreated: result.digest.draftCount,
          rowsSent: result.sending.sent
        };
      }

      if (result.requestMode === "send_due") {
        return {
          summary: `Processed ${result.processed} scheduled newsletter campaign(s) and sent ${result.sent}.`,
          rowsUpdated: result.processed,
          rowsSent: result.sent
        };
      }

      return {
        summary: `Drafted ${result.draftCount} newsletter digest(s).`,
        rowsCreated: result.draftCount
      };
    }
  });

  if (!task.ok) {
    return task.response;
  }

  return jsonResponse({ ok: true, ...task.result });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
