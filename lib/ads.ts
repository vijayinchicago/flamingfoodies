import { env, flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdSlotConfig = {
  blogInline?: string;
  blogArchive?: string;
  blogInArticle?: string;
  reviewInline?: string;
  reviewArchive?: string;
  reviewInArticle?: string;
  recipeInline?: string;
  recipeInArticle?: string;
};

export function sanitizeAdsenseClientId(clientId?: string | null) {
  const trimmed = clientId?.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("ca-") ? trimmed : `ca-${trimmed}`;
}

export function normalizeAdsensePublisherId(publisherId?: string | null) {
  const normalizedClientId = sanitizeAdsenseClientId(publisherId);
  if (!normalizedClientId) return undefined;
  return normalizedClientId.slice(3);
}

export function buildAdsTxtContent(publisherId?: string | null, extraLines?: string | null) {
  const lines: string[] = [];
  const normalizedPublisherId = normalizeAdsensePublisherId(publisherId);

  if (normalizedPublisherId) {
    lines.push(`google.com, ${normalizedPublisherId}, DIRECT, f08c47fec0942fa0`);
  }

  if (extraLines) {
    lines.push(
      ...extraLines
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    );
  }

  return lines.join("\n");
}

export function coerceSiteSettingBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

export async function getAdRuntimeConfig() {
  const clientId = sanitizeAdsenseClientId(env.NEXT_PUBLIC_ADSENSE_ID);
  const slotIds: AdSlotConfig = {
    blogInline: env.NEXT_PUBLIC_ADSENSE_BLOG_INLINE_SLOT,
    blogArchive: env.NEXT_PUBLIC_ADSENSE_BLOG_ARCHIVE_SLOT,
    blogInArticle: env.NEXT_PUBLIC_ADSENSE_BLOG_IN_ARTICLE_SLOT,
    reviewInline: env.NEXT_PUBLIC_ADSENSE_REVIEW_INLINE_SLOT,
    reviewArchive: env.NEXT_PUBLIC_ADSENSE_REVIEW_ARCHIVE_SLOT,
    reviewInArticle: env.NEXT_PUBLIC_ADSENSE_REVIEW_IN_ARTICLE_SLOT,
    recipeInline: env.NEXT_PUBLIC_ADSENSE_RECIPE_INLINE_SLOT ?? env.NEXT_PUBLIC_ADSENSE_REVIEW_INLINE_SLOT,
    recipeInArticle: env.NEXT_PUBLIC_ADSENSE_RECIPE_IN_ARTICLE_SLOT ?? env.NEXT_PUBLIC_ADSENSE_REVIEW_IN_ARTICLE_SLOT
  };
  const enabledByEnv = flags.hasAdsense;
  const hasManualSlots = Object.values(slotIds).some(Boolean);

  if (!enabledByEnv || !clientId) {
    return {
      enabled: false,
      clientId,
      slotIds,
      manualSlotsEnabled: false
    };
  }

  let showAds = true;

  if (flags.hasSupabaseAdmin) {
    const supabase = createSupabaseAdminClient();
    if (supabase) {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "show_ads")
        .maybeSingle();

      if (data) {
        showAds = coerceSiteSettingBoolean(data.value, true);
      }
    }
  }

  return {
    enabled: showAds,
    clientId,
    slotIds,
    manualSlotsEnabled: showAds && hasManualSlots
  };
}
