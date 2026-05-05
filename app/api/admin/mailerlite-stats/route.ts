import { runCronAutomationTask } from "@/lib/services/automation-control";
import { refreshMailerLiteCampaignStats } from "@/lib/services/mailerlite-stats";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "mailerlite-stats-collector",
    triggerReference: pathname,
    inputPayload: {},
    execute: async () => refreshMailerLiteCampaignStats(),
    summarize: (result) => {
      if (result.mode === "skipped") {
        return {
          summary: `MailerLite stats refresh skipped: ${result.reason ?? "unknown"}.`
        };
      }
      return {
        summary: `Refreshed stats for ${result.campaignsUpdated}/${result.campaignsChecked} campaign(s); ${result.failures} failure(s).`,
        rowsUpdated: result.campaignsUpdated
      };
    }
  });

  if (!task.ok) return task.response;
  return jsonResponse({ ok: true, ...task.result });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
