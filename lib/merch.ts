import type { MerchThemeKey } from "@/lib/types";

export const merchThemeOptions = [
  "flame",
  "ember",
  "gold",
  "cream",
  "smoke",
  "charcoal"
] as const satisfies readonly MerchThemeKey[];

const MERCH_THEME_CLASSES: Record<MerchThemeKey, string> = {
  flame: "from-flame/30 via-ember/20 to-transparent",
  ember: "from-ember/30 via-flame/15 to-transparent",
  gold: "from-gold/25 via-ember/15 to-transparent",
  cream: "from-cream/10 via-ember/10 to-transparent",
  smoke: "from-white/10 via-flame/15 to-transparent",
  charcoal: "from-charcoal/25 via-flame/10 to-transparent"
};

export function getMerchThemeClasses(themeKey?: MerchThemeKey | null) {
  return MERCH_THEME_CLASSES[themeKey || "flame"];
}
