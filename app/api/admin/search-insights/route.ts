import { revalidatePath } from "next/cache";

import { runSearchInsightsAutomation } from "@/lib/services/search-insights";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

class SearchInsightsSkippedError extends Error {
  readonly result: {
    ok: false;
    skippedReason: string;
  };

  constructor(result: { ok: false; skippedReason: string }) {
    super(result.skippedReason);
    this.name = "SearchInsightsSkippedError";
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
  const task = await runCronAutomationTask({
    request,
    agentId: "search-insights-analyst",
    triggerReference: pathname,
    execute: async () => {
      const result = await runSearchInsightsAutomation();
      if (!result.ok) {
        throw new SearchInsightsSkippedError(result);
      }

      return result;
    },
    onSuccess: () => {
      revalidateSearchInsightSurfaces();
    },
    summarize: (result) => ({
      summary: `Synced Search Console recommendations for ${result.property}.`,
      rowsCreated: result.newRecommendationCount
    }),
    onErrorResponse: (error) => {
      if (error instanceof SearchInsightsSkippedError) {
        return jsonResponse(error.result, { status: 503 });
      }

      return jsonResponse(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Search insights automation failed"
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
