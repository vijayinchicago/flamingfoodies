import { revalidatePath } from "next/cache";

import { reevaluatePendingAiDraftsForAutopublish } from "@/lib/services/automation";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "editorial-autopublisher",
    triggerReference: pathname,
    inputPayload: {
      publishDueAfterReevaluation: true
    },
    execute: () =>
      reevaluatePendingAiDraftsForAutopublish({
        publishDueAfterReevaluation: true
      }),
    onSuccess: (result) => {
      revalidatePath("/admin/automation/jobs");
      revalidatePath("/admin/automation/trigger");
      revalidatePath("/admin/automation/agents");
      revalidatePath("/admin/content/recipes");
      revalidatePath("/admin/content/blog");
      revalidatePath("/admin/content/reviews");
      revalidatePath("/blog");
      revalidatePath("/recipes");
      revalidatePath("/reviews");

      for (const item of result.items) {
        if (item.type === "blog_post") revalidatePath(`/blog/${item.slug}`);
        if (item.type === "recipe") revalidatePath(`/recipes/${item.slug}`);
        if (item.type === "review") revalidatePath(`/reviews/${item.slug}`);
      }
    },
    summarize: (result) => ({
      summary: `Reevaluated ${result.reviewed} AI draft(s), promoting ${result.promoted} and publishing ${result.published}.`,
      rowsUpdated: result.reviewed,
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
