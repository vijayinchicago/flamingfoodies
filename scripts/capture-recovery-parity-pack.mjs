#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const SAFE_VALUE_NAMES = new Set([
  "ALLOW_SAMPLE_FALLBACKS",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SITE_NAME",
  "NEXT_PUBLIC_ENABLE_GOOGLE_AUTH",
  "NEXT_PUBLIC_ENABLE_GITHUB_AUTH",
  "NEXT_PUBLIC_SHOW_ADS",
  "NEXT_PUBLIC_PLAUSIBLE_DOMAIN",
  "NEXT_PUBLIC_MAINTENANCE_MODE",
  "NEXT_PUBLIC_ALLOW_MOCK_ADMIN",
  "GOOGLE_SEARCH_CONSOLE_PROPERTY",
  "GOOGLE_SEARCH_CONSOLE_REDIRECT_URI",
  "BUFFER_CHANNEL_IDS"
]);

const AGENT_REQUIREMENTS = [
  {
    id: "editorial-autopublisher",
    evaluate: (signals) =>
      signals.hasSupabaseAdmin
        ? {
            status: "runtime_setting_required",
            reason: "Requires `auto_publish_ai_content` from `site_settings`, not just env state."
          }
        : {
            status: "needs_config",
            reason: "Supabase admin access is required before the publish path can run live."
          }
  },
  {
    id: "editorial-performance-evaluator",
    evaluate: (signals) =>
      signals.hasSupabaseAdmin
        ? { status: "likely_live", reason: "Supabase admin access is present." }
        : { status: "needs_config", reason: "Supabase admin access is missing." }
  },
  {
    id: "pinterest-distributor",
    evaluate: (signals) =>
      signals.hasPinterestDistribution
        ? { status: "likely_live", reason: "Buffer credentials, Pinterest target, and board are all present." }
        : { status: "needs_config", reason: "Pinterest Buffer credentials or board mapping are incomplete." }
  },
  {
    id: "growth-loop-promoter",
    evaluate: (signals) =>
      signals.hasSocialDistribution
        ? { status: "likely_live", reason: "A live social destination is configured." }
        : { status: "needs_config", reason: "No live social destination is configured." }
  },
  {
    id: "social-distribution-evaluator",
    evaluate: (signals) =>
      signals.hasSocialDistribution && signals.hasSupabaseAdmin
        ? { status: "likely_live", reason: "Social distribution plus Supabase admin access are present." }
        : { status: "needs_config", reason: "Needs both social distribution and Supabase admin access." }
  },
  {
    id: "shop-shelf-curator",
    evaluate: (signals) =>
      signals.hasSupabaseAdmin
        ? { status: "likely_live", reason: "Supabase admin access is present." }
        : { status: "needs_config", reason: "Supabase admin access is missing." }
  },
  {
    id: "shop-performance-evaluator",
    evaluate: (signals) =>
      signals.hasSupabaseAdmin
        ? { status: "likely_live", reason: "Supabase admin access is present." }
        : { status: "needs_config", reason: "Supabase admin access is missing." }
  },
  {
    id: "newsletter-digest-agent",
    evaluate: (signals) =>
      signals.hasConvertKit
        ? { status: "likely_live", reason: "ConvertKit signup configuration is present." }
        : { status: "needs_config", reason: "ConvertKit configuration is incomplete." }
  },
  {
    id: "search-insights-analyst",
    evaluate: (signals) =>
      signals.hasSearchConsoleAuth
        ? { status: "likely_live", reason: "Search Console auth is configured with a refresh token." }
        : { status: "needs_config", reason: "Search Console auth is incomplete." }
  },
  {
    id: "search-recommendation-executor",
    evaluate: (signals) =>
      signals.hasSearchConsoleAuth
        ? { status: "likely_live", reason: "Search Console auth is configured with a refresh token." }
        : { status: "needs_config", reason: "Search Console auth is incomplete." }
  },
  {
    id: "search-performance-evaluator",
    evaluate: (signals) =>
      signals.hasSearchConsoleAuth
        ? { status: "likely_live", reason: "Search Console auth is configured with a refresh token." }
        : { status: "needs_config", reason: "Search Console auth is incomplete." }
  },
  {
    id: "festival-discovery",
    evaluate: (signals) =>
      signals.hasAiResearch
        ? { status: "likely_live", reason: "Anthropic and Supabase admin access are present." }
        : { status: "needs_config", reason: "Needs both Anthropic and Supabase admin access." }
  },
  {
    id: "pepper-discovery",
    evaluate: (signals) =>
      signals.hasAiResearch
        ? { status: "likely_live", reason: "Anthropic and Supabase admin access are present." }
        : { status: "needs_config", reason: "Needs both Anthropic and Supabase admin access." }
  },
  {
    id: "brand-discovery",
    evaluate: (signals) =>
      signals.hasAiResearch
        ? { status: "likely_live", reason: "Anthropic and Supabase admin access are present." }
        : { status: "needs_config", reason: "Needs both Anthropic and Supabase admin access." }
  },
  {
    id: "release-monitor",
    evaluate: (signals) =>
      signals.hasAiResearch
        ? { status: "likely_live", reason: "Anthropic and Supabase admin access are present." }
        : { status: "needs_config", reason: "Needs both Anthropic and Supabase admin access." }
  },
  {
    id: "tutorial-generator",
    evaluate: (signals) =>
      signals.hasAiResearch
        ? { status: "likely_live", reason: "Anthropic and Supabase admin access are present." }
        : { status: "needs_config", reason: "Needs both Anthropic and Supabase admin access." }
  },
  {
    id: "content-shop-sync",
    evaluate: (signals) =>
      signals.hasSupabaseAdmin
        ? { status: "likely_live", reason: "Supabase admin access is present." }
        : { status: "needs_config", reason: "Supabase admin access is missing." }
  }
];

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasArg(flag) {
  return process.argv.includes(flag);
}

function printHelp() {
  console.log(`Usage:
  node scripts/capture-recovery-parity-pack.mjs [--env-file <path>] [--label <name>] [--output-dir <path>]

Examples:
  pnpm parity-pack:capture -- --env-file .env.recovery.production --label production
  node scripts/capture-recovery-parity-pack.mjs --label local-shell

What it does:
  - captures sanitized env state from the provided env file or current process env
  - records git metadata, cron inventory, route inventory, and inferred agent readiness
  - writes a parity-pack JSON, markdown summary, provider registry template, and manual follow-up checklist
`);
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatTimestampForPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isConfigured(value) {
  const normalized = normalizeString(value);
  return Boolean(normalized && normalized !== '""' && normalized !== "''");
}

function parseEnvFile(content) {
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const name = match[1];
    let value = match[2] ?? "";
    const commentIndex = value.search(/\s+#/);
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex);
    }

    value = value.trim();

    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[name] = value;
  }

  return values;
}

async function loadEnvSource(envFile) {
  if (!envFile) {
    return {
      kind: "process_env",
      path: null,
      values: { ...process.env }
    };
  }

  const resolved = path.resolve(ROOT, envFile);
  const content = await fs.readFile(resolved, "utf8");

  return {
    kind: "env_file",
    path: resolved,
    values: parseEnvFile(content)
  };
}

async function getEnvReferenceNames() {
  const content = await fs.readFile(path.join(ROOT, ".env.example"), "utf8");
  return Object.keys(parseEnvFile(content));
}

function runGit(args) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return "";
  }

  return result.stdout.trim();
}

function getGitMetadata() {
  return {
    branch: runGit(["rev-parse", "--abbrev-ref", "HEAD"]) || null,
    commit: runGit(["rev-parse", "HEAD"]) || null,
    shortCommit: runGit(["rev-parse", "--short", "HEAD"]) || null,
    latestTag: runGit(["describe", "--tags", "--abbrev=0"]) || null,
    headTags: runGit(["tag", "--points-at", "HEAD"])
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    isDirty: Boolean(runGit(["status", "--porcelain"]))
  };
}

function maskValue(name, value) {
  if (!isConfigured(value)) {
    return null;
  }

  if (SAFE_VALUE_NAMES.has(name)) {
    return value;
  }

  return `(redacted, ${value.length} chars)`;
}

function buildEnvManifest(names, values) {
  const variables = names.map((name) => {
    const rawValue = Object.prototype.hasOwnProperty.call(values, name) ? values[name] : undefined;
    const normalized = normalizeString(rawValue);
    const present = Object.prototype.hasOwnProperty.call(values, name);

    let state = "missing";
    if (present && normalized) {
      if (normalized === "true") {
        state = "enabled";
      } else if (normalized === "false") {
        state = "disabled";
      } else {
        state = "set";
      }
    } else if (present) {
      state = "blank";
    }

    return {
      name,
      state,
      valuePreview: maskValue(name, normalized),
      length: normalized.length || 0
    };
  });

  const counts = variables.reduce(
    (accumulator, variable) => {
      accumulator[variable.state] = (accumulator[variable.state] ?? 0) + 1;
      return accumulator;
    },
    {
      set: 0,
      enabled: 0,
      disabled: 0,
      blank: 0,
      missing: 0
    }
  );

  return {
    counts,
    variables
  };
}

function parseBufferTargets(value) {
  return normalizeString(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildRuntimeSignals(values) {
  const siteUrl = normalizeString(values.NEXT_PUBLIC_SITE_URL);
  const supabaseUrl = normalizeString(values.NEXT_PUBLIC_SUPABASE_URL);
  const supabasePublicKey =
    normalizeString(values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    || normalizeString(values.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabaseAdminKey =
    normalizeString(values.SUPABASE_SECRET_KEY) || normalizeString(values.SUPABASE_SERVICE_ROLE_KEY);
  const bufferTargets =
    normalizeString(values.BUFFER_CHANNEL_IDS) || normalizeString(values.BUFFER_PROFILE_IDS);
  const pinterestTargets = parseBufferTargets(bufferTargets).filter((entry) => entry.startsWith("pinterest:"));
  const hasBufferGraphql = isConfigured(values.BUFFER_API_KEY);
  const hasBufferLegacyToken = isConfigured(values.BUFFER_ACCESS_TOKEN);
  const hasConvertKit = isConfigured(values.CONVERTKIT_API_KEY) && isConfigured(values.CONVERTKIT_FORM_ID);
  const hasConvertKitBroadcast = isConfigured(values.CONVERTKIT_API_SECRET);
  const hasSearchConsoleConfig =
    isConfigured(values.GOOGLE_SEARCH_CONSOLE_PROPERTY)
    && isConfigured(values.GOOGLE_SEARCH_CONSOLE_CLIENT_ID)
    && isConfigured(values.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET)
    && isConfigured(values.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI);
  const hasSearchConsoleAuth =
    hasSearchConsoleConfig && isConfigured(values.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN);
  const hasSupabase = Boolean(supabaseUrl && supabasePublicKey);
  const hasSupabaseAdmin = Boolean(supabaseUrl && supabaseAdminKey);
  const hasBuffer = hasBufferGraphql || hasBufferLegacyToken;
  const hasSocialDistribution = hasBuffer && parseBufferTargets(bufferTargets).length > 0;
  const hasPinterestDistribution =
    hasBuffer && pinterestTargets.length > 0 && isConfigured(values.BUFFER_PINTEREST_BOARD_ID);
  const hasAnthropic = isConfigured(values.ANTHROPIC_API_KEY);

  return {
    siteUrl: siteUrl || null,
    hasSupabase,
    hasSupabaseAdmin,
    hasConvertKit,
    hasConvertKitBroadcast,
    hasAnthropic,
    hasBuffer,
    hasBufferGraphql,
    hasBufferLegacyToken,
    hasBufferTargets: parseBufferTargets(bufferTargets).length > 0,
    hasSocialDistribution,
    hasPinterestTarget: pinterestTargets.length > 0,
    hasPinterestBoard: isConfigured(values.BUFFER_PINTEREST_BOARD_ID),
    hasPinterestDistribution,
    hasSearchConsoleConfig,
    hasSearchConsoleAuth,
    hasAdsense:
      isConfigured(values.NEXT_PUBLIC_ADSENSE_ID) && normalizeString(values.NEXT_PUBLIC_SHOW_ADS) === "true",
    hasUpstash: isConfigured(values.KV_REST_API_URL) && isConfigured(values.KV_REST_API_TOKEN),
    hasUnsplash: isConfigured(values.UNSPLASH_ACCESS_KEY),
    hasPexels: isConfigured(values.PEXELS_API_KEY),
    hasSkimlinks: isConfigured(values.NEXT_PUBLIC_SKIMLINKS_ID),
    googleAuthEnabled: normalizeString(values.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH) === "true",
    githubAuthEnabled: normalizeString(values.NEXT_PUBLIC_ENABLE_GITHUB_AUTH) === "true",
    allowSampleFallbacks: normalizeString(values.ALLOW_SAMPLE_FALLBACKS) === "true",
    mockAdminEnabled: normalizeString(values.NEXT_PUBLIC_ALLOW_MOCK_ADMIN) !== "false",
    maintenanceMode: normalizeString(values.NEXT_PUBLIC_MAINTENANCE_MODE) === "true",
    hasAiResearch: hasAnthropic && hasSupabaseAdmin
  };
}

function buildProviderStatus(signals, values) {
  return [
    {
      service: "Supabase",
      status: signals.hasSupabaseAdmin ? "configured" : signals.hasSupabase ? "partial" : "missing"
    },
    {
      service: "Anthropic",
      status: signals.hasAnthropic ? "configured" : "missing"
    },
    {
      service: "Buffer",
      status: signals.hasBuffer ? "configured" : "missing"
    },
    {
      service: "Pinterest via Buffer",
      status: signals.hasPinterestDistribution ? "configured" : signals.hasPinterestTarget ? "partial" : "missing"
    },
    {
      service: "ConvertKit",
      status: signals.hasConvertKit
        ? signals.hasConvertKitBroadcast
          ? "configured"
          : "partial"
        : "missing"
    },
    {
      service: "Search Console",
      status: signals.hasSearchConsoleAuth
        ? "configured"
        : signals.hasSearchConsoleConfig
          ? "partial"
          : "missing"
    },
    {
      service: "AdSense",
      status: signals.hasAdsense ? "configured" : "disabled"
    },
    {
      service: "Upstash",
      status: signals.hasUpstash ? "configured" : "disabled"
    },
    {
      service: "Unsplash",
      status: signals.hasUnsplash ? "configured" : "disabled"
    },
    {
      service: "Pexels",
      status: signals.hasPexels ? "configured" : "disabled"
    },
    {
      service: "Skimlinks",
      status: signals.hasSkimlinks ? "configured" : "disabled"
    },
    {
      service: "GA4",
      status: isConfigured(values.NEXT_PUBLIC_GA4_ID) ? "configured" : "disabled"
    },
    {
      service: "Clarity",
      status: isConfigured(values.NEXT_PUBLIC_CLARITY_ID) ? "configured" : "disabled"
    },
    {
      service: "Plausible",
      status: isConfigured(values.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) ? "configured" : "disabled"
    }
  ];
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function toRoutePath(relativePath) {
  const withoutLeaf = relativePath.replace(/\/(page|route)\.(t|j)sx?$/, "");
  const parts = withoutLeaf
    .split(path.sep)
    .join("/")
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\(.*\)$/.test(segment));
  return parts.length ? `/${parts.join("/")}` : "/";
}

async function getRouteInventory() {
  const appRoot = path.join(ROOT, "app");
  const files = await walk(appRoot);

  const pageRoutes = files
    .filter((file) => /\/page\.(t|j)sx?$/.test(file))
    .map((file) => toRoutePath(path.relative(appRoot, file)))
    .sort();

  const routeHandlers = files
    .filter((file) => /\/route\.(t|j)sx?$/.test(file))
    .map((file) => toRoutePath(path.relative(appRoot, file)))
    .sort();

  return {
    pageRoutes,
    adminPages: pageRoutes.filter((route) => route.startsWith("/admin")).sort(),
    publicPages: pageRoutes.filter((route) => !route.startsWith("/admin") && !route.startsWith("/api")).sort(),
    apiAdminRoutes: routeHandlers.filter((route) => route.startsWith("/api/admin")).sort()
  };
}

async function getCronInventory() {
  const raw = await fs.readFile(path.join(ROOT, "vercel.json"), "utf8");
  const parsed = JSON.parse(raw);
  return parsed.crons ?? [];
}

async function getAgentInventory(signals) {
  const raw = await fs.readFile(path.join(ROOT, "lib", "autonomous-agents.ts"), "utf8");
  const ids = [...raw.matchAll(/id:\s*"([^"]+)"/g)]
    .map((match) => match[1])
    .filter((value, index, array) => array.indexOf(value) === index);

  const inferredStatus = AGENT_REQUIREMENTS.map((entry) => ({
    id: entry.id,
    ...entry.evaluate(signals)
  }));

  return {
    ids,
    inferredStatus
  };
}

function buildSummaryMarkdown(pack) {
  const envRows = pack.env.variables
    .map(
      (variable) =>
        `| \`${variable.name}\` | ${variable.state} | ${variable.valuePreview ?? ""} |`
    )
    .join("\n");

  const cronRows = pack.crons
    .map((cron) => `| \`${cron.path}\` | \`${cron.schedule}\` |`)
    .join("\n");

  const agentRows = pack.agents.inferredStatus
    .map((agent) => `| \`${agent.id}\` | ${agent.status} | ${agent.reason} |`)
    .join("\n");

  const providerRows = pack.providers
    .map((provider) => `| ${provider.service} | ${provider.status} |`)
    .join("\n");

  return `# Recovery Parity Pack

Captured at: \`${pack.capturedAt}\`

Label: \`${pack.label}\`

## Git

- Branch: \`${pack.git.branch ?? "unknown"}\`
- Commit: \`${pack.git.commit ?? "unknown"}\`
- Latest tag: \`${pack.git.latestTag ?? "none"}\`
- HEAD tags: ${pack.git.headTags.length ? pack.git.headTags.map((tag) => `\`${tag}\``).join(", ") : "none"}
- Dirty worktree: ${pack.git.isDirty ? "yes" : "no"}

## Env Summary

- Source: \`${pack.env.source.kind}\`${pack.env.source.path ? ` (${pack.env.source.path})` : ""}
- Set: ${pack.env.counts.set}
- Enabled: ${pack.env.counts.enabled}
- Disabled: ${pack.env.counts.disabled}
- Blank: ${pack.env.counts.blank}
- Missing: ${pack.env.counts.missing}

| Variable | State | Sanitized value |
| --- | --- | --- |
${envRows}

## Runtime Signals

\`\`\`json
${JSON.stringify(pack.runtimeSignals, null, 2)}
\`\`\`

## Provider Status

| Provider | Status |
| --- | --- |
${providerRows}

## Cron Inventory

| Path | Schedule |
| --- | --- |
${cronRows}

## Agent Readiness

| Agent | Inferred status | Reason |
| --- | --- | --- |
${agentRows}

## Route Inventory Counts

- Public pages: ${pack.routes.publicPages.length}
- Admin pages: ${pack.routes.adminPages.length}
- Admin API routes: ${pack.routes.apiAdminRoutes.length}

## Files In This Pack

- \`parity-pack.json\`
- \`summary.md\`
- \`manual-followups.md\`
- \`provider-registry-template.md\`
`;
}

function buildManualChecklist(pack) {
  return `# Manual Follow-Ups For ${pack.label}

This pack captured the repo-side and env-side baseline automatically.
Complete the items below to make it a full disaster-recovery parity pack.

## Provider Dashboards

- [ ] Export or record the Vercel production env inventory that matches this capture timestamp
- [ ] Export or record the deployed Vercel cron inventory
- [ ] Record the Buffer organization ID, Pinterest channel ID, and Pinterest board \`serviceId\`
- [ ] Record the Search Console Cloud project ID, OAuth client IDs, property string, and callback URLs
- [ ] Record the ConvertKit form ID plus any account-side automations or tag mappings not represented in code
- [ ] Record the Amazon Associates tracking tag and account owner
- [ ] Record any Skimlinks publisher ID if it is part of production monetization
- [ ] Record the AdSense publisher ID and slot inventory if ads are enabled
- [ ] Record the GA4 measurement ID, Clarity project ID, and Plausible site domain if those are enabled
- [ ] Record the Upstash database name/region if likes telemetry is enabled
- [ ] Record the Unsplash app and Pexels app/account owners if media lookup is enabled

## Supabase State

- [ ] Export the full \`site_settings\` table
- [ ] Export row counts for the key recovery tables listed in the disaster recovery guide
- [ ] Export storage object counts for \`avatars\`, \`admin-media\`, and \`community-media\`
- [ ] Confirm the current admin username expected by \`supabase/seed.sql\`

## Screenshots / Visual Baseline

- [ ] Capture screenshots for: \`/\`, \`/recipes\`, \`/reviews\`, \`/shop\`, \`/blog\`, \`/search\`, \`/quiz\`
- [ ] Capture one representative detail page for each major vertical
- [ ] Capture screenshots for: \`/admin\`, \`/admin/automation/agents\`, \`/admin/automation/runs\`, \`/admin/automation/approvals\`, \`/admin/settings/general\`, \`/admin/settings/affiliates\`, \`/admin/social/queue\`, \`/admin/newsletter/campaigns\`, \`/admin/analytics/search-console\`

## Validation

- [ ] Compare this capture to the matching database backup timestamp
- [ ] Save this parity pack beside the backup set that shares the same timestamp window
- [ ] Treat provider-side settings that are not stored in code as first-class recovery assets
`;
}

function buildProviderRegistryTemplate() {
  return `# Provider Registry Template

Fill this out when creating or refreshing a parity pack.

| Service | Owner | Account email / login | Dashboard URL | Critical IDs / callbacks | Last verified | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| GitHub |  |  |  | repo, branch, release tags |  |  |
| Vercel |  |  |  | project, team, domains |  |  |
| Domain / DNS |  |  |  | registrar, zone, TXT/CNAME records |  |  |
| Supabase |  |  |  | project URL, publishable key, secret key |  |  |
| Supabase Google OAuth |  |  |  | callback URL, client ID |  |  |
| Supabase GitHub OAuth |  |  |  | callback URL, client ID |  |  |
| SMTP provider |  |  |  | sender identity, host |  |  |
| Anthropic |  |  |  | key owner, model |  |  |
| Buffer |  |  |  | org ID, API key owner |  |  |
| Pinterest in Buffer |  |  |  | channel ID, board service ID |  |  |
| ConvertKit / Kit |  |  |  | form ID, API key owner |  |  |
| Google Cloud / Search Console |  |  |  | project ID, OAuth client, property, callback URIs |  |  |
| Amazon Associates |  |  |  | tracking tag |  |  |
| Skimlinks |  |  |  | publisher ID |  |  |
| AdSense |  |  |  | publisher ID, slot IDs |  |  |
| GA4 |  |  |  | measurement ID |  |  |
| Clarity |  |  |  | project ID |  |  |
| Plausible |  |  |  | site domain |  |  |
| Upstash |  |  |  | REST URL, DB name |  |  |
| Unsplash |  |  |  | app owner |  |  |
| Pexels |  |  |  | API key owner |  |  |
`;
}

async function ensureDirectory(directory) {
  await fs.mkdir(directory, { recursive: true });
}

async function writeFile(filePath, content) {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

async function main() {
  if (hasArg("--help") || hasArg("-h")) {
    printHelp();
    return;
  }

  const envFile = getArgValue("--env-file");
  const label = getArgValue("--label") || "manual";
  const outputDirArg = getArgValue("--output-dir");
  const capturedAt = new Date().toISOString();
  const outputDir = outputDirArg
    ? path.resolve(ROOT, outputDirArg)
    : path.join(ROOT, "artifacts", "parity-packs", `${formatTimestampForPath(new Date())}-${slugify(label) || "capture"}`);

  const envSource = await loadEnvSource(envFile);
  const envNames = await getEnvReferenceNames();
  const envManifest = buildEnvManifest(envNames, envSource.values);
  const runtimeSignals = buildRuntimeSignals(envSource.values);
  const [crons, routes, agents] = await Promise.all([
    getCronInventory(),
    getRouteInventory(),
    getAgentInventory(runtimeSignals)
  ]);

  const packageJson = JSON.parse(await fs.readFile(path.join(ROOT, "package.json"), "utf8"));
  const git = getGitMetadata();
  const providers = buildProviderStatus(runtimeSignals, envSource.values);

  const pack = {
    capturedAt,
    label,
    package: {
      name: packageJson.name,
      version: packageJson.version,
      node: packageJson.engines?.node ?? null
    },
    git,
    env: {
      source: {
        kind: envSource.kind,
        path: envSource.path
      },
      counts: envManifest.counts,
      variables: envManifest.variables
    },
    runtimeSignals,
    providers,
    crons,
    agents,
    routes
  };

  await ensureDirectory(outputDir);

  await writeFile(path.join(outputDir, "parity-pack.json"), `${JSON.stringify(pack, null, 2)}\n`);
  await writeFile(path.join(outputDir, "summary.md"), buildSummaryMarkdown(pack));
  await writeFile(path.join(outputDir, "manual-followups.md"), buildManualChecklist(pack));
  await writeFile(path.join(outputDir, "provider-registry-template.md"), buildProviderRegistryTemplate());

  console.log(`Recovery parity pack written to ${outputDir}`);
  console.log(`- summary.md`);
  console.log(`- parity-pack.json`);
  console.log(`- manual-followups.md`);
  console.log(`- provider-registry-template.md`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
