import { revalidatePath } from "next/cache";

import { runCronAutomationTask } from "@/lib/services/automation-control";
import { runPrepublishQaForScheduledContent } from "@/lib/services/prepublish-qa";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "prepublish-qa",
    triggerReference: pathname,
    execute: () =>
      runPrepublishQaForScheduledContent({
        dueOnly: false
      }),
    onSuccess: () => {
      revalidatePath("/admin/automation/agents");
      revalidatePath("/admin/automation/runs");
      revalidatePath("/admin/automation/trigger");
      revalidatePath("/admin/content/recipes");
      revalidatePath("/admin/content/blog");
      revalidatePath("/admin/content/reviews");
    },
    summarize: (result) => ({
      summary:
        `Prepublish QA reviewed ${result.reviewed} scheduled item(s), clearing ${result.ready} ` +
        `and blocking ${result.blocked}.`,
      rowsUpdated: result.reviewed
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
