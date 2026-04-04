"use client";

import { createBrowserClient } from "@supabase/ssr";

function getBrowserSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publicKey) {
    return null;
  }

  return { url, publicKey };
}

export function createSupabaseBrowserClient() {
  const config = getBrowserSupabaseConfig();
  if (!config) return null;

  return createBrowserClient(config.url, config.publicKey);
}
