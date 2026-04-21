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
  | "brand-discovery"
  | "release-monitor"
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
  | "global_pause"
  | "external_send_pause"
  | "draft_creation_pause"
  | "quiet_hours"
  | "run_cap"
  | "mutation_cap"
  | "external_send_cap"
  | "failure_threshold";

export type AutomationManualTaskErrorCode = AutomationExecutionBlockCode | "failed";

export type AutomationPolicyState = {
  globalPause: boolean;
  externalSendPause: boolean;
  draftCreationPause: boolean;
  defaultQuietHoursStartEt: number | null;
  defaultQuietHoursEndEt: number | null;
  source: "site_settings" | "fallback";
};

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

type AutomationRunDetailRow = AutomationRunRow & {
  input_payload: unknown;
  result_payload: unknown;
};

type AutomationRunEventLevel = "info" | "warning" | "error";

type AutomationRunEventRow = {
  id: number;
  run_id: number;
  level: string;
  code: string;
  message: string;
  payload: unknown;
  created_at: string | null;
};

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

export type AutomationRunDetailRecord = AutomationRunRecord & {
  inputPayload: unknown;
  resultPayload: unknown;
};

export type AutomationRunEventRecord = {
  id: number;
  runId: number;
  level: AutomationRunEventLevel;
  code: string;
  message: string;
  payload: unknown;
  createdAt: string | null;
};

export type AutomationRunSummary = {
  total: number;
  startedCount: number;
  succeededCount: number;
  failedCount: number;
  blockedCount: number;
  cancelledCount: number;
  rolledBackCount: number;
  rowsCreated: number;
  rowsUpdated: number;
  rowsPublished: number;
  rowsSent: number;
};

type AutomationApprovalRow = {
  id: number;
  agent_id: string;
  subject_type: string;
  subject_key: string;
  proposed_action: string;
  payload: unknown;
  status: string;
  source_run_id: number | null;
  approved_by_admin_id: string | null;
  rejected_by_admin_id: string | null;
  decision_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AutomationApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "applied";

export type AutomationApprovalRecord = {
  id: number;
  agentId: AutomationAgentId;
  subjectType: string;
  subjectKey: string;
  proposedAction: string;
  payload: Record<string, unknown>;
  status: AutomationApprovalStatus;
  sourceRunId: number | null;
  approvedByAdminId: string | null;
  rejectedByAdminId: string | null;
  decisionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  expiresAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AutomationApprovalSummary = {
  total: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  expiredCount: number;
  appliedCount: number;
  byAgent: Record<
    string,
    {
      total: number;
      pendingCount: number;
      approvedCount: number;
      rejectedCount: number;
      expiredCount: number;
      appliedCount: number;
    }
  >;
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

type AutomationPolicyBlock = {
  errorCode: AutomationExecutionBlockCode;
  errorMessage: string;
};

const AUTOMATION_APPROVAL_SELECT =
  "id, agent_id, subject_type, subject_key, proposed_action, payload, status, source_run_id, approved_by_admin_id, rejected_by_admin_id, decision_reason, approved_at, rejected_at, expires_at, created_at, updated_at";

const AUTOMATION_RUN_SELECT =
  "id, agent_id, trigger_source, trigger_reference, environment, status, started_at, completed_at, duration_ms, summary, error_message, rows_created, rows_updated, rows_published, rows_sent, external_actions_count, created_by_admin_id, rollback_run_id, created_at";

const AUTOMATION_RUN_DETAIL_SELECT = `${AUTOMATION_RUN_SELECT}, input_payload, result_payload`;

const AUTOMATION_RUN_EVENT_SELECT =
  "id, run_id, level, code, message, payload, created_at";

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

function getEtHour(now = new Date()) {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hourCycle: "h23"
  }).format(now);

  const value = Number(formatted);
  return Number.isFinite(value) ? value : 0;
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
    || message.includes("automation_approvals")
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

function parseBooleanSetting(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
      return true;
    }

    if (
      normalized === "false"
      || normalized === "0"
      || normalized === "no"
      || normalized === "off"
    ) {
      return false;
    }
  }

  return fallback;
}

function parseQuietHourSetting(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return null;
  }

  const normalized = Math.trunc(parsed);
  return normalized >= 0 && normalized <= 23 ? normalized : null;
}

export function isEtHourInQuietHours(
  hourEt: number,
  quietHoursStartEt: number | null,
  quietHoursEndEt: number | null
) {
  if (
    quietHoursStartEt === null
    || quietHoursEndEt === null
    || quietHoursStartEt === quietHoursEndEt
  ) {
    return false;
  }

  if (quietHoursStartEt < quietHoursEndEt) {
    return hourEt >= quietHoursStartEt && hourEt < quietHoursEndEt;
  }

  return hourEt >= quietHoursStartEt || hourEt < quietHoursEndEt;
}

async function readAutomationPolicyState(): Promise<AutomationPolicyState> {
  const fallback: AutomationPolicyState = {
    globalPause: false,
    externalSendPause: false,
    draftCreationPause: false,
    defaultQuietHoursStartEt: null,
    defaultQuietHoursEndEt: null,
    source: "fallback"
  };

  if (!flags.hasSupabaseAdmin) {
    return fallback;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return fallback;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [
      "automation_global_pause",
      "automation_external_send_pause",
      "automation_draft_creation_pause",
      "automation_default_quiet_hours_start_et",
      "automation_default_quiet_hours_end_et"
    ]);

  if (error) {
    return fallback;
  }

  const values = new Map(
    (data ?? []).map((row) => [String(row.key), (row as { value?: unknown }).value])
  );

  return {
    globalPause: parseBooleanSetting(values.get("automation_global_pause"), false),
    externalSendPause: parseBooleanSetting(values.get("automation_external_send_pause"), false),
    draftCreationPause: parseBooleanSetting(values.get("automation_draft_creation_pause"), false),
    defaultQuietHoursStartEt: parseQuietHourSetting(
      values.get("automation_default_quiet_hours_start_et")
    ),
    defaultQuietHoursEndEt: parseQuietHourSetting(
      values.get("automation_default_quiet_hours_end_et")
    ),
    source: "site_settings"
  };
}

export async function getAutomationPolicyState() {
  return readAutomationPolicyState();
}

export function getAutomationPolicyBlock(input: {
  agent: Pick<
    AutomationAgentRecord,
    "name" | "riskClass" | "autonomyMode" | "quietHoursStartEt" | "quietHoursEndEt"
  >;
  triggerSource: AutomationTriggerSource;
  policyState: AutomationPolicyState;
  now?: Date;
}): AutomationPolicyBlock | null {
  const { agent, triggerSource, policyState } = input;

  if (policyState.globalPause) {
    return {
      errorCode: "global_pause",
      errorMessage: "Automation is paused site-wide by policy."
    };
  }

  if (
    policyState.externalSendPause
    && (agent.riskClass === "external_send" || agent.autonomyMode === "external_send")
  ) {
    return {
      errorCode: "external_send_pause",
      errorMessage: `${agent.name} is blocked because external-send automation is paused site-wide.`
    };
  }

  if (policyState.draftCreationPause && agent.riskClass === "draft_only") {
    return {
      errorCode: "draft_creation_pause",
      errorMessage: `${agent.name} is blocked because draft-creation automation is paused site-wide.`
    };
  }

  const quietHoursStartEt = agent.quietHoursStartEt ?? policyState.defaultQuietHoursStartEt;
  const quietHoursEndEt = agent.quietHoursEndEt ?? policyState.defaultQuietHoursEndEt;
  const shouldEnforceQuietHours =
    triggerSource === "cron" || triggerSource === "system" || triggerSource === "callback";

  if (
    shouldEnforceQuietHours
    && isEtHourInQuietHours(getEtHour(input.now), quietHoursStartEt, quietHoursEndEt)
  ) {
    return {
      errorCode: "quiet_hours",
      errorMessage: `${agent.name} is inside its ET quiet-hours window and will resume when quiet hours end.`
    };
  }

  return null;
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

function parseAutomationRunDetail(
  row: AutomationRunDetailRow | null
): AutomationRunDetailRecord | null {
  const run = parseAutomationRun(row);
  if (!run) {
    return null;
  }

  return {
    ...run,
    inputPayload: row?.input_payload ?? {},
    resultPayload: row?.result_payload ?? {}
  };
}

function parseAutomationRunEvent(
  row: AutomationRunEventRow | null
): AutomationRunEventRecord | null {
  if (
    !row
    || typeof row.id !== "number"
    || typeof row.run_id !== "number"
    || !row.level
    || !row.code
    || !row.message
  ) {
    return null;
  }

  return {
    id: row.id,
    runId: row.run_id,
    level: row.level as AutomationRunEventLevel,
    code: row.code,
    message: row.message,
    payload: row.payload ?? {},
    createdAt: row.created_at ?? null
  };
}

function parseAutomationApproval(row: AutomationApprovalRow | null): AutomationApprovalRecord | null {
  if (
    !row
    || typeof row.id !== "number"
    || !row.agent_id
    || !row.subject_type
    || !row.subject_key
    || !row.proposed_action
    || !row.status
  ) {
    return null;
  }

  return {
    id: row.id,
    agentId: row.agent_id as AutomationAgentId,
    subjectType: row.subject_type,
    subjectKey: row.subject_key,
    proposedAction: row.proposed_action,
    payload: toRecord(row.payload),
    status: row.status as AutomationApprovalStatus,
    sourceRunId: typeof row.source_run_id === "number" ? row.source_run_id : null,
    approvedByAdminId: row.approved_by_admin_id ?? null,
    rejectedByAdminId: row.rejected_by_admin_id ?? null,
    decisionReason: row.decision_reason ?? null,
    approvedAt: row.approved_at ?? null,
    rejectedAt: row.rejected_at ?? null,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null
  };
}

export function summarizeAutomationRuns(runs: AutomationRunRecord[]): AutomationRunSummary {
  return runs.reduce<AutomationRunSummary>(
    (summary, run) => {
      summary.total += 1;
      summary.rowsCreated += run.rowsCreated;
      summary.rowsUpdated += run.rowsUpdated;
      summary.rowsPublished += run.rowsPublished;
      summary.rowsSent += run.rowsSent;

      if (run.status === "started") {
        summary.startedCount += 1;
      } else if (run.status === "succeeded") {
        summary.succeededCount += 1;
      } else if (run.status === "failed") {
        summary.failedCount += 1;
      } else if (run.status === "blocked") {
        summary.blockedCount += 1;
      } else if (run.status === "cancelled") {
        summary.cancelledCount += 1;
      } else if (run.status === "rolled_back") {
        summary.rolledBackCount += 1;
      }

      return summary;
    },
    {
      total: 0,
      startedCount: 0,
      succeededCount: 0,
      failedCount: 0,
      blockedCount: 0,
      cancelledCount: 0,
      rolledBackCount: 0,
      rowsCreated: 0,
      rowsUpdated: 0,
      rowsPublished: 0,
      rowsSent: 0
    }
  );
}

export function summarizeAutomationApprovals(
  approvals: AutomationApprovalRecord[]
): AutomationApprovalSummary {
  return approvals.reduce<AutomationApprovalSummary>(
    (summary, approval) => {
      summary.total += 1;
      const byAgent = (summary.byAgent[approval.agentId] ??= {
        total: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        expiredCount: 0,
        appliedCount: 0
      });

      byAgent.total += 1;

      if (approval.status === "pending") {
        summary.pendingCount += 1;
        byAgent.pendingCount += 1;
      } else if (approval.status === "approved") {
        summary.approvedCount += 1;
        byAgent.approvedCount += 1;
      } else if (approval.status === "rejected") {
        summary.rejectedCount += 1;
        byAgent.rejectedCount += 1;
      } else if (approval.status === "expired") {
        summary.expiredCount += 1;
        byAgent.expiredCount += 1;
      } else if (approval.status === "applied") {
        summary.appliedCount += 1;
        byAgent.appliedCount += 1;
      }

      return summary;
    },
    {
      total: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      expiredCount: 0,
      appliedCount: 0,
      byAgent: {}
    }
  );
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

async function readAutomationApprovalById(approvalId: number) {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("automation_approvals")
    .select(AUTOMATION_APPROVAL_SELECT)
    .eq("id", approvalId)
    .maybeSingle();

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return null;
    }

    throw new Error(`Failed to read automation approval ${approvalId}: ${error.message}`);
  }

  return parseAutomationApproval((data ?? null) as AutomationApprovalRow | null);
}

async function readAutomationRunById(runId: number) {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("automation_runs")
    .select(AUTOMATION_RUN_DETAIL_SELECT)
    .eq("id", runId)
    .maybeSingle();

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return null;
    }

    throw new Error(`Failed to read automation run ${runId}: ${error.message}`);
  }

  return parseAutomationRunDetail((data ?? null) as AutomationRunDetailRow | null);
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

  if (errorCode === "global_pause") {
    return "Automation is paused site-wide by policy.";
  }

  if (errorCode === "external_send_pause") {
    return `${agent.name} is blocked because external-send automation is paused site-wide.`;
  }

  if (errorCode === "draft_creation_pause") {
    return `${agent.name} is blocked because draft-creation automation is paused site-wide.`;
  }

  if (errorCode === "quiet_hours") {
    return `${agent.name} is inside its ET quiet-hours window and will resume when quiet hours end.`;
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
    errorCode === "paused"
      || errorCode === "disabled"
      || errorCode === "global_pause"
      || errorCode === "external_send_pause"
      || errorCode === "draft_creation_pause"
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
  triggerSource: AutomationTriggerSource
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

  const policyState = await readAutomationPolicyState();
  const policyBlock = getAutomationPolicyBlock({
    agent,
    triggerSource,
    policyState
  });
  if (policyBlock) {
    return {
      ok: false as const,
      errorCode: policyBlock.errorCode,
      errorMessage: policyBlock.errorMessage,
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
  status?: AutomationRunStatus;
  triggerSource?: AutomationTriggerSource;
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
    .select(AUTOMATION_RUN_SELECT)
    .order("started_at", { ascending: false })
    .limit(options?.limit ?? 400);

  if (options?.since) {
    query = query.gte("started_at", options.since);
  }

  if (options?.agentId) {
    query = query.eq("agent_id", options.agentId);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.triggerSource) {
    query = query.eq("trigger_source", options.triggerSource);
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

export async function getAutomationRun(runId: number) {
  return readAutomationRunById(runId);
}

export async function listAutomationRunEvents(options: {
  runId: number;
  limit?: number;
}) {
  if (!flags.hasSupabaseAdmin) {
    return [] as AutomationRunEventRecord[];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [] as AutomationRunEventRecord[];
  }

  const { data, error } = await supabase
    .from("automation_run_events")
    .select(AUTOMATION_RUN_EVENT_SELECT)
    .eq("run_id", options.runId)
    .order("created_at", { ascending: true })
    .limit(options.limit ?? 200);

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return [] as AutomationRunEventRecord[];
    }

    throw new Error(`Failed to list automation run events for ${options.runId}: ${error.message}`);
  }

  return Array.isArray(data)
    ? data
        .map((row) => parseAutomationRunEvent(row as AutomationRunEventRow))
        .filter((row): row is AutomationRunEventRecord => Boolean(row))
    : [];
}

export async function getAutomationApproval(approvalId: number) {
  return readAutomationApprovalById(approvalId);
}

export async function listAutomationApprovals(options?: {
  limit?: number;
  status?: AutomationApprovalStatus;
  agentId?: AutomationAgentId;
}) {
  if (!flags.hasSupabaseAdmin) {
    return [] as AutomationApprovalRecord[];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [] as AutomationApprovalRecord[];
  }

  let query = supabase
    .from("automation_approvals")
    .select(AUTOMATION_APPROVAL_SELECT)
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 200);

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.agentId) {
    query = query.eq("agent_id", options.agentId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      return [] as AutomationApprovalRecord[];
    }

    throw new Error(`Failed to list automation approvals: ${error.message}`);
  }

  return Array.isArray(data)
    ? data
        .map((row) => parseAutomationApproval(row as AutomationApprovalRow))
        .filter((row): row is AutomationApprovalRecord => Boolean(row))
    : [];
}

export async function getAutomationApprovalSummary(options?: {
  agentId?: AutomationAgentId;
}) {
  const approvals = await listAutomationApprovals({
    limit: 400,
    agentId: options?.agentId
  });

  return summarizeAutomationApprovals(approvals);
}

export async function createAutomationApproval(input: {
  agentId: AutomationAgentId;
  subjectType: string;
  subjectKey: string;
  proposedAction: string;
  payload?: Record<string, unknown>;
  sourceRunId?: number | null;
  expiresAt?: string | null;
  status?: AutomationApprovalStatus;
}) {
  if (!flags.hasSupabaseAdmin) {
    throw new Error("Supabase admin access is not configured.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Automation approvals are not available in this environment.");
  }

  const { data: existingData, error: existingError } = await supabase
    .from("automation_approvals")
    .select(AUTOMATION_APPROVAL_SELECT)
    .eq("agent_id", input.agentId)
    .eq("subject_type", input.subjectType)
    .eq("subject_key", input.subjectKey)
    .eq("proposed_action", input.proposedAction)
    .maybeSingle();

  if (existingError && !isMissingAutomationControlRelationError(existingError)) {
    throw new Error(`Failed to read existing automation approval: ${existingError.message}`);
  }

  if (isMissingAutomationControlRelationError(existingError)) {
    throw new Error("Automation approvals table is not available yet. Apply the migration first.");
  }

  const existing = parseAutomationApproval((existingData ?? null) as AutomationApprovalRow | null);
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from("automation_approvals")
      .update({
        payload: toJsonValue(input.payload ?? {}),
        source_run_id: input.sourceRunId ?? existing.sourceRunId,
        expires_at: input.expiresAt ?? existing.expiresAt,
        updated_at: now
      })
      .eq("id", existing.id)
      .select(AUTOMATION_APPROVAL_SELECT)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update automation approval ${existing.id}: ${error.message}`);
    }

    const approval = parseAutomationApproval((data ?? null) as AutomationApprovalRow | null);
    if (!approval) {
      throw new Error(`Automation approval ${existing.id} could not be parsed after update.`);
    }

    return {
      action: "updated" as const,
      approval
    };
  }

  const { data, error } = await supabase
    .from("automation_approvals")
    .insert({
      agent_id: input.agentId,
      subject_type: input.subjectType,
      subject_key: input.subjectKey,
      proposed_action: input.proposedAction,
      payload: toJsonValue(input.payload ?? {}),
      status: input.status ?? "pending",
      source_run_id: input.sourceRunId ?? null,
      expires_at: input.expiresAt ?? null
    })
    .select(AUTOMATION_APPROVAL_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to create automation approval for ${input.agentId}: ${error.message}`);
  }

  const approval = parseAutomationApproval((data ?? null) as AutomationApprovalRow | null);
  if (!approval) {
    throw new Error(`Automation approval for ${input.agentId} could not be parsed after insert.`);
  }

  return {
    action: "created" as const,
    approval
  };
}

export async function updateAutomationApproval(input: {
  approvalId: number;
  status: AutomationApprovalStatus;
  decisionReason?: string | null;
  approvedByAdminId?: string | null;
  rejectedByAdminId?: string | null;
}) {
  if (!flags.hasSupabaseAdmin) {
    throw new Error("Supabase admin access is not configured.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Automation approvals are not available in this environment.");
  }

  const now = new Date().toISOString();
  const update: Record<string, unknown> = {
    status: input.status,
    updated_at: now
  };

  if (input.decisionReason !== undefined) {
    update.decision_reason = input.decisionReason;
  }

  if (input.status === "approved") {
    update.approved_by_admin_id = input.approvedByAdminId ?? null;
    update.approved_at = now;
    update.rejected_by_admin_id = null;
    update.rejected_at = null;
  } else if (input.status === "rejected") {
    update.approved_by_admin_id = null;
    update.approved_at = null;
    update.rejected_by_admin_id = input.rejectedByAdminId ?? null;
    update.rejected_at = now;
  } else if (input.status === "pending" || input.status === "expired") {
    update.approved_by_admin_id = null;
    update.approved_at = null;
    update.rejected_by_admin_id = null;
    update.rejected_at = null;
  } else if (input.status === "applied") {
    update.rejected_by_admin_id = null;
    update.rejected_at = null;
  }

  const { data, error } = await supabase
    .from("automation_approvals")
    .update(update)
    .eq("id", input.approvalId)
    .select(AUTOMATION_APPROVAL_SELECT)
    .maybeSingle();

  if (error) {
    if (isMissingAutomationControlRelationError(error)) {
      throw new Error("Automation approvals table is not available yet. Apply the migration first.");
    }

    throw new Error(`Failed to update automation approval ${input.approvalId}: ${error.message}`);
  }

  const approval = parseAutomationApproval((data ?? null) as AutomationApprovalRow | null);
  if (!approval) {
    throw new Error(`Automation approval ${input.approvalId} could not be parsed after update.`);
  }

  return approval;
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
