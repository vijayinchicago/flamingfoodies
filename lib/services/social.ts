import { env, flags, hasConfiguredEnvValue } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";

const DEFAULT_PLATFORMS = ["instagram", "pinterest", "facebook"] as const;
const GRAPHQL_SUPPORTED_PLATFORMS = ["pinterest"] as const;
type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;
type SocialPlatform = (typeof DEFAULT_PLATFORMS)[number];

export type SocialAutomationContext = {
  sourceAgentId?: string | null;
  sourceRunId?: number | null;
  sourceLane?: string | null;
  sourceReason?: string | null;
  sourcePath?: string | null;
};

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeAutomationRunId(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseSocialAutomationContext(value: unknown): SocialAutomationContext | null {
  if (!isRecord(value)) {
    return null;
  }

  const normalized = {
    sourceAgentId: normalizeString(value.sourceAgentId),
    sourceRunId: normalizeAutomationRunId(value.sourceRunId),
    sourceLane: normalizeString(value.sourceLane),
    sourceReason: normalizeString(value.sourceReason),
    sourcePath: normalizeString(value.sourcePath)
  } satisfies SocialAutomationContext;

  if (
    !normalized.sourceAgentId &&
    !normalized.sourceRunId &&
    !normalized.sourceLane &&
    !normalized.sourceReason &&
    !normalized.sourcePath
  ) {
    return null;
  }

  return normalized;
}

export function extractInternalPathFromUrl(url?: string | null) {
  if (!url?.trim()) {
    return null;
  }

  if (url.startsWith("/")) {
    return url.split("?")[0] ?? url;
  }

  try {
    const parsed = new URL(url);
    return parsed.pathname || null;
  } catch {
    return null;
  }
}

function getReviewProductLabel(title: string) {
  return title.replace(/\s+review$/i, "").trim();
}

export function buildSocialHashtags(title: string, contentType: string) {
  const typeTags =
    contentType === "recipe"
      ? ["#spicyrecipes", "#dinnerideas"]
      : contentType === "blog_post"
        ? ["#hotsauceguide", "#spicyfood"]
        : ["#hotsaucereview", "#hotsauce"];
  const titleTags = title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4)
    .slice(0, 2)
    .map((token) => `#${token}`);

  return Array.from(
    new Set(
      [
        "#flamingfoodies",
        `#${contentType.replace(/_/g, "")}`,
        ...typeTags,
        ...titleTags
      ].slice(0, 6)
    )
  );
}

export function buildSocialCaption(input: {
  title: string;
  contentType: string;
  platform: SocialPlatform;
}) {
  const base =
    input.contentType === "recipe"
      ? `${input.title} is the kind of spicy dinner that keeps a mixed table happy and still gives the heat lovers something to chase.`
      : input.contentType === "blog_post"
        ? `${input.title} is the kind of useful read you send to the friend who is trying to cook smarter, shop better, or build a better sauce shelf.`
        : `${getReviewProductLabel(input.title)} is worth a look if you want to know where the heat lands, what the bottle actually tastes like, and what it is good on.`;

  const closerByPlatform: Record<(typeof DEFAULT_PLATFORMS)[number], string> = {
    instagram:
      input.contentType === "recipe"
        ? "Save it for the next dinner night when you want real heat without kitchen chaos."
        : "Send it to the person who always asks what to buy, cook, or pour first.",
    pinterest:
      input.contentType === "recipe"
        ? "Save it for your next dinner plan."
        : "Save it for your next pantry run or gift list.",
    facebook:
      input.contentType === "recipe"
        ? "Read it, then pass it along to the person you cook with."
        : "Read it, then share it with the person who keeps the hot sauce shelf stocked."
  };

  return `${base} ${closerByPlatform[input.platform]}`.replace(/\s+/g, " ").trim();
}

function buildContentLink(contentType: string, slug: string) {
  return absoluteUrl(
    contentType === "blog_post"
      ? `/blog/${slug}`
      : contentType === "recipe"
        ? `/recipes/${slug}`
        : `/reviews/${slug}`
  );
}

function getBufferChannelConfigValue() {
  return normalizeString(env.BUFFER_CHANNEL_IDS) ?? normalizeString(env.BUFFER_PROFILE_IDS) ?? "";
}

function getBufferApiKey() {
  return normalizeString(env.BUFFER_API_KEY);
}

function getLegacyBufferAccessToken() {
  return normalizeString(env.BUFFER_ACCESS_TOKEN);
}

function usesBufferGraphql() {
  return hasConfiguredEnvValue(getBufferApiKey());
}

function usesLegacyBufferToken() {
  return hasConfiguredEnvValue(getLegacyBufferAccessToken());
}

export function parseBufferChannelIds(value = getBufferChannelConfigValue()) {
  const targets = new Map<string, string[]>();

  for (const rawEntry of (value || "").split(",")) {
    const entry = rawEntry.trim();
    if (!entry) {
      continue;
    }

    const [platform, targetId] = entry.includes(":")
      ? entry.split(":", 2).map((part) => part.trim())
      : ["all", entry];

    if (!targetId) {
      continue;
    }

    const existing = targets.get(platform) ?? [];
    existing.push(targetId);
    targets.set(platform, existing);
  }

  return targets;
}

export const parseBufferProfileIds = parseBufferChannelIds;

function getBufferChannelIds(platform: string) {
  const channels = parseBufferChannelIds();
  return [...(channels.get(platform) ?? []), ...(channels.get("all") ?? [])];
}

function isGraphqlSupportedPlatform(platform: string): platform is (typeof GRAPHQL_SUPPORTED_PLATFORMS)[number] {
  return (GRAPHQL_SUPPORTED_PLATFORMS as readonly string[]).includes(platform);
}

export function getConfiguredSocialPlatforms(): SocialPlatform[] {
  if (!flags.hasBuffer) {
    return [];
  }

  const platforms = DEFAULT_PLATFORMS.filter((platform) => {
    const targetIds = getBufferChannelIds(platform);
    if (!targetIds.length) {
      return false;
    }

    if (usesBufferGraphql()) {
      if (!isGraphqlSupportedPlatform(platform)) {
        return false;
      }

      if (platform === "pinterest" && !hasConfiguredEnvValue(env.BUFFER_PINTEREST_BOARD_ID)) {
        return false;
      }
    }

    return true;
  });

  return [...platforms];
}

export function getSocialDistributionConfig() {
  const targets = parseBufferChannelIds();
  const activePlatforms = getConfiguredSocialPlatforms();

  return {
    hasBufferCredentials: flags.hasBuffer,
    usesGraphql: usesBufferGraphql(),
    usesLegacyToken: usesLegacyBufferToken(),
    hasAnyTarget: targets.size > 0,
    hasAnyActivePlatform: flags.hasBuffer && activePlatforms.length > 0,
    hasPinterestTarget: targets.has("pinterest") || targets.has("all"),
    hasPinterestBoard: hasConfiguredEnvValue(env.BUFFER_PINTEREST_BOARD_ID),
    activePlatforms
  };
}

type BufferGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{
    message?: string;
  }>;
};

async function bufferGraphqlRequest<TData>(
  query: string,
  variables: Record<string, unknown>
) {
  const apiKey = getBufferApiKey();
  if (!apiKey) {
    throw new Error("BUFFER_API_KEY is not configured.");
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

  const payload = (await response
    .json()
    .catch(() => null)) as BufferGraphqlResponse<TData> | null;
  const errorMessages = (payload?.errors ?? [])
    .map((error) => error.message?.trim())
    .filter((message): message is string => Boolean(message));

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

function buildBufferGraphqlInput(post: {
  platform: string;
  caption: string;
  hashtags: string[];
  title?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
}, channelId: string) {
  const input: Record<string, unknown> = {
    channelId,
    text: `${post.caption} ${post.hashtags.join(" ")}`.trim(),
    schedulingType: "automatic",
    mode: "shareNow",
    source: "flamingfoodies:automation"
  };

  if (post.imageUrl) {
    input.assets = {
      images: [
        {
          url: post.imageUrl
        }
      ]
    };
  }

  if (post.platform === "pinterest") {
    const boardServiceId = normalizeString(env.BUFFER_PINTEREST_BOARD_ID);
    if (!boardServiceId) {
      throw new Error("BUFFER_PINTEREST_BOARD_ID is not configured.");
    }

    input.metadata = {
      pinterest: {
        boardServiceId,
        title: (post.title ?? post.caption).slice(0, 100),
        url: post.linkUrl ?? undefined
      }
    };
  }

  return input;
}

async function publishViaBufferGraphql(post: {
  platform: string;
  caption: string;
  hashtags: string[];
  title?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
}) {
  if (!isGraphqlSupportedPlatform(post.platform)) {
    throw new Error(`Buffer GraphQL publishing is not configured for ${post.platform}.`);
  }

  const channelIds = getBufferChannelIds(post.platform);
  if (!channelIds.length) {
    throw new Error(`No Buffer channel is configured for ${post.platform}.`);
  }

  const platformPostIds: string[] = [];

  for (const channelId of channelIds) {
    const data = await bufferGraphqlRequest<{
      createPost?: {
        __typename?: string;
        message?: string;
        post?: {
          id?: string;
        };
      };
    }>(
      `
        mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
            __typename
            ... on PostActionSuccess {
              post {
                id
              }
            }
            ... on MutationError {
              message
            }
          }
        }
      `,
      {
        input: buildBufferGraphqlInput(post, channelId)
      }
    );

    const outcome = data.createPost;
    if (outcome?.__typename === "MutationError") {
      throw new Error(outcome.message?.trim() || "Buffer publish failed.");
    }

    const postId = outcome?.post?.id?.trim();
    if (!postId) {
      throw new Error("Buffer did not return a published post id.");
    }

    platformPostIds.push(postId);
  }

  return {
    mode: "live" as const,
    platformPostId: platformPostIds.join(",")
  };
}

async function publishViaLegacyBuffer(post: {
  platform: string;
  caption: string;
  hashtags: string[];
  title?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
}) {
  const accessToken = getLegacyBufferAccessToken();
  const profileIds = getBufferChannelIds(post.platform);
  if (!accessToken || !profileIds.length) {
    throw new Error(`No legacy Buffer profile is configured for ${post.platform}.`);
  }

  const body = new URLSearchParams();
  body.set("access_token", accessToken);
  body.set("text", `${post.caption} ${post.hashtags.join(" ")}`.trim());
  body.set("now", "true");

  for (const profileId of profileIds) {
    body.append("profile_ids[]", profileId);
  }

  if (post.linkUrl) {
    body.set("media[link]", post.linkUrl);
  }

  if (post.imageUrl) {
    body.set("media[photo]", post.imageUrl);
  }

  if (post.caption) {
    body.set("media[description]", post.caption.slice(0, 200));
  }

  const response = await fetch("https://api.bufferapp.com/1/updates/create.json", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });

  if (!response.ok) {
    throw new Error("Buffer publish failed.");
  }

  const payload = await response.json().catch(() => ({}));
  const rawId =
    payload?.updates?.[0]?.id ?? payload?.update?.id ?? payload?.id ?? undefined;

  return {
    mode: "live" as const,
    platformPostId: rawId ? String(rawId) : undefined
  };
}

async function publishViaBuffer(post: {
  platform: string;
  caption: string;
  hashtags: string[];
  title?: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
}) {
  if (usesBufferGraphql()) {
    return publishViaBufferGraphql(post);
  }

  if (usesLegacyBufferToken()) {
    return publishViaLegacyBuffer(post);
  }

  return {
    mode: "mock" as const,
    platformPostId: undefined
  };
}

export async function createSocialPostsForContent({
  contentType,
  contentId,
  title,
  slug,
  imageUrl,
  scheduledAt,
  automationContext
}: {
  contentType: string;
  contentId: number;
  title: string;
  slug: string;
  imageUrl?: string;
  scheduledAt?: string | null;
  automationContext?: SocialAutomationContext | null;
}) {
  const linkUrl = buildContentLink(contentType, slug);
  const path = extractInternalPathFromUrl(linkUrl);
  const normalizedAutomationContext = parseSocialAutomationContext(automationContext ?? null);
  const configuredPlatforms = getConfiguredSocialPlatforms();
  const created = configuredPlatforms.map((platform) => ({
    platform,
    contentId,
    title,
    contentType,
    linkUrl,
    path,
    scheduledAt: scheduledAt ?? null,
    automationContext: normalizedAutomationContext
  }));

  if (!flags.hasSupabaseAdmin) {
    return {
      mode: getSocialDistributionConfig().hasAnyActivePlatform ? "live" : "mock",
      created
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: getSocialDistributionConfig().hasAnyActivePlatform ? "live" : "mock",
      created
    };
  }

  if (!configuredPlatforms.length) {
    return {
      mode: "mock" as const,
      created
    };
  }

  const rows = configuredPlatforms.map((platform) => ({
    platform,
    content_type: contentType,
    content_id: contentId,
    caption: buildSocialCaption({
      title,
      contentType,
      platform
    }),
    hashtags: buildSocialHashtags(title, contentType),
    image_url: imageUrl ?? null,
    link_url: linkUrl,
    status: scheduledAt ? "scheduled" : "pending",
    scheduled_at: scheduledAt ?? null,
    automation_context: normalizedAutomationContext
  }));

  const { data, error } = await supabase
    .from("social_posts")
    .insert(rows)
    .select("id, platform, content_id, content_type, link_url, scheduled_at, automation_context");

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: getSocialDistributionConfig().hasAnyActivePlatform ? "live" : "mock",
    created:
      data?.map((row) => ({
        id: row.id,
        platform: row.platform,
        contentId: row.content_id,
        contentType: row.content_type,
        linkUrl: row.link_url,
        path: extractInternalPathFromUrl(row.link_url),
        scheduledAt: row.scheduled_at ?? null,
        automationContext: parseSocialAutomationContext(row.automation_context)
      })) ?? created
  };
}

async function getSocialPostRow(supabase: AdminClient, id: number) {
  const { data, error } = await supabase
    .from("social_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Social post not found.");
  }

  return data;
}

export async function publishSocialPost(id: number) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      mode: flags.hasBuffer ? ("live" as const) : ("mock" as const),
      id,
      platformPostId: `manual-${id}`,
      publishedAt: new Date().toISOString(),
      path: null,
      automationContext: null
    };
  }

  const post = await getSocialPostRow(supabase, id);
  const publishedAt = new Date().toISOString();
  const providerResult = await publishViaBuffer({
    platform: post.platform,
    caption: post.caption,
    hashtags: post.hashtags ?? [],
    imageUrl: post.image_url ?? null,
    linkUrl: post.link_url ?? null
  });

  if (providerResult.mode !== "live") {
    throw new Error(
      "Buffer publish is still running in mock mode for this runtime. Refresh the admin page after redeploy and try again."
    );
  }

  const platformPostId =
    providerResult.platformPostId ?? post.platform_post_id ?? `manual-${id}`;

  const { error } = await supabase
    .from("social_posts")
    .update({
      status: "published",
      published_at: publishedAt,
      platform_post_id: platformPostId,
      scheduled_at: post.scheduled_at ?? publishedAt
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: providerResult.mode,
    id,
    platform: post.platform,
    contentType: post.content_type ?? "custom",
    contentId: Number(post.content_id ?? 0),
    linkUrl: post.link_url ?? null,
    path: extractInternalPathFromUrl(post.link_url ?? null),
    automationContext: parseSocialAutomationContext(post.automation_context),
    platformPostId,
    publishedAt
  };
}

export async function publishDueScheduledSocialPosts() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      published: 0,
      publishedPosts: [],
      failedPostIds: []
    };
  }

  const { data: duePosts } = await supabase
    .from("social_posts")
    .select("id")
    .eq("status", "scheduled")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(12);

  const publishedPosts: Array<{
    mode: "live" | "mock";
    id: number;
    platform?: string;
    contentType?: string;
    contentId?: number;
    linkUrl?: string | null;
    path?: string | null;
    automationContext?: SocialAutomationContext | null;
    platformPostId: string;
    publishedAt: string;
  }> = [];
  const failedPostIds: number[] = [];

  for (const row of duePosts ?? []) {
    try {
      const published = await publishSocialPost(row.id);
      publishedPosts.push(published);
    } catch {
      failedPostIds.push(row.id);
      await supabase.from("social_posts").update({ status: "failed" }).eq("id", row.id);
    }
  }

  return {
    published: publishedPosts.length,
    publishedPosts,
    failedPostIds
  };
}
