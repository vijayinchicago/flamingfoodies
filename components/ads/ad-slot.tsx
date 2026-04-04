"use client";

import { useEffect, useRef } from "react";

import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot({
  clientId,
  slotId,
  slotName,
  placement,
  className,
  contentType,
  contentId,
  contentSlug
}: {
  clientId: string;
  slotId?: string;
  slotName: string;
  placement: string;
  className?: string;
  contentType?: string;
  contentId?: number;
  contentSlug?: string;
}) {
  const hasTrackedRef = useRef(false);
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (!slotId || !clientId) {
      return;
    }

    if (!hasTrackedRef.current) {
      trackEvent(ANALYTICS_EVENTS.adSlotRendered, {
        path: window.location.pathname,
        contentType,
        contentId,
        contentSlug,
        slotName,
        placement
      });
      hasTrackedRef.current = true;
    }

    if (!hasRequestedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        hasRequestedRef.current = true;
      } catch {
        return;
      }
    }
  }, [clientId, contentId, contentSlug, contentType, placement, slotId, slotName]);

  if (!slotId || !clientId) {
    return null;
  }

  return (
    <div
      className={cn(
        "not-prose print:hidden rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-4",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cream/55">
          Sponsored
        </p>
        <p className="text-xs text-cream/45">Ads help keep recipes and reviews free.</p>
      </div>
      <ins
        className="adsbygoogle block min-h-[280px] w-full overflow-hidden rounded-[1.25rem]"
        data-ad-client={clientId}
        data-ad-format="auto"
        data-ad-slot={slotId}
        data-full-width-responsive="true"
      />
    </div>
  );
}
