import { env, flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/utils";

const DEFAULT_PLATFORMS = ["instagram", "pinterest", "facebook"] as const;
type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

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
  platform: (typeof DEFAULT_PLATFORMS)[number];
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

export function parseBufferProfileIds(value = env.BUFFER_PROFILE_IDS) {
  const profiles = new Map<string, string[]>();

  for (const rawEntry of (value || "").split(",")) {
    const entry = rawEntry.trim();
    if (!entry) {
      continue;
    }

    const [platform, profileId] = entry.includes(":")
      ? entry.split(":", 2).map((part) => part.trim())
      : ["all", entry];

    if (!profileId) {
      continue;
    }

    const existing = profiles.get(platform) ?? [];
    existing.push(profileId);
    profiles.set(platform, existing);
  }

  return profiles;
}

function getBufferProfileIds(platform: string) {
  const profiles = parseBufferProfileIds();
  return [...(profiles.get(platform) ?? []), ...(profiles.get("all") ?? [])];
}

async function publishViaBuffer(post: {
  platform: string;
  caption: string;
  hashtags: string[];
  imageUrl?: string | null;
  linkUrl?: string | null;
}) {
  const profileIds = getBufferProfileIds(post.platform);
  if (!flags.hasBuffer || !profileIds.length) {
    return {
      mode: "mock" as const,
      platformPostId: undefined
    };
  }

  const body = new URLSearchParams();
  body.set("access_token", env.BUFFER_ACCESS_TOKEN!);
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

export async function createSocialPostsForContent({
  contentType,
  contentId,
  title,
  slug,
  imageUrl,
  scheduledAt
}: {
  contentType: string;
  contentId: number;
  title: string;
  slug: string;
  imageUrl?: string;
  scheduledAt?: string | null;
}) {
  const created = DEFAULT_PLATFORMS.map((platform) => ({
    platform,
    contentId,
    title,
    contentType,
    linkUrl: buildContentLink(contentType, slug)
  }));

  if (!flags.hasSupabaseAdmin) {
    return {
      mode: flags.hasBuffer ? "live" : "mock",
      created
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      mode: flags.hasBuffer ? "live" : "mock",
      created
    };
  }

  const rows = DEFAULT_PLATFORMS.map((platform) => ({
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
    link_url: buildContentLink(contentType, slug),
    status: scheduledAt ? "scheduled" : "pending",
    scheduled_at: scheduledAt ?? null
  }));

  const { data, error } = await supabase
    .from("social_posts")
    .insert(rows)
    .select("id, platform, content_id, content_type, link_url");

  if (error) {
    throw new Error(error.message);
  }

  return {
    mode: flags.hasBuffer ? "live" : "mock",
    created:
      data?.map((row) => ({
        id: row.id,
        platform: row.platform,
        contentId: row.content_id,
        contentType: row.content_type,
        linkUrl: row.link_url
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
      mode: flags.hasBuffer ? "live" : "mock",
      id,
      platformPostId: `manual-${id}`
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
    platformPostId,
    publishedAt
  };
}

export async function publishDueScheduledSocialPosts() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      published: 0
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

  let published = 0;

  for (const row of duePosts ?? []) {
    try {
      await publishSocialPost(row.id);
      published += 1;
    } catch {
      await supabase.from("social_posts").update({ status: "failed" }).eq("id", row.id);
    }
  }

  return {
    published
  };
}
