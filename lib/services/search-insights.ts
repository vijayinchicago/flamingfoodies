import { createHmac, timingSafeEqual } from "node:crypto";

import type {
  BlogSearchOptimization,
  RecipeSearchOptimization,
  SearchInsightBlock
} from "@/lib/search-content-optimizations";
import {
  buildSearchRecommendationQueueMutations,
  executeSearchRecommendationQueue,
  getSearchRecommendationIdFromKey,
  summarizeSearchRecommendationQueue,
  type SearchImplementationPayload,
  type SearchImplementationStrategy,
  type SearchLandingPageOptimization,
  type SearchQueuedRecommendation,
  type SearchRecommendationQueueSnapshot,
  type SearchRecommendationQueueSummary,
  type SearchRecommendationStatus,
  type SearchRuntimeOptimizations
} from "@/lib/search-recommendation-workflow";
import {
  buildSearchRecommendations,
  type SearchDimensionRow,
  type SearchPageRow,
  type SearchPerformanceSnapshot,
  type SearchQueryRow,
  type SearchRecommendation
} from "@/lib/search-performance";
import { env, flags, hasConfiguredEnvValue } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { RecipeFaq } from "@/lib/types";

export {
  buildSearchRuntimeOptimizations,
  buildSearchRecommendationKey
} from "@/lib/search-recommendation-workflow";
export type {
  SearchImplementationPayload,
  SearchImplementationStrategy,
  SearchLandingPageOptimization,
  SearchQueuedRecommendation,
  SearchRecommendationQueueSummary,
  SearchRecommendationStatus,
  SearchRuntimeOptimizations
} from "@/lib/search-recommendation-workflow";

const SEARCH_RUNTIME_OPTIMIZATIONS_KEY = "search_runtime_optimizations";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const SEARCH_CONSOLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_API_BASE = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const SEARCH_ANALYTICS_ROW_LIMIT = 25000;
const SEARCH_CONSOLE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_SEARCH_EVALUATION_WINDOW_DAYS = 7;
const DEFAULT_SEARCH_EVALUATION_MAX_RUNS = 10;

type SearchConsoleApiRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SearchConsoleQueryResponse = {
  rows?: SearchConsoleApiRow[];
};

type SearchConsoleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type SearchConsoleConnectionRow = {
  property: string;
  refresh_token: string;
  scope: string | null;
  token_type: string | null;
  connected_email: string | null;
};

type SearchRecommendationQueueRow = {
  id: number;
  property: string;
  recommendation_key: string;
  source_run_id: number | null;
  last_seen_run_id: number | null;
  status: string;
  is_active: boolean | null;
  priority: string;
  action: string;
  target_path: string | null;
  related_paths: string[] | null;
  title: string;
  summary: string;
  suggested_title: string | null;
  suggested_changes: string[] | null;
  supporting_queries: string[] | null;
  total_impressions: number | null;
  avg_position: number | null;
  implementation_strategy: string | null;
  implementation_payload: unknown;
  decision_reason: string | null;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

type SearchExecutorRunRow = {
  id: number;
  completed_at: string | null;
  result_payload: unknown;
};

type AutomationEvaluationLookupRow = {
  source_run_id: number;
  subject_key: string;
};

export type SearchRecommendationEvaluationBaseline = {
  recommendationKey: string;
  recommendationId: string;
  title: string;
  targetPath?: string;
  totalImpressions: number;
  avgPosition?: number;
  status: SearchRecommendationStatus;
  implementationStrategy: SearchImplementationStrategy;
  supportingQueries: string[];
  lastSeenAt: string;
  baselineCapturedAt: string;
};

export type SearchInsightsAutomationResult =
  | {
      ok: false;
      skippedReason: string;
    }
  | {
      ok: true;
      property: string;
      runId: number | null;
      window: {
        startDate: string;
        endDate: string;
        latestAvailableDate: string;
      };
      queryCount: number;
      pageCount: number;
      recommendationIds: string[];
      newRecommendationCount: number;
      approvedRecommendationCount: number;
      appliedRecommendationCount: number;
    };

export type SearchRecommendationExecutorResult =
  | {
      ok: false;
      skippedReason: string;
    }
  | {
      ok: true;
      property: string;
      appliedRecommendationKeys: string[];
      manualReviewRecommendationKeys: string[];
      runtimeTargetCount: number;
      appliedRecommendationCount: number;
      appliedRecommendationSnapshots: SearchRecommendationEvaluationBaseline[];
      newlyAppliedRecommendationSnapshots: SearchRecommendationEvaluationBaseline[];
      evaluationWindowDays: number;
    };

export type SearchRecommendationEvaluatorResult =
  | {
      ok: false;
      skippedReason: string;
    }
  | {
      ok: true;
      property: string;
      latestAvailableDate: string;
      evaluationWindowDays: number;
      candidateRunCount: number;
      evaluatedRunIds: number[];
      evaluatedRecommendationCount: number;
      keepCount: number;
      revertCount: number;
      escalateCount: number;
      skippedExistingCount: number;
    };

export type SearchRuntimeOptimizationSnapshot = {
  capturedAt: string;
  detectedRecommendationIds: string[];
  appliedRecommendationIds: string[];
  pageTargets: string[];
  blogTargets: string[];
  recipeTargets: string[];
  runtime: SearchRuntimeOptimizations | null;
};

export type LatestSearchInsightRunSummary = {
  createdAt: string;
  latestAvailableDate: string;
  recommendationCount: number;
  appliedRecommendationIds: string[];
  detectedRecommendationIds: string[];
};

export type SearchConsoleConnectionSummary = {
  property: string;
  scope: string | null;
  tokenType: string | null;
  connectedEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SearchInsightRunRecord = {
  id: number;
  property: string;
  searchType: string;
  startDate: string;
  endDate: string;
  latestAvailableDate: string;
  snapshot: SearchPerformanceSnapshot;
  recommendations: SearchRecommendation[];
  appliedRuntime: SearchRuntimeOptimizations | null;
  appliedRecommendationIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type SearchInsightRunHistoryItem = {
  id: number;
  property: string;
  startDate: string;
  endDate: string;
  latestAvailableDate: string;
  recommendationCount: number;
  appliedRecommendationIds: string[];
  detectedRecommendationIds: string[];
  createdAt: string;
};

export type SearchInsightsDashboard = {
  connection: SearchConsoleConnectionSummary | null;
  latestRun: SearchInsightRunRecord | null;
  recentRuns: SearchInsightRunHistoryItem[];
  currentRuntime: SearchRuntimeOptimizations | null;
  queue: SearchQueuedRecommendation[];
  queueSummary: SearchRecommendationQueueSummary;
};

type SearchConsoleConfig = {
  property: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

type SignedOAuthStatePayload = {
  nonce: string;
  issuedAt: number;
  signature: string;
};

function getSearchConsoleProperty() {
  const property = env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.trim();
  return hasConfiguredEnvValue(property) ? property : null;
}

function getSearchConsoleConfig(): SearchConsoleConfig | null {
  const clientId = env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET?.trim();
  const redirectUri = env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI?.trim();

  if (
    !getSearchConsoleProperty() ||
    !hasConfiguredEnvValue(clientId) ||
    !hasConfiguredEnvValue(clientSecret) ||
    !hasConfiguredEnvValue(redirectUri)
  ) {
    return null;
  }

  return {
    property: getSearchConsoleProperty()!,
    clientId: clientId!,
    clientSecret: clientSecret!,
    redirectUri: redirectUri!
  };
}

async function resolveSearchConsoleProperty() {
  const configuredProperty = getSearchConsoleProperty();
  if (configuredProperty) {
    return configuredProperty;
  }

  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: connection } = await supabase
    .from("search_console_connections")
    .select("property")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (connection?.property) {
    return String(connection.property);
  }

  const { data: latestRun } = await supabase
    .from("search_insight_runs")
    .select("property")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return latestRun?.property ? String(latestRun.property) : null;
}

function signOAuthStatePayload(input: { nonce: string; issuedAt: number }, secret: string) {
  return createHmac("sha256", secret)
    .update(`${input.nonce}:${input.issuedAt}`)
    .digest("base64url");
}

function decodeOAuthState(state: string): SignedOAuthStatePayload | null {
  try {
    const raw = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as Partial<SignedOAuthStatePayload>;

    if (
      typeof parsed.nonce !== "string" ||
      typeof parsed.issuedAt !== "number" ||
      typeof parsed.signature !== "string"
    ) {
      return null;
    }

    return {
      nonce: parsed.nonce,
      issuedAt: parsed.issuedAt,
      signature: parsed.signature
    };
  } catch {
    return null;
  }
}

export function createSignedSearchConsoleOAuthState(now = Date.now()) {
  const config = getSearchConsoleConfig();
  if (!config) {
    throw new Error("Google Search Console OAuth is not configured");
  }

  const payload = {
    nonce: crypto.randomUUID(),
    issuedAt: now
  };

  const signedPayload: SignedOAuthStatePayload = {
    ...payload,
    signature: signOAuthStatePayload(payload, config.clientSecret)
  };

  return Buffer.from(JSON.stringify(signedPayload), "utf8").toString("base64url");
}

export function isValidSearchConsoleOAuthState(state: string, now = Date.now()) {
  const config = getSearchConsoleConfig();
  if (!config) {
    return false;
  }

  const payload = decodeOAuthState(state);
  if (!payload) {
    return false;
  }

  if (
    !Number.isFinite(payload.issuedAt) ||
    payload.issuedAt > now + 60_000 ||
    now - payload.issuedAt > SEARCH_CONSOLE_OAUTH_STATE_TTL_MS
  ) {
    return false;
  }

  const expectedSignature = signOAuthStatePayload(
    { nonce: payload.nonce, issuedAt: payload.issuedAt },
    config.clientSecret
  );

  const signatureBuffer = Buffer.from(payload.signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer);
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function subtractDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

function mapMetricRow(row: SearchConsoleApiRow) {
  return {
    clicks: Number(row.clicks ?? 0),
    impressions: Number(row.impressions ?? 0),
    ctr: Number(row.ctr ?? 0),
    position: Number(row.position ?? 0)
  };
}

function mapQueryRows(rows: SearchConsoleApiRow[]): SearchQueryRow[] {
  return rows
    .map((row) => ({
      query: row.keys?.[0] ?? "",
      ...mapMetricRow(row)
    }))
    .filter((row) => row.query);
}

function mapPageRows(rows: SearchConsoleApiRow[]): SearchPageRow[] {
  return rows
    .map((row) => ({
      page: row.keys?.[0] ?? "",
      ...mapMetricRow(row)
    }))
    .filter((row) => row.page);
}

function mapDimensionRows(rows: SearchConsoleApiRow[]): SearchDimensionRow[] {
  return rows
    .map((row) => ({
      label: row.keys?.[0] ?? "",
      ...mapMetricRow(row)
    }))
    .filter((row) => row.label);
}

function buildAuthUrl(state: string, config: SearchConsoleConfig) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: SEARCH_CONSOLE_SCOPE,
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function readConnectionFromDatabase() {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const config = getSearchConsoleConfig();
  const supabase = createSupabaseAdminClient();
  if (!config || !supabase) {
    return null;
  }

  const { data } = await supabase
    .from("search_console_connections")
    .select("property, refresh_token, scope, token_type, connected_email")
    .eq("property", config.property)
    .maybeSingle();

  return (data ?? null) as SearchConsoleConnectionRow | null;
}

async function getRefreshToken() {
  if (env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN) {
    return env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN;
  }

  const connection = await readConnectionFromDatabase();
  return connection?.refresh_token ?? null;
}

async function fetchAccessToken(refreshToken: string, config: SearchConsoleConfig) {
  const response = await fetch(SEARCH_CONSOLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    }).toString()
  });

  const payload = (await response.json()) as SearchConsoleTokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "Failed to refresh Search Console token");
  }

  return payload.access_token;
}

async function querySearchAnalyticsRows(input: {
  accessToken: string;
  property: string;
  startDate: string;
  endDate: string;
  dimensions: string[];
}) {
  const rows: SearchConsoleApiRow[] = [];

  for (let startRow = 0; ; startRow += SEARCH_ANALYTICS_ROW_LIMIT) {
    const response = await fetch(
      `${SEARCH_CONSOLE_API_BASE}/${encodeURIComponent(input.property)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          startDate: input.startDate,
          endDate: input.endDate,
          type: "web",
          dimensions: input.dimensions,
          rowLimit: SEARCH_ANALYTICS_ROW_LIMIT,
          startRow
        })
      }
    );

    const payload = (await response.json()) as SearchConsoleQueryResponse & {
      error?: {
        message?: string;
      };
    };

    if (!response.ok) {
      throw new Error(payload.error?.message || "Search Console query failed");
    }

    const batch = payload.rows ?? [];
    rows.push(...batch);

    if (batch.length < SEARCH_ANALYTICS_ROW_LIMIT) {
      break;
    }
  }

  return rows;
}

async function detectLatestAvailableDate(accessToken: string, property: string) {
  const today = new Date();
  const rows = await querySearchAnalyticsRows({
    accessToken,
    property,
    startDate: formatDateOnly(subtractDays(today, 10)),
    endDate: formatDateOnly(subtractDays(today, 1)),
    dimensions: ["date"]
  });

  const latest = rows
    .map((row) => row.keys?.[0] ?? "")
    .filter(Boolean)
    .sort()
    .at(-1);

  if (!latest) {
    throw new Error("Search Console did not return any recent date rows");
  }

  return latest;
}

async function fetchSnapshot(config: SearchConsoleConfig, refreshToken: string) {
  const accessToken = await fetchAccessToken(refreshToken, config);
  const latestAvailableDate = await detectLatestAvailableDate(accessToken, config.property);
  const endDate = latestAvailableDate;
  const startDate = formatDateOnly(subtractDays(new Date(`${latestAvailableDate}T00:00:00.000Z`), 89));

  const [queryRows, pageRows, deviceRows, countryRows, searchAppearanceRows] = await Promise.all([
    querySearchAnalyticsRows({
      accessToken,
      property: config.property,
      startDate,
      endDate,
      dimensions: ["query"]
    }),
    querySearchAnalyticsRows({
      accessToken,
      property: config.property,
      startDate,
      endDate,
      dimensions: ["page"]
    }),
    querySearchAnalyticsRows({
      accessToken,
      property: config.property,
      startDate,
      endDate,
      dimensions: ["device"]
    }),
    querySearchAnalyticsRows({
      accessToken,
      property: config.property,
      startDate,
      endDate,
      dimensions: ["country"]
    }),
    querySearchAnalyticsRows({
      accessToken,
      property: config.property,
      startDate,
      endDate,
      dimensions: ["searchAppearance"]
    })
  ]);

  const snapshot: SearchPerformanceSnapshot = {
    filters: {
      Date: `${startDate} to ${endDate}`,
      Type: "web",
      Property: config.property
    },
    queries: mapQueryRows(queryRows),
    pages: mapPageRows(pageRows),
    devices: mapDimensionRows(deviceRows),
    countries: mapDimensionRows(countryRows),
    searchAppearance: mapDimensionRows(searchAppearanceRows)
  };

  return {
    snapshot,
    window: {
      startDate,
      endDate,
      latestAvailableDate
    }
  };
}

async function saveRuntimeOptimizations(runtime: SearchRuntimeOptimizations | null) {
  if (!flags.hasSupabaseAdmin) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("site_settings").upsert(
    {
      key: SEARCH_RUNTIME_OPTIMIZATIONS_KEY,
      value: runtime ?? {}
    },
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(`Failed to save runtime search optimizations: ${error.message}`);
  }
}

async function saveSearchInsightRun(input: {
  property: string;
  snapshot: SearchPerformanceSnapshot;
  recommendations: SearchRecommendation[];
  window: SearchRuntimeOptimizations["sourceWindow"];
  runtime: SearchRuntimeOptimizations | null;
}) {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("search_insight_runs")
    .insert({
      property: input.property,
      search_type: "web",
      start_date: input.window.startDate,
      end_date: input.window.endDate,
      latest_available_date: input.window.latestAvailableDate,
      snapshot: input.snapshot,
      recommendations: input.recommendations,
      applied_runtime: input.runtime ?? {},
      applied_recommendation_ids: input.runtime?.appliedRecommendationIds ?? []
    })
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to save search insight run: ${error.message}`);
  }

  return typeof data?.id === "number" ? data.id : null;
}

async function readSearchRecommendationQueue(property: string) {
  if (!flags.hasSupabaseAdmin) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("search_recommendations")
    .select(
      "id, property, recommendation_key, source_run_id, last_seen_run_id, status, is_active, priority, action, target_path, related_paths, title, summary, suggested_title, suggested_changes, supporting_queries, total_impressions, avg_position, implementation_strategy, implementation_payload, decision_reason, first_seen_at, last_seen_at, created_at, updated_at"
    )
    .eq("property", property);

  if (error) {
    throw new Error(`Failed to read search recommendations: ${error.message}`);
  }

  return (data ?? []) as SearchRecommendationQueueRow[];
}

async function upsertSearchRecommendationQueue(input: {
  property: string;
  runId: number | null;
  recommendations: SearchRecommendation[];
}) {
  if (!flags.hasSupabaseAdmin) {
    return {
      newRecommendationCount: 0,
      summary: summarizeSearchRecommendationQueue([])
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      newRecommendationCount: 0,
      summary: summarizeSearchRecommendationQueue([])
    };
  }

  const existingRows = await readSearchRecommendationQueue(input.property);
  const snapshots: SearchRecommendationQueueSnapshot[] = existingRows.map((row) => ({
    recommendationKey: row.recommendation_key,
    sourceRunId: row.source_run_id,
    status: parseRecommendationStatus(row.status) ?? "new",
    isActive: row.is_active !== false,
    decisionReason: row.decision_reason ?? null,
    firstSeenAt: row.first_seen_at
  }));
  const mutations = buildSearchRecommendationQueueMutations({
    property: input.property,
    runId: input.runId,
    recommendations: input.recommendations,
    existing: snapshots
  });

  if (mutations.upserts.length) {
    const { error } = await supabase
      .from("search_recommendations")
      .upsert(mutations.upserts, {
        onConflict: "property,recommendation_key"
      });

    if (error) {
      throw new Error(`Failed to upsert search recommendations: ${error.message}`);
    }
  }

  if (mutations.deactivateRecommendationKeys.length) {
    const { error } = await supabase
      .from("search_recommendations")
      .update({ is_active: false })
      .eq("property", input.property)
      .in("recommendation_key", mutations.deactivateRecommendationKeys);

    if (error) {
      throw new Error(`Failed to deactivate stale search recommendations: ${error.message}`);
    }
  }

  const refreshedRows = await readSearchRecommendationQueue(input.property);
  const summary = summarizeSearchRecommendationQueue(
    refreshedRows
      .map(parseQueuedRecommendation)
      .filter((entry): entry is SearchQueuedRecommendation => Boolean(entry))
  );

  return {
    newRecommendationCount: mutations.newRecommendationKeys.length,
    summary
  };
}

function toFiniteNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : 0;
}

function coerceFilters(value: unknown) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, current]) => [key, String(current ?? "")])
  );
}

function coerceQueryRows(value: unknown): SearchQueryRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((entry) => ({
      query: String(entry.query ?? "").trim(),
      clicks: toFiniteNumber(entry.clicks),
      impressions: toFiniteNumber(entry.impressions),
      ctr: toFiniteNumber(entry.ctr),
      position: toFiniteNumber(entry.position)
    }))
    .filter((entry) => entry.query);
}

function coercePageRows(value: unknown): SearchPageRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((entry) => ({
      page: String(entry.page ?? "").trim(),
      clicks: toFiniteNumber(entry.clicks),
      impressions: toFiniteNumber(entry.impressions),
      ctr: toFiniteNumber(entry.ctr),
      position: toFiniteNumber(entry.position)
    }))
    .filter((entry) => entry.page);
}

function coerceDimensionRows(value: unknown): SearchDimensionRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((entry) => ({
      label: String(entry.label ?? "").trim(),
      clicks: toFiniteNumber(entry.clicks),
      impressions: toFiniteNumber(entry.impressions),
      ctr: toFiniteNumber(entry.ctr),
      position: toFiniteNumber(entry.position)
    }))
    .filter((entry) => entry.label);
}

function parseSnapshot(value: unknown): SearchPerformanceSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    filters: coerceFilters(value.filters),
    queries: coerceQueryRows(value.queries),
    pages: coercePageRows(value.pages),
    devices: coerceDimensionRows(value.devices),
    countries: coerceDimensionRows(value.countries),
    searchAppearance: coerceDimensionRows(value.searchAppearance)
  };
}

function parseRecommendation(value: unknown): SearchRecommendation | null {
  if (!isRecord(value)) {
    return null;
  }

  const priority = value.priority === "high" ? "high" : value.priority === "medium" ? "medium" : null;
  const action =
    value.action === "retune_existing_page" ||
    value.action === "add_supporting_page" ||
    value.action === "verify_technical"
      ? value.action
      : null;
  const id = String(value.id ?? "").trim();
  const title = String(value.title ?? "").trim();
  const summary = String(value.summary ?? "").trim();

  if (!priority || !action || !id || !title || !summary) {
    return null;
  }

  const avgPosition = Number.isFinite(Number(value.avgPosition))
    ? Number(value.avgPosition)
    : undefined;

  return {
    id,
    title,
    priority,
    action,
    targetPath: typeof value.targetPath === "string" ? value.targetPath : undefined,
    relatedPaths: Array.isArray(value.relatedPaths)
      ? value.relatedPaths.map((entry) => String(entry)).filter(Boolean)
      : undefined,
    summary,
    suggestedTitle: typeof value.suggestedTitle === "string" ? value.suggestedTitle : undefined,
    suggestedChanges: Array.isArray(value.suggestedChanges)
      ? value.suggestedChanges.map((entry) => String(entry)).filter(Boolean)
      : [],
    supportingQueries: Array.isArray(value.supportingQueries)
      ? value.supportingQueries.map((entry) => String(entry)).filter(Boolean)
      : [],
    totalImpressions: toFiniteNumber(value.totalImpressions),
    avgPosition
  };
}

function parseRecommendations(value: unknown): SearchRecommendation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseRecommendation)
    .filter((entry): entry is SearchRecommendation => Boolean(entry));
}

function parseRecommendationStatus(value: unknown): SearchRecommendationStatus | null {
  return value === "new" ||
    value === "approved" ||
    value === "applied" ||
    value === "manual_review" ||
    value === "dismissed"
    ? value
    : null;
}

function parseImplementationStrategy(value: unknown): SearchImplementationStrategy | null {
  return value === "runtime_page_overlay" ||
    value === "runtime_blog_overlay" ||
    value === "runtime_recipe_overlay" ||
    value === "manual_only"
    ? value
    : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseImplementationPayload(value: unknown): SearchImplementationPayload {
  if (!isRecord(value) || !Array.isArray(value.operations)) {
    return { operations: [] };
  }

  return {
    operations: value.operations
      .filter(isRecord)
      .map((entry) => ({
        kind:
          entry.kind === "page" || entry.kind === "blog" || entry.kind === "recipe"
            ? entry.kind
            : null,
        target: String(entry.target ?? "").trim(),
        fields: isRecord(entry.fields) ? entry.fields : {}
      }))
      .filter(
        (entry): entry is SearchImplementationPayload["operations"][number] =>
          Boolean(entry.kind && entry.target)
      )
      .map((entry) => ({
        kind: entry.kind,
        target: entry.target,
        fields: entry.fields
      }))
  };
}

function coerceFaqs(value: unknown): RecipeFaq[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter(isRecord)
    .map((entry) => ({
      question: String(entry.question ?? "").trim(),
      answer: String(entry.answer ?? "").trim()
    }))
    .filter((entry) => entry.question && entry.answer);
}

function coerceInsightBlocks(value: unknown): SearchInsightBlock[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter(isRecord)
    .map((entry) => ({
      eyebrow: String(entry.eyebrow ?? "").trim(),
      title: String(entry.title ?? "").trim(),
      copy: String(entry.copy ?? "").trim()
    }))
    .filter((entry) => entry.title && entry.copy);
}

function coerceBlogOptimization(value: unknown): BlogSearchOptimization | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    title: typeof value.title === "string" ? value.title : undefined,
    description: typeof value.description === "string" ? value.description : undefined,
    seoTitle: typeof value.seoTitle === "string" ? value.seoTitle : undefined,
    seoDescription: typeof value.seoDescription === "string" ? value.seoDescription : undefined,
    appendContent: typeof value.appendContent === "string" ? value.appendContent : undefined
  };
}

function coerceRecipeOptimization(value: unknown): RecipeSearchOptimization | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    description: typeof value.description === "string" ? value.description : undefined,
    seoTitle: typeof value.seoTitle === "string" ? value.seoTitle : undefined,
    seoDescription: typeof value.seoDescription === "string" ? value.seoDescription : undefined,
    introAppendix: typeof value.introAppendix === "string" ? value.introAppendix : undefined,
    extraFaqs: coerceFaqs(value.extraFaqs),
    insightBlocks: coerceInsightBlocks(value.insightBlocks)
  };
}

function coercePageOptimization(value: unknown): SearchLandingPageOptimization | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    metadataTitle: typeof value.metadataTitle === "string" ? value.metadataTitle : undefined,
    metadataDescription:
      typeof value.metadataDescription === "string" ? value.metadataDescription : undefined,
    heroEyebrow: typeof value.heroEyebrow === "string" ? value.heroEyebrow : undefined,
    heroTitle: typeof value.heroTitle === "string" ? value.heroTitle : undefined,
    heroCopy: typeof value.heroCopy === "string" ? value.heroCopy : undefined,
    faqEyebrow: typeof value.faqEyebrow === "string" ? value.faqEyebrow : undefined,
    faqTitle: typeof value.faqTitle === "string" ? value.faqTitle : undefined,
    faqCopy: typeof value.faqCopy === "string" ? value.faqCopy : undefined,
    faqs: coerceFaqs(value.faqs)
  };
}

function parseRuntimeOptimizations(value: unknown): SearchRuntimeOptimizations | null {
  if (!isRecord(value) || !isRecord(value.sourceWindow)) {
    return null;
  }

  const blog = isRecord(value.blog) ? value.blog : {};
  const recipes = isRecord(value.recipes) ? value.recipes : {};
  const pages = isRecord(value.pages) ? value.pages : {};

  return {
    generatedAt:
      typeof value.generatedAt === "string" ? value.generatedAt : new Date().toISOString(),
    sourceWindow: {
      startDate: String(value.sourceWindow.startDate ?? ""),
      endDate: String(value.sourceWindow.endDate ?? ""),
      latestAvailableDate: String(value.sourceWindow.latestAvailableDate ?? "")
    },
    detectedRecommendationIds: Array.isArray(value.detectedRecommendationIds)
      ? value.detectedRecommendationIds.map((item) => String(item))
      : [],
    appliedRecommendationIds: Array.isArray(value.appliedRecommendationIds)
      ? value.appliedRecommendationIds.map((item) => String(item))
      : [],
    blog: Object.fromEntries(
      Object.entries(blog)
        .map(([key, optimization]) => [key, coerceBlogOptimization(optimization)])
        .filter((entry): entry is [string, BlogSearchOptimization] => Boolean(entry[1]))
    ),
    recipes: Object.fromEntries(
      Object.entries(recipes)
        .map(([key, optimization]) => [key, coerceRecipeOptimization(optimization)])
        .filter((entry): entry is [string, RecipeSearchOptimization] => Boolean(entry[1]))
    ),
    pages: Object.fromEntries(
      Object.entries(pages)
        .map(([key, optimization]) => [key, coercePageOptimization(optimization)])
        .filter((entry): entry is [string, SearchLandingPageOptimization] => Boolean(entry[1]))
    )
  };
}

export function parseSearchRuntimeOptimizationSnapshot(
  value: unknown
): SearchRuntimeOptimizationSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const runtime = parseRuntimeOptimizations(value.runtime);

  return {
    capturedAt:
      typeof value.capturedAt === "string" ? value.capturedAt : new Date().toISOString(),
    detectedRecommendationIds: Array.isArray(value.detectedRecommendationIds)
      ? value.detectedRecommendationIds.map((entry) => String(entry))
      : [],
    appliedRecommendationIds: Array.isArray(value.appliedRecommendationIds)
      ? value.appliedRecommendationIds.map((entry) => String(entry))
      : [],
    pageTargets: Array.isArray(value.pageTargets)
      ? value.pageTargets.map((entry) => String(entry))
      : Object.keys(runtime?.pages ?? {}).sort(),
    blogTargets: Array.isArray(value.blogTargets)
      ? value.blogTargets.map((entry) => String(entry))
      : Object.keys(runtime?.blog ?? {}).sort(),
    recipeTargets: Array.isArray(value.recipeTargets)
      ? value.recipeTargets.map((entry) => String(entry))
      : Object.keys(runtime?.recipes ?? {}).sort(),
    runtime
  };
}

function parseQueuedRecommendation(value: SearchRecommendationQueueRow): SearchQueuedRecommendation | null {
  const status = parseRecommendationStatus(value.status);
  const strategy = parseImplementationStrategy(value.implementation_strategy);
  const priority =
    value.priority === "high" ? "high" : value.priority === "medium" ? "medium" : null;
  const action =
    value.action === "retune_existing_page" ||
    value.action === "add_supporting_page" ||
    value.action === "verify_technical"
      ? value.action
      : null;

  if (!status || !strategy || !priority || !action) {
    return null;
  }

  return {
    id: value.id,
    property: value.property,
    recommendationKey: value.recommendation_key,
    recommendationId: getSearchRecommendationIdFromKey(value.recommendation_key),
    sourceRunId: value.source_run_id,
    lastSeenRunId: value.last_seen_run_id,
    status,
    isActive: value.is_active !== false,
    priority,
    action,
    targetPath: value.target_path ?? undefined,
    relatedPaths: value.related_paths ?? [],
    title: value.title,
    summary: value.summary,
    suggestedTitle: value.suggested_title ?? undefined,
    suggestedChanges: value.suggested_changes ?? [],
    supportingQueries: value.supporting_queries ?? [],
    totalImpressions: toFiniteNumber(value.total_impressions),
    avgPosition: Number.isFinite(Number(value.avg_position))
      ? Number(value.avg_position)
      : undefined,
    implementationStrategy: strategy,
    implementationPayload: parseImplementationPayload(value.implementation_payload),
    decisionReason: value.decision_reason ?? null,
    firstSeenAt: value.first_seen_at,
    lastSeenAt: value.last_seen_at,
    createdAt: value.created_at,
    updatedAt: value.updated_at
  };
}

export function hasSearchConsoleBaseConfig() {
  return Boolean(getSearchConsoleConfig());
}

export async function hasSearchConsoleConnection() {
  if (!hasSearchConsoleBaseConfig()) {
    return false;
  }

  return Boolean(await getRefreshToken());
}

export function getSearchConsoleScope() {
  return SEARCH_CONSOLE_SCOPE;
}

export function getSearchConsoleAuthUrl(state: string) {
  const config = getSearchConsoleConfig();
  if (!config) {
    throw new Error("Google Search Console OAuth is not configured");
  }

  return buildAuthUrl(state, config);
}

export async function exchangeSearchConsoleCode(code: string) {
  const config = getSearchConsoleConfig();
  if (!config) {
    throw new Error("Google Search Console OAuth is not configured");
  }

  const response = await fetch(SEARCH_CONSOLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code"
    }).toString()
  });

  const payload = (await response.json()) as SearchConsoleTokenResponse;

  if (!response.ok || (!payload.refresh_token && !payload.access_token)) {
    throw new Error(payload.error_description || payload.error || "Failed to exchange OAuth code");
  }

  return payload;
}

export async function saveSearchConsoleConnection(input: {
  refreshToken: string;
  scope?: string;
  tokenType?: string;
  connectedEmail?: string;
}) {
  const config = getSearchConsoleConfig();
  const supabase = createSupabaseAdminClient();

  if (!config || !supabase) {
    throw new Error("Search Console storage is not configured");
  }

  const { error } = await supabase.from("search_console_connections").upsert(
    {
      property: config.property,
      refresh_token: input.refreshToken,
      scope: input.scope ?? null,
      token_type: input.tokenType ?? null,
      connected_email: input.connectedEmail ?? null
    },
    { onConflict: "property" }
  );

  if (error) {
    throw new Error(`Failed to save Search Console connection: ${error.message}`);
  }
}

export async function getSearchRuntimeOptimizations() {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", SEARCH_RUNTIME_OPTIMIZATIONS_KEY)
    .maybeSingle();

  return parseRuntimeOptimizations(data?.value);
}

export async function getSearchRuntimeOptimizationSnapshot(): Promise<SearchRuntimeOptimizationSnapshot> {
  const runtime = await getSearchRuntimeOptimizations();

  return {
    capturedAt: new Date().toISOString(),
    detectedRecommendationIds: runtime?.detectedRecommendationIds ?? [],
    appliedRecommendationIds: runtime?.appliedRecommendationIds ?? [],
    pageTargets: Object.keys(runtime?.pages ?? {}).sort(),
    blogTargets: Object.keys(runtime?.blog ?? {}).sort(),
    recipeTargets: Object.keys(runtime?.recipes ?? {}).sort(),
    runtime
  };
}

export async function restoreSearchRuntimeOptimizationSnapshot(
  snapshot: SearchRuntimeOptimizationSnapshot | null
) {
  await saveRuntimeOptimizations(snapshot?.runtime ?? null);

  return {
    restoredTargetCount:
      Object.keys(snapshot?.runtime?.pages ?? {}).length
      + Object.keys(snapshot?.runtime?.blog ?? {}).length
      + Object.keys(snapshot?.runtime?.recipes ?? {}).length,
    restoredRecommendationCount: snapshot?.runtime?.appliedRecommendationIds.length ?? 0
  };
}

export async function getRuntimeBlogSearchOptimization(slug: string) {
  const runtime = await getSearchRuntimeOptimizations();
  return runtime?.blog[slug];
}

export async function getRuntimeRecipeSearchOptimization(slug: string) {
  const runtime = await getSearchRuntimeOptimizations();
  return runtime?.recipes[slug];
}

export async function getSearchLandingPageOptimization(path: string) {
  const runtime = await getSearchRuntimeOptimizations();
  return runtime?.pages[path] ?? null;
}

async function getLatestSearchInsightWindow() {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("search_insight_runs")
    .select("start_date, end_date, latest_available_date")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read the latest search insight window: ${error.message}`);
  }

  if (!data?.start_date || !data?.end_date || !data?.latest_available_date) {
    return null;
  }

  return {
    startDate: String(data.start_date),
    endDate: String(data.end_date),
    latestAvailableDate: String(data.latest_available_date)
  };
}

function sortQueuedRecommendations(left: SearchQueuedRecommendation, right: SearchQueuedRecommendation) {
  if (left.isActive !== right.isActive) {
    return left.isActive ? -1 : 1;
  }

  const statusWeight: Record<SearchRecommendationStatus, number> = {
    approved: 0,
    new: 1,
    manual_review: 2,
    applied: 3,
    dismissed: 4
  };

  if (statusWeight[left.status] !== statusWeight[right.status]) {
    return statusWeight[left.status] - statusWeight[right.status];
  }

  if (left.priority !== right.priority) {
    return left.priority === "high" ? -1 : 1;
  }

  if (left.totalImpressions !== right.totalImpressions) {
    return right.totalImpressions - left.totalImpressions;
  }

  return right.lastSeenAt.localeCompare(left.lastSeenAt);
}

function buildRecommendationEvaluationBaseline(
  recommendation: SearchQueuedRecommendation
): SearchRecommendationEvaluationBaseline {
  return {
    recommendationKey: recommendation.recommendationKey,
    recommendationId: recommendation.recommendationId,
    title: recommendation.title,
    targetPath: recommendation.targetPath,
    totalImpressions: recommendation.totalImpressions,
    avgPosition: recommendation.avgPosition,
    status: recommendation.status,
    implementationStrategy: recommendation.implementationStrategy,
    supportingQueries: recommendation.supportingQueries,
    lastSeenAt: recommendation.lastSeenAt,
    baselineCapturedAt: new Date().toISOString()
  };
}

function parseRecommendationEvaluationBaseline(
  value: unknown
): SearchRecommendationEvaluationBaseline | null {
  if (!isRecord(value)) {
    return null;
  }

  const status = parseRecommendationStatus(value.status);
  const strategy = parseImplementationStrategy(value.implementationStrategy);
  const recommendationKey = String(value.recommendationKey ?? "").trim();
  const recommendationId = String(value.recommendationId ?? "").trim();
  const title = String(value.title ?? "").trim();
  const lastSeenAt = String(value.lastSeenAt ?? "").trim();
  const baselineCapturedAt = String(value.baselineCapturedAt ?? "").trim();

  if (!status || !strategy || !recommendationKey || !recommendationId || !title || !lastSeenAt) {
    return null;
  }

  const totalImpressions = toFiniteNumber(value.totalImpressions);
  const avgPosition = Number.isFinite(Number(value.avgPosition))
    ? Number(value.avgPosition)
    : undefined;

  return {
    recommendationKey,
    recommendationId,
    title,
    targetPath: typeof value.targetPath === "string" ? value.targetPath : undefined,
    totalImpressions,
    avgPosition,
    status,
    implementationStrategy: strategy,
    supportingQueries: Array.isArray(value.supportingQueries)
      ? value.supportingQueries.map((entry) => String(entry)).filter(Boolean)
      : [],
    lastSeenAt,
    baselineCapturedAt: baselineCapturedAt || new Date().toISOString()
  };
}

function parseRecommendationEvaluationBaselineList(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as SearchRecommendationEvaluationBaseline[];
  }

  return value
    .map(parseRecommendationEvaluationBaseline)
    .filter((entry): entry is SearchRecommendationEvaluationBaseline => Boolean(entry));
}

function getExecutorEvaluationCandidates(
  resultPayload: unknown,
  includeExistingApplied: boolean
) {
  if (!isRecord(resultPayload)) {
    return [] as SearchRecommendationEvaluationBaseline[];
  }

  const preferred = includeExistingApplied
    ? resultPayload.appliedRecommendationSnapshots
    : resultPayload.newlyAppliedRecommendationSnapshots;
  const fallback = includeExistingApplied ? resultPayload.newlyAppliedRecommendationSnapshots : [];

  return [
    ...parseRecommendationEvaluationBaselineList(preferred),
    ...parseRecommendationEvaluationBaselineList(fallback)
  ].filter(
    (entry, index, all) =>
      index === all.findIndex((candidate) => candidate.recommendationKey === entry.recommendationKey)
  );
}

function toUtcDay(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

function diffUtcDays(left: string, right: string) {
  const diffMs = toUtcDay(left).getTime() - toUtcDay(right).getTime();
  return Math.floor(diffMs / 86400000);
}

function buildSearchEvaluationVerdict(input: {
  baseline: SearchRecommendationEvaluationBaseline;
  current: SearchQueuedRecommendation | null;
  latestAvailableDate: string;
}) {
  if (!input.current) {
    return {
      verdict: "escalate" as const,
      notes:
        `Latest Search Console queue no longer contains ${input.baseline.recommendationKey}. ` +
        "Review whether the recommendation was superseded or removed before taking action.",
      observedPayload: {
        latestAvailableDate: input.latestAvailableDate,
        currentRecommendation: null
      }
    };
  }

  const current = input.current;
  const impressionsDelta = current.totalImpressions - input.baseline.totalImpressions;
  const impressionsDeltaPct =
    input.baseline.totalImpressions > 0
      ? impressionsDelta / input.baseline.totalImpressions
      : null;
  const positionDelta =
    typeof input.baseline.avgPosition === "number" && typeof current.avgPosition === "number"
      ? input.baseline.avgPosition - current.avgPosition
      : null;
  const stillApplied = current.status === "applied";

  if (
    stillApplied &&
    (
      (positionDelta !== null && positionDelta >= 1)
      || (impressionsDeltaPct !== null && impressionsDeltaPct >= 0.15)
    )
  ) {
    return {
      verdict: "keep" as const,
      notes:
        `Baseline impressions ${input.baseline.totalImpressions} and avg position ${input.baseline.avgPosition ?? "n/a"} moved to ` +
        `${current.totalImpressions} and ${current.avgPosition ?? "n/a"} in data current through ${input.latestAvailableDate}.`,
      observedPayload: {
        latestAvailableDate: input.latestAvailableDate,
        currentRecommendation: {
          recommendationKey: current.recommendationKey,
          status: current.status,
          isActive: current.isActive,
          totalImpressions: current.totalImpressions,
          avgPosition: current.avgPosition,
          lastSeenAt: current.lastSeenAt
        },
        deltas: {
          impressionsDelta,
          impressionsDeltaPct,
          positionDelta
        }
      }
    };
  }

  if (
    (
      positionDelta !== null &&
      positionDelta <= -2
    ) &&
    (
      impressionsDeltaPct !== null &&
      impressionsDeltaPct <= -0.2
    )
  ) {
    return {
      verdict: "revert" as const,
      notes:
        `Baseline impressions ${input.baseline.totalImpressions} and avg position ${input.baseline.avgPosition ?? "n/a"} fell to ` +
        `${current.totalImpressions} and ${current.avgPosition ?? "n/a"} by ${input.latestAvailableDate}. Review whether the overlay should be reverted or reworked.`,
      observedPayload: {
        latestAvailableDate: input.latestAvailableDate,
        currentRecommendation: {
          recommendationKey: current.recommendationKey,
          status: current.status,
          isActive: current.isActive,
          totalImpressions: current.totalImpressions,
          avgPosition: current.avgPosition,
          lastSeenAt: current.lastSeenAt
        },
        deltas: {
          impressionsDelta,
          impressionsDeltaPct,
          positionDelta
        }
      }
    };
  }

  return {
    verdict: "escalate" as const,
    notes:
      `Signals are mixed for ${input.baseline.recommendationKey}: baseline impressions ${input.baseline.totalImpressions} / avg position ${input.baseline.avgPosition ?? "n/a"}, ` +
      `latest ${current.totalImpressions} / ${current.avgPosition ?? "n/a"}. Keep watching before widening or reverting.`,
    observedPayload: {
      latestAvailableDate: input.latestAvailableDate,
      currentRecommendation: {
        recommendationKey: current.recommendationKey,
        status: current.status,
        isActive: current.isActive,
        totalImpressions: current.totalImpressions,
        avgPosition: current.avgPosition,
        lastSeenAt: current.lastSeenAt
      },
      deltas: {
        impressionsDelta,
        impressionsDeltaPct,
        positionDelta
      }
    }
  };
}

export async function getSearchRecommendationQueue() {
  const property = await resolveSearchConsoleProperty();
  if (!flags.hasSupabaseAdmin || !property) {
    return [];
  }

  const rows = await readSearchRecommendationQueue(property);
  return rows
    .map(parseQueuedRecommendation)
    .filter((entry): entry is SearchQueuedRecommendation => Boolean(entry))
    .sort(sortQueuedRecommendations);
}

export async function getSearchRecommendationQueueSummary() {
  const queue = await getSearchRecommendationQueue();
  return summarizeSearchRecommendationQueue(queue);
}

export async function updateSearchRecommendationStatus(input: {
  recommendationKey: string;
  status: SearchRecommendationStatus;
  decisionReason?: string | null;
}) {
  const property = await resolveSearchConsoleProperty();
  if (!flags.hasSupabaseAdmin || !property) {
    throw new Error("Search recommendation storage is not configured");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Search recommendation storage is not configured");
  }

  const { error } = await supabase
    .from("search_recommendations")
    .update({
      status: input.status,
      decision_reason:
        input.decisionReason === undefined ? null : input.decisionReason,
      updated_at: new Date().toISOString()
    })
    .eq("property", property)
    .eq("recommendation_key", input.recommendationKey);

  if (error) {
    throw new Error(`Failed to update search recommendation status: ${error.message}`);
  }
}

export async function runSearchRecommendationExecutor(): Promise<SearchRecommendationExecutorResult> {
  const property = await resolveSearchConsoleProperty();
  if (!property) {
    return {
      ok: false,
      skippedReason: "Search Console property settings are not available yet."
    };
  }

  if (!flags.hasSupabaseAdmin) {
    return {
      ok: false,
      skippedReason: "Supabase admin access is required to execute queued search recommendations."
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      skippedReason: "Search recommendation storage is not configured."
    };
  }

  const [window, queueRows] = await Promise.all([
    getLatestSearchInsightWindow(),
    readSearchRecommendationQueue(property)
  ]);

  if (!window) {
    return {
      ok: false,
      skippedReason: "Run Search Console sync first so the executor has a source window to work from."
    };
  }

  const queue = queueRows
    .map(parseQueuedRecommendation)
    .filter((entry): entry is SearchQueuedRecommendation => Boolean(entry));

  const execution = executeSearchRecommendationQueue(queue, window);
  const previousByKey = new Map(queue.map((entry) => [entry.recommendationKey, entry]));
  const changedRows = execution.nextRecommendations.filter((entry) => {
    const previous = previousByKey.get(entry.recommendationKey);
    return (
      previous &&
      (previous.status !== entry.status || previous.decisionReason !== entry.decisionReason)
    );
  });
  const newlyAppliedRecommendationKeys = changedRows
    .filter((entry) => {
      const previous = previousByKey.get(entry.recommendationKey);
      return previous && previous.status !== "applied" && entry.status === "applied";
    })
    .map((entry) => entry.recommendationKey);

  if (changedRows.length) {
    const updates = changedRows.map((entry) =>
      supabase
        .from("search_recommendations")
        .update({
          status: entry.status,
          decision_reason: entry.decisionReason,
          updated_at: entry.updatedAt
        })
        .eq("property", entry.property)
        .eq("recommendation_key", entry.recommendationKey)
    );

    const results = await Promise.all(updates);
    const failedResult = results.find((result) => result.error);
    if (failedResult?.error) {
      throw new Error(`Failed to persist executor queue updates: ${failedResult.error.message}`);
    }
  }

  await saveRuntimeOptimizations(execution.runtime);

  const runtimeTargetCount =
    Object.keys(execution.runtime.pages).length +
    Object.keys(execution.runtime.blog).length +
    Object.keys(execution.runtime.recipes).length;
  const queueByKey = new Map(queue.map((entry) => [entry.recommendationKey, entry]));
  const appliedRecommendationSnapshots = execution.runtime.appliedRecommendationIds
    .map((recommendationId) => {
      const match = queue.find((entry) => entry.recommendationId === recommendationId);
      return match ? buildRecommendationEvaluationBaseline(match) : null;
    })
    .filter((entry): entry is SearchRecommendationEvaluationBaseline => Boolean(entry));
  const newlyAppliedRecommendationSnapshots = newlyAppliedRecommendationKeys
    .map((recommendationKey) => {
      const match = queueByKey.get(recommendationKey);
      return match ? buildRecommendationEvaluationBaseline(match) : null;
    })
    .filter((entry): entry is SearchRecommendationEvaluationBaseline => Boolean(entry));

  return {
    ok: true,
    property,
    appliedRecommendationKeys: execution.appliedRecommendationKeys,
    manualReviewRecommendationKeys: execution.manualReviewRecommendationKeys,
    runtimeTargetCount,
    appliedRecommendationCount: execution.runtime.appliedRecommendationIds.length,
    appliedRecommendationSnapshots,
    newlyAppliedRecommendationSnapshots,
    evaluationWindowDays: DEFAULT_SEARCH_EVALUATION_WINDOW_DAYS
  };
}

export async function runSearchPerformanceEvaluator(options?: {
  evaluationWindowDays?: number;
  includeExistingApplied?: boolean;
  maxRuns?: number;
  allowPendingSearchConsoleLag?: boolean;
}): Promise<SearchRecommendationEvaluatorResult> {
  const property = await resolveSearchConsoleProperty();
  if (!property) {
    return {
      ok: false,
      skippedReason: "Search Console property settings are not available yet."
    };
  }

  if (!flags.hasSupabaseAdmin) {
    return {
      ok: false,
      skippedReason: "Supabase admin access is required to evaluate search recommendations."
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      ok: false,
      skippedReason: "Search evaluator storage is not configured."
    };
  }

  const evaluationWindowDays = Math.max(
    0,
    Math.trunc(options?.evaluationWindowDays ?? DEFAULT_SEARCH_EVALUATION_WINDOW_DAYS)
  );
  const maxRuns = Math.max(1, Math.trunc(options?.maxRuns ?? DEFAULT_SEARCH_EVALUATION_MAX_RUNS));
  const includeExistingApplied = options?.includeExistingApplied === true;
  const allowPendingSearchConsoleLag = options?.allowPendingSearchConsoleLag === true;

  const [latestWindow, queue, executorRunsResult] = await Promise.all([
    getLatestSearchInsightWindow(),
    getSearchRecommendationQueue(),
    supabase
      .from("automation_runs")
      .select("id, completed_at, result_payload")
      .eq("agent_id", "search-recommendation-executor")
      .eq("status", "succeeded")
      .order("completed_at", { ascending: false })
      .limit(maxRuns * 3)
  ]);

  if (!latestWindow) {
    return {
      ok: false,
      skippedReason: "Run Search Console sync first so the evaluator has a current queue snapshot."
    };
  }

  if (executorRunsResult.error) {
    throw new Error(`Failed to read search executor runs for evaluation: ${executorRunsResult.error.message}`);
  }

  const executorRuns = ((executorRunsResult.data ?? []) as SearchExecutorRunRow[])
    .filter((row) => typeof row.id === "number" && typeof row.completed_at === "string")
    .filter(
      (row) =>
        allowPendingSearchConsoleLag ||
        diffUtcDays(latestWindow.latestAvailableDate, String(row.completed_at)) >= evaluationWindowDays
    )
    .slice(0, maxRuns);

  if (!executorRuns.length) {
    return {
      ok: true,
      property,
      latestAvailableDate: latestWindow.latestAvailableDate,
      evaluationWindowDays,
      candidateRunCount: 0,
      evaluatedRunIds: [],
      evaluatedRecommendationCount: 0,
      keepCount: 0,
      revertCount: 0,
      escalateCount: 0,
      skippedExistingCount: 0
    };
  }

  const executorRunIds = executorRuns.map((run) => run.id);
  const { data: evaluationLookupRows, error: evaluationLookupError } = await supabase
    .from("automation_evaluations")
    .select("source_run_id, subject_key")
    .in("source_run_id", executorRunIds);

  if (evaluationLookupError) {
    throw new Error(`Failed to read existing search evaluations: ${evaluationLookupError.message}`);
  }

  const existingByRunId = new Map<number, Set<string>>();
  for (const row of (evaluationLookupRows ?? []) as AutomationEvaluationLookupRow[]) {
    const existing = existingByRunId.get(row.source_run_id) ?? new Set<string>();
    existing.add(String(row.subject_key));
    existingByRunId.set(row.source_run_id, existing);
  }

  const queueByKey = new Map(queue.map((entry) => [entry.recommendationKey, entry]));
  const inserts: Array<Record<string, unknown>> = [];
  const evaluatedRunIds = new Set<number>();
  let keepCount = 0;
  let revertCount = 0;
  let escalateCount = 0;
  let skippedExistingCount = 0;

  for (const run of executorRuns) {
    const searchConsoleLagDays = diffUtcDays(
      latestWindow.latestAvailableDate,
      String(run.completed_at)
    );
    const usedPendingSearchConsoleLag =
      allowPendingSearchConsoleLag && searchConsoleLagDays < evaluationWindowDays;
    const candidates = getExecutorEvaluationCandidates(run.result_payload, includeExistingApplied);
    if (!candidates.length) {
      continue;
    }

    const existingSubjectKeys = existingByRunId.get(run.id) ?? new Set<string>();

    for (const candidate of candidates) {
      if (existingSubjectKeys.has(candidate.recommendationKey)) {
        skippedExistingCount += 1;
        continue;
      }

      const verdict = buildSearchEvaluationVerdict({
        baseline: candidate,
        current: queueByKey.get(candidate.recommendationKey) ?? null,
        latestAvailableDate: latestWindow.latestAvailableDate
      });
      const observedPayload = isRecord(verdict.observedPayload)
        ? {
            ...verdict.observedPayload,
            sourceRunCompletedAt: run.completed_at,
            searchConsoleLagDays,
            usedPendingSearchConsoleLag
          }
        : {
            observedPayload: verdict.observedPayload,
            sourceRunCompletedAt: run.completed_at,
            searchConsoleLagDays,
            usedPendingSearchConsoleLag
          };
      const notes = usedPendingSearchConsoleLag
        ? `Seed evaluation only: Search Console data is current through ${latestWindow.latestAvailableDate}, which trails executor run ${run.id} completed at ${run.completed_at}. ${verdict.notes}`
        : verdict.notes;

      if (verdict.verdict === "keep") {
        keepCount += 1;
      } else if (verdict.verdict === "revert") {
        revertCount += 1;
      } else {
        escalateCount += 1;
      }

      inserts.push({
        agent_id: "search-performance-evaluator",
        source_run_id: run.id,
        subject_type: "search_recommendation",
        subject_key: candidate.recommendationKey,
        evaluation_window_days: evaluationWindowDays,
        baseline_payload: candidate,
        observed_payload: observedPayload,
        verdict: verdict.verdict,
        notes
      });
      evaluatedRunIds.add(run.id);
      existingSubjectKeys.add(candidate.recommendationKey);
    }
  }

  if (inserts.length) {
    const { error } = await supabase.from("automation_evaluations").insert(inserts);
    if (error) {
      throw new Error(`Failed to write search evaluator verdicts: ${error.message}`);
    }
  }

  return {
    ok: true,
    property,
    latestAvailableDate: latestWindow.latestAvailableDate,
    evaluationWindowDays,
    candidateRunCount: executorRuns.length,
    evaluatedRunIds: [...evaluatedRunIds].sort((left, right) => right - left),
    evaluatedRecommendationCount: inserts.length,
    keepCount,
    revertCount,
    escalateCount,
    skippedExistingCount
  };
}

export async function getLatestSearchInsightRunSummary() {
  if (!flags.hasSupabaseAdmin) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("search_insight_runs")
    .select("created_at, latest_available_date, recommendations, applied_recommendation_ids")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.created_at || !data?.latest_available_date) {
    return null;
  }

  const summary: LatestSearchInsightRunSummary = {
    createdAt: data.created_at,
    latestAvailableDate: data.latest_available_date,
    recommendationCount: Array.isArray(data.recommendations) ? data.recommendations.length : 0,
    appliedRecommendationIds: Array.isArray(data.applied_recommendation_ids)
      ? data.applied_recommendation_ids.map((item) => String(item))
      : [],
    detectedRecommendationIds: Array.isArray(data.recommendations)
      ? data.recommendations
          .filter(isRecord)
          .map((item) => String(item.id ?? ""))
          .filter(Boolean)
      : []
  };

  return summary;
}

export async function getSearchInsightsDashboard(): Promise<SearchInsightsDashboard> {
  if (!flags.hasSupabaseAdmin) {
    return {
      connection: null,
      latestRun: null,
      recentRuns: [],
      currentRuntime: null,
      queue: [],
      queueSummary: summarizeSearchRecommendationQueue([])
    };
  }

  const supabase = createSupabaseAdminClient();
  const config = getSearchConsoleConfig();

  if (!supabase) {
    return {
      connection: null,
      latestRun: null,
      recentRuns: [],
      currentRuntime: null,
      queue: [],
      queueSummary: summarizeSearchRecommendationQueue([])
    };
  }

  const [connectionResult, latestRunResult, recentRunsResult, currentRuntime, queue] = await Promise.all([
    config
      ? supabase
          .from("search_console_connections")
          .select("property, scope, token_type, connected_email, created_at, updated_at")
          .eq("property", config.property)
          .maybeSingle()
      : supabase
          .from("search_console_connections")
          .select("property, scope, token_type, connected_email, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
    supabase
      .from("search_insight_runs")
      .select(
        "id, property, search_type, start_date, end_date, latest_available_date, snapshot, recommendations, applied_runtime, applied_recommendation_ids, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("search_insight_runs")
      .select("id, property, start_date, end_date, latest_available_date, recommendations, applied_recommendation_ids, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    getSearchRuntimeOptimizations(),
    getSearchRecommendationQueue()
  ]);

  const connectionData = connectionResult.data;
  const latestRunData = latestRunResult.data;

  const connection: SearchConsoleConnectionSummary | null =
    connectionData?.property && connectionData.created_at && connectionData.updated_at
      ? {
          property: connectionData.property,
          scope: connectionData.scope ?? null,
          tokenType: connectionData.token_type ?? null,
          connectedEmail: connectionData.connected_email ?? null,
          createdAt: connectionData.created_at,
          updatedAt: connectionData.updated_at
        }
      : null;

  const latestRun =
    latestRunData &&
    typeof latestRunData.id === "number" &&
    latestRunData.property &&
    latestRunData.search_type &&
    latestRunData.start_date &&
    latestRunData.end_date &&
    latestRunData.latest_available_date &&
    latestRunData.created_at &&
    latestRunData.updated_at
      ? {
          id: latestRunData.id,
          property: String(latestRunData.property),
          searchType: String(latestRunData.search_type),
          startDate: String(latestRunData.start_date),
          endDate: String(latestRunData.end_date),
          latestAvailableDate: String(latestRunData.latest_available_date),
          snapshot: parseSnapshot(latestRunData.snapshot) ?? {
            filters: {},
            queries: [],
            pages: [],
            devices: [],
            countries: [],
            searchAppearance: []
          },
          recommendations: parseRecommendations(latestRunData.recommendations),
          appliedRuntime: parseRuntimeOptimizations(latestRunData.applied_runtime),
          appliedRecommendationIds: Array.isArray(latestRunData.applied_recommendation_ids)
            ? latestRunData.applied_recommendation_ids.map((entry) => String(entry)).filter(Boolean)
            : [],
          createdAt: String(latestRunData.created_at),
          updatedAt: String(latestRunData.updated_at)
        }
      : null;

  const recentRuns: SearchInsightRunHistoryItem[] = Array.isArray(recentRunsResult.data)
    ? recentRunsResult.data
        .filter((row) => typeof row.id === "number" && row.created_at && row.latest_available_date)
        .map((row) => {
          const recommendations = parseRecommendations(row.recommendations);
          return {
            id: row.id,
            property: String(row.property ?? ""),
            startDate: String(row.start_date ?? ""),
            endDate: String(row.end_date ?? ""),
            latestAvailableDate: String(row.latest_available_date ?? ""),
            recommendationCount: recommendations.length,
            appliedRecommendationIds: Array.isArray(row.applied_recommendation_ids)
              ? row.applied_recommendation_ids.map((entry) => String(entry)).filter(Boolean)
              : [],
            detectedRecommendationIds: recommendations.map((entry) => entry.id),
            createdAt: String(row.created_at)
          };
        })
    : [];

  return {
    connection,
    latestRun,
    recentRuns,
    currentRuntime,
    queue,
    queueSummary: summarizeSearchRecommendationQueue(queue)
  };
}

export async function runSearchInsightsAutomation(): Promise<SearchInsightsAutomationResult> {
  const config = getSearchConsoleConfig();
  if (!config) {
    return {
      ok: false,
      skippedReason: "Google Search Console OAuth settings are not fully configured."
    };
  }

  if (!flags.hasSupabaseAdmin) {
    return {
      ok: false,
      skippedReason: "Supabase admin access is required to persist search insight runs."
    };
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return {
      ok: false,
      skippedReason: "Search Console is not connected yet, so there is no refresh token to use."
    };
  }

  const { snapshot, window } = await fetchSnapshot(config, refreshToken);
  const recommendations = buildSearchRecommendations(snapshot);
  const currentRuntime = await getSearchRuntimeOptimizations();

  const runId = await saveSearchInsightRun({
    property: config.property,
    snapshot,
    recommendations,
    window,
    runtime: currentRuntime
  });
  const queueResult = await upsertSearchRecommendationQueue({
    property: config.property,
    runId,
    recommendations
  });

  return {
    ok: true,
    property: config.property,
    runId,
    window,
    queryCount: snapshot.queries.length,
    pageCount: snapshot.pages.length,
    recommendationIds: recommendations.map((recommendation) => recommendation.id),
    newRecommendationCount: queueResult.newRecommendationCount,
    approvedRecommendationCount: queueResult.summary.approvedCount,
    appliedRecommendationCount: queueResult.summary.appliedCount
  };
}
