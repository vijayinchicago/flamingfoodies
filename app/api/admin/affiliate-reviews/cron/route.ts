import { AFFILIATE_REVIEW_AGENT } from "@/lib/affiliate-review";
import { runCronAutomationTask } from "@/lib/services/automation-control";
import { runAffiliateProductReviewer, summarizeAffiliateReview } from "@/lib/services/affiliate-reviews";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const task = await runCronAutomationTask({
    request, agentId: AFFILIATE_REVIEW_AGENT,
    triggerReference: "/api/admin/affiliate-reviews/cron",
    inputPayload: { quantity: 1, draftOnly: true },
    execute: (context) => runAffiliateProductReviewer({
      invocationKey: `cron:${new Date().toISOString().slice(0, 10)}`, run: context?.run
    }),
    summarize: summarizeAffiliateReview,
    onErrorResponse: (error) => jsonResponse({ ok: false, error: error instanceof Error ? error.message : "Review generation failed" }, { status: 500 })
  });
  return task.ok ? jsonResponse({ ok: true, ...task.result }) : task.response;
}
