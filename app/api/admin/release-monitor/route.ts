import { revalidatePath } from "next/cache";

import { runCronAutomationTask } from "@/lib/services/automation-control";
import { runReleaseMonitor } from "@/lib/services/brand-monitor";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "release-monitor",
    triggerReference: pathname,
    execute: (context) =>
      runReleaseMonitor({
        sourceRunId: context?.run?.id ?? null
      }),
    onSuccess: () => {
      revalidatePath("/admin/automation/approvals");
      revalidatePath("/admin/automation/agents");
      revalidatePath("/admin/automation/trigger");
    },
    summarize: (result) => ({
      summary: `Queued ${result.approvalsCreated} release approval(s) and refreshed ${result.approvalsUpdated}.`,
      rowsCreated: result.approvalsCreated,
      rowsUpdated: result.approvalsUpdated
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
