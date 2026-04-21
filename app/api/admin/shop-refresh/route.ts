import {
  recordAutomationSnapshot,
  runCronAutomationTask
} from "@/lib/services/automation-control";
import {
  getShopShelfSnapshot,
  runShopCatalogRefresh
} from "@/lib/services/shop-automation";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const { pathname, searchParams } = new URL(request.url);
  const windowDaysParam = searchParams.get("windowDays");
  const windowDays = windowDaysParam ? Number(windowDaysParam) : undefined;
  let beforeShelfSnapshot: Awaited<ReturnType<typeof getShopShelfSnapshot>> | null = null;
  const task = await runCronAutomationTask({
    request,
    agentId: "shop-shelf-curator",
    triggerReference: pathname,
    inputPayload: {
      windowDays: windowDays ?? null
    },
    execute: async () => {
      beforeShelfSnapshot = await getShopShelfSnapshot();
      return runShopCatalogRefresh({
        source: "cron",
        windowDays
      });
    },
    onSuccess: async (_result, context) => {
      const afterShelfSnapshot = await getShopShelfSnapshot();
      await recordAutomationSnapshot(context?.run ?? null, {
        scope: "merch_products.shop_shelf",
        subjectKey: "shop-picks",
        beforePayload: beforeShelfSnapshot,
        afterPayload: afterShelfSnapshot
      });
    },
    summarize: (result) => ({
      summary: `Refreshed shop catalog with ${result.created} created and ${result.updated} updated item(s).`,
      rowsCreated: result.created,
      rowsUpdated: result.updated
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
