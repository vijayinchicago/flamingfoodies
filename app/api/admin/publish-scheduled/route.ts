import { revalidatePath } from "next/cache";

import { publishScheduledContent } from "@/lib/services/automation";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "editorial-autopublisher",
    triggerReference: pathname,
    execute: publishScheduledContent,
    onSuccess: (result) => {
      revalidatePath("/blog");
      revalidatePath("/recipes");
      revalidatePath("/reviews");

      for (const item of result.published) {
        if (item.type === "blog_post") revalidatePath(`/blog/${item.slug}`);
        if (item.type === "recipe") revalidatePath(`/recipes/${item.slug}`);
        if (item.type === "review") revalidatePath(`/reviews/${item.slug}`);
      }
    },
    summarize: (result) => ({
      summary:
        `Published ${result.published.length} scheduled item(s) and blocked ` +
        `${result.blocked.length} failing prepublish QA.`,
      rowsPublished: result.published.length,
      rowsUpdated: result.blocked.length
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
