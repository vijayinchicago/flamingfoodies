import type {
  BlogSearchOptimization,
  RecipeSearchOptimization
} from "@/lib/search-content-optimizations";
import type { SearchRecommendation } from "@/lib/search-performance";
import type { RecipeFaq } from "@/lib/types";

export type SearchLandingPageOptimization = {
  metadataTitle?: string;
  metadataDescription?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroCopy?: string;
  faqEyebrow?: string;
  faqTitle?: string;
  faqCopy?: string;
  faqs?: RecipeFaq[];
};

export type SearchRuntimeOptimizations = {
  generatedAt: string;
  sourceWindow: {
    startDate: string;
    endDate: string;
    latestAvailableDate: string;
  };
  detectedRecommendationIds: string[];
  appliedRecommendationIds: string[];
  blog: Record<string, BlogSearchOptimization>;
  recipes: Record<string, RecipeSearchOptimization>;
  pages: Record<string, SearchLandingPageOptimization>;
};

export type SearchRecommendationStatus =
  | "new"
  | "approved"
  | "applied"
  | "manual_review"
  | "dismissed";

export type SearchImplementationStrategy =
  | "runtime_page_overlay"
  | "runtime_blog_overlay"
  | "runtime_recipe_overlay"
  | "manual_only";

export type SearchImplementationOperation = {
  kind: "page" | "blog" | "recipe";
  target: string;
  fields: Record<string, unknown>;
};

export type SearchImplementationPayload = {
  operations: SearchImplementationOperation[];
};

export type SearchRecommendationQueueUpsert = {
  property: string;
  recommendation_key: string;
  source_run_id: number | null;
  last_seen_run_id: number | null;
  status: SearchRecommendationStatus;
  is_active: boolean;
  priority: SearchRecommendation["priority"];
  action: SearchRecommendation["action"];
  target_path: string | null;
  related_paths: string[];
  title: string;
  summary: string;
  suggested_title: string | null;
  suggested_changes: string[];
  supporting_queries: string[];
  total_impressions: number;
  avg_position: number | null;
  implementation_strategy: SearchImplementationStrategy;
  implementation_payload: SearchImplementationPayload;
  decision_reason: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

export type SearchRecommendationQueueSnapshot = {
  recommendationKey: string;
  sourceRunId: number | null;
  status: SearchRecommendationStatus;
  isActive: boolean;
  decisionReason: string | null;
  firstSeenAt: string;
};

export type SearchQueuedRecommendation = {
  id: number;
  property: string;
  recommendationKey: string;
  recommendationId: string;
  sourceRunId: number | null;
  lastSeenRunId: number | null;
  status: SearchRecommendationStatus;
  isActive: boolean;
  priority: SearchRecommendation["priority"];
  action: SearchRecommendation["action"];
  targetPath?: string;
  relatedPaths: string[];
  title: string;
  summary: string;
  suggestedTitle?: string;
  suggestedChanges: string[];
  supportingQueries: string[];
  totalImpressions: number;
  avgPosition?: number;
  implementationStrategy: SearchImplementationStrategy;
  implementationPayload: SearchImplementationPayload;
  decisionReason: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchRecommendationQueueSummary = {
  total: number;
  active: number;
  inactive: number;
  newCount: number;
  approvedCount: number;
  appliedCount: number;
  manualReviewCount: number;
  dismissedCount: number;
};

type SupportedImplementationDefinition = {
  strategy: Exclude<SearchImplementationStrategy, "manual_only">;
  operations: SearchImplementationOperation[];
};

type SearchRecommendationImplementation = {
  strategy: SearchImplementationStrategy;
  payload: SearchImplementationPayload;
  reason: string | null;
};

const seafoodPageFaqs: RecipeFaq[] = [
  {
    question: "What kind of hot sauce works best on seafood and fish?",
    answer:
      "Usually bottles with brightness, ginger, citrus, or cleaner pepper notes. They wake up shrimp, fish, and grilled seafood without flattening them."
  },
  {
    question: "Are smoky sauces too heavy for fish?",
    answer:
      "Often yes, especially on lighter seafood. A little smoke can work, but dense, muddy sauces usually bury delicate proteins faster than they help them."
  },
  {
    question: "Can you use hot sauce in ceviche?",
    answer:
      "Yes, but go lightly and choose a bright bottle. Ceviche already has acid from citrus, so the sauce should add lift and pepper character instead of muddy sweetness or heavy smoke."
  },
  {
    question: "Can one seafood bottle also work on fish tacos?",
    answer:
      "Absolutely. Many seafood-friendly bottles are also excellent on fish tacos, shrimp tacos, and rice bowls because they bring the same lift and clarity."
  }
];

const wingsPageFaqs: RecipeFaq[] = [
  {
    question: "What kind of hot sauce works best on wings and fried chicken?",
    answer:
      "Usually a sauce with cling, garlic, vinegar, smoke, or enough acid to keep rich food from tasting flat. Thin novelty superhots rarely work as well on wings and fried chicken as a balanced bottle with some structure."
  },
  {
    question: "Can the same bottle work on wings and hot chicken sandwiches?",
    answer:
      "Yes. Garlic-heavy sauces, punchy Louisiana-style bottles, and the right hot honeys often pull double duty on wings, fried chicken, and crispy sandwiches."
  },
  {
    question: "Do wings and fried chicken need the hottest bottle on the shelf?",
    answer:
      "No. Rich food can carry more heat, but one balanced hard-hitter is usually smarter than stacking multiple ultra-hot bottles that all taste flat."
  }
];

const friedChickenPageFaqs: RecipeFaq[] = [
  {
    question: "What is the best hot sauce for fried chicken?",
    answer:
      "Usually a bottle with vinegar, garlic, or enough texture to stay present on the crust. Louisiana-style sauces, garlic-heavy wing sauces, and the right hot honeys tend to beat thin novelty superhots."
  },
  {
    question: "Should fried chicken get a table sauce or a thicker wing sauce?",
    answer:
      "It depends on the job. A table sauce is great when you want a sharp, vinegary splash. A thicker garlic-forward sauce or hot honey works better when you want more cling on sandwiches, tenders, or cutlets."
  },
  {
    question: "Can the same bottle work on fried chicken and hot chicken sandwiches?",
    answer:
      "Yes. The most useful fried-chicken bottles often pull double duty on hot chicken sandwiches, tenders, fries, and even pizza if they bring enough acid or garlic to stay lively."
  },
  {
    question: "What flavors work best on hot chicken sandwiches?",
    answer:
      "Garlic, vinegar, smoky chili, and hot honey all work well because they cut rich breading and stay noticeable after slaw, pickles, and buns enter the stack."
  }
];

const seafoodBlogOptimization: BlogSearchOptimization = {
  title: "How to Choose a Hot Sauce for Seafood, Fish, and Ceviche",
  description:
    "A buying guide for seafood-friendly hot sauces that work on shrimp, grilled fish, fish tacos, and ceviche without flattening the plate.",
  seoTitle: "How to Choose the Best Hot Sauce for Seafood, Fish, and Ceviche | FlamingFoodies",
  seoDescription:
    "Learn which hot sauces actually work on seafood, fish tacos, grilled fish, shrimp, and ceviche, plus what to avoid.",
  appendContent: `
## The best hot sauce for fish keeps the fish tasting clear

White fish, salmon, and grilled snapper usually want acidity, citrus, ginger, or a clean pepper finish before they want brute force. If a bottle tastes muddy or overly smoky, it can flatten flaky fish fast. That is why the most useful fish sauces tend to overlap with the bottles we keep on the [seafood shelf](/hot-sauces/best-for-seafood).

## Can you use hot sauce in ceviche?

Yes, but use a light hand. Ceviche already has acid from lime or another citrus, so the hot sauce needs to bring lift, fruit, or pepper character without turning the bowl harsh. Bright habanero, ginger, and citrus-led sauces usually make more sense than heavy garlic-bomb or wing-night bottles.

## Match the bottle to the seafood

Shrimp and fish tacos can handle a little more sweetness or cream-friendly texture. Grilled fish wants brightness and restraint. Salmon can take a little more smoke than snapper or ceviche, but it still benefits from a sauce that finishes clean instead of lingering like a dare.
  `
};

const seafoodPageOptimization: SearchLandingPageOptimization = {
  metadataTitle: "Best Hot Sauces for Seafood and Fish | FlamingFoodies",
  metadataDescription:
    "The best hot sauces for seafood, fish tacos, ceviche, and shrimp: bright, gingery bottles that sharpen the plate instead of flattening it.",
  heroEyebrow: "Hot sauces for seafood",
  heroTitle:
    "Best Hot Sauces for Seafood — The bottles that wake up shrimp, fish, and ceviche without flattening them.",
  heroCopy:
    "Seafood usually wants brightness, citrus, ginger, or cleaner fruit notes. These are the bottles that sharpen fish tacos, grilled seafood, and ceviche instead of crushing them under brute heat.",
  faqEyebrow: "FAQ",
  faqTitle: "Seafood buying questions worth solving before dinner.",
  faqCopy:
    "The most useful seafood sauces tend to be the ones that add brightness and range to fish, shellfish, and ceviche, not just raw heat.",
  faqs: seafoodPageFaqs
};

const nashvilleRecipeOptimization: RecipeSearchOptimization = {
  description:
    "Crisp fried chicken, cayenne oil sauce, pickles, and slaw stacked into a Nashville hot chicken sandwich that keeps the crust loud and the heat pointed.",
  seoTitle: "Nashville Hot Chicken Sandwich Recipe | How to Make the Sauce",
  seoDescription:
    "Make a crunchy Nashville hot chicken sandwich at home with the right fried chicken method, cayenne oil sauce, slaw, and pickles.",
  introAppendix:
    "If you found this while looking for how to make a hot chicken sandwich, the make-or-break move is the Nashville oil. Fry the chicken until the crust is solid first, then brush on enough cayenne oil to stain the breading without drowning it, and use slaw plus pickles to keep the sandwich moving.",
  extraFaqs: [
    {
      question: "What is Nashville hot chicken sandwich sauce made of?",
      answer:
        "Usually hot frying oil whisked with cayenne, paprika, brown sugar, and a little seasoning. It is more of a spiced hot oil than a creamy sandwich sauce, which is why slaw and pickles matter so much."
    },
    {
      question: "How do I keep a hot chicken sandwich crisp after adding the sauce?",
      answer:
        "Fry the chicken hard enough to build a real crust, rest it on a rack instead of paper towels, then brush on the Nashville oil instead of soaking the piece. Build the sandwich right before serving."
    }
  ],
  insightBlocks: [
    {
      eyebrow: "Sauce method",
      title: "The Nashville oil is the point, not an afterthought.",
      copy:
        "This sandwich reads correctly when the cayenne oil tastes assertive but the crust still stays crisp. Brush on enough to stain the chicken, then let slaw and pickles do the balancing."
    },
    {
      eyebrow: "Sandwich balance",
      title: "Heat alone is not what makes the sandwich work.",
      copy:
        "The best hot chicken sandwich has crunch, fat, acid, and cooling bite in the same stack. Skip the slaw or pickles and it starts eating heavy fast."
    }
  ]
};

const wingsPageOptimization: SearchLandingPageOptimization = {
  metadataTitle: "Best Hot Sauces for Wings and Fried Chicken | FlamingFoodies",
  metadataDescription:
    "The best hot sauces for wings, fried chicken, and hot chicken sandwiches: garlicky, clingy bottles and bigger hitters that still taste good.",
  heroEyebrow: "Hot sauces for wings and fried chicken",
  heroTitle:
    "Best Hot Sauces for Wings and Fried Chicken — The bottles that hold up on wings, fried chicken, and hot chicken sandwiches.",
  heroCopy:
    "Wing-friendly bottles need more than heat. They need enough garlic, cling, smoke, or vinegar structure to stay interesting on rich food and not disappear into the crust.",
  faqEyebrow: "FAQ",
  faqTitle: "The wings-and-fried-chicken questions that matter most.",
  faqCopy:
    "This is the quick read if you want bottles that work on wings, fried chicken, and hot sandwiches without feeling like a gimmick.",
  faqs: wingsPageFaqs
};

const friedChickenPageOptimization: SearchLandingPageOptimization = {
  metadataTitle: "Best Hot Sauces for Fried Chicken and Hot Sandwiches | FlamingFoodies",
  metadataDescription:
    "The best hot sauces for fried chicken, hot chicken sandwiches, tenders, and crispy cutlets: bottles with enough vinegar, garlic, or sweet heat to cut through the crust.",
  heroEyebrow: "Hot sauces for fried chicken",
  heroTitle:
    "Best Hot Sauces for Fried Chicken — The bottles that make crispy chicken, tenders, and hot sandwiches taste sharper and more alive.",
  heroCopy:
    "Fried chicken wants more than raw heat. It wants vinegar, garlic, cling, or sweet heat that can cut the crust and fat without turning every bite into a novelty stunt.",
  faqEyebrow: "FAQ",
  faqTitle: "The fried-chicken buying questions worth answering before you sauce the plate.",
  faqCopy:
    "This is the quick read if you want bottles that actually improve fried chicken, tenders, and hot sandwiches instead of just making them hotter.",
  faqs: friedChickenPageFaqs
};

const implementationRegistry: Record<string, SupportedImplementationDefinition> = {
  "seafood-fish-cluster": {
    strategy: "runtime_page_overlay",
    operations: [
      {
        kind: "page",
        target: "/hot-sauces/best-for-seafood",
        fields: seafoodPageOptimization
      },
      {
        kind: "blog",
        target: "how-to-choose-a-hot-sauce-for-seafood",
        fields: seafoodBlogOptimization
      }
    ]
  },
  "nashville-hot-chicken-cluster": {
    strategy: "runtime_recipe_overlay",
    operations: [
      {
        kind: "recipe",
        target: "nashville-hot-chicken-sandwiches",
        fields: nashvilleRecipeOptimization
      }
    ]
  },
  "wings-fried-chicken-cluster": {
    strategy: "runtime_page_overlay",
    operations: [
      {
        kind: "page",
        target: "/hot-sauces/best-for-wings",
        fields: wingsPageOptimization
      }
    ]
  },
  "fried-chicken-supporting-page": {
    strategy: "runtime_page_overlay",
    operations: [
      {
        kind: "page",
        target: "/hot-sauces/best-for-fried-chicken",
        fields: friedChickenPageOptimization
      }
    ]
  }
};

function clonePayload(payload: SearchImplementationPayload): SearchImplementationPayload {
  return {
    operations: payload.operations.map((operation) => ({
      kind: operation.kind,
      target: operation.target,
      fields: { ...operation.fields }
    }))
  };
}

function getRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function coerceFaqs(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .map((entry) => getRecord(entry))
    .map((entry) => ({
      question: String(entry.question ?? "").trim(),
      answer: String(entry.answer ?? "").trim()
    }))
    .filter((entry) => entry.question && entry.answer);
}

function coerceBlogOptimization(value: Record<string, unknown>): BlogSearchOptimization {
  return {
    title: typeof value.title === "string" ? value.title : undefined,
    description: typeof value.description === "string" ? value.description : undefined,
    seoTitle: typeof value.seoTitle === "string" ? value.seoTitle : undefined,
    seoDescription: typeof value.seoDescription === "string" ? value.seoDescription : undefined,
    appendContent: typeof value.appendContent === "string" ? value.appendContent : undefined
  };
}

function coerceRecipeOptimization(value: Record<string, unknown>): RecipeSearchOptimization {
  return {
    description: typeof value.description === "string" ? value.description : undefined,
    seoTitle: typeof value.seoTitle === "string" ? value.seoTitle : undefined,
    seoDescription: typeof value.seoDescription === "string" ? value.seoDescription : undefined,
    introAppendix: typeof value.introAppendix === "string" ? value.introAppendix : undefined,
    extraFaqs: coerceFaqs(value.extraFaqs),
    insightBlocks: Array.isArray(value.insightBlocks)
      ? value.insightBlocks
          .map((entry) => getRecord(entry))
          .map((entry) => ({
            eyebrow: String(entry.eyebrow ?? "").trim(),
            title: String(entry.title ?? "").trim(),
            copy: String(entry.copy ?? "").trim()
          }))
          .filter((entry) => entry.title && entry.copy)
      : undefined
  };
}

function coercePageOptimization(value: Record<string, unknown>): SearchLandingPageOptimization {
  return {
    metadataTitle:
      typeof value.metadataTitle === "string" ? value.metadataTitle : undefined,
    metadataDescription:
      typeof value.metadataDescription === "string" ? value.metadataDescription : undefined,
    heroEyebrow: typeof value.heroEyebrow === "string" ? value.heroEyebrow : undefined,
    heroTitle: typeof value.heroTitle === "string" ? value.heroTitle : undefined,
    heroCopy: typeof value.heroCopy === "string" ? value.heroCopy : undefined,
    faqEyebrow: typeof value.faqEyebrow === "string" ? value.faqEyebrow : undefined,
    faqTitle: typeof value.faqTitle === "string" ? value.faqTitle : undefined,
    faqCopy: typeof value.faqCopy === "string" ? value.faqCopy : undefined,
    faqs: coerceFaqs(value.faqs)
  };
}

function applyImplementationOperation(
  runtime: SearchRuntimeOptimizations,
  operation: SearchImplementationOperation
) {
  const fields = getRecord(operation.fields);

  if (operation.kind === "page") {
    runtime.pages[operation.target] = {
      ...(runtime.pages[operation.target] ?? {}),
      ...coercePageOptimization(fields)
    };
    return;
  }

  if (operation.kind === "blog") {
    runtime.blog[operation.target] = {
      ...(runtime.blog[operation.target] ?? {}),
      ...coerceBlogOptimization(fields)
    };
    return;
  }

  runtime.recipes[operation.target] = {
    ...(runtime.recipes[operation.target] ?? {}),
    ...coerceRecipeOptimization(fields)
  };
}

function createEmptyRuntime(
  window: SearchRuntimeOptimizations["sourceWindow"],
  detectedRecommendationIds: string[],
  appliedRecommendationIds: string[],
  generatedAt: string
): SearchRuntimeOptimizations {
  return {
    generatedAt,
    sourceWindow: window,
    detectedRecommendationIds,
    appliedRecommendationIds,
    blog: {},
    recipes: {},
    pages: {}
  };
}

function getManualOnlyReason(recommendation: Pick<SearchRecommendation, "action" | "id">) {
  if (recommendation.action === "verify_technical") {
    return "This recommendation needs manual technical verification before any runtime overlay can be applied.";
  }

  return `No executor strategy is defined for ${recommendation.id} yet, so it stays in manual review.`;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export function buildSearchRecommendationKey(
  recommendation: Pick<SearchRecommendation, "id" | "targetPath">
) {
  return `${recommendation.id}:${recommendation.targetPath ?? "-"}`;
}

export function getSearchRecommendationIdFromKey(recommendationKey: string) {
  const separatorIndex = recommendationKey.indexOf(":");
  return separatorIndex === -1 ? recommendationKey : recommendationKey.slice(0, separatorIndex);
}

export function getSearchRecommendationImplementation(
  recommendation: Pick<SearchRecommendation, "id" | "action">
): SearchRecommendationImplementation {
  const definition = implementationRegistry[recommendation.id];

  if (definition) {
    return {
      strategy: definition.strategy,
      payload: clonePayload({ operations: definition.operations }),
      reason: null
    };
  }

  return {
    strategy: "manual_only",
    payload: { operations: [] },
    reason: getManualOnlyReason(recommendation)
  };
}

export function buildSearchRuntimeOptimizations(
  recommendations: SearchRecommendation[],
  window: SearchRuntimeOptimizations["sourceWindow"],
  generatedAt = new Date().toISOString()
): SearchRuntimeOptimizations {
  const detectedRecommendationIds = uniqueStrings(recommendations.map((recommendation) => recommendation.id));
  const appliedRecommendationIds: string[] = [];
  const runtime = createEmptyRuntime(window, detectedRecommendationIds, appliedRecommendationIds, generatedAt);

  for (const recommendation of recommendations) {
    const implementation = getSearchRecommendationImplementation(recommendation);

    if (implementation.strategy === "manual_only" || !implementation.payload.operations.length) {
      continue;
    }

    appliedRecommendationIds.push(recommendation.id);

    for (const operation of implementation.payload.operations) {
      applyImplementationOperation(runtime, operation);
    }
  }

  runtime.appliedRecommendationIds = uniqueStrings(appliedRecommendationIds);
  return runtime;
}

export function buildSearchRecommendationQueueMutations(input: {
  property: string;
  runId: number | null;
  recommendations: SearchRecommendation[];
  existing: SearchRecommendationQueueSnapshot[];
  now?: string;
}) {
  const now = input.now ?? new Date().toISOString();
  const recommendationsByKey = new Map<string, SearchRecommendation>();

  for (const recommendation of input.recommendations) {
    recommendationsByKey.set(buildSearchRecommendationKey(recommendation), recommendation);
  }

  const existingByKey = new Map(
    input.existing.map((entry) => [entry.recommendationKey, entry])
  );
  const activeKeys = new Set<string>();
  const newRecommendationKeys: string[] = [];

  const upserts = [...recommendationsByKey.entries()].map(
    ([recommendationKey, recommendation]): SearchRecommendationQueueUpsert => {
    const existing = existingByKey.get(recommendationKey);
    const implementation = getSearchRecommendationImplementation(recommendation);

    activeKeys.add(recommendationKey);

    if (!existing) {
      newRecommendationKeys.push(recommendationKey);
    }

    return {
      property: input.property,
      recommendation_key: recommendationKey,
      source_run_id: existing?.sourceRunId ?? input.runId,
      last_seen_run_id: input.runId,
      status: existing?.status ?? "new",
      is_active: true,
      priority: recommendation.priority,
      action: recommendation.action,
      target_path: recommendation.targetPath ?? null,
      related_paths: recommendation.relatedPaths ?? [],
      title: recommendation.title,
      summary: recommendation.summary,
      suggested_title: recommendation.suggestedTitle ?? null,
      suggested_changes: recommendation.suggestedChanges,
      supporting_queries: recommendation.supportingQueries,
      total_impressions: recommendation.totalImpressions,
      avg_position: recommendation.avgPosition ?? null,
      implementation_strategy: implementation.strategy,
      implementation_payload: implementation.payload,
      decision_reason: existing?.decisionReason ?? null,
      first_seen_at: existing?.firstSeenAt ?? now,
      last_seen_at: now
    };
  });

  const deactivateRecommendationKeys = input.existing
    .filter((entry) => entry.isActive && !activeKeys.has(entry.recommendationKey))
    .map((entry) => entry.recommendationKey);

  return {
    upserts,
    deactivateRecommendationKeys,
    newRecommendationKeys
  };
}

export function summarizeSearchRecommendationQueue(
  queue: Pick<SearchQueuedRecommendation, "status" | "isActive">[]
): SearchRecommendationQueueSummary {
  const activeQueue = queue.filter((entry) => entry.isActive);

  return {
    total: queue.length,
    active: activeQueue.length,
    inactive: queue.length - activeQueue.length,
    newCount: activeQueue.filter((entry) => entry.status === "new").length,
    approvedCount: activeQueue.filter((entry) => entry.status === "approved").length,
    appliedCount: activeQueue.filter((entry) => entry.status === "applied").length,
    manualReviewCount: activeQueue.filter((entry) => entry.status === "manual_review").length,
    dismissedCount: activeQueue.filter((entry) => entry.status === "dismissed").length
  };
}

export function buildSearchRuntimeOptimizationsFromQueue(
  recommendations: Pick<
    SearchQueuedRecommendation,
    | "recommendationId"
    | "status"
    | "isActive"
    | "implementationPayload"
    | "implementationStrategy"
  >[],
  window: SearchRuntimeOptimizations["sourceWindow"],
  generatedAt = new Date().toISOString()
): SearchRuntimeOptimizations {
  const detectedRecommendationIds = uniqueStrings(
    recommendations
      .filter((entry) => entry.isActive)
      .map((entry) => entry.recommendationId)
  );
  const appliedRecommendationIds = uniqueStrings(
    recommendations
      .filter(
        (entry) =>
          entry.isActive &&
          entry.status === "applied" &&
          entry.implementationStrategy !== "manual_only"
      )
      .map((entry) => entry.recommendationId)
  );
  const runtime = createEmptyRuntime(window, detectedRecommendationIds, appliedRecommendationIds, generatedAt);

  for (const recommendation of recommendations) {
    if (
      !recommendation.isActive ||
      recommendation.status !== "applied" ||
      recommendation.implementationStrategy === "manual_only"
    ) {
      continue;
    }

    for (const operation of recommendation.implementationPayload.operations) {
      applyImplementationOperation(runtime, operation);
    }
  }

  return runtime;
}

export function executeSearchRecommendationQueue(
  recommendations: SearchQueuedRecommendation[],
  window: SearchRuntimeOptimizations["sourceWindow"],
  now = new Date().toISOString()
) {
  const appliedRecommendationKeys: string[] = [];
  const manualReviewRecommendationKeys: string[] = [];

  const nextRecommendations = recommendations.map((recommendation) => {
    const nextRecommendation: SearchQueuedRecommendation = {
      ...recommendation,
      implementationPayload: clonePayload(recommendation.implementationPayload)
    };

    if (!nextRecommendation.isActive || nextRecommendation.status !== "approved") {
      return nextRecommendation;
    }

    if (
      nextRecommendation.implementationStrategy === "manual_only" ||
      !nextRecommendation.implementationPayload.operations.length
    ) {
      nextRecommendation.status = "manual_review";
      nextRecommendation.decisionReason =
        nextRecommendation.decisionReason ||
        getManualOnlyReason({
          id: nextRecommendation.recommendationId,
          action: nextRecommendation.action
        });
      nextRecommendation.updatedAt = now;
      manualReviewRecommendationKeys.push(nextRecommendation.recommendationKey);
      return nextRecommendation;
    }

    nextRecommendation.status = "applied";
    nextRecommendation.decisionReason =
      "Applied by the search recommendation executor using the configured runtime overlay strategy.";
    nextRecommendation.updatedAt = now;
    appliedRecommendationKeys.push(nextRecommendation.recommendationKey);
    return nextRecommendation;
  });

  const runtime = buildSearchRuntimeOptimizationsFromQueue(nextRecommendations, window, now);

  return {
    nextRecommendations,
    runtime,
    appliedRecommendationKeys,
    manualReviewRecommendationKeys
  };
}
