import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedPath = url.searchParams.get("next");
  const nextPath =
    requestedPath === "/admin" || requestedPath?.startsWith("/admin/")
      ? requestedPath
      : "/admin";
  const supabase = createSupabaseServerClient();

  if (code && supabase) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        return NextResponse.redirect(new URL(nextPath, url.origin));
      }

      await supabase.auth.signOut();
    }
  }

  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", "Admin access is required.");
  return NextResponse.redirect(loginUrl);
}
