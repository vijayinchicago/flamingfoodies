import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.hostname === "www.flamingfoodies.com") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.hostname = "flamingfoodies.com";
    return NextResponse.redirect(redirectUrl, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
