import { describe, expect, it } from "vitest";

import {
  getAutomationResultWarning,
  getAutomationRunTiming,
  getGenerationChildJobs,
  getGenerationJobDiagnostic,
  getGenerationJobTiming
} from "@/lib/services/run-diagnostics";
import type { GenerationJob } from "@/lib/types";

const baseJob: GenerationJob = {
  id: 857,
  jobType: "recipe",
  status: "failed",
  attempts: 1,
  queuedAt: "2026-09-07T06:04:27.529Z",
  startedAt: "2026-09-07T06:04:27.546Z",
  completedAt: "2026-09-07T07:00:27.703Z"
};

describe("run diagnostics", () => {
  it("explains timeout cleanup and calculates recorded timing", () => {
    const job = {
      ...baseJob,
      errorMessage: "Generation job timed out after 6 minutes and was marked failed automatically."
    };

    expect(getGenerationJobTiming(job).processingMs).toBe(3_360_157);
    expect(getGenerationJobDiagnostic(job)).toMatchObject({
      label: "Execution timeout"
    });
  });

  it("flags a stale open automation run", () => {
    const timing = getAutomationRunTiming(
      {
        startedAt: "2026-09-07T06:00:00.000Z",
        status: "started"
      },
      new Date("2026-09-07T06:07:00.000Z").getTime()
    );

    expect(timing.isOverdue).toBe(true);
    expect(timing.elapsedMs).toBe(420_000);
  });

  it("deduplicates retry entries and surfaces child failures", () => {
    const payload = {
      createdJobs: [
        { id: 845, type: "recipe", error: "model unavailable" },
        { id: 845, type: "recipe", error: "model unavailable" },
        { id: 846, type: "recipe", title: "Completed recipe" }
      ]
    };

    expect(getGenerationChildJobs(payload)).toEqual([
      expect.objectContaining({ id: 845, occurrences: 2, error: "model unavailable" }),
      expect.objectContaining({ id: 846, occurrences: 1, title: "Completed recipe" })
    ]);
    expect(getAutomationResultWarning(payload)).toBe(
      "1 of 2 child job(s) failed. model unavailable"
    );
  });

  it("surfaces a root payload error even when the run status says succeeded", () => {
    expect(getAutomationResultWarning({ error: "Unexpected token I" })).toBe(
      "Unexpected token I"
    );
  });
});
