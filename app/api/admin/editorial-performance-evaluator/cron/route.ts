import { revalidatePath } from "next/cache";

import { runCronAutomationTask } from "@/lib/services/automation-control";
import {
  DEFAULT_EDITORIAL_EVALUATION_WINDOW_DAYS,
  runEditorialPerformanceEvaluator
} from "@/lib/services/editorial-performance-evaluator";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

class EditorialPerformanceEvaluatorSkippedError extends Error {
  readonly result: {
    ok: false;
    skippedReason: string;
  };

  constructor(result: { ok: false; skippedReason: string }) {
    super(result.skippedReason);
    this.name = "EditorialPerformanceEvaluatorSkippedError";
    this.result = result;
  }
}

function revalidateEditorialEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
}

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "editorial-performance-evaluator",
    triggerReference: pathname,
    inputPayload: {
      evaluationWindowDays: DEFAULT_EDITORIAL_EVALUATION_WINDOW_DAYS,
      allowImmatureRuns: false
    },
    execute: async () => {
      const result = await runEditorialPerformanceEvaluator({
        evaluationWindowDays: DEFAULT_EDITORIAL_EVALUATION_WINDOW_DAYS,
        allowImmatureRuns: false
      });
      if (!result.ok) {
        throw new EditorialPerformanceEvaluatorSkippedError(result);
      }

      return result;
    },
    onSuccess: () => {
      revalidateEditorialEvaluationSurfaces();
    },
    summarize: (result) => ({
      summary:
        `Recorded ${result.evaluatedContentCount} editorial evaluation verdict(s): ` +
        `${result.keepCount} keep, ${result.escalateCount} escalate, ${result.revertCount} revert.`,
      rowsCreated: result.evaluatedContentCount,
      rowsUpdated: result.skippedExistingCount
    }),
    onErrorResponse: (error) => {
      if (error instanceof EditorialPerformanceEvaluatorSkippedError) {
        return jsonResponse(error.result, { status: 503 });
      }

      return jsonResponse(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Editorial performance evaluator failed"
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
