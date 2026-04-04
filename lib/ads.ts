import { env, flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type AdSlotConfig = {
  blogInline?: string;
  blogArchive?: string;
  reviewInline?: string;
  reviewArchive?: string;
};

export function normalizeAdsensePublisherId(publisherId?: string | null) {
  if (!publisherId) return undefined;
  return publisherId.startsWith("ca-") ? publisherId.slice(3) : publisherId;
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
  const slotIds: AdSlotConfig = {
    blogInline: env.NEXT_PUBLIC_ADSENSE_BLOG_INLINE_SLOT,
    blogArchive: env.NEXT_PUBLIC_ADSENSE_BLOG_ARCHIVE_SLOT,
    reviewInline: env.NEXT_PUBLIC_ADSENSE_REVIEW_INLINE_SLOT,
    reviewArchive: env.NEXT_PUBLIC_ADSENSE_REVIEW_ARCHIVE_SLOT
  };
  const enabledByEnv = flags.hasAdsense;
  const hasManualSlots = Object.values(slotIds).some(Boolean);

  if (!enabledByEnv || !env.NEXT_PUBLIC_ADSENSE_ID) {
    return {
      enabled: false,
      clientId: env.NEXT_PUBLIC_ADSENSE_ID,
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
    clientId: env.NEXT_PUBLIC_ADSENSE_ID,
    slotIds,
    manualSlotsEnabled: showAds && hasManualSlots
  };
}
