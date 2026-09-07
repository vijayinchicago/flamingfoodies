import type { GenerationJob } from "@/lib/types";

export const GENERATION_TIMEOUT_MS = 6 * 60 * 1000;

type RunTimingInput = {
  startedAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  status: string;
};

export type GenerationChildJob = {
  id: number;
  type: string;
  title: string | null;
  slug: string | null;
  error: string | null;
  profile: string | null;
  cuisine: string | null;
  heatLevel: string | null;
  recipeLane: string | null;
  occurrences: number;
};

function parseTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getGenerationJobTiming(job: GenerationJob, nowMs = Date.now()) {
  const queuedAt = parseTimestamp(job.queuedAt);
  const startedAt = parseTimestamp(job.startedAt);
  const completedAt = parseTimestamp(job.completedAt);
  const activeEnd = completedAt ?? nowMs;

  return {
    queueDelayMs:
      queuedAt !== null && startedAt !== null ? Math.max(0, startedAt - queuedAt) : null,
    processingMs:
      startedAt !== null ? Math.max(0, activeEnd - startedAt) : null,
    totalMs: queuedAt !== null ? Math.max(0, activeEnd - queuedAt) : null,
    isOverdue:
      (job.status === "queued" || job.status === "generating") &&
      startedAt !== null &&
      nowMs - startedAt > GENERATION_TIMEOUT_MS
  };
}

export function getGenerationJobDiagnostic(job: GenerationJob, nowMs = Date.now()) {
  const error = job.errorMessage ?? "";
  const normalizedError = error.toLowerCase();
  const timing = getGenerationJobTiming(job, nowMs);

  if (timing.isOverdue) {
    return {
      label: "Overdue",
      message:
        "This job has exceeded the six-minute reconciliation window and is probably no longer executing."
    };
  }

  if (normalizedError.includes("not_found_error") || normalizedError.includes("model:")) {
    return {
      label: "Model unavailable",
      message: "Anthropic rejected the configured model ID before generating any content."
    };
  }

  if (normalizedError.includes("timed out") || normalizedError.includes("serverless duration")) {
    return {
      label: "Execution timeout",
      message:
        "The serverless request ended before the job completed. The recorded duration may include the later cleanup delay."
    };
  }

  if (normalizedError.includes("empty") && normalizedError.includes("payload")) {
    return {
      label: "Invalid model response",
      message: "The model returned text, but it could not be parsed into the required complete JSON object."
    };
  }

  if (normalizedError.includes("invalid") && normalizedError.includes("payload")) {
    return {
      label: "Schema validation failed",
      message: "The model response was JSON, but a required field did not pass content validation."
    };
  }

  if (job.status === "failed") {
    return {
      label: "Failed",
      message: error || "The job failed without a saved error message."
    };
  }

  return null;
}

export function getAutomationRunTiming(run: RunTimingInput, nowMs = Date.now()) {
  const startedAt = parseTimestamp(run.startedAt);
  const completedAt = parseTimestamp(run.completedAt);
  const elapsedMs =
    typeof run.durationMs === "number"
      ? run.durationMs
      : startedAt !== null
        ? Math.max(0, (completedAt ?? nowMs) - startedAt)
        : null;

  return {
    elapsedMs,
    isOverdue:
      run.status === "started" &&
      startedAt !== null &&
      nowMs - startedAt > GENERATION_TIMEOUT_MS
  };
}

export function getGenerationChildJobs(payload: unknown): GenerationChildJob[] {
  const record = toRecord(payload);
  const rawJobs = Array.isArray(record?.createdJobs) ? record.createdJobs : [];
  const jobsById = new Map<number, GenerationChildJob>();

  rawJobs.forEach((value) => {
    const job = toRecord(value);
    if (!job || typeof job.id !== "number") {
      return;
    }

    const existing = jobsById.get(job.id);
    const next: GenerationChildJob = {
      id: job.id,
      type: readString(job, "type") ?? existing?.type ?? "content",
      title: readString(job, "title") ?? existing?.title ?? null,
      slug: readString(job, "slug") ?? existing?.slug ?? null,
      error: readString(job, "error") ?? existing?.error ?? null,
      profile: readString(job, "profile") ?? existing?.profile ?? null,
      cuisine: readString(job, "scheduledCuisine") ?? existing?.cuisine ?? null,
      heatLevel: readString(job, "scheduledHeatLevel") ?? existing?.heatLevel ?? null,
      recipeLane: readString(job, "recipeLane") ?? existing?.recipeLane ?? null,
      occurrences: (existing?.occurrences ?? 0) + 1
    };

    jobsById.set(job.id, next);
  });

  return Array.from(jobsById.values());
}

export function getAutomationResultWarning(payload: unknown) {
  const record = toRecord(payload);
  if (!record) {
    return null;
  }

  const rootError = readString(record, "error");
  if (rootError) {
    return rootError;
  }

  const childJobs = getGenerationChildJobs(payload);
  const failedJobs = childJobs.filter((job) => job.error);
  if (failedJobs.length) {
    return `${failedJobs.length} of ${childJobs.length} child job(s) failed. ${failedJobs[0]?.error}`;
  }

  const failedPostIds = Array.isArray(record.failedPostIds)
    ? record.failedPostIds.filter((value): value is number => typeof value === "number")
    : [];
  if (failedPostIds.length) {
    return `${failedPostIds.length} social post(s) failed: ${failedPostIds.join(", ")}.`;
  }

  return readString(record, "skippedReason");
}
