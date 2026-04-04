import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { env, flags, supabaseConfig } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  if (!flags.hasSupabase) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseConfig.publicKey!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...(options as object) });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value, ...(options as object) });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: "", ...(options as object) });
          response = NextResponse.next({ request });
          response.cookies.set({ name, value: "", ...(options as object) });
        }
      }
    }
  );

  await supabase.auth.getUser();
  return response;
}
