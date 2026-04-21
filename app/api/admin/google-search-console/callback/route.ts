import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { requireAdminApiAccess, writeAdminAuditLog } from "@/lib/admin-api";
import {
  exchangeSearchConsoleCode,
  isValidSearchConsoleOAuthState,
  runSearchInsightsAutomation,
  saveSearchConsoleConnection
} from "@/lib/services/search-insights";
import { jsonResponse } from "@/lib/utils";

const OAUTH_STATE_COOKIE = "search_console_oauth_state";

export const dynamic = "force-dynamic";

function revalidateSearchInsightSurfaces() {
  revalidatePath("/admin/automation/agents");
  revalidatePath("/admin/automation/trigger");
  revalidatePath("/admin/analytics/search-console");
  revalidatePath("/blog");
  revalidatePath("/recipes");
  revalidatePath("/hot-sauces");
  revalidatePath("/hot-sauces/best-for-wings");
  revalidatePath("/hot-sauces/best-for-seafood");
  revalidatePath("/hot-sauces/best-for-fried-chicken");
  revalidatePath("/blog/how-to-choose-a-hot-sauce-for-seafood");
  revalidatePath("/recipes/nashville-hot-chicken-sandwiches");
}

export async function GET(request: Request) {
  const admin = await requireAdminApiAccess();
  if (admin instanceof Response) {
    return admin;
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const cookieStore = cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  const hasValidSignedState = returnedState ? isValidSearchConsoleOAuthState(returnedState) : false;
  const hasMatchingCookieState =
    Boolean(returnedState) && Boolean(expectedState) && returnedState === expectedState;

  if (!code) {
    return jsonResponse({ ok: false, error: "Missing OAuth code" }, { status: 400 });
  }

  if (!hasValidSignedState && !hasMatchingCookieState) {
    return jsonResponse({ ok: false, error: "Invalid OAuth state" }, { status: 400 });
  }

  try {
    const tokenPayload = await exchangeSearchConsoleCode(code);
    const refreshToken = tokenPayload.refresh_token;

    if (!refreshToken) {
      return jsonResponse(
        {
          ok: false,
          error: "Google did not return a refresh token. Reconnect with consent prompt and try again."
        },
        { status: 409 }
      );
    }

    await saveSearchConsoleConnection({
      refreshToken,
      scope: tokenPayload.scope,
      tokenType: tokenPayload.token_type
    });

    await writeAdminAuditLog({
      adminId: admin.id,
      action: "connect_search_console",
      targetType: "search_console",
      targetId: "default_property",
      metadata: {
        scope: tokenPayload.scope ?? null,
        tokenType: tokenPayload.token_type ?? null
      }
    });

    const result = await runSearchInsightsAutomation();
    revalidateSearchInsightSurfaces();

    if (!result.ok) {
      return jsonResponse(result, { status: 503 });
    }

    const redirectUrl = new URL("/admin/analytics/search-console", url);
    redirectUrl.searchParams.set("synced", "1");
    redirectUrl.searchParams.set("recommendations", String(result.recommendationIds.length));
    redirectUrl.searchParams.set("new", String(result.newRecommendationCount));
    redirectUrl.searchParams.set("approved", String(result.approvedRecommendationCount));
    redirectUrl.searchParams.set("applied", String(result.appliedRecommendationCount));
    redirectUrl.searchParams.set("latest", result.window.latestAvailableDate);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Search Console connection failed"
      },
      { status: 500 }
    );
  }
}
