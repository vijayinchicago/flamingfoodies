import { runPepperDiscovery } from "@/lib/services/pepper-discovery";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "pepper-discovery",
    triggerReference: pathname,
    execute: runPepperDiscovery,
    summarize: (result) => ({
      summary: `Discovered ${result.inserted} new pepper draft(s) from ${result.found} candidate(s).`,
      rowsCreated: result.inserted
    })
  });

  if (!task.ok) {
    return task.response;
  }

  return jsonResponse({ ok: true, ...task.result });
}

export async function GET(request: Request) { return handleRequest(request); }
export async function POST(request: Request) { return handleRequest(request); }
