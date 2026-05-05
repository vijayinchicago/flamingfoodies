import { runCronAutomationTask } from "@/lib/services/automation-control";
import { reconcileNewsletterSubscribers } from "@/lib/services/subscriber-reconciler";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function handleRequest(request: Request) {
  const { pathname } = new URL(request.url);
  const task = await runCronAutomationTask({
    request,
    agentId: "subscriber-sync-reconciler",
    triggerReference: pathname,
    inputPayload: {},
    execute: async () => reconcileNewsletterSubscribers(),
    summarize: (result) => {
      if (result.mode === "skipped") {
        return {
          summary: `Subscriber reconcile skipped: ${result.reason ?? "unknown"}.`
        };
      }
      return {
        summary: `Reconciled subscribers: Supabase=${result.supabaseActiveCount}, MailerLite=${result.mailerLiteActiveCount}, pushed=${result.pushedToMailerLite}, marked-inactive=${result.markedInactiveInSupabase}, failures=${result.failures}.`,
        rowsUpdated: result.pushedToMailerLite + result.markedInactiveInSupabase
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
