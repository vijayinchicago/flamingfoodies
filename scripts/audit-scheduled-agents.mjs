#!/usr/bin/env node
// Credentials stay in memory; output contains readiness only. Requires an
// already-authenticated Vercel CLI, never an env-file export.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const scope = "vijayinchicagos-projects";
function api(path) {
  return JSON.parse(execFileSync("vercel", ["api", path, "--scope", scope], {
    encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
  }));
}
const reports = [];
for (const [name, site] of [["flamingfoodies", "https://flamingfoodies.com"], ["bark-and-baste", "https://barkandbaste.com"]]) {
  const project = api(`/v9/projects/${name}`);
  const secretId = project.env.find(entry => entry.key === "CRON_SECRET" && entry.target.includes("production"))?.id;
  if (!secretId) throw new Error(`${name}: CRON_SECRET is absent`);
  const secret = api(`/v1/projects/${project.id}/env/${secretId}`).value;
  const jobs = [];
  for (const definition of project.crons?.definitions ?? []) {
    if (definition.path === "/api/admin/automation-health") continue;
    const url = new URL(definition.path, site);
    url.searchParams.set("dry_run", "1");
    const response = await fetch(url, { headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(30000) });
    let body;
    try { body = await response.json(); } catch { body = {}; }
    const isProbe = body.dryRun === true || body.summary === "Read-only scheduler probe passed." || body.status === "blocked";
    jobs.push({ path: definition.path, schedule: definition.schedule, status: response.status,
      ready: response.ok && isProbe && (body.ok === true || body.status === "succeeded"),
      reason: body.missing?.length ? body.missing.join(", ") : body.policy ?? body.summary ?? "Probe contract missing" });
  }
  reports.push({ project: name, checkedAt: new Date().toISOString(), schedulerEnabled: project.crons?.disabledAt === null, jobs });
}
const output = JSON.stringify(reports, null, 2);
const reportIndex = process.argv.indexOf("--report");
if (reportIndex >= 0 && process.argv[reportIndex + 1]) writeFileSync(process.argv[reportIndex + 1], output + "\n", { mode: 0o600 });
console.log(output);
process.exitCode = reports.some(report => !report.schedulerEnabled || report.jobs.some(job => !job.ready)) ? 1 : 0;
