import { runContentShopSyncBatch } from "@/lib/services/content-shop-signals";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const { pathname, searchParams } = new URL(request.url);
  const windowDaysParam = searchParams.get("windowDays");
  const windowDays = windowDaysParam ? Number(windowDaysParam) : undefined;
  const task = await runCronAutomationTask({
    request,
    agentId: "content-shop-sync",
    triggerReference: pathname,
    inputPayload: {
      windowDays: windowDays ?? null
    },
    execute: () => runContentShopSyncBatch(windowDays),
    summarize: (result) => ({
      summary: `Processed ${result.processed} content item(s), finding ${result.totalMatches} matches and ${result.totalGaps} gaps.`,
      rowsUpdated: result.processed
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
