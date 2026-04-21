import { revalidatePath } from "next/cache";

import { runCronAutomationTask } from "@/lib/services/automation-control";
import { runBrandDiscovery } from "@/lib/services/brand-monitor";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "brand-discovery",
    triggerReference: pathname,
    execute: runBrandDiscovery,
    onSuccess: () => {
      revalidatePath("/admin/automation/agents");
      revalidatePath("/admin/automation/trigger");
    },
    summarize: (result) => ({
      summary: `Inserted ${result.brandsInserted} discovered brand draft(s).`,
      rowsCreated: result.brandsInserted
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
