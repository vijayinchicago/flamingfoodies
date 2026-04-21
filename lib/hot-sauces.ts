import type { BlogPost, Recipe, Review } from "@/lib/types";

export interface HotSauceComparisonRow {
  name: string;
  href: string;
  bestFor: string;
  heat: string;
  flavorLane: string;
  priceLabel: string;
  whyBuy: string;
}

export type HotSauceComparisonContext =
  | "general"
  | "tacos"
  | "eggs"
  | "wings"
  | "fried_chicken"
  | "seafood"
  | "pizza"
  | "gifts";

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
    href: "/hot-sauces/best-for-eggs",
    eyebrow: "Breakfast",
    title: "Best hot sauces for eggs",
    description: "Everyday pours, chili crisps, and bright bottles that make eggs more interesting fast."
  },
  {
    href: "/hot-sauces/best-for-fried-chicken",
    eyebrow: "Fried chicken",
    title: "Best hot sauces for fried chicken",
    description: "The bottles that cut through crispy breading without turning every bite into a gimmick."
  },
  {
    href: "/hot-sauces/best-for-seafood",
    eyebrow: "Seafood",
    title: "Best hot sauces for seafood",
    description: "Bright, gingery, and fruit-forward bottles that sharpen shrimp, fish, and grilled seafood."
  },
  {
    href: "/hot-sauces/best-for-wings",
    eyebrow: "Wings and pizza",
    title: "Best hot sauces for wings",
    description: "Garlicky, clingy bottles and big hitters that still taste good on game-day food."
  },
  {
    href: "/hot-sauces/best-for-pizza",
    eyebrow: "Pizza night",
    title: "Best hot sauces for pizza",
    description: "Hot honeys, reaper bombs, and pizza-friendly bottles that actually improve the slice."
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
  },
  {
    href: "/hot-sauces/gifts-under-50",
    eyebrow: "Budget gifts",
    title: "Best hot sauce gifts under $50",
    description: "Giftable sets and shelf builders that still feel thoughtful without blowing past impulse-buy range."
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

function formatHotSaucePrice(priceUsd?: number) {
  return typeof priceUsd === "number" ? `$${priceUsd.toFixed(2)}` : "Check Amazon";
}

export function getHotSauceHeatLabel(review: Review) {
  switch (review.heatLevel) {
    case "mild":
      return "Mild";
    case "medium":
      return "Medium";
    case "hot":
      return "Hot";
    case "inferno":
      return "Inferno";
    case "reaper":
      return "Reaper";
    default:
      return "Flavor-first";
  }
}

export function getHotSauceFlavorLane(review: Review) {
  if (review.category === "gift-set" || review.category === "subscription-box") {
    return "Mixed tasting flight";
  }

  if (review.category === "pantry-condiment") {
    return "Sticky-sweet finish";
  }

  if (review.flavorNotes.length >= 2) {
    return review.flavorNotes.slice(0, 2).join(" + ");
  }

  if (review.flavorNotes.length === 1) {
    return review.flavorNotes[0];
  }

  return "Flavor-first heat";
}

export function getHotSauceBestForCopy(
  review: Review,
  context: HotSauceComparisonContext = "general"
) {
  if (context === "gifts") {
    if (review.category === "subscription-box") {
      return "Recurring discovery";
    }

    if (review.category === "gift-set") {
      return "Tasting-night gifting";
    }
  }

  if (context === "tacos" && hasAnyToken(review, ["taco", "tacos", "birria", "breakfast tacos"])) {
    return "Tacos and rice bowls";
  }

  if (context === "eggs" && hasAnyToken(review, ["egg", "eggs", "breakfast", "hash"])) {
    return "Eggs and breakfast tacos";
  }

  if (context === "wings" && hasAnyToken(review, ["wings", "wing", "buffalo", "garlic", "pizza"])) {
    return "Wings and game-day food";
  }

  if (
    context === "fried_chicken" &&
    hasAnyToken(review, ["fried chicken", "hot chicken", "sandwich", "tenders", "hot honey", "drizzle"])
  ) {
    return "Fried chicken and hot sandwiches";
  }

  if (context === "seafood" && hasAnyToken(review, ["seafood", "shrimp", "fish"])) {
    return "Seafood and fish tacos";
  }

  if (context === "pizza" && hasAnyToken(review, ["pizza", "hot honey", "garlic"])) {
    return "Pizza and fried chicken";
  }

  if (review.category === "subscription-box") {
    return "Recurring discovery";
  }

  if (review.category === "gift-set") {
    return "Tasting-night gifting";
  }

  if (review.category === "grow-kit") {
    return "DIY sauce makers";
  }

  if (hasAnyToken(review, ["taco", "tacos", "birria"])) {
    return "Tacos and rice bowls";
  }

  if (hasAnyToken(review, ["seafood", "shrimp", "fish"])) {
    return "Seafood and fish tacos";
  }

  if (hasAnyToken(review, ["egg", "eggs", "breakfast", "hash"])) {
    return "Eggs and breakfast tacos";
  }

  if (hasAnyToken(review, ["pizza", "hot honey"])) {
    return "Pizza and fried chicken";
  }

  if (hasAnyToken(review, ["wings", "wing", "buffalo", "garlic"])) {
    return "Wings and game-day food";
  }

  if (hasAnyToken(review, ["taco", "tacos", "birria"])) {
    return "Tacos and rice bowls";
  }

  if (isBigHeatHotSauceReview(review)) {
    return "Heat-chasing nights";
  }

  if (isEverydayHotSauceReview(review)) {
    return "Weeknight everyday use";
  }

  return "Flavor-first heat";
}

export function getHotSauceWhyBuy(review: Review) {
  if (review.category === "subscription-box") {
    return "It turns one gift into a recurring tasting ritual instead of a one-bottle guess.";
  }

  if (review.category === "gift-set") {
    return "You get a more curated gift move with lower odds of missing on one exact flavor profile.";
  }

  if (review.category === "pantry-condiment") {
    return "It adds contrast and texture where a standard vinegar-forward sauce can feel too one-note.";
  }

  if (isBigHeatHotSauceReview(review)) {
    return "This is the bottle to keep when you want serious fire but still need some actual flavor behind it.";
  }

  if (hasAnyToken(review, ["citrus", "lime", "bright", "carrot"])) {
    return "The bright profile keeps rich food tasting awake instead of just hotter.";
  }

  if (hasAnyToken(review, ["garlic", "buffalo", "smoky"])) {
    return "It hangs on wings, pizza, and other richer food better than thinner novelty sauces.";
  }

  if (isEverydayHotSauceReview(review)) {
    return "This is the kind of bottle you can pour generously across eggs, tacos, bowls, and weeknight dinners.";
  }

  return "It earns shelf space by being more useful than a pure heat stunt.";
}

export function getHotSauceSkipIfCopy(review: Review) {
  if (review.category === "subscription-box") {
    return "Skip if you need one exact everyday bottle instead of a discovery-style gift.";
  }

  if (review.category === "gift-set") {
    return "Skip if you already know the exact bottle you want and do not need a tasting route.";
  }

  if (review.category === "pantry-condiment" || hasAnyToken(review, ["hot honey", "sweet", "sticky"])) {
    return "Skip if you want a classic vinegar-forward table sauce with almost no sweetness.";
  }

  if (isBigHeatHotSauceReview(review)) {
    return "Skip if the table is heat-shy or you mainly want an easy everyday pour.";
  }

  if (hasAnyToken(review, ["seafood", "shrimp", "fish", "citrus", "lime"])) {
    return "Skip if you want a thick, smoky wing sauce more than a bright finishing bottle.";
  }

  if (isEverydayHotSauceReview(review)) {
    return "Skip if you are chasing a novelty-level heat hit or a super-special-occasion bottle.";
  }

  return "Skip if you want one bottle to solve every single spicy-food situation.";
}

export function buildHotSauceComparisonRows(
  reviews: Review[],
  context: HotSauceComparisonContext = "general"
): HotSauceComparisonRow[] {
  return reviews.map((review) => ({
    name: review.productName || review.title,
    href: `/reviews/${review.slug}`,
    bestFor: getHotSauceBestForCopy(review, context),
    heat: getHotSauceHeatLabel(review),
    flavorLane: getHotSauceFlavorLane(review),
    priceLabel: formatHotSaucePrice(review.priceUsd),
    whyBuy: getHotSauceWhyBuy(review)
  }));
}

export function getHotSauceGuidePosts(posts: BlogPost[], limit = 3) {
  return [...posts]
    .filter((post) => {
      const corpus = normalizeText(
        [post.title, post.description, post.slug, post.tags.join(" "), post.category].join(" ")
      );

      return (
        corpus.includes("hot sauce") ||
        corpus.includes("pizza") ||
        corpus.includes("wings") ||
        corpus.includes("seafood") ||
        corpus.includes("eggs") ||
        corpus.includes("taco")
      );
    })
    .sort((left, right) => {
      if ((left.featured ?? false) !== (right.featured ?? false)) {
        return left.featured ? -1 : 1;
      }

      return new Date(right.publishedAt ?? 0).getTime() - new Date(left.publishedAt ?? 0).getTime();
    })
    .slice(0, limit);
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

export function getBestForFriedChickenReviews(reviews: Review[], limit = 4) {
  const scored = reviews.map((review) => {
    let score = 0;

    if (review.category === "pantry-condiment") score += 4;
    if (hasAnyToken(review, ["fried chicken", "hot chicken", "sandwich", "tenders", "cutlet"])) {
      score += 5;
    }
    if (hasAnyToken(review, ["garlic", "vinegar", "buffalo", "hot honey", "drizzle"])) {
      score += 4;
    }
    if (getHotSauceIntentLabel(review) === "Best for wings") score += 2;
    if (review.recommended) score += 2;
    if (review.featured) score += 1;
    if (review.priceUsd && review.priceUsd <= 15) score += 1;

    return { review, score };
  });

  return scored
    .sort((left, right) => right.score - left.score || right.review.rating - left.review.rating)
    .map((entry) => entry.review)
    .slice(0, limit);
}

export function getBestForEggsReviews(reviews: Review[], limit = 4) {
  const scored = reviews.map((review) => {
    let score = 0;

    if (hasAnyToken(review, ["egg", "eggs", "breakfast", "hash"])) score += 5;
    if (isEverydayHotSauceReview(review)) score += 4;
    if (review.category === "pantry-condiment") score += 2;
    if (hasAnyToken(review, ["crisp", "honey", "bright", "pour"])) score += 2;
    if (review.recommended) score += 2;
    if (typeof review.priceUsd === "number" && review.priceUsd <= 15) score += 1;

    return { review, score };
  });

  return scored
    .sort((left, right) => right.score - left.score || right.review.rating - left.review.rating)
    .map((entry) => entry.review)
    .slice(0, limit);
}

export function getBestForSeafoodReviews(reviews: Review[], limit = 4) {
  const scored = reviews.map((review) => {
    let score = 0;

    if (getHotSauceIntentLabel(review) === "Best for seafood") score += 5;
    if (hasAnyToken(review, ["seafood", "shrimp", "fish", "ginger", "citrus", "bright"])) score += 4;
    if (!isBigHeatHotSauceReview(review)) score += 2;
    if (review.recommended) score += 2;
    if (review.featured) score += 1;

    return { review, score };
  });

  return scored
    .sort((left, right) => right.score - left.score || right.review.rating - left.review.rating)
    .map((entry) => entry.review)
    .slice(0, limit);
}

export function getBestForPizzaReviews(reviews: Review[], limit = 4) {
  const scored = reviews.map((review) => {
    let score = 0;

    if (getHotSauceIntentLabel(review) === "Best on pizza") score += 5;
    if (getHotSauceIntentLabel(review) === "Best for wings") score += 3;
    if (hasAnyToken(review, ["pizza", "hot honey", "garlic", "fried chicken"])) score += 4;
    if (review.category === "pantry-condiment") score += 2;
    if (review.recommended) score += 2;

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

export function getGiftableHotSauceReviewsUnderPrice(
  reviews: Review[],
  maxPrice = 50,
  limit = 4
) {
  return reviews
    .filter(
      (review) =>
        isGiftableHotSauceReview(review) &&
        typeof review.priceUsd === "number" &&
        review.priceUsd <= maxPrice
    )
    .map((review) => {
      let score = 0;

      if (review.category === "gift-set" || review.category === "subscription-box") score += 4;
      if (review.recommended) score += 3;
      if (review.featured) score += 2;
      if (hasAnyToken(review, ["gift", "bundle", "subscription", "tasting"])) score += 3;
      score += Math.round(review.rating * 2);
      score += Math.min(Math.floor((review.viewCount ?? 0) / 100), 4);

      return { review, score };
    })
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

export function getFriedChickenFriendlyRecipes(recipes: Recipe[], limit = 3) {
  const scored = recipes.map((recipe) => {
    const corpus = normalizeText([recipe.title, recipe.description, recipe.tags.join(" ")].join(" "));
    let score = 0;

    if (corpus.includes("fried")) score += 4;
    if (corpus.includes("chicken")) score += 4;
    if (corpus.includes("sandwich")) score += 4;
    if (corpus.includes("tenders")) score += 2;
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
