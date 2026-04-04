"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

function getExternalReferrer() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return undefined;
  }

  if (!document.referrer) {
    return undefined;
  }

  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === window.location.origin) {
      return undefined;
    }
    return document.referrer;
  } catch {
    return undefined;
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const serializedQuery = searchParams.toString();
    const routeKey = serializedQuery ? `${pathname}?${serializedQuery}` : pathname;

    if (routeKey === lastTrackedPath.current) {
      return;
    }

    lastTrackedPath.current = routeKey;

    trackEvent(ANALYTICS_EVENTS.pageView, {
      path: pathname,
      referrer: getExternalReferrer(),
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined
    });
  }, [pathname, searchParams]);

  return null;
}
