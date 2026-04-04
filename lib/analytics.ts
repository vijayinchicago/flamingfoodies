import { ANALYTICS_EVENTS, type EventName } from "@/lib/telemetry-events";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

const RESERVED_PAYLOAD_KEYS = new Set([
  "path",
  "referrer",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "contentType",
  "contentId",
  "contentSlug",
  "value"
]);

const STORAGE_KEYS = {
  anonymousId: "ff_anonymous_id",
  sessionId: "ff_session_id",
  sessionAcquisition: "ff_session_acquisition"
} as const;

function ensureStorageId(storage: Storage, key: string) {
  let value = storage.getItem(key);

  if (!value) {
    value = crypto.randomUUID();
    storage.setItem(key, value);
  }

  return value;
}

function getExternalReferrer() {
  if (typeof document === "undefined" || typeof window === "undefined" || !document.referrer) {
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

function getSessionAcquisition() {
  const emptyAcquisition: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  } = {};

  if (typeof window === "undefined") {
    return emptyAcquisition;
  }

  const params = new URLSearchParams(window.location.search);
  const nextAcquisition = {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    referrer: getExternalReferrer()
  };
  const hasFreshAttribution = Boolean(
    nextAcquisition.utmSource
      || nextAcquisition.utmMedium
      || nextAcquisition.utmCampaign
      || nextAcquisition.referrer
  );

  if (hasFreshAttribution) {
    window.sessionStorage.setItem(STORAGE_KEYS.sessionAcquisition, JSON.stringify(nextAcquisition));
    return nextAcquisition;
  }

  const stored = window.sessionStorage.getItem(STORAGE_KEYS.sessionAcquisition);
  if (!stored) {
    return nextAcquisition;
  }

  try {
    return {
      ...emptyAcquisition,
      ...(JSON.parse(stored) as typeof nextAcquisition)
    };
  } catch {
    return nextAcquisition;
  }
}

async function postInternalTelemetryEvent(name: EventName, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  const anonymousId = ensureStorageId(window.localStorage, STORAGE_KEYS.anonymousId);
  const sessionId = ensureStorageId(window.sessionStorage, STORAGE_KEYS.sessionId);
  const acquisition = getSessionAcquisition();
  const metadata = Object.fromEntries(
    Object.entries(payload).filter(([key]) => !RESERVED_PAYLOAD_KEYS.has(key))
  );

  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      keepalive: true,
      body: JSON.stringify({
        eventName: name,
        anonymousId,
        sessionId,
        path: typeof payload.path === "string" ? payload.path : window.location.pathname,
        referrer:
          typeof payload.referrer === "string" ? payload.referrer : acquisition.referrer,
        utmSource:
          typeof payload.utmSource === "string" ? payload.utmSource : acquisition.utmSource,
        utmMedium:
          typeof payload.utmMedium === "string" ? payload.utmMedium : acquisition.utmMedium,
        utmCampaign:
          typeof payload.utmCampaign === "string" ? payload.utmCampaign : acquisition.utmCampaign,
        contentType: typeof payload.contentType === "string" ? payload.contentType : undefined,
        contentId: typeof payload.contentId === "number" ? payload.contentId : undefined,
        contentSlug: typeof payload.contentSlug === "string" ? payload.contentSlug : undefined,
        value: typeof payload.value === "number" ? payload.value : undefined,
        metadata
      })
    });
  } catch {
    return;
  }
}

export function trackEvent(name: EventName, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  if (name !== ANALYTICS_EVENTS.pageView) {
    window.gtag?.("event", name, payload);
    window.plausible?.(name, { props: payload });
  }

  void postInternalTelemetryEvent(name, payload);
}
