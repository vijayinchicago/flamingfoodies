import { z } from "zod";

import {
  AFFILIATE_LINKS,
  buildAffiliateDestinationUrl,
  getAffiliateDestinationKind,
  getAffiliateMonetizationLabel,
  getAffiliateMonetizationStrategy,
  isExactAmazonProductDestination,
  type AffiliateLinkDefinition,
  type AffiliateLinkEntry
} from "@/lib/affiliates";
import { flags } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const AFFILIATE_LINK_OVERRIDE_SETTING_KEY = "affiliate_link_overrides";

const affiliateLinkOverrideSchema = z
  .object({
    url: z.string().url(),
    partner: z.string().min(2).max(80).optional(),
    product: z.string().min(2).max(160).optional(),
    amazonOnlyUrl: z.string().url().optional(),
    note: z.string().max(240).optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional()
  })
  .strict();

const affiliateLinkOverrideMapSchema = z.record(z.string(), affiliateLinkOverrideSchema);

export type AffiliateLinkOverride = z.infer<typeof affiliateLinkOverrideSchema>;

function applyAffiliateOverride(
  entry: AffiliateLinkDefinition,
  override?: AffiliateLinkOverride | null
): AffiliateLinkDefinition {
  if (!override) {
    return entry;
  }

  return {
    ...entry,
    partner: override.partner ?? entry.partner,
    product: override.product ?? entry.product,
    url: override.url ?? entry.url,
    amazonOnlyUrl: override.amazonOnlyUrl ?? entry.amazonOnlyUrl
  };
}

export async function getAffiliateLinkOverrides(): Promise<Record<string, AffiliateLinkOverride>> {
  if (!flags.hasSupabaseAdmin) {
    return {};
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {};
  }

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", AFFILIATE_LINK_OVERRIDE_SETTING_KEY)
    .maybeSingle();

  const parsed = affiliateLinkOverrideMapSchema.safeParse(data?.value ?? {});
  return parsed.success ? parsed.data : {};
}

export async function getAffiliateLinkEntryWithOverride(
  key: string
): Promise<AffiliateLinkEntry | null> {
  const entry = AFFILIATE_LINKS[key];
  if (!entry) {
    return null;
  }

  const overrides = await getAffiliateLinkOverrides();
  return {
    key,
    ...applyAffiliateOverride(entry, overrides[key] ?? null)
  };
}

export async function getAffiliateRegistryWithOverrides() {
  const overrides = await getAffiliateLinkOverrides();

  return Object.entries(AFFILIATE_LINKS).map(([key, entry]) => {
    const override = overrides[key] ?? null;
    const resolved = applyAffiliateOverride(entry, override);

    return {
      key,
      ...resolved,
      override,
      hasOverride: Boolean(override),
      basePartner: entry.partner,
      baseProduct: entry.product,
      baseDestinationUrl: buildAffiliateDestinationUrl(entry),
      destinationUrl: buildAffiliateDestinationUrl(resolved),
      destinationKind: getAffiliateDestinationKind(resolved),
      exactAmazonProduct: isExactAmazonProductDestination(resolved),
      monetizationStrategy: getAffiliateMonetizationStrategy(resolved),
      monetizationLabel: getAffiliateMonetizationLabel(getAffiliateMonetizationStrategy(resolved))
    };
  });
}
