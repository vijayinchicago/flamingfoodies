import { revalidatePath } from "next/cache";

import { runFestivalDiscovery } from "@/lib/services/festival-discovery";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "festival-discovery",
    triggerReference: pathname,
    execute: runFestivalDiscovery,
    onSuccess: (result) => {
      // If new festivals were discovered, revalidate the hub page so the
      // draft count is visible in the admin dashboard.
      if (result.inserted > 0) {
        revalidatePath("/festivals");
      }
    },
    summarize: (result) => ({
      summary: `Discovered ${result.inserted} new festival draft(s) from ${result.found} candidate(s).`,
      rowsCreated: result.inserted
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
