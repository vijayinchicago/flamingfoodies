// During ad/trust review, keep broader utility, community, and commerce surfaces
// accessible to users but out of the indexed core until the editorial center of
// gravity is stronger.
const ADSENSE_REVIEW_HOLDOUT_PREFIXES = [
  "/brands",
  "/community",
  "/competitions",
  "/festivals",
  "/hot-sauces",
  "/leaderboard",
  "/new-releases",
  "/peppers",
  "/quiz",
  "/rewards",
  "/search",
  "/seasonal",
  "/shop",
  "/subscriptions"
] as const;

export function shouldNoIndexPath(path?: string | null) {
  if (!path) {
    return false;
  }

  return ADSENSE_REVIEW_HOLDOUT_PREFIXES.some((prefix) => (
    path === prefix || path.startsWith(`${prefix}/`)
  ));
}
