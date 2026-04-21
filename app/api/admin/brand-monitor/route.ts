import { revalidatePath } from "next/cache";
import { runBrandMonitor } from "@/lib/services/brand-monitor";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "brand-monitor",
    triggerReference: pathname,
    execute: runBrandMonitor,
    onSuccess: (result) => {
      if (result.releasesInserted > 0) revalidatePath("/new-releases");
    },
    summarize: (result) => ({
      summary: `Inserted ${result.brandsInserted} brand(s) and ${result.releasesInserted} release(s).`,
      rowsCreated: result.brandsInserted + result.releasesInserted,
      rowsPublished: result.releasesInserted
    })
  });

  if (!task.ok) {
    return task.response;
  }

  return jsonResponse({ ok: true, ...task.result });
}

export async function GET(request: Request) { return handleRequest(request); }
export async function POST(request: Request) { return handleRequest(request); }
