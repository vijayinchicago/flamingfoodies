import type { Recipe, Review } from "@/lib/types";

export type HotSauceFilterKey = "all" | "everyday" | "big-heat" | "giftable" | "under-15";

export const HOT_SAUCE_FILTERS: Array<{
  key: HotSauceFilterKey;
  label: string;
  description: string;
}> = [
  {
    key: "all",
    label: "All bottles",
    description: "Browse the full shelf."
  },
  {
    key: "everyday",
    label: "Everyday",
    description: "Useful on eggs, tacos, bowls, and weeknight dinners."
  },
  {
    key: "big-heat",
    label: "Big heat",
    description: "Bottles for wings, pizza, and heat-chasing."
  },
  {
    key: "giftable",
    label: "Giftable",
    description: "Bundles, tasting sets, and easy-present picks."
  },
  {
    key: "under-15",
    label: "Under $15",
    description: "Affordable bottles with real flavor."
  }
];

export const HOT_SAUCE_LANDING_LINKS = [
  {
    href: "/hot-sauces/best",
    eyebrow: "Best overall",
    title: "Best hot sauces",
    description: "The bottles we would recommend first if someone asked what to buy right now."
  },
  {
    href: "/hot-sauces/best-for-tacos",
    eyebrow: "Taco night",
    title: "Best hot sauces for tacos",
    description: "Bright, spoonable bottles that sharpen tacos instead of bullying them."
  },
  {
    href: "/hot-sauces/best-for-wings",
    eyebrow: "Wings and pizza",
    title: "Best hot sauces for wings",
    description: "Garlicky, clingy bottles and big hitters that still taste good on game-day food."
  },
  {
    href: "/hot-sauces/under-15",
    eyebrow: "Affordable",
    title: "Best hot sauces under $15",
    description: "Useful bottles that build a smarter shelf without spending gift-set money."
  },
  {
    href: "/hot-sauces/best-gift-sets",
    eyebrow: "Gifts",
    title: "Best gift sets and subscriptions",
    description: "The easiest way to gift heat without guessing at a single bottle."
  }
] as const;

function normalizeText(value?: string | null) {
  return (value || "").toLowerCase();
}

function joinReviewCorpus(review: Review) {
  return normalizeText(
    [
      review.title,
      review.description,
      review.productName,
      review.brand,
      review.category,
      review.cuisineOrigin,
      review.content,
      review.tags.join(" "),
      review.flavorNotes.join(" "),
      review.pros.join(" "),
      review.cons.join(" ")
    ].join(" ")
  );
}

function hasAnyToken(review: Review, tokens: string[]) {
  const corpus = joinReviewCorpus(review);
  return tokens.some((token) => corpus.includes(token));
}

export function isGiftableHotSauceReview(review: Review) {
  return (
    review.category === "gift-set" ||
    review.category === "subscription-box" ||
    hasAnyToken(review, ["gift", "bundle", "collection", "subscription", "tasting"])
  );
}

export function isBigHeatHotSauceReview(review: Review) {
  return (
    review.heatLevel === "inferno" ||
    review.heatLevel === "reaper" ||
    (review.scovilleMax ?? 0) >= 50000 ||
    hasAnyToken(review, ["superhot", "extreme", "wings and pizza weapon"])
  );
}

export function isEverydayHotSauceReview(review: Review) {
  if (isGiftableHotSauceReview(review) || isBigHeatHotSauceReview(review)) {
    return false;
  }

  return (
    review.category === "hot-sauce" ||
    review.category === "pantry-condiment" ||
    hasAnyToken(review, ["everyday", "table sauce", "breakfast tacos", "use often", "generous pour"])
  );
}

export function getFilteredHotSauceReviews(
  reviews: Review[],
  filter: HotSauceFilterKey
) {
  switch (filter) {
    case "everyday":
      return reviews.filter(isEverydayHotSauceReview);
    case "big-heat":
      return reviews.filter(isBigHeatHotSauceReview);
    case "giftable":
      return reviews.filter(isGiftableHotSauceReview);
    case "under-15":
      return reviews.filter((review) => typeof review.priceUsd === "number" && review.priceUsd <= 15);
    case "all":
    default:
      return reviews;
  }
}

function sortByShelfValue(reviews: Review[]) {
  return [...reviews].sort((left, right) => {
    if ((left.featured ?? false) !== (right.featured ?? false)) {
      return left.featured ? -1 : 1;
    }

    if (left.recommended !== right.recommended) {
      return left.recommended ? -1 : 1;
    }

    if (left.rating !== right.rating) {
      return right.rating - left.rating;
    }

    return (right.viewCount ?? 0) - (left.viewCount ?? 0);
  });
}

export function getTopHotSaucePicks(reviews: Review[], limit = 3) {
  return sortByShelfValue(reviews).slice(0, limit);
}

export function getBestHotSaucesReviews(reviews: Review[], limit = 6) {
  return reviews
    .map((review) => {
      let score = 0;

      if (review.category === "hot-sauce" || review.category === "pantry-condiment") score += 4;
      if (review.recommended) score += 4;
      if (review.featured) score += 3;
      if (isEverydayHotSauceReview(review)) score += 3;
      if (!isGiftableHotSauceReview(review)) score += 2;
      if (!isBigHeatHotSauceReview(review)) score += 1;
      score += Math.round(review.rating * 2);
      score += Math.min(Math.floor((review.viewCount ?? 0) / 100), 4);

      return { review, score };
    })
    .sort((left, right) => right.score - left.score || right.review.rating - left.review.rating)
    .map((entry) => entry.review)
    .slice(0, limit);
}

export function getBestGiftableHotSauceReviews(reviews: Review[], limit = 4) {
  return reviews
    .filter(isGiftableHotSauceReview)
    .map((review) => {
      let score = 0;

      if (review.category === "gift-set" || review.category === "subscription-box") score += 4;
      if (review.recommended) score += 3;
      if (review.featured) score += 2;
      if (hasAnyToken(review, ["subscription", "tasting", "gift", "collection"])) score += 3;
      score += Math.round(review.rating * 2);
      score += Math.min(Math.floor((review.viewCount ?? 0) / 100), 4);

      return { review, score };
    })
    .sort((left, right) => right.score - left.score || right.review.rating - left.review.rating)
    .map((entry) => entry.review)
    .slice(0, limit);
}

export function getHotSauceIntentLabel(review: Review) {
  if (isGiftableHotSauceReview(review)) {
    return "Best for gifting";
  }

  if (review.category === "grow-kit") {
    return "Best for DIY sauce makers";
  }

  if (hasAnyToken(review, ["wings", "pizza"])) {
    return "Best for wings";
  }

  if (hasAnyToken(review, ["dumpling", "dumplings", "noodle", "noodles", "peppercorn"])) {
    return "Best for dumplings";
  }

  if (hasAnyToken(review, ["seafood", "shrimp", "fish"])) {
    return "Best for seafood";
  }

  if (review.category === "pantry-condiment" || hasAnyToken(review, ["honey", "fried chicken"])) {
    return "Best on pizza";
  }

  if (hasAnyToken(review, ["taco", "tacos"]) || review.cuisineOrigin === "mexican") {
    return "Best for tacos";
  }

  if (isBigHeatHotSauceReview(review)) {
    return "Best for heat chasers";
  }

  if (isEverydayHotSauceReview(review)) {
    return "Best for everyday pours";
  }

  return "Best for flavor-first heat";
}

export function getBestForTacosReviews(reviews: Review[], limit = 4) {
  const scored = reviews.map((review) => {
    let score = 0;

    if (getHotSauceIntentLabel(review) === "Best for tacos") score += 5;
    if (review.cuisineOrigin === "mexican") score += 4;
    if (isEverydayHotSauceReview(review)) score += 3;
    if (hasAnyToken(review, ["taco", "tacos", "breakfast tacos"])) score += 3;
    if (hasAnyToken(review, ["citrus", "lime", "carrot", "bright", "smoky", "tomato"])) score += 2;
    if (typeof review.priceUsd === "number" && review.priceUsd <= 15) score += 1;
    if (review.recommended) score += 1;

    return { review, score };
  });

  return scored
    .sort((left, right) => right.score - left.score || right.review.rating - left.review.rating)
    .map((entry) => entry.review)
    .slice(0, limit);
}

export function getBestForWingsReviews(reviews: Review[], limit = 4) {
  const scored = reviews.map((review) => {
    let score = 0;

    if (getHotSauceIntentLabel(review) === "Best for wings") score += 5;
    if (isBigHeatHotSauceReview(review)) score += 4;
    if (hasAnyToken(review, ["wings", "wing", "pizza", "garlic", "buffalo"])) score += 4;
    if (hasAnyToken(review, ["fried chicken", "sandwich", "drizzle"])) score += 2;
    if (review.recommended) score += 2;
    if (review.featured) score += 1;

    return { review, score };
  });

  return scored
    .sort((left, right) => right.score - left.score || right.review.rating - left.review.rating)
    .map((entry) => entry.review)
    .slice(0, limit);
}

export function getAffordableHotSauceReviews(reviews: Review[], limit = 6) {
  const scored = reviews
    .filter((review) => typeof review.priceUsd === "number" && review.priceUsd <= 15)
    .map((review) => {
      let score = 0;

      if (isEverydayHotSauceReview(review)) score += 4;
      if (review.recommended) score += 3;
      if (review.featured) score += 2;
      if (hasAnyToken(review, ["taco", "tacos", "eggs", "pizza", "bowl", "weeknight"])) score += 2;
      score += Math.round(review.rating * 2);
      score += Math.min(Math.floor((review.viewCount ?? 0) / 100), 4);

      return { review, score };
    });

  return scored
    .sort((left, right) => right.score - left.score || right.review.rating - left.review.rating)
    .map((entry) => entry.review)
    .slice(0, limit);
}

export function getTacoFriendlyRecipes(recipes: Recipe[], limit = 3) {
  const scored = recipes.map((recipe) => {
    const corpus = normalizeText([recipe.title, recipe.description, recipe.tags.join(" ")].join(" "));
    let score = 0;

    if (corpus.includes("taco")) score += 5;
    if (corpus.includes("birria")) score += 3;
    if (corpus.includes("quesa")) score += 2;
    if (recipe.cuisineType === "mexican") score += 1;

    return { recipe, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.recipe)
    .slice(0, limit);
}

export function getWingFriendlyRecipes(recipes: Recipe[], limit = 3) {
  const scored = recipes.map((recipe) => {
    const corpus = normalizeText([recipe.title, recipe.description, recipe.tags.join(" ")].join(" "));
    let score = 0;

    if (corpus.includes("chicken")) score += 3;
    if (corpus.includes("fried")) score += 3;
    if (corpus.includes("wings")) score += 4;
    if (corpus.includes("sandwich")) score += 2;
    if (corpus.includes("burger")) score += 1;
    if (recipe.cuisineType === "american") score += 1;

    return { recipe, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.recipe)
    .slice(0, limit);
}

export function getHotSauceFilterMeta(filter: HotSauceFilterKey) {
  return HOT_SAUCE_FILTERS.find((entry) => entry.key === filter) ?? HOT_SAUCE_FILTERS[0];
}
