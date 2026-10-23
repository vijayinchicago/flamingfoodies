import config from "@/vercel.json";
import { requireCronAuthorization } from "@/lib/cron";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) return unauthorized;
  const jobs = [];
  for (const job of config.crons) {
    if (job.path === "/api/admin/automation-health") continue;
    const url = new URL(job.path, env.NEXT_PUBLIC_SITE_URL);
    url.searchParams.set("dry_run", "1");
    try {
      const response = await fetch(url, { headers: { authorization: `Bearer ${env.CRON_SECRET}` }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      const body = await response.json();
      jobs.push({ path: job.path, ready: response.ok && body.dryRun === true && body.ok === true, missing: body.missing, policy: body.policy });
    } catch {
      jobs.push({ path: job.path, ready: false, error: "Probe failed" });
    }
  }
  const ok = jobs.every(job => job.ready);
  const report = { event: "scheduled_agent_health", ok, jobs };
  if (ok) console.info(JSON.stringify(report));
  else console.error(JSON.stringify(report));
  return Response.json(report, { status: ok ? 200 : 503 });
}
