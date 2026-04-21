import { revalidatePath } from "next/cache";

import {
  getSearchRuntimeOptimizationSnapshot,
  runSearchRecommendationExecutor
} from "@/lib/services/search-insights";
import {
  recordAutomationSnapshot,
  runCronAutomationTask
} from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

class SearchRecommendationExecutorSkippedError extends Error {
  readonly result: {
    ok: false;
    skippedReason: string;
  };

  constructor(result: { ok: false; skippedReason: string }) {
    super(result.skippedReason);
    this.name = "SearchRecommendationExecutorSkippedError";
    this.result = result;
  }
}

function revalidateSearchInsightSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/trigger");
  revalidatePath("/admin/analytics/search-console");
  revalidatePath("/blog");
  revalidatePath("/recipes");
  revalidatePath("/hot-sauces");
  revalidatePath("/hot-sauces/best-for-wings");
  revalidatePath("/hot-sauces/best-for-seafood");
  revalidatePath("/hot-sauces/best-for-fried-chicken");
  revalidatePath("/blog/how-to-choose-a-hot-sauce-for-seafood");
  revalidatePath("/recipes/nashville-hot-chicken-sandwiches");
}

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  let beforeRuntimeSnapshot: Awaited<ReturnType<typeof getSearchRuntimeOptimizationSnapshot>> | null =
    null;
  const task = await runCronAutomationTask({
    request,
    agentId: "search-recommendation-executor",
    triggerReference: pathname,
    execute: async () => {
      beforeRuntimeSnapshot = await getSearchRuntimeOptimizationSnapshot();
      const result = await runSearchRecommendationExecutor();
      if (!result.ok) {
        throw new SearchRecommendationExecutorSkippedError(result);
      }

      return result;
    },
    onSuccess: async (result, context) => {
      const afterRuntimeSnapshot = await getSearchRuntimeOptimizationSnapshot();
      await recordAutomationSnapshot(context?.run ?? null, {
        scope: "site_settings.search_runtime_optimizations",
        subjectKey: result.property,
        beforePayload: beforeRuntimeSnapshot,
        afterPayload: afterRuntimeSnapshot
      });
      revalidateSearchInsightSurfaces();
    },
    summarize: (result) => ({
      summary: `Applied ${result.appliedRecommendationCount} approved search recommendation(s).`,
      rowsPublished: result.appliedRecommendationCount,
      rowsUpdated: result.manualReviewRecommendationKeys.length
    }),
    onErrorResponse: (error) => {
      if (error instanceof SearchRecommendationExecutorSkippedError) {
        return jsonResponse(error.result, { status: 503 });
      }

      return jsonResponse(
        {
          ok: false,
          error:
            error instanceof Error ? error.message : "Search recommendation executor failed"
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
