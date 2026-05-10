"use client";

import { getOrCreateClientAnalyticsIdentity, trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";
import type { AffiliateClickTrackingMode } from "@/lib/affiliates";

interface AffiliateLinkProps {
  href: string;
  partnerKey?: string;
  partnerName?: string;
  productName?: string;
  trackingMode?: AffiliateClickTrackingMode;
  sourcePage?: string;
  position?: string;
  contentType?: string;
  contentId?: number;
  contentSlug?: string;
  className?: string;
  children: React.ReactNode;
}

function sendAffiliateClickBeacon(payload: {
  partnerKey?: string;
  partnerName?: string;
  productName?: string;
  url?: string;
  sourcePage?: string;
  position?: string;
  sessionId?: string;
}) {
  const body = JSON.stringify(payload);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/affiliate-click", blob);
    return;
  }

  void fetch("/api/affiliate-click", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    keepalive: true,
    body
  });
}

export function AffiliateLink({
  href,
  partnerKey,
  partnerName,
  productName,
  trackingMode = "client_beacon",
  sourcePage,
  position,
  contentType,
  contentId,
  contentSlug,
  className,
  children
}: AffiliateLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={className}
      onClick={(event) => {
        const identity = getOrCreateClientAnalyticsIdentity();

        if (partnerKey && trackingMode === "server_redirect" && identity.sessionId) {
          try {
            const redirectUrl = new URL(event.currentTarget.href, window.location.origin);
            if (redirectUrl.origin === window.location.origin && redirectUrl.pathname.startsWith("/go/")) {
              redirectUrl.searchParams.set("sid", identity.sessionId);
              event.currentTarget.href = redirectUrl.toString();
            }
          } catch {
            // Keep the original href if URL rewriting fails.
          }
        }

        trackEvent(ANALYTICS_EVENTS.affiliateClick, {
          path: sourcePage,
          sourcePage,
          position,
          partnerKey,
          partnerName,
          productName,
          contentType,
          contentId,
          contentSlug
        });

        if (trackingMode === "client_beacon" || !partnerKey) {
          sendAffiliateClickBeacon({
            partnerKey,
            partnerName,
            productName,
            url: href,
            sourcePage,
            position,
            sessionId: identity.sessionId
          });
        }
      }}
    >
      {children}
    </a>
  );
}
