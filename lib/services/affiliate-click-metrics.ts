export type AffiliateClickMetricRow = {
  partner?: string | null;
  product?: string | null;
  url?: string | null;
  source_page?: string | null;
  position?: string | null;
  session_id?: string | null;
  clicked_at?: string | null;
};

const SESSION_DEDUPE_WINDOW_MS = 30 * 60 * 1000;
const LEGACY_DEDUPE_WINDOW_MS = 60 * 1000;

function normalizeValue(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function getAffiliateClickSignature(row: AffiliateClickMetricRow) {
  const partner = normalizeValue(row.partner);
  const product = normalizeValue(row.product);
  const url = normalizeValue(row.url);
  const sourcePage = normalizeValue(row.source_page);
  const position = normalizeValue(row.position);
  const sessionId = normalizeValue(row.session_id);

  if (sessionId) {
    return `session:${sessionId}::${partner}::${product}::${url}::${sourcePage}::${position}`;
  }

  return `legacy::${partner}::${product}::${url}::${sourcePage}::${position}`;
}

function getAffiliateClickTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

export function dedupeAffiliateClickRows<T extends AffiliateClickMetricRow>(rows: T[]) {
  const sortedRows = [...rows].sort((left, right) => {
    const leftTime = getAffiliateClickTimestamp(left.clicked_at) ?? 0;
    const rightTime = getAffiliateClickTimestamp(right.clicked_at) ?? 0;
    return leftTime - rightTime;
  });

  const lastAcceptedBySignature = new Map<string, number>();
  const dedupedRows: T[] = [];

  for (const row of sortedRows) {
    const signature = getAffiliateClickSignature(row);
    const timestamp = getAffiliateClickTimestamp(row.clicked_at);

    if (timestamp === null) {
      dedupedRows.push(row);
      continue;
    }

    const lastAccepted = lastAcceptedBySignature.get(signature);
    const dedupeWindowMs = normalizeValue(row.session_id)
      ? SESSION_DEDUPE_WINDOW_MS
      : LEGACY_DEDUPE_WINDOW_MS;

    if (typeof lastAccepted === "number" && timestamp - lastAccepted < dedupeWindowMs) {
      continue;
    }

    lastAcceptedBySignature.set(signature, timestamp);
    dedupedRows.push(row);
  }

  return dedupedRows;
}
