import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

type VercelConfig = {
  crons?: Array<{
    path: string;
    schedule: string;
  }>;
};

function readVercelConfig() {
  const raw = readFileSync(resolve(process.cwd(), "vercel.json"), "utf8");
  return JSON.parse(raw) as VercelConfig;
}

describe("vercel cron config", () => {
  it("runs the AI draft reevaluation pass before scheduled publishing", () => {
    const config = readVercelConfig();
    const reevaluateCron = config.crons?.find(
      (entry) => entry.path === "/api/admin/reevaluate-ai-drafts"
    );
    const publishCron = config.crons?.find(
      (entry) => entry.path === "/api/admin/publish-scheduled"
    );

    expect(reevaluateCron?.schedule).toBe("45 17 * * *");
    expect(publishCron?.schedule).toBe("0 18 * * *");
  });
});
