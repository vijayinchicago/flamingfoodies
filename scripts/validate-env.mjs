#!/usr/bin/env node

const mode = process.argv.includes("--production")
  ? "production"
  : process.argv.includes("--local")
    ? "local"
    : "development";

const requiredByMode = {
  development: [],
  local: [],
  production: [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "CRON_SECRET"
  ]
};

const recommended = [
  "CONVERTKIT_API_KEY",
  "CONVERTKIT_API_SECRET",
  "CONVERTKIT_FORM_ID",
  "ANTHROPIC_API_KEY",
  "UNSPLASH_ACCESS_KEY",
  "PEXELS_API_KEY",
  "BUFFER_ACCESS_TOKEN",
  "BUFFER_PROFILE_IDS"
];

function getValue(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function isBufferProfileFormatValid(value) {
  if (!value) {
    return true;
  }

  return value.split(",").every((entry) => {
    const normalized = entry.trim();
    if (!normalized) {
      return true;
    }

    if (!normalized.includes(":")) {
      return true;
    }

    const [platform, profileId] = normalized.split(":", 2).map((part) => part.trim());
    return Boolean(platform && profileId);
  });
}

const missingRequired = requiredByMode[mode].filter((name) => !getValue(name));
const hasSupabasePublicKey =
  Boolean(getValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")) ||
  Boolean(getValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
const hasSupabaseAdminKey =
  Boolean(getValue("SUPABASE_SECRET_KEY")) ||
  Boolean(getValue("SUPABASE_SERVICE_ROLE_KEY"));
const missingRecommended = recommended.filter((name) => !getValue(name));
const bufferProfiles = getValue("BUFFER_PROFILE_IDS");

if (!isBufferProfileFormatValid(bufferProfiles)) {
  console.error(
    "Invalid BUFFER_PROFILE_IDS format. Use comma-separated entries like 'instagram:123,facebook:456,all:789'."
  );
  process.exit(1);
}

if (missingRequired.length) {
  console.error(`Missing required ${mode} env vars:`);
  for (const name of missingRequired) {
    console.error(`- ${name}`);
  }
  process.exit(1);
}

if (mode === "production" && !hasSupabasePublicKey) {
  console.error(
    "Missing required production Supabase public key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
  process.exit(1);
}

if (mode === "production" && !hasSupabaseAdminKey) {
  console.error(
    "Missing required production Supabase admin key. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

console.log(`Environment check passed for ${mode} mode.`);

if (missingRecommended.length) {
  console.log("");
  console.log("Recommended but optional env vars not set:");
  for (const name of missingRecommended) {
    console.log(`- ${name}`);
  }
}
