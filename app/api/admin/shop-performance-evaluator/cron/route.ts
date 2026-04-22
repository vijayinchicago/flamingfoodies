import { revalidatePath } from "next/cache";

import { runCronAutomationTask } from "@/lib/services/automation-control";
import {
  DEFAULT_SHOP_EVALUATION_WINDOW_DAYS,
  runShopPerformanceEvaluator
} from "@/lib/services/shop-performance-evaluator";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

class ShopPerformanceEvaluatorSkippedError extends Error {
  readonly result: {
    ok: false;
    skippedReason: string;
  };

  constructor(result: { ok: false; skippedReason: string }) {
    super(result.skippedReason);
    this.name = "ShopPerformanceEvaluatorSkippedError";
    this.result = result;
  }
}

function revalidateShopEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
}

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "shop-performance-evaluator",
    triggerReference: pathname,
    inputPayload: {
      evaluationWindowDays: DEFAULT_SHOP_EVALUATION_WINDOW_DAYS,
      allowImmatureRuns: false
    },
    execute: async () => {
      const result = await runShopPerformanceEvaluator({
        evaluationWindowDays: DEFAULT_SHOP_EVALUATION_WINDOW_DAYS,
        allowImmatureRuns: false
      });
      if (!result.ok) {
        throw new ShopPerformanceEvaluatorSkippedError(result);
      }

      return result;
    },
    onSuccess: () => {
      revalidateShopEvaluationSurfaces();
    },
    summarize: (result) => ({
      summary:
        `Recorded ${result.evaluatedContentCount} shop evaluation verdict(s): ` +
        `${result.keepCount} keep, ${result.escalateCount} escalate, ${result.revertCount} revert.`,
      rowsCreated: result.evaluatedContentCount,
      rowsUpdated: result.skippedExistingCount
    }),
    onErrorResponse: (error) => {
      if (error instanceof ShopPerformanceEvaluatorSkippedError) {
        return jsonResponse(error.result, { status: 503 });
      }

      return jsonResponse(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Shop performance evaluator failed"
        },
        { status: 500 }
      );
    }
  });

  if (!task.ok) {
    return task.response;
  }

  return jsonResponse(task.result);
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
