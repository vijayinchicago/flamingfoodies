import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

function readNumericFlag(argv: string[], name: string) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  const candidate = argv[index + 1];
  if (!candidate) {
    throw new Error(`Missing value after ${name}`);
  }

  const parsed = Number(candidate);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${name}: ${candidate}`);
  }

  return parsed;
}

async function main() {
  const argv = process.argv.slice(2);

  for (const envFile of collectEnvFiles(argv)) {
    loadEnvFile(envFile);
  }

  const { runShopPerformanceEvaluator } = await import("@/lib/services/shop-performance-evaluator");
  const result = await runShopPerformanceEvaluator({
    evaluationWindowDays: readNumericFlag(argv, "--window-days"),
    maxRuns: readNumericFlag(argv, "--max-runs"),
    allowImmatureRuns: argv.includes("--allow-immature-runs")
  });
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
