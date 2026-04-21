import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { buildSearchRecommendationQueueMutations } from "@/lib/search-recommendation-workflow";
import type { SearchRecommendation } from "@/lib/search-performance";

function decodeQuotedValue(value: string) {
  if (!value.length) {
    return value;
  }

  const quote = value[0];
  if ((quote !== '"' && quote !== "'") || value[value.length - 1] !== quote) {
    return value;
  }

  const inner = value.slice(1, -1);
  if (quote === "'") {
    return inner;
  }

  return inner
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function loadEnvFile(filePath: string) {
  const absolutePath = resolve(process.cwd(), filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Env file not found: ${absolutePath}`);
  }

  const contents = readFileSync(absolutePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ") ? line.slice("export ".length) : line;
    const separatorIndex = normalizedLine.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();
    process.env[key] = decodeQuotedValue(rawValue);
  }
}

function collectEnvFiles(argv: string[]) {
  const envFiles: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--env-file") {
      const candidate = argv[index + 1];
      if (!candidate) {
        throw new Error("Missing value after --env-file");
      }

      envFiles.push(candidate);
      index += 1;
    }
  }

  return envFiles;
}

async function main() {
  for (const envFile of collectEnvFiles(process.argv.slice(2))) {
    loadEnvFile(envFile);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const latestRunResult = await supabase
    .from("search_insight_runs")
    .select("id, property, recommendations, applied_recommendation_ids, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestRunResult.error || !latestRunResult.data) {
    throw new Error(latestRunResult.error?.message || "No search insight run found.");
  }

  const latestRun = latestRunResult.data;
  const recommendations = Array.isArray(latestRun.recommendations)
    ? (latestRun.recommendations as SearchRecommendation[])
    : [];
  const appliedIds = new Set(
    Array.isArray(latestRun.applied_recommendation_ids)
      ? latestRun.applied_recommendation_ids.map((value) => String(value))
      : []
  );

  const existingRowsResult = await supabase
    .from("search_recommendations")
    .select("recommendation_key, source_run_id, status, is_active, decision_reason, first_seen_at")
    .eq("property", latestRun.property);

  if (existingRowsResult.error) {
    throw new Error(existingRowsResult.error.message);
  }

  const mutations = buildSearchRecommendationQueueMutations({
    property: String(latestRun.property),
    runId: latestRun.id,
    recommendations,
    existing: (existingRowsResult.data ?? []).map((row) => ({
      recommendationKey: String(row.recommendation_key),
      sourceRunId: typeof row.source_run_id === "number" ? row.source_run_id : null,
      status:
        row.status === "approved" ||
        row.status === "applied" ||
        row.status === "manual_review" ||
        row.status === "dismissed"
          ? row.status
          : "new",
      isActive: row.is_active !== false,
      decisionReason: typeof row.decision_reason === "string" ? row.decision_reason : null,
      firstSeenAt: typeof row.first_seen_at === "string" ? row.first_seen_at : latestRun.created_at
    }))
  });

  const upserts = mutations.upserts.map((row) => {
    const recommendationId = row.recommendation_key.split(":")[0] ?? row.recommendation_key;

    if (appliedIds.has(recommendationId)) {
      return {
        ...row,
        status: "applied" as const,
        decision_reason:
          row.decision_reason ||
          "Carried forward from the legacy auto-applied runtime state that was already live before queue migration."
      };
    }

    if (row.implementation_strategy === "manual_only") {
      return {
        ...row,
        status: "manual_review" as const,
        decision_reason:
          row.decision_reason ||
          "Needs manual technical review. Carried forward from the legacy pre-queue Search Console rollout."
      };
    }

    return row;
  });

  if (upserts.length) {
    const { error } = await supabase
      .from("search_recommendations")
      .upsert(upserts, { onConflict: "property,recommendation_key" });

    if (error) {
      throw new Error(error.message);
    }
  }

  if (mutations.deactivateRecommendationKeys.length) {
    const { error } = await supabase
      .from("search_recommendations")
      .update({ is_active: false })
      .eq("property", latestRun.property)
      .in("recommendation_key", mutations.deactivateRecommendationKeys);

    if (error) {
      throw new Error(error.message);
    }
  }

  const summaryResult = await supabase
    .from("search_recommendations")
    .select("recommendation_key, status, is_active")
    .eq("property", latestRun.property)
    .order("recommendation_key", { ascending: true });

  if (summaryResult.error) {
    throw new Error(summaryResult.error.message);
  }

  console.log(
    JSON.stringify(
      {
        property: latestRun.property,
        runId: latestRun.id,
        upserted: upserts.length,
        deactivated: mutations.deactivateRecommendationKeys.length,
        rows: summaryResult.data ?? []
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
