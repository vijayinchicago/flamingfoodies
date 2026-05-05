import { runCronAutomationTask } from "@/lib/services/automation-control";
import { runReferralAttributionEvaluator } from "@/lib/services/referral-evaluator";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "referral-attribution-evaluator",
    triggerReference: pathname,
    inputPayload: {},
    execute: async () => runReferralAttributionEvaluator(),
    summarize: (result) => {
      if (result.mode === "skipped") {
        return {
          summary: `Referral attribution evaluator skipped: ${result.reason ?? "unknown"}.`
        };
      }
      return {
        summary: `Wrote ${result.insightsWritten} referral insight(s) over ${result.evaluationWindowDays}-day window.`,
        rowsCreated: result.insightsWritten
      };
    }
  });

  if (!task.ok) return task.response;
  return jsonResponse({ ok: true, ...task.result });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
