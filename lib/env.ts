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
  NEXT_PUBLIC_ADSENSE_BLOG_IN_ARTICLE_SLOT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_REVIEW_INLINE_SLOT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_REVIEW_ARCHIVE_SLOT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_REVIEW_IN_ARTICLE_SLOT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_RECIPE_INLINE_SLOT: z.string().optional(),
  NEXT_PUBLIC_ADSENSE_RECIPE_IN_ARTICLE_SLOT: z.string().optional(),
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
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_SEARCH_CONSOLE_PROPERTY: z.string().optional(),
  GOOGLE_SEARCH_CONSOLE_CLIENT_ID: z.string().optional(),
  GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_SEARCH_CONSOLE_REDIRECT_URI: z.string().optional(),
  GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SKIMLINKS_ID: z.string().optional(),
  NEXT_PUBLIC_MAINTENANCE_MODE: z.string().optional(),
  NEXT_PUBLIC_ALLOW_MOCK_ADMIN: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

export const env = parsed.success ? parsed.data : envSchema.parse({});

export function hasConfiguredEnvValue(value?: string | null) {
  const trimmed = value?.trim();
  return Boolean(trimmed && trimmed !== '""' && trimmed !== "''");
}

export const supabaseConfig = {
  publicKey:
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  adminKey: env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
};

export const flags = {
  hasSupabase:
    hasConfiguredEnvValue(env.NEXT_PUBLIC_SUPABASE_URL) &&
    hasConfiguredEnvValue(supabaseConfig.publicKey),
  hasSupabaseAdmin:
    hasConfiguredEnvValue(env.NEXT_PUBLIC_SUPABASE_URL) &&
    hasConfiguredEnvValue(supabaseConfig.adminKey),
  hasConvertKit:
    hasConfiguredEnvValue(env.CONVERTKIT_API_KEY) &&
    hasConfiguredEnvValue(env.CONVERTKIT_FORM_ID),
  hasConvertKitBroadcast: hasConfiguredEnvValue(env.CONVERTKIT_API_SECRET),
  hasAnthropic: hasConfiguredEnvValue(env.ANTHROPIC_API_KEY),
  hasUpstash:
    hasConfiguredEnvValue(env.KV_REST_API_URL) &&
    hasConfiguredEnvValue(env.KV_REST_API_TOKEN),
  hasBuffer: hasConfiguredEnvValue(env.BUFFER_ACCESS_TOKEN),
  hasSearchConsoleConfig:
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_PROPERTY) &&
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID) &&
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET) &&
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI),
  hasSearchConsoleAuth:
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_PROPERTY) &&
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID) &&
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET) &&
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI) &&
    hasConfiguredEnvValue(env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN),
  hasAdsense:
    hasConfiguredEnvValue(env.NEXT_PUBLIC_ADSENSE_ID) &&
    env.NEXT_PUBLIC_SHOW_ADS === "true",
  allowSampleFallbacks:
    env.ALLOW_SAMPLE_FALLBACKS === "true" || process.env.NODE_ENV !== "production",
  mockAdminEnabled:
    env.NEXT_PUBLIC_ALLOW_MOCK_ADMIN !== "false" &&
    process.env.NODE_ENV !== "production"
};
