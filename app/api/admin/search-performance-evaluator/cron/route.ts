import { revalidatePath } from "next/cache";

import { runCronAutomationTask } from "@/lib/services/automation-control";
import { runSearchPerformanceEvaluator } from "@/lib/services/search-insights";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

class SearchPerformanceEvaluatorSkippedError extends Error {
  readonly result: {
    ok: false;
    skippedReason: string;
  };

  constructor(result: { ok: false; skippedReason: string }) {
    super(result.skippedReason);
    this.name = "SearchPerformanceEvaluatorSkippedError";
    this.result = result;
  }
}

function revalidateSearchEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
  revalidatePath("/admin/analytics/search-console");
}

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "search-performance-evaluator",
    triggerReference: pathname,
    inputPayload: {
      evaluationWindowDays: 7,
      includeExistingApplied: false
    },
    execute: async () => {
      const result = await runSearchPerformanceEvaluator({
        evaluationWindowDays: 7,
        includeExistingApplied: false
      });
      if (!result.ok) {
        throw new SearchPerformanceEvaluatorSkippedError(result);
      }

      return result;
    },
    onSuccess: () => {
      revalidateSearchEvaluationSurfaces();
    },
    summarize: (result) => ({
      summary:
        `Recorded ${result.evaluatedRecommendationCount} search evaluation verdict(s): ` +
        `${result.keepCount} keep, ${result.escalateCount} escalate, ${result.revertCount} revert.`,
      rowsCreated: result.evaluatedRecommendationCount,
      rowsUpdated: result.skippedExistingCount
    }),
    onErrorResponse: (error) => {
      if (error instanceof SearchPerformanceEvaluatorSkippedError) {
        return jsonResponse(error.result, { status: 503 });
      }

      return jsonResponse(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Search performance evaluator failed"
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
