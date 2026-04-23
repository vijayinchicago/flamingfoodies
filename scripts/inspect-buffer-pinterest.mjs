#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function decodeQuotedValue(value) {
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

function loadEnvFile(filePath) {
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

function getArgValue(name) {
  const argv = process.argv.slice(2);

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === name) {
      return argv[index + 1] ?? null;
    }
  }

  return null;
}

function collectEnvFiles() {
  const argv = process.argv.slice(2);
  const envFiles = [];

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

function parseChannelMappings(value) {
  const mappings = new Map();

  for (const rawEntry of (value || "").split(",")) {
    const entry = rawEntry.trim();
    if (!entry) {
      continue;
    }

    const [platform, channelId] = entry.includes(":")
      ? entry.split(":", 2).map((part) => part.trim())
      : ["all", entry];

    if (!channelId) {
      continue;
    }

    const existing = mappings.get(platform) ?? [];
    existing.push(channelId);
    mappings.set(platform, existing);
  }

  return mappings;
}

async function bufferRequest(query, variables = {}) {
  const apiKey = process.env.BUFFER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("BUFFER_API_KEY is required for this script.");
  }

  const response = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const payload = await response.json().catch(() => null);
  const errorMessages = (payload?.errors ?? [])
    .map((error) => error?.message?.trim())
    .filter(Boolean);

  if (!response.ok) {
    throw new Error(
      errorMessages[0] ?? `Buffer request failed with status ${response.status}.`
    );
  }

  if (errorMessages.length) {
    throw new Error(errorMessages.join(" | "));
  }

  if (!payload?.data) {
    throw new Error("Buffer returned an empty response.");
  }

  return payload.data;
}

async function main() {
  for (const envFile of collectEnvFiles()) {
    loadEnvFile(envFile);
  }

  const organizationOverride =
    getArgValue("--organization-id") || process.env.BUFFER_ORGANIZATION_ID?.trim() || null;
  const channelOverride = getArgValue("--channel-id");
  const configuredMappings = parseChannelMappings(
    process.env.BUFFER_CHANNEL_IDS || process.env.BUFFER_PROFILE_IDS || ""
  );

  const organizationsData = await bufferRequest(`
    query GetOrganizations {
      account {
        organizations {
          id
        }
      }
    }
  `);

  const organizations = organizationsData?.account?.organizations ?? [];
  const organizationId =
    organizationOverride || (organizations.length === 1 ? organizations[0]?.id ?? null : null);

  if (!organizationId) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          message:
            "Multiple Buffer organizations were found. Re-run with --organization-id <id> or set BUFFER_ORGANIZATION_ID.",
          organizations
        },
        null,
        2
      )
    );
    process.exit(1);
  }

  const channelsData = await bufferRequest(
    `
      query GetChannels($organizationId: OrganizationId!) {
        channels(input: { organizationId: $organizationId }) {
          id
          name
          displayName
          service
          isQueuePaused
        }
      }
    `,
    {
      organizationId
    }
  );

  const channels = channelsData?.channels ?? [];
  const pinterestChannels = channels.filter((channel) => channel?.service === "pinterest");
  const configuredPinterestChannels = [
    ...(configuredMappings.get("pinterest") ?? []),
    ...(configuredMappings.get("all") ?? [])
  ];
  const pinterestChannelId =
    channelOverride ||
    configuredPinterestChannels[0] ||
    (pinterestChannels.length === 1 ? pinterestChannels[0]?.id ?? null : null);

  let pinterestBoards = [];

  if (pinterestChannelId) {
    const channelData = await bufferRequest(
      `
        query GetPinterestBoards($channelId: ChannelId!) {
          channel(input: { id: $channelId }) {
            id
            displayName
            service
            metadata {
              ... on PinterestMetadata {
                boards {
                  serviceId
                }
              }
            }
          }
        }
      `,
      {
        channelId: pinterestChannelId
      }
    );

    pinterestBoards = channelData?.channel?.metadata?.boards ?? [];
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        organizationId,
        configuredChannelMappings: Object.fromEntries(configuredMappings),
        channels,
        pinterestChannels,
        pinterestChannelId: pinterestChannelId ?? null,
        pinterestBoards,
        envChecklist: {
          BUFFER_API_KEY: Boolean(process.env.BUFFER_API_KEY?.trim()),
          BUFFER_CHANNEL_IDS: process.env.BUFFER_CHANNEL_IDS?.trim() || null,
          BUFFER_PINTEREST_BOARD_ID: process.env.BUFFER_PINTEREST_BOARD_ID?.trim() || null,
          BUFFER_ORGANIZATION_ID: process.env.BUFFER_ORGANIZATION_ID?.trim() || null
        }
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
