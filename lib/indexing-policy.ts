// Keep obvious utility surfaces out of the index. Editorial, commercial, and
// discovery content should remain eligible for indexing unless a page opts out
// more specifically.
const ADSENSE_REVIEW_HOLDOUT_PREFIXES = [
  "/leaderboard",
  "/new-releases",
  "/search"
] as const;

export function shouldNoIndexPath(path?: string | null) {
  if (!path) {
    return false;
  }

  return ADSENSE_REVIEW_HOLDOUT_PREFIXES.some((prefix) => (
    path === prefix || path.startsWith(`${prefix}/`)
  ));
}
