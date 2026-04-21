import { queueSocialScheduler } from "@/lib/services/automation";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "pinterest-distributor",
    triggerReference: pathname,
    execute: queueSocialScheduler,
    summarize: (result) => ({
      summary: `Queued ${result.queued} social post(s) and published ${result.published}.`,
      rowsUpdated: result.queued,
      rowsPublished: result.published
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
