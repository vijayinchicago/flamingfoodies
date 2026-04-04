"use client";

import { useEffect, useRef } from "react";

import { trackEvent } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

export function SearchTracker({
  query,
  resultCount,
  source
}: {
  query: string;
  resultCount: number;
  source?: string;
}) {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const key = `${trimmedQuery}::${source || "direct"}::${resultCount}`;
    if (trackedRef.current === key) return;
    trackedRef.current = key;

    trackEvent(ANALYTICS_EVENTS.searchPerformed, {
      path: "/search",
      query: trimmedQuery,
      resultCount,
      source: source || "direct",
      hasResults: resultCount > 0,
      value: resultCount
    });
  }, [query, resultCount, source]);

  return null;
}
