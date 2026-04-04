import { z } from "zod";

const inferredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://flamingfoodies.com");

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default(inferredSiteUrl),
  NEXT_PUBLIC_SITE_NAME: z.string().default("FlamingFoodies"),
  ALLOW_SAMPLE_FALLBACKS: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CONVERTKIT_API_KEY: z.string().optional(),
  CONVERTKIT_API_SECRET: z.string().optional(),
  CONVERTKIT_FORM_ID: z.string().optional(),
  NEXT_PUBLIC_AMAZON_TAG: z.string().optional(),
  NEXT_PUBLIC_GA4_ID: z.string().optional(),
  NEXT_PUBLIC_CLARITY_ID: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_ID: z.string().optional(),
  NEXT_PUBLIC_SHOW_ADS: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_BLOG_INLINE_SLOT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_BLOG_ARCHIVE_SLOT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_REVIEW_INLINE_SLOT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_REVIEW_ARCHIVE_SLOT: z.string().optional(),
  ADS_TXT_EXTRA_LINES: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  PEXELS_API_KEY: z.string().optional(),
  BUFFER_ACCESS_TOKEN: z.string().optional(),
  BUFFER_PROFILE_IDS: z.string().optional(),
  NEXT_PUBLIC_SKIMLINKS_ID: z.string().optional(),
  NEXT_PUBLIC_MAINTENANCE_MODE: z.string().optional(),
  NEXT_PUBLIC_ALLOW_MOCK_ADMIN: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

export const env = parsed.success ? parsed.data : envSchema.parse({});

export const supabaseConfig = {
  publicKey:
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  adminKey: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
};

export const flags = {
  hasSupabase:
    Boolean(env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(supabaseConfig.publicKey),
  hasSupabaseAdmin:
    Boolean(env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(supabaseConfig.adminKey),
  hasConvertKit: Boolean(env.CONVERTKIT_API_KEY && env.CONVERTKIT_FORM_ID),
  hasConvertKitBroadcast: Boolean(env.CONVERTKIT_API_SECRET),
  hasAnthropic: Boolean(env.ANTHROPIC_API_KEY),
  hasUpstash: Boolean(env.KV_REST_API_URL && env.KV_REST_API_TOKEN),
  hasBuffer: Boolean(env.BUFFER_ACCESS_TOKEN),
  hasAdsense: Boolean(env.NEXT_PUBLIC_ADSENSE_ID && env.NEXT_PUBLIC_SHOW_ADS === "true"),
  allowSampleFallbacks:
    env.ALLOW_SAMPLE_FALLBACKS === "true" || process.env.NODE_ENV !== "production",
  mockAdminEnabled:
    env.NEXT_PUBLIC_ALLOW_MOCK_ADMIN !== "false" &&
    process.env.NODE_ENV !== "production"
};
