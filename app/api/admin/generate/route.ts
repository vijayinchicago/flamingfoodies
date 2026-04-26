import { runGenerationPipeline } from "@/lib/services/automation";
import { runShopPickAutomation } from "@/lib/services/shop-automation";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handleRequest(request: Request) {
  const { pathname, searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "recipe";
  const qtyParam = searchParams.get("qty");
  const profileParam = searchParams.get("profile");
  const qty = qtyParam ? Number(qtyParam) : undefined;
  const profile = profileParam === "hot_sauce_recipe" ? "hot_sauce_recipe" : undefined;
  const inputPayload = {
    type,
    qty: qty ?? null,
    profile: profile ?? null
  };

  const task = await runCronAutomationTask({
    request,
    agentId: type === "merch_product" ? "shop-shelf-curator" : "editorial-autopublisher",
    triggerReference: pathname,
    inputPayload,
    execute: () =>
      type === "merch_product"
        ? runShopPickAutomation(qty, {
            source: "cron"
          })
        : runGenerationPipeline(type, qty, {
            source: "cron",
            profile
          }),
    summarize: (result) => ({
      summary: `Queued ${Array.isArray(result.createdJobs) ? result.createdJobs.length : 0} ${type} job(s).`,
      rowsCreated: Array.isArray(result.createdJobs) ? result.createdJobs.length : 0
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
