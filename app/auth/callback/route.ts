import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = createSupabaseServerClient();

  if (code && supabase) {
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const needsOnboarding = !data.user?.user_metadata?.user_name;
    return NextResponse.redirect(
      new URL(needsOnboarding ? "/onboarding" : "/", url.origin)
    );
  }

  return NextResponse.redirect(new URL("/", url.origin));
}
