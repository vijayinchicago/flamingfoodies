export const HEAT_LEVELS = ["mild", "medium", "hot", "inferno", "reaper"] as const;

export const CUISINE_TYPES = [
  "american",
  "mexican",
  "thai",
  "korean",
  "indian",
  "chinese",
  "japanese",
  "ethiopian",
  "peruvian",
  "jamaican",
  "cajun",
  "szechuan",
  "vietnamese",
  "west_african",
  "middle_eastern",
  "caribbean",
  "italian",
  "moroccan",
  "filipino",
  "greek",
  "turkish",
  "brazilian",
  "nigerian",
  "malaysian",
  "other"
] as const;

export const CUISINE_ROTATION = [
  "american",
  "mexican",
  "thai",
  "korean",
  "indian",
  "jamaican",
  "szechuan",
  "filipino",
  "turkish",
  "greek",
  "nigerian",
  "malaysian",
  "cajun",
  "caribbean",
  "ethiopian",
  "peruvian",
  "west_african",
  "middle_eastern",
  "brazilian",
  "japanese",
  "italian",
  "chinese",
  "moroccan",
  "vietnamese",
  "other"
] as const satisfies readonly (typeof CUISINE_TYPES)[number][];

export const RECIPE_GENERATION_LANES = [
  "weeknight",
  "burger_sandwich",
  "wings_snack",
  "grill_roast",
  "rice_bowl",
  "noodle_pasta",
  "stew_curry",
  "seafood",
  "vegetarian"
] as const;

export const RECIPE_LANE_PROMPT_GUIDANCE: Record<
  (typeof RECIPE_GENERATION_LANES)[number],
  string
> = {
  weeknight:
    "Prioritize a practical, high-crave dinner that still feels premium and editorially useful.",
  burger_sandwich:
    "Make it a handheld, sandwich, burger, or stuffed roll that feels highly clickable and sauce-friendly.",
  wings_snack:
    "Focus on wings, skewers, bites, or shareable snack food that feels game-night or party ready.",
  grill_roast:
    "Lean into char, roasting, grilling, or broiling for deeper caramelized heat.",
  rice_bowl:
    "Build a complete bowl-style meal with a clear base, topping story, and finishing sauce.",
  noodle_pasta:
    "Anchor the dish in noodles, pasta, dumplings, or a starch-forward comfort lane.",
  stew_curry:
    "Make the dish saucy, spoonable, braised, or curry-like with layered heat.",
  seafood:
    "Center seafood and keep the heat calibrated so it supports, not buries, the protein.",
  vegetarian:
    "Keep it meatless while still satisfying, structured, and craveable enough for a main course."
};

export function formatTaxonomyLabel(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
