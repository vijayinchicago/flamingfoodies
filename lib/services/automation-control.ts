import { requireCronAuthorization } from "@/lib/cron";
import { flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { jsonResponse } from "@/lib/utils";

export type AutomationAgentId =
  | "editorial-autopublisher"
  | "pinterest-distributor"
  | "growth-loop-promoter"
  | "shop-shelf-curator"
  | "newsletter-digest-agent"
  | "search-insights-analyst"
  | "search-recommendation-executor"
  | "festival-discovery"
  | "pepper-discovery"
  | "brand-monitor"
  | "tutorial-generator"
  | "content-shop-sync";

export type AutomationTriggerSource =
  | "cron"
  | "manual"
  | "admin_action"
  | "callback"
  | "system";

export type AutomationRiskClass =
  | "draft_only"
  | "bounded_live"
  | "external_send"
  | "approval_required"
  | "internal_support";

export type AutomationAutonomyMode =
  | "disabled"
  | "draft_only"
  | "approval_required"
  | "bounded_live"
  | "external_send";

export type AutomationRollbackStrategy =
  | "none"
  | "rebuild_from_source"
  | "restore_snapshot"
  | "manual_only";

type AutomationExecutionBlockCode =
  | "paused"
  | "disabled"
  | "run_cap"
  | "mutation_cap"
  | "external_send_cap"
  | "failure_threshold";

export type AutomationManualTaskErrorCode = AutomationExecutionBlockCode | "failed";

type AutomationAgentRow = {
  agent_id: string;
  name: string;
  category: string | null;
  risk_class: string | null;
  autonomy_mode: string | null;
  is_enabled: boolean | null;
  requires_manual_approval: boolean | null;
  schedule_cron: string | null;
  owner: string | null;
  daily_run_cap: number | null;
  daily_mutation_cap: number | null;
  daily_external_send_cap: number | null;
  quiet_hours_start_et: number | null;
  quiet_hours_end_et: number | null;
  max_consecutive_failures: number | null;
  alert_after_minutes: number | null;
  rollback_strategy: string | null;
  config: unknown;
  created_at: string | null;
  updated_at: string | null;
};

export type AutomationAgentRecord = {
  agentId: AutomationAgentId;
  name: string;
  category: string;
  riskClass: AutomationRiskClass;
  autonomyMode: AutomationAutonomyMode;
  isEnabled: boolean;
  requiresManualApproval: boolean;
  scheduleCron: string | null;
  owner: string | null;
  dailyRunCap: number | null;
  dailyMutationCap: number | null;
  dailyExternalSendCap: number | null;
  quietHoursStartEt: number | null;
  quietHoursEndEt: number | null;
  maxConsecutiveFailures: number;
  alertAfterMinutes: number;
  rollbackStrategy: AutomationRollbackStrategy;
  config: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
};

type AutomationInsertedRunRow = {
  id: number;
};

type AutomationRunRow = {
  id: number;
  agent_id: string;
  trigger_source: string;
  trigger_reference: string | null;
  environment: string | null;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  summary: string | null;
  error_message: string | null;
  rows_created: number | null;
  rows_updated: number | null;
  rows_published: number | null;
  rows_sent: number | null;
  external_actions_count: number | null;
  created_by_admin_id: string | null;
  rollback_run_id: number | null;
  created_at: string | null;
};

type AutomationRunEventLevel = "info" | "warning" | "error";

export type AutomationRunStatus =
  | "started"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "blocked"
  | "rolled_back";

export type AutomationRunRecord = {
  id: number;
  agentId: AutomationAgentId;
  triggerSource: AutomationTriggerSource;
  triggerReference: string | null;
  environment: string;
  status: AutomationRunStatus;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  summary: string | null;
  errorMessage: string | null;
  rowsCreated: number;
  rowsUpdated: number;
  rowsPublished: number;
  rowsSent: number;
  externalActionsCount: number;
  createdByAdminId: string | null;
  rollbackRunId: number | null;
  createdAt: string | null;
};

type AutomationRunHandle = {
  id: number;
  agentId: AutomationAgentId;
  startedAt: string;
};

type AutomationRunSummaryInput = {
  summary?: string | null;
  resultPayload?: unknown;
  rowsCreated?: number;
  rowsUpdated?: number;
  rowsPublished?: number;
  rowsSent?: number;
  externalActionsCount?: number;
};

type AutomationExecutionContext = {
  run: AutomationRunHandle | null;
};

type CronAutomationTaskOptions<TResult> = {
  request: Request;
  agentId: AutomationAgentId;
  triggerReference?: string | null;
  inputPayload?: Record<string, unknown>;
  execute: (context?: AutomationExecutionContext) => Promise<TResult>;
  onSuccess?: (result: TResult, context?: AutomationExecutionContext) => Promise<void> | void;
  summarize?: (result: TResult, context?: AutomationExecutionContext) => AutomationRunSummaryInput;
  onErrorResponse?: (error: unknown) => Response;
};

type ManualAutomationTaskOptions<TResult> = {
  agentId: AutomationAgentId;
  adminId?: string | null;
  triggerReference?: string | null;
  inputPayload?: Record<string, unknown>;
  execute: (context?: AutomationExecutionContext) => Promise<TResult>;
  onSuccess?: (result: TResult, context?: AutomationExecutionContext) => Promise<void> | void;
  summarize?: (result: TResult, context?: AutomationExecutionContext) => AutomationRunSummaryInput;
  onErrorMessage?: (error: unknown) => string;
};

function currentEnvironment() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset"
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  const match = formatted?.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);

  return sign * (hours * 60 + minutes) * 60 * 1000;
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 1);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 1);

  return { year, month, day };
}

function addCalendarDays(parts: { year: number; month: number; day: number }, days: number) {
  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0));

  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate()
  };
}

function zonedDateTimeToUtc(
  parts: { year: number; month: number; day: number },
  hour: number,
  minute: number,
  timeZone: string
) {
  const guess = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, 0));
  const offsetMs = getTimeZoneOffsetMs(guess, timeZone);
  return new Date(guess.getTime() - offsetMs);
}

function getEtDayBounds(now = new Date()) {
  const timeZone = "America/New_York";
  const today = getZonedDateParts(now, timeZone);
  const tomorrow = addCalendarDays(today, 1);
  const startLocal = zonedDateTimeToUtc(today, 0, 0, timeZone);
  const nextDay = zonedDateTimeToUtc(tomorrow, 0, 0, timeZone);

  return {
    start: startLocal.toISOString(),
    end: nextDay.toISOString()
  };
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return null;
  }

  const value = (error as { code?: unknown }).code;
  return typeof value === "string" ? value : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value : "";
  }

  return typeof error === "string" ? error : "";
}

function isMissingAutomationControlRelationError(error: unknown) {
  const code = getErrorCode(error);
  const message = getErrorMessage(error).toLowerCase();

  if (code === "42P01" || code === "PGRST205") {
    return true;
  }

  return (
    message.includes("automation_agents")
    || message.includes("automation_runs")
    || message.includes("automation_run_events")
    || message.includes("automation_state_snapshots")
  ) && (message.includes("does not exist") || message.includes("not found"));
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message
    };
  }

  return {
    message: getErrorMessage(error) || "Unknown automation error"
  };
}

function toJsonValue(value: unknown) {
  if (value === undefined) {
    return {};
  }

  try {
    return JSON.parse(
      JSON.stringify(value, (_key, currentValue) => {
        if (typeof currentValue === "bigint") {
          return Number(currentValue);
        }

        if (currentValue instanceof Error) {
          return serializeError(currentValue);
        }

        return currentValue;
      })
    ) as unknown;
  } catch {
    return {};
  }
}

function toRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function parseAutomationAgent(row: AutomationAgentRow | null): AutomationAgentRecord | null {
  if (
    !row?.agent_id ||
    !row.name ||
    !row.category ||
    !row.risk_class ||
    !row.autonomy_mode ||
    !row.rollback_strategy
  ) {
    return null;
  }

  return {
    agentId: row.agent_id as AutomationAgentId,
    name: row.name,
    category: row.category,
    riskClass: row.risk_class as AutomationRiskClass,
    autonomyMode: row.autonomy_mode as AutomationAutonomyMode,
    isEnabled: row.is_enabled !== false,
    requiresManualApproval: row.requires_manual_approval === true,
    scheduleCron: row.schedule_cron ?? null,
    owner: row.owner ?? null,
    dailyRunCap: typeof row.daily_run_cap === "number" ? row.daily_run_cap : null,
    dailyMutationCap:
      typeof row.daily_mutation_cap === "number" ? row.daily_mutation_cap : null,
    dailyExternalSendCap:
      typeof row.daily_external_send_cap === "number" ? row.daily_external_send_cap : null,
    quietHoursStartEt:
      typeof row.quiet_hours_start_et === "number" ? row.quiet_hours_start_et : null,
    quietHoursEndEt: typeof row.quiet_hours_end_et === "number" ? row.quiet_hours_end_et : null,
    maxConsecutiveFailures:
      typeof row.max_consecutive_failures === "number" ? row.max_consecutive_failures : 3,
    alertAfterMinutes: typeof row.alert_after_minutes === "number" ? row.alert_after_minutes : 120,
    rollbackStrategy: row.rollback_strategy as AutomationRollbackStrategy,
    config: toRecord(row.config),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null
  };
}

function parseAutomationRun(row: AutomationRunRow | null): AutomationRunRecord | null {
  if (
    !row ||
    typeof row.id !== "number" ||
    !row.agent_id ||
    !row.trigger_source ||
    !row.status ||
    !row.started_at
  ) {
    return null;
  }

  return {
    id: row.id,
    agentId: row.agent_id as AutomationAgentId,
    triggerSource: row.trigger_source as AutomationTriggerSource,
    triggerReference: row.trigger_reference ?? null,
    environment: row.environment ?? "production",
    status: row.status as AutomationRunStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at ?? null,
    durationMs: typeof row.duration_ms === "number" ? row.duration_ms : null,
    summary: row.summary ?? null,
    errorMessage: row.error_message ?? null,
    rowsCreated: typeof row.rows_created === "number" ? row.rows_created : 0,
    rowsUpdated: typeof row.rows_updated === "number" ? row.rows_updated : 0,
    rowsPublished: typeof row.rows_published === "number" ? row.rows_published : 0,
    rowsSent: typeof row.rows_sent === "number" ? row.rows_sent : 0,
    externalActionsCount:
      typeof row.external_actions_count === "number" ? row.external_actions_count : 0,
    createdByAdminId: row.created_by_admin_id ?? null,
    rollbackRunId: typeof row.rollback_run_id === "number" ? row.rollback_run_id : null,
    createdAt: row.created_at ?? null
  };
}

async function readAutomationAgent(agentId: AutomationAgentId) {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("automation_agents")
    .select(
      "agent_id, name, category, risk_class, autonomy_mode, is_enabled, requires_manual_approval, schedule_cron, owner, daily_run_cap, daily_mutation_cap, daily_external_send_cap, quiet_hours_start_et, quiet_hours_end_et, max_consecutive_failures, alert_after_minutes, rollback_strategy, config, created_at, updated_at"
    )
    .eq("agent_id", agentId)
    .maybeSingle();

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return null;
    }

    throw new Error(`Failed to read automation agent ${agentId}: ${error.message}`);
  }

  return parseAutomationAgent((data ?? null) as AutomationAgentRow | null);
}

async function readAutomationRunsForPolicy(agentId: AutomationAgentId) {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const dayBounds = getEtDayBounds();
  const [todayResult, recentResult] = await Promise.all([
    supabase
      .from("automation_runs")
      .select(
        "status, rows_created, rows_updated, rows_published, rows_sent, external_actions_count, started_at"
      )
      .eq("agent_id", agentId)
      .gte("started_at", dayBounds.start)
      .lt("started_at", dayBounds.end)
      .order("started_at", { ascending: false }),
    supabase
      .from("automation_runs")
      .select("status, started_at")
      .eq("agent_id", agentId)
      .order("started_at", { ascending: false })
      .limit(12)
  ]);

  if (todayResult.error) {
    if (isMissingAutomationControlRelationError(todayResult.error)) {
      return null;
    }

    throw new Error(
      `Failed to read automation run policy state for ${agentId}: ${todayResult.error.message}`
    );
  }

  if (recentResult.error) {
    if (isMissingAutomationControlRelationError(recentResult.error)) {
      return null;
    }

    throw new Error(
      `Failed to read automation failure history for ${agentId}: ${recentResult.error.message}`
    );
  }

  return {
    todayRuns: Array.isArray(todayResult.data) ? todayResult.data : [],
    recentRuns: Array.isArray(recentResult.data) ? recentResult.data : []
  };
}

function buildAutomationBlockMessage(
  agent: AutomationAgentRecord,
  errorCode: AutomationExecutionBlockCode,
  detail?: string
) {
  if (detail) {
    return detail;
  }

  if (errorCode === "paused") {
    return `${agent.name} is paused.`;
  }

  if (errorCode === "disabled") {
    return `${agent.name} is disabled by autonomy policy.`;
  }

  if (errorCode === "run_cap") {
    return `${agent.name} hit its daily run cap and is blocked until tomorrow ET.`;
  }

  if (errorCode === "mutation_cap") {
    return `${agent.name} hit its daily mutation cap and is blocked until tomorrow ET.`;
  }

  if (errorCode === "external_send_cap") {
    return `${agent.name} hit its daily external-send cap and is blocked until tomorrow ET.`;
  }

  return `${agent.name} is blocked after too many consecutive failures.`;
}

function buildAutomationBlockResponse(
  errorCode: AutomationExecutionBlockCode,
  errorMessage: string
) {
  const status =
    errorCode === "paused" || errorCode === "disabled"
      ? 423
      : errorCode === "failure_threshold"
        ? 409
        : 429;

  return jsonResponse(
    {
      ok: false,
      error: errorMessage
    },
    { status }
  );
}

export async function getAutomationAgent(agentId: AutomationAgentId) {
  return readAutomationAgent(agentId);
}

export async function assertAgentExecutionAllowed(
  agentId: AutomationAgentId,
  _triggerSource: AutomationTriggerSource
) {
  const agent = await readAutomationAgent(agentId);
  if (!agent) {
    return {
      ok: true as const,
      agent: null
    };
  }

  if (!agent.isEnabled) {
    return {
      ok: false as const,
      errorCode: "paused" as const,
      errorMessage: `${agent.name} is paused.`,
      agent
    };
  }

  if (agent.autonomyMode === "disabled") {
    return {
      ok: false as const,
      errorCode: "disabled" as const,
      errorMessage: `${agent.name} is disabled by autonomy policy.`,
      agent
    };
  }

  const policyRuns = await readAutomationRunsForPolicy(agentId);
  if (!policyRuns) {
    return {
      ok: true as const,
      agent
    };
  }

  if (agent.maxConsecutiveFailures > 0) {
    let consecutiveFailures = 0;
    for (const run of policyRuns.recentRuns) {
      if (run.status !== "failed") {
        break;
      }

      consecutiveFailures += 1;
    }

    if (consecutiveFailures >= agent.maxConsecutiveFailures) {
      return {
        ok: false as const,
        errorCode: "failure_threshold" as const,
        errorMessage: `${agent.name} is blocked after ${consecutiveFailures} consecutive failed runs.`,
        agent
      };
    }
  }

  const todayNonBlockedRuns = policyRuns.todayRuns.filter((run) => run.status !== "blocked");
  if (
    typeof agent.dailyRunCap === "number" &&
    todayNonBlockedRuns.length >= agent.dailyRunCap
  ) {
    return {
      ok: false as const,
      errorCode: "run_cap" as const,
      errorMessage: `${agent.name} hit its daily run cap (${agent.dailyRunCap}) and is blocked until tomorrow ET.`,
      agent
    };
  }

  const todayMutationUsage = todayNonBlockedRuns.reduce((sum, run) => {
    const rowsCreated =
      typeof run.rows_created === "number" ? run.rows_created : 0;
    const rowsUpdated =
      typeof run.rows_updated === "number" ? run.rows_updated : 0;
    const rowsPublished =
      typeof run.rows_published === "number" ? run.rows_published : 0;

    return sum + rowsCreated + rowsUpdated + rowsPublished;
  }, 0);

  if (
    typeof agent.dailyMutationCap === "number" &&
    todayMutationUsage >= agent.dailyMutationCap
  ) {
    return {
      ok: false as const,
      errorCode: "mutation_cap" as const,
      errorMessage: `${agent.name} hit its daily mutation cap (${agent.dailyMutationCap}) and is blocked until tomorrow ET.`,
      agent
    };
  }

  const todayExternalUsage = todayNonBlockedRuns.reduce((sum, run) => {
    const rowsSent = typeof run.rows_sent === "number" ? run.rows_sent : 0;
    const externalActions =
      typeof run.external_actions_count === "number" ? run.external_actions_count : 0;

    return sum + Math.max(rowsSent, externalActions);
  }, 0);

  if (
    typeof agent.dailyExternalSendCap === "number" &&
    todayExternalUsage >= agent.dailyExternalSendCap
  ) {
    return {
      ok: false as const,
      errorCode: "external_send_cap" as const,
      errorMessage: `${agent.name} hit its daily external-send cap (${agent.dailyExternalSendCap}) and is blocked until tomorrow ET.`,
      agent
    };
  }

  return {
    ok: true as const,
    agent
  };
}

async function recordBlockedAutomationRun(input: {
  agentId: AutomationAgentId;
  triggerSource: AutomationTriggerSource;
  triggerReference?: string | null;
  inputPayload?: Record<string, unknown>;
  errorCode: AutomationExecutionBlockCode;
  errorMessage: string;
  createdByAdminId?: string | null;
}) {
  if (!flags.hasSupabaseAdmin) {
    return;
  }

  const agent = await readAutomationAgent(input.agentId);
  if (!agent) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const timestamp = new Date().toISOString();
  const { data, error } = await supabase
    .from("automation_runs")
    .insert({
      agent_id: input.agentId,
      trigger_source: input.triggerSource,
      trigger_reference: input.triggerReference ?? null,
      environment: currentEnvironment(),
      status: "blocked",
      started_at: timestamp,
      completed_at: timestamp,
      duration_ms: 0,
      summary: buildAutomationBlockMessage(agent, input.errorCode, input.errorMessage),
      input_payload: toJsonValue(input.inputPayload ?? {}),
      result_payload: toJsonValue({
        errorCode: input.errorCode,
        errorMessage: input.errorMessage
      }),
      error_message: input.errorMessage,
      created_by_admin_id: input.createdByAdminId ?? null
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return;
    }

    throw new Error(`Failed to record blocked automation run for ${input.agentId}: ${error.message}`);
  }

  if (typeof data?.id === "number") {
    await appendAutomationRunEvent(
      {
        id: data.id,
        agentId: input.agentId,
        startedAt: timestamp
      },
      {
        level: "warning",
        code: `run_blocked_${input.errorCode}`,
        message: input.errorMessage,
        payload: {
          triggerReference: input.triggerReference ?? null
        }
      }
    );
  }
}

export async function beginAutomationRun(input: {
  agentId: AutomationAgentId;
  triggerSource: AutomationTriggerSource;
  triggerReference?: string | null;
  inputPayload?: Record<string, unknown>;
  createdByAdminId?: string | null;
}) {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const agent = await readAutomationAgent(input.agentId);
  if (!agent) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const startedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("automation_runs")
    .insert({
      agent_id: input.agentId,
      trigger_source: input.triggerSource,
      trigger_reference: input.triggerReference ?? null,
      environment: currentEnvironment(),
      status: "started",
      started_at: startedAt,
      input_payload: toJsonValue(input.inputPayload ?? {}),
      created_by_admin_id: input.createdByAdminId ?? null
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return null;
    }

    throw new Error(`Failed to start automation run for ${input.agentId}: ${error.message}`);
  }

  if (typeof data?.id !== "number") {
    return null;
  }

  return {
    id: data.id,
    agentId: input.agentId,
    startedAt
  } satisfies AutomationRunHandle;
}

export async function listAutomationAgents() {
  if (!flags.hasSupabaseAdmin) {
    return [] as AutomationAgentRecord[];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [] as AutomationAgentRecord[];
  }

  const { data, error } = await supabase
    .from("automation_agents")
    .select(
      "agent_id, name, category, risk_class, autonomy_mode, is_enabled, requires_manual_approval, schedule_cron, owner, daily_run_cap, daily_mutation_cap, daily_external_send_cap, quiet_hours_start_et, quiet_hours_end_et, max_consecutive_failures, alert_after_minutes, rollback_strategy, config, created_at, updated_at"
    )
    .order("name", { ascending: true });

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return [] as AutomationAgentRecord[];
    }

    throw new Error(`Failed to list automation agents: ${error.message}`);
  }

  return Array.isArray(data)
    ? data
        .map((row) => parseAutomationAgent(row as AutomationAgentRow))
        .filter((row): row is AutomationAgentRecord => Boolean(row))
    : [];
}

export async function listAutomationRuns(options?: {
  limit?: number;
  since?: string;
  agentId?: AutomationAgentId;
}) {
  if (!flags.hasSupabaseAdmin) {
    return [] as AutomationRunRecord[];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [] as AutomationRunRecord[];
  }

  let query = supabase
    .from("automation_runs")
    .select(
      "id, agent_id, trigger_source, trigger_reference, environment, status, started_at, completed_at, duration_ms, summary, error_message, rows_created, rows_updated, rows_published, rows_sent, external_actions_count, created_by_admin_id, rollback_run_id, created_at"
    )
    .order("started_at", { ascending: false })
    .limit(options?.limit ?? 400);

  if (options?.since) {
    query = query.gte("started_at", options.since);
  }

  if (options?.agentId) {
    query = query.eq("agent_id", options.agentId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return [] as AutomationRunRecord[];
    }

    throw new Error(`Failed to list automation runs: ${error.message}`);
  }

  return Array.isArray(data)
    ? data
        .map((row) => parseAutomationRun(row as AutomationRunRow))
        .filter((row): row is AutomationRunRecord => Boolean(row))
    : [];
}

export async function setAutomationAgentEnabled(
  agentId: AutomationAgentId,
  isEnabled: boolean
) {
  if (!flags.hasSupabaseAdmin) {
    return {
      ok: false as const,
      errorMessage: "Supabase admin access is not configured."
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false as const,
      errorMessage: "Automation control is not available in this environment."
    };
  }

  const { data, error } = await supabase
    .from("automation_agents")
    .update({
      is_enabled: isEnabled
    })
    .eq("agent_id", agentId)
    .select(
      "agent_id, name, category, risk_class, autonomy_mode, is_enabled, requires_manual_approval, schedule_cron, owner, daily_run_cap, daily_mutation_cap, daily_external_send_cap, quiet_hours_start_et, quiet_hours_end_et, max_consecutive_failures, alert_after_minutes, rollback_strategy, config, created_at, updated_at"
    )
    .maybeSingle();

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return {
        ok: false as const,
        errorMessage: "Automation control tables are not available yet. Apply the migration first."
      };
    }

    throw new Error(`Failed to update automation agent ${agentId}: ${error.message}`);
  }

  const agent = parseAutomationAgent((data ?? null) as AutomationAgentRow | null);
  if (!agent) {
    return {
      ok: false as const,
      errorMessage: `${agentId} is not registered in automation control.`
    };
  }

  return {
    ok: true as const,
    agent
  };
}

export async function pauseAutomationAgent(agentId: AutomationAgentId) {
  return setAutomationAgentEnabled(agentId, false);
}

export async function resumeAutomationAgent(agentId: AutomationAgentId) {
  return setAutomationAgentEnabled(agentId, true);
}

export async function recordAutomationSnapshot(
  run: AutomationRunHandle | null,
  input: {
    scope: string;
    subjectKey: string;
    beforePayload?: unknown;
    afterPayload?: unknown;
  }
) {
  if (!run || !flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("automation_state_snapshots").insert({
    agent_id: run.agentId,
    run_id: run.id,
    scope: input.scope,
    subject_key: input.subjectKey,
    before_payload: toJsonValue(input.beforePayload ?? {}),
    after_payload: toJsonValue(input.afterPayload ?? {})
  });

  if (error && !isMissingAutomationControlRelationError(error)) {
    throw new Error(`Failed to record automation snapshot for ${run.agentId}: ${error.message}`);
  }
}

export async function appendAutomationRunEvent(
  run: AutomationRunHandle | null,
  input: {
    level: AutomationRunEventLevel;
    code: string;
    message: string;
    payload?: unknown;
  }
) {
  if (!run || !flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("automation_run_events").insert({
    run_id: run.id,
    level: input.level,
    code: input.code,
    message: input.message,
    payload: toJsonValue(input.payload ?? {})
  });

  if (error && !isMissingAutomationControlRelationError(error)) {
    throw new Error(`Failed to append automation event for ${run.agentId}: ${error.message}`);
  }
}

function buildDurationMs(startedAt: string) {
  const duration = Date.now() - new Date(startedAt).getTime();
  return Number.isFinite(duration) && duration >= 0 ? duration : 0;
}

export async function completeAutomationRun(
  run: AutomationRunHandle | null,
  input?: AutomationRunSummaryInput
) {
  if (!run || !flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("automation_runs")
    .update({
      status: "succeeded",
      completed_at: new Date().toISOString(),
      duration_ms: buildDurationMs(run.startedAt),
      summary: input?.summary ?? null,
      result_payload: toJsonValue(input?.resultPayload ?? {}),
      rows_created: input?.rowsCreated ?? 0,
      rows_updated: input?.rowsUpdated ?? 0,
      rows_published: input?.rowsPublished ?? 0,
      rows_sent: input?.rowsSent ?? 0,
      external_actions_count: input?.externalActionsCount ?? 0
    })
    .eq("id", run.id);

  if (error && !isMissingAutomationControlRelationError(error)) {
    throw new Error(`Failed to complete automation run ${run.id}: ${error.message}`);
  }
}

export async function failAutomationRun(run: AutomationRunHandle | null, error: unknown) {
  if (!run || !flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const serializedError = serializeError(error);
  const { error: updateError } = await supabase
    .from("automation_runs")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      duration_ms: buildDurationMs(run.startedAt),
      error_message: serializedError.message,
      result_payload: toJsonValue(serializedError)
    })
    .eq("id", run.id);

  if (updateError && !isMissingAutomationControlRelationError(updateError)) {
    throw new Error(`Failed to fail automation run ${run.id}: ${updateError.message}`);
  }
}

export async function runCronAutomationTask<TResult>(
  options: CronAutomationTaskOptions<TResult>
): Promise<{ ok: true; result: TResult } | { ok: false; response: Response }> {
  const unauthorized = requireCronAuthorization(options.request);
  if (unauthorized) {
    return {
      ok: false,
      response: unauthorized
    };
  }

  const gate = await assertAgentExecutionAllowed(options.agentId, "cron");
  if (!gate.ok) {
    await recordBlockedAutomationRun({
      agentId: options.agentId,
      triggerSource: "cron",
      triggerReference: options.triggerReference,
      inputPayload: options.inputPayload,
      errorCode: gate.errorCode,
      errorMessage: gate.errorMessage
    });

    return {
      ok: false,
      response: buildAutomationBlockResponse(gate.errorCode, gate.errorMessage)
    };
  }

  const run = await beginAutomationRun({
    agentId: options.agentId,
    triggerSource: "cron",
    triggerReference: options.triggerReference,
    inputPayload: options.inputPayload
  });

  if (run) {
    await appendAutomationRunEvent(run, {
      level: "info",
      code: "run_started",
      message: `${options.agentId} started.`,
      payload: {
        triggerReference: options.triggerReference ?? null
      }
    });
  }

  try {
    const result = await options.execute({ run });
    await options.onSuccess?.(result, { run });

    const summary = options.summarize?.(result, { run });
    await completeAutomationRun(run, {
      resultPayload: result,
      ...summary
    });

    if (run) {
      await appendAutomationRunEvent(run, {
        level: "info",
        code: "run_succeeded",
        message: `${options.agentId} completed successfully.`,
        payload: summary?.resultPayload ?? result
      });
    }

    return {
      ok: true,
      result
    };
  } catch (error) {
    await failAutomationRun(run, error);

    if (run) {
      await appendAutomationRunEvent(run, {
        level: "error",
        code: "run_failed",
        message: `${options.agentId} failed.`,
        payload: serializeError(error)
      });
    }

    if (options.onErrorResponse) {
      return {
        ok: false,
        response: options.onErrorResponse(error)
      };
    }

    throw error;
  }
}

export async function runManualAutomationTask<TResult>(
  options: ManualAutomationTaskOptions<TResult>
): Promise<
  | {
      ok: true;
      result: TResult;
    }
  | {
      ok: false;
      errorCode: AutomationManualTaskErrorCode;
      errorMessage: string;
    }
> {
  const gate = await assertAgentExecutionAllowed(options.agentId, "manual");
  if (!gate.ok) {
    await recordBlockedAutomationRun({
      agentId: options.agentId,
      triggerSource: "manual",
      triggerReference: options.triggerReference,
      inputPayload: options.inputPayload,
      errorCode: gate.errorCode,
      errorMessage: gate.errorMessage,
      createdByAdminId: options.adminId ?? null
    });

    return {
      ok: false,
      errorCode: gate.errorCode,
      errorMessage: gate.errorMessage
    };
  }

  const run = await beginAutomationRun({
    agentId: options.agentId,
    triggerSource: "manual",
    triggerReference: options.triggerReference,
    inputPayload: options.inputPayload,
    createdByAdminId: options.adminId ?? null
  });

  if (run) {
    await appendAutomationRunEvent(run, {
      level: "info",
      code: "run_started",
      message: `${options.agentId} started manually.`,
      payload: {
        triggerReference: options.triggerReference ?? null,
        adminId: options.adminId ?? null
      }
    });
  }

  try {
    const result = await options.execute({ run });
    await options.onSuccess?.(result, { run });

    const summary = options.summarize?.(result, { run });
    await completeAutomationRun(run, {
      resultPayload: result,
      ...summary
    });

    if (run) {
      await appendAutomationRunEvent(run, {
        level: "info",
        code: "run_succeeded",
        message: `${options.agentId} completed successfully.`,
        payload: summary?.resultPayload ?? result
      });
    }

    return {
      ok: true,
      result
    };
  } catch (error) {
    await failAutomationRun(run, error);

    if (run) {
      await appendAutomationRunEvent(run, {
        level: "error",
        code: "run_failed",
        message: `${options.agentId} failed.`,
        payload: serializeError(error)
      });
    }

    return {
      ok: false,
      errorCode: "failed",
      errorMessage:
        (options.onErrorMessage?.(error) ?? getErrorMessage(error)) || "Automation failed."
    };
  }
}
