import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { env, flags, supabaseConfig } from "@/lib/env";

export function createSupabaseServerClient() {
  if (!flags.hasSupabase) return null;

  const cookieStore = cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseConfig.publicKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...(options as object) });
          } catch {
            return;
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: "", ...(options as object) });
          } catch {
            return;
          }
        }
      }
    }
  );
}

export function createSupabaseAdminClient() {
  if (!flags.hasSupabaseAdmin) return null;

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseConfig.adminKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
