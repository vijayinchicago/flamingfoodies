import { NextResponse } from "next/server";

import { requireAdminApiAccess } from "@/lib/admin-api";
import {
  createSignedSearchConsoleOAuthState,
  getSearchConsoleAuthUrl,
  hasSearchConsoleBaseConfig
} from "@/lib/services/search-insights";
import { jsonResponse } from "@/lib/utils";

const OAUTH_STATE_COOKIE = "search_console_oauth_state";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminApiAccess();
  if (admin instanceof Response) {
    return admin;
  }

  if (!hasSearchConsoleBaseConfig()) {
    return jsonResponse(
      {
        ok: false,
        error: "Google Search Console OAuth settings are not fully configured"
      },
      { status: 503 }
    );
  }

  const state = createSignedSearchConsoleOAuthState();
  const response = NextResponse.redirect(getSearchConsoleAuthUrl(state));
  response.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60
  });

  return response;
}
