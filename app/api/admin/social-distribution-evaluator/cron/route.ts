import { revalidatePath } from "next/cache";

import { runCronAutomationTask } from "@/lib/services/automation-control";
import {
  DEFAULT_SOCIAL_EVALUATION_WINDOW_DAYS,
  runSocialDistributionEvaluator
} from "@/lib/services/social-distribution-evaluator";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

class SocialDistributionEvaluatorSkippedError extends Error {
  readonly result: {
    ok: false;
    skippedReason: string;
  };

  constructor(result: { ok: false; skippedReason: string }) {
    super(result.skippedReason);
    this.name = "SocialDistributionEvaluatorSkippedError";
    this.result = result;
  }
}

function revalidateSocialEvaluationSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/runs");
  revalidatePath("/admin/automation/trigger");
}

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "social-distribution-evaluator",
    triggerReference: pathname,
    inputPayload: {
      evaluationWindowDays: DEFAULT_SOCIAL_EVALUATION_WINDOW_DAYS,
      allowImmatureRuns: false
    },
    execute: async () => {
      const result = await runSocialDistributionEvaluator({
        evaluationWindowDays: DEFAULT_SOCIAL_EVALUATION_WINDOW_DAYS,
        allowImmatureRuns: false
      });
      if (!result.ok) {
        throw new SocialDistributionEvaluatorSkippedError(result);
      }

      return result;
    },
    onSuccess: () => {
      revalidateSocialEvaluationSurfaces();
    },
    summarize: (result) => ({
      summary:
        `Recorded ${result.evaluatedPostCount} social evaluation verdict(s): ` +
        `${result.keepCount} keep, ${result.escalateCount} escalate, ${result.revertCount} revert.`,
      rowsCreated: result.evaluatedPostCount,
      rowsUpdated: result.skippedExistingCount
    }),
    onErrorResponse: (error) => {
      if (error instanceof SocialDistributionEvaluatorSkippedError) {
        return jsonResponse(error.result, { status: 503 });
      }

      return jsonResponse(
        {
          ok: false,
          error:
            error instanceof Error ? error.message : "Social distribution evaluator failed"
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
