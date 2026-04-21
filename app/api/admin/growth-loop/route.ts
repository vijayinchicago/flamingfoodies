import { runCronAutomationTask } from "@/lib/services/automation-control";
import { queueGrowthLoopPromotions } from "@/lib/services/growth-loop";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const windowDays = 30;
  const task = await runCronAutomationTask({
    request,
    agentId: "growth-loop-promoter",
    triggerReference: pathname,
    inputPayload: {
      windowDays
    },
    execute: () => queueGrowthLoopPromotions(windowDays),
    summarize: (result) => ({
      summary: `Queued ${result.queuedPosts} growth-loop post(s) across ${result.queuedContent} content item(s).`,
      rowsPublished: result.queuedContent,
      rowsSent: result.queuedPosts
    })
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
