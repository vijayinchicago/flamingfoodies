"use client";

import { trackEvent } from "@/lib/analytics";
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
      onClick={() => {
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
            position
          });
        }
      }}
    >
      {children}
    </a>
  );
}
