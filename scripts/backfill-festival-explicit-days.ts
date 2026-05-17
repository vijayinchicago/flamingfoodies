/**
 * Backfill start_day and end_day on existing festival rows by parsing the
 * free-text date_range field. Only writes when the parse is high-confidence —
 * specifically, when date_range contains explicit numeric day(s) like
 * "August 8-9" or "April 25". Rows with only ambiguous cues ("Early May",
 * "Mid October") are skipped and reported as needing editorial review.
 *
 * Run after the 20260516180000_add_festival_explicit_days.sql migration is
 * applied. Safe to re-run; rows that already have start_day/end_day set
 * are skipped.
 *
 * Usage:
 *   npx tsx scripts/backfill-festival-explicit-days.ts --env-file .env.local
 *   npx tsx scripts/backfill-festival-explicit-days.ts --env-file .env.local --dry-run
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { parseDateRangeToDays } from "@/lib/festivals";

function decodeQuotedValue(value: string) {
  if (!value.length) return value;
  const quote = value[0];
  if ((quote !== '"' && quote !== "'") || value[value.length - 1] !== quote) {
    return value;
  }
  const inner = value.slice(1, -1);
  if (quote === "'") return inner;
  return inner
    .replace(/\\n/g, "\n")
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
    if (!line || line.startsWith("#")) continue;
    const normalizedLine = line.startsWith("export ") ? line.slice("export ".length) : line;
    const separatorIndex = normalizedLine.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();
    process.env[key] = decodeQuotedValue(rawValue);
  }
}

function parseFlags(argv: string[]) {
  const envFiles: string[] = [];
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--env-file") {
      const candidate = argv[i + 1];
      if (!candidate) throw new Error("Missing value after --env-file");
      envFiles.push(candidate);
      i += 1;
    } else if (argv[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { envFiles, dryRun };
}

type FestivalRow = {
  slug: string;
  name: string;
  date_range: string;
  start_day: number | null;
  end_day: number | null;
};

async function main() {
  const { envFiles, dryRun } = parseFlags(process.argv.slice(2));
  for (const envFile of envFiles) loadEnvFile(envFile);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script."
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase
    .from("festivals")
    .select("slug, name, date_range, start_day, end_day");

  if (error) {
    throw new Error(`Supabase fetch failed: ${error.message}`);
  }
  const rows = (data ?? []) as FestivalRow[];

  const alreadySet: string[] = [];
  const updates: Array<{ slug: string; name: string; startDay: number; endDay: number; dateRange: string }> = [];
  const ambiguous: Array<{ slug: string; name: string; dateRange: string }> = [];

  for (const row of rows) {
    if (row.start_day !== null && row.end_day !== null) {
      alreadySet.push(row.slug);
      continue;
    }
    const parsed = parseDateRangeToDays(row.date_range);
    if (!parsed) {
      ambiguous.push({ slug: row.slug, name: row.name, dateRange: row.date_range });
      continue;
    }
    updates.push({
      slug: row.slug,
      name: row.name,
      startDay: parsed.startDay,
      endDay: parsed.endDay,
      dateRange: row.date_range
    });
  }

  console.log(`\nFestival catalog: ${rows.length} rows total`);
  console.log(`  Already populated: ${alreadySet.length}`);
  console.log(`  Confident parse → will update: ${updates.length}`);
  console.log(`  Ambiguous (needs editorial review): ${ambiguous.length}\n`);

  if (updates.length > 0) {
    console.log("Will update (slug → start_day–end_day from date_range):");
    for (const u of updates) {
      console.log(`  ${u.slug}: ${u.startDay}–${u.endDay}  (from "${u.dateRange}")`);
    }
  }

  if (ambiguous.length > 0) {
    console.log("\nSkipped — needs editorial review (date_range has no explicit numbers):");
    for (const a of ambiguous) {
      console.log(`  ${a.slug} (${a.name}): "${a.dateRange}"`);
    }
  }

  if (dryRun) {
    console.log("\nDry run — no writes performed.");
    return;
  }

  if (updates.length === 0) {
    console.log("\nNothing to write.");
    return;
  }

  console.log("\nApplying updates…");
  let succeeded = 0;
  let failed = 0;
  for (const u of updates) {
    const { error: updateError } = await supabase
      .from("festivals")
      .update({ start_day: u.startDay, end_day: u.endDay })
      .eq("slug", u.slug);
    if (updateError) {
      console.error(`  ✗ ${u.slug}: ${updateError.message}`);
      failed += 1;
    } else {
      succeeded += 1;
    }
  }
  console.log(`\nDone. ${succeeded} updated, ${failed} failed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
