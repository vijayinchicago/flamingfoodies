/**
 * Brand and release research agents.
 * - Brand discovery writes draft brand rows only.
 * - Release monitoring creates approval proposals instead of publishing releases directly.
 */

import Anthropic from "@anthropic-ai/sdk";

import type { ReleaseType } from "@/lib/releases";
import {
  createAutomationApproval,
  getAutomationApproval,
  updateAutomationApproval
} from "@/lib/services/automation-control";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type BrandDiscoveryResult = {
  brandsFound: number;
  brandsInserted: number;
  error?: string;
};

export type ReleaseMonitorResult = {
  releasesFound: number;
  approvalsCreated: number;
  approvalsUpdated: number;
  error?: string;
};

export type BrandMonitorResult = {
  brandsFound: number;
  brandsInserted: number;
  releasesFound: number;
  approvalsCreated: number;
  approvalsUpdated: number;
  error?: string;
};

export type ReleaseApprovalPayload = {
  release: {
    subjectKey: string;
    proposedSlug: string;
    title: string;
    brand: string;
    type: ReleaseType;
    description: string;
    body: string;
    sourceUrl: string | null;
    featured: boolean;
    source: string;
  };
};

type BrandDiscoveryCandidate = {
  name?: string;
  tagline?: string;
  founded?: string;
  origin?: string;
  city?: string;
  tier?: string;
  description?: string;
  why_it_matters?: string;
  best_for?: string;
  signature_products?: Array<{
    name?: string;
    description?: string;
  }>;
};

type ReleaseCandidate = {
  title?: string;
  brand?: string;
  type?: string;
  description?: string;
  body?: string;
  source_url?: string;
};

type ReleaseRow = {
  id: number;
  slug: string;
};

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildReleaseApprovalSubjectKey(input: {
  title: string;
  brand: string;
  type: string;
}) {
  return `${toSlug(input.brand)}:${toSlug(input.title)}:${toSlug(input.type)}`;
}

function buildReleaseSlugBase(input: { title: string; brand: string }) {
  return toSlug(`${input.brand}-${input.title}`).slice(0, 80);
}

function normalizeReleaseType(value: string | undefined): ReleaseType {
  if (
    value === "new-product"
    || value === "limited-edition"
    || value === "collab"
    || value === "restock"
    || value === "brand-news"
  ) {
    return value;
  }

  return "new-product";
}

function extractTextContent(response: Awaited<ReturnType<Anthropic["messages"]["create"]>>) {
  if (!("content" in response) || !Array.isArray(response.content)) {
    return "";
  }

  let output = "";

  for (const block of response.content) {
    if (block.type === "text") {
      output += block.text;
    }
  }

  return output.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

function parseJsonArray<T>(raw: string): T[] {
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function createAnthropicClient() {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

const BRAND_SYSTEM = `You are a brand researcher for FlamingFoodies.com.

Search for hot sauce and spicy food brands that are NOT in this list. Focus on:
- Craft brands with cult followings not yet mainstream
- Recently launched brands gaining traction
- International brands entering the US market

Return a JSON array of brand objects with EXACTLY these fields:
{
  "name": string,
  "tagline": string,
  "founded": string,
  "origin": string,        // usa|mexico|caribbean|uk|belize|canada|australia
  "city": string,
  "tier": string,          // iconic|craft|premium|regional|subscription
  "description": string,   // 2-3 sentences
  "why_it_matters": string,
  "best_for": string,
  "signature_products": [{ "name": string, "description": string }]
}

Return ONLY valid JSON array. Return [] if nothing new found.`;

const RELEASE_SYSTEM = `You are a product news researcher for FlamingFoodies.com.

Search for recent (last 7 days) hot sauce product launches, limited editions, brand collaborations, and notable industry news.

Return a JSON array with EXACTLY these fields:
{
  "title": string,
  "brand": string,
  "type": string,       // new-product|limited-edition|collab|restock|brand-news
  "description": string, // 1-2 sentences
  "body": string,        // 2-3 sentence editorial take
  "source_url": string   // URL of the news source or empty string
}

Return ONLY valid JSON array. Return [] if nothing found.`;

async function discoverBrands(existingNames: string[]) {
  const client = createAnthropicClient();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    system: BRAND_SYSTEM,
    // @ts-ignore
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [
      {
        role: "user",
        content: `Find hot sauce brands NOT in this list: ${existingNames.join(", ")}. Return up to 5 new brands as JSON.`
      }
    ]
  });

  return parseJsonArray<BrandDiscoveryCandidate>(extractTextContent(response));
}

async function discoverReleases() {
  const client = createAnthropicClient();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 3000,
    system: RELEASE_SYSTEM,
    // @ts-ignore
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [
      {
        role: "user",
        content:
          "Search for new hot sauce product launches, limited editions, and brand news from the past 7 days. Return as JSON array."
      }
    ]
  });

  return parseJsonArray<ReleaseCandidate>(extractTextContent(response));
}

export async function runBrandDiscovery(): Promise<BrandDiscoveryResult> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      brandsFound: 0,
      brandsInserted: 0,
      error: "No DB"
    };
  }

  const { data: existingBrands } = await supabase.from("brands").select("name");
  const existingNames = (existingBrands ?? []).map((row: { name: string }) => row.name);

  try {
    const discoveredBrands = await discoverBrands(existingNames);
    let brandsInserted = 0;
    const seenNames = new Set<string>();

    for (const candidate of discoveredBrands) {
      const name = String(candidate.name ?? "").trim();
      if (!name || seenNames.has(name.toLowerCase())) {
        continue;
      }
      seenNames.add(name.toLowerCase());

      const slug = toSlug(name);
      const row = {
        slug,
        name,
        tagline: String(candidate.tagline ?? ""),
        founded: String(candidate.founded ?? "Unknown"),
        origin: String(candidate.origin ?? "usa"),
        city: String(candidate.city ?? ""),
        tier: String(candidate.tier ?? "craft"),
        description: String(candidate.description ?? ""),
        editorial_note: "",
        why_it_matters: String(candidate.why_it_matters ?? ""),
        best_for: String(candidate.best_for ?? ""),
        pepper_slug: null,
        signature_products: Array.isArray(candidate.signature_products)
          ? candidate.signature_products
              .filter(
                (item) =>
                  item
                  && (typeof item.name === "string" || typeof item.description === "string")
              )
              .map((item) => ({
                name: String(item?.name ?? ""),
                description: String(item?.description ?? "")
              }))
          : [],
        featured: false,
        source: "ai_discovered",
        status: "draft"
      };
      const { error } = await supabase.from("brands").insert(row);

      if (!error) {
        brandsInserted += 1;
      }
    }

    return {
      brandsFound: discoveredBrands.length,
      brandsInserted
    };
  } catch (error) {
    return {
      brandsFound: 0,
      brandsInserted: 0,
      error: error instanceof Error ? error.message : "Brand discovery failed"
    };
  }
}

function buildReleaseApprovalPayload(candidate: ReleaseCandidate): ReleaseApprovalPayload | null {
  const title = String(candidate.title ?? "").trim();
  const brand = String(candidate.brand ?? "").trim();
  if (!title || !brand) {
    return null;
  }

  const type = normalizeReleaseType(candidate.type);
  const subjectKey = buildReleaseApprovalSubjectKey({
    title,
    brand,
    type
  });

  return {
    release: {
      subjectKey,
      proposedSlug: buildReleaseSlugBase({ title, brand }),
      title,
      brand,
      type,
      description: String(candidate.description ?? ""),
      body: String(candidate.body ?? ""),
      sourceUrl: String(candidate.source_url ?? "").trim() || null,
      featured: false,
      source: "ai_discovered"
    }
  };
}

export async function runReleaseMonitor(options?: {
  sourceRunId?: number | null;
}): Promise<ReleaseMonitorResult> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      releasesFound: 0,
      approvalsCreated: 0,
      approvalsUpdated: 0,
      error: "No DB"
    };
  }

  try {
    const discoveredReleases = await discoverReleases();
    let approvalsCreated = 0;
    let approvalsUpdated = 0;
    const seenSubjectKeys = new Set<string>();

    for (const candidate of discoveredReleases) {
      const payload = buildReleaseApprovalPayload(candidate);
      if (!payload || seenSubjectKeys.has(payload.release.subjectKey)) {
        continue;
      }
      seenSubjectKeys.add(payload.release.subjectKey);

      const result = await createAutomationApproval({
        agentId: "release-monitor",
        subjectType: "release",
        subjectKey: payload.release.subjectKey,
        proposedAction: "publish_release",
        payload,
        sourceRunId: options?.sourceRunId ?? null
      });

      if (result.action === "created") {
        approvalsCreated += 1;
      } else {
        approvalsUpdated += 1;
      }
    }

    return {
      releasesFound: discoveredReleases.length,
      approvalsCreated,
      approvalsUpdated
    };
  } catch (error) {
    return {
      releasesFound: 0,
      approvalsCreated: 0,
      approvalsUpdated: 0,
      error: error instanceof Error ? error.message : "Release monitoring failed"
    };
  }
}

async function resolveUniqueReleaseSlug(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  slugBase: string
) {
  let candidate = slugBase || `release-${Date.now()}`;

  for (let index = 0; index < 25; index += 1) {
    const { data, error } = await supabase
      .from("releases")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to validate release slug ${candidate}: ${error.message}`);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${slugBase}-${index + 2}`.slice(0, 80);
  }

  return `${slugBase}-${Date.now()}`.slice(0, 80);
}

function getReleasePayloadFromApproval(approval: Awaited<ReturnType<typeof getAutomationApproval>>) {
  const release = approval?.payload.release;
  if (!release || typeof release !== "object" || Array.isArray(release)) {
    throw new Error("Release approval payload is missing its release proposal.");
  }

  const releaseRecord = release as Record<string, unknown>;
  const title = String(releaseRecord.title ?? "").trim();
  const brand = String(releaseRecord.brand ?? "").trim();
  const type = normalizeReleaseType(
    typeof releaseRecord.type === "string" ? releaseRecord.type : undefined
  );

  if (!title || !brand) {
    throw new Error("Release approval payload is missing the title or brand.");
  }

  return {
    title,
    brand,
    type,
    description: String(releaseRecord.description ?? ""),
    body: String(releaseRecord.body ?? ""),
    sourceUrl:
      typeof releaseRecord.sourceUrl === "string" && releaseRecord.sourceUrl.trim().length
        ? releaseRecord.sourceUrl.trim()
        : null,
    featured: Boolean(releaseRecord.featured),
    source:
      typeof releaseRecord.source === "string" && releaseRecord.source.trim().length
        ? releaseRecord.source.trim()
        : "ai_discovered",
    proposedSlug:
      typeof releaseRecord.proposedSlug === "string" && releaseRecord.proposedSlug.trim().length
        ? releaseRecord.proposedSlug.trim()
        : buildReleaseSlugBase({ title, brand })
  };
}

export async function applyReleaseApproval(approvalId: number) {
  const approval = await getAutomationApproval(approvalId);
  if (!approval) {
    throw new Error("Automation approval not found.");
  }

  if (
    approval.agentId !== "release-monitor"
    || approval.subjectType !== "release"
    || approval.proposedAction !== "publish_release"
  ) {
    throw new Error("This automation approval is not a supported release publish proposal.");
  }

  if (approval.status !== "approved") {
    throw new Error("Approve this release proposal before applying it.");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Release publishing is not available in this environment.");
  }

  const release = getReleasePayloadFromApproval(approval);
  const { data: existingRelease, error: existingError } = await supabase
    .from("releases")
    .select("id, slug")
    .eq("title", release.title)
    .eq("brand", release.brand)
    .eq("type", release.type)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Failed to read existing release rows: ${existingError.message}`);
  }

  let releaseSlug = (existingRelease as ReleaseRow | null)?.slug ?? null;
  let existed = Boolean(releaseSlug);

  if (!releaseSlug) {
    releaseSlug = await resolveUniqueReleaseSlug(supabase, release.proposedSlug);
    const { error } = await supabase.from("releases").insert({
      slug: releaseSlug,
      title: release.title,
      brand: release.brand,
      type: release.type,
      description: release.description,
      body: release.body,
      affiliate_key: null,
      source_url: release.sourceUrl,
      featured: release.featured,
      source: release.source,
      status: "published",
      published_at: new Date().toISOString()
    });

    if (error) {
      throw new Error(`Failed to publish approved release: ${error.message}`);
    }

    existed = false;
  }

  await updateAutomationApproval({
    approvalId,
    status: "applied",
    decisionReason: existed
      ? `Approved proposal matched existing published release ${releaseSlug}.`
      : `Approved and published as release ${releaseSlug}.`
  });

  return {
    approvalId,
    releaseSlug,
    existed
  };
}

export async function runBrandMonitor(options?: {
  sourceRunId?: number | null;
}): Promise<BrandMonitorResult> {
  const [brandDiscovery, releaseMonitor] = await Promise.all([
    runBrandDiscovery(),
    runReleaseMonitor({ sourceRunId: options?.sourceRunId ?? null })
  ]);

  return {
    brandsFound: brandDiscovery.brandsFound,
    brandsInserted: brandDiscovery.brandsInserted,
    releasesFound: releaseMonitor.releasesFound,
    approvalsCreated: releaseMonitor.approvalsCreated,
    approvalsUpdated: releaseMonitor.approvalsUpdated,
    error: brandDiscovery.error ?? releaseMonitor.error
  };
}
