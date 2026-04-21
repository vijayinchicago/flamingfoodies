import { describe, expect, it } from "vitest";

import type { SearchRecommendation } from "@/lib/search-performance";
import {
  buildSearchRecommendationKey,
  buildSearchRecommendationQueueMutations,
  executeSearchRecommendationQueue,
  getSearchRecommendationImplementation,
  summarizeSearchRecommendationQueue,
  type SearchQueuedRecommendation,
  type SearchRecommendationQueueSnapshot
} from "@/lib/search-recommendation-workflow";

function createRecommendation(
  overrides: Partial<SearchRecommendation> &
    Pick<
      SearchRecommendation,
      "id" | "title" | "priority" | "action" | "summary" | "suggestedChanges" | "supportingQueries" | "totalImpressions"
    >
): SearchRecommendation {
  return {
    id: overrides.id,
    title: overrides.title,
    priority: overrides.priority,
    action: overrides.action,
    targetPath: overrides.targetPath,
    relatedPaths: overrides.relatedPaths ?? [],
    summary: overrides.summary,
    suggestedTitle: overrides.suggestedTitle,
    suggestedChanges: overrides.suggestedChanges,
    supportingQueries: overrides.supportingQueries,
    totalImpressions: overrides.totalImpressions,
    avgPosition: overrides.avgPosition
  };
}

function createQueuedRecommendation(
  recommendation: SearchRecommendation,
  overrides?: Partial<SearchQueuedRecommendation>
): SearchQueuedRecommendation {
  const implementation = getSearchRecommendationImplementation(recommendation);

  return {
    id: overrides?.id ?? 1,
    property: overrides?.property ?? "sc-domain:flamingfoodies.com",
    recommendationKey:
      overrides?.recommendationKey ?? buildSearchRecommendationKey(recommendation),
    recommendationId: overrides?.recommendationId ?? recommendation.id,
    sourceRunId: overrides?.sourceRunId ?? 1,
    lastSeenRunId: overrides?.lastSeenRunId ?? 2,
    status: overrides?.status ?? "new",
    isActive: overrides?.isActive ?? true,
    priority: overrides?.priority ?? recommendation.priority,
    action: overrides?.action ?? recommendation.action,
    targetPath: overrides?.targetPath ?? recommendation.targetPath,
    relatedPaths: overrides?.relatedPaths ?? recommendation.relatedPaths ?? [],
    title: overrides?.title ?? recommendation.title,
    summary: overrides?.summary ?? recommendation.summary,
    suggestedTitle: overrides?.suggestedTitle ?? recommendation.suggestedTitle,
    suggestedChanges: overrides?.suggestedChanges ?? recommendation.suggestedChanges,
    supportingQueries: overrides?.supportingQueries ?? recommendation.supportingQueries,
    totalImpressions: overrides?.totalImpressions ?? recommendation.totalImpressions,
    avgPosition: overrides?.avgPosition ?? recommendation.avgPosition,
    implementationStrategy: overrides?.implementationStrategy ?? implementation.strategy,
    implementationPayload: overrides?.implementationPayload ?? implementation.payload,
    decisionReason: overrides?.decisionReason ?? null,
    firstSeenAt: overrides?.firstSeenAt ?? "2026-04-18T12:00:00.000Z",
    lastSeenAt: overrides?.lastSeenAt ?? "2026-04-21T12:00:00.000Z",
    createdAt: overrides?.createdAt ?? "2026-04-18T12:00:00.000Z",
    updatedAt: overrides?.updatedAt ?? "2026-04-21T12:00:00.000Z"
  };
}

describe("search recommendation queue mutations", () => {
  it("dedupes by recommendation key, preserves status, refreshes content, and deactivates stale items", () => {
    const seafoodRecommendation = createRecommendation({
      id: "seafood-fish-cluster",
      title: "Expand seafood pages around fish and ceviche intent",
      priority: "high",
      action: "retune_existing_page",
      targetPath: "/hot-sauces/best-for-seafood",
      relatedPaths: ["/blog/how-to-choose-a-hot-sauce-for-seafood"],
      summary: "Initial seafood summary.",
      suggestedTitle: "Best Hot Sauces for Seafood and Fish | FlamingFoodies",
      suggestedChanges: ["Retune the seafood guide."],
      supportingQueries: ["best hot sauce for seafood"],
      totalImpressions: 44,
      avgPosition: 7.2
    });
    const seafoodRecommendationUpdated = {
      ...seafoodRecommendation,
      summary: "Updated seafood summary from the latest sync.",
      totalImpressions: 57
    };
    const technicalRecommendation = createRecommendation({
      id: "canonical-host-split",
      title: "Verify the apex-domain redirect for duplicated hosts",
      priority: "medium",
      action: "verify_technical",
      targetPath: "/hot-sauces/best-for-wings",
      summary: "Host split summary.",
      suggestedChanges: ["Force www to redirect to apex."],
      supportingQueries: ["https://www.flamingfoodies.com/hot-sauces/best-for-wings"],
      totalImpressions: 12
    });

    const existing: SearchRecommendationQueueSnapshot[] = [
      {
        recommendationKey: buildSearchRecommendationKey(seafoodRecommendation),
        sourceRunId: 2,
        status: "approved",
        isActive: true,
        decisionReason: "Approved by admin.",
        firstSeenAt: "2026-04-18T12:00:00.000Z"
      },
      {
        recommendationKey: "old-cluster:/stale-path",
        sourceRunId: 1,
        status: "dismissed",
        isActive: true,
        decisionReason: "No longer relevant.",
        firstSeenAt: "2026-04-17T12:00:00.000Z"
      }
    ];

    const mutations = buildSearchRecommendationQueueMutations({
      property: "sc-domain:flamingfoodies.com",
      runId: 7,
      recommendations: [
        seafoodRecommendation,
        seafoodRecommendationUpdated,
        technicalRecommendation
      ],
      existing,
      now: "2026-04-21T15:00:00.000Z"
    });

    expect(mutations.upserts).toHaveLength(2);
    expect(mutations.newRecommendationKeys).toEqual([
      buildSearchRecommendationKey(technicalRecommendation)
    ]);
    expect(mutations.deactivateRecommendationKeys).toEqual(["old-cluster:/stale-path"]);

    expect(
      mutations.upserts.find(
        (entry) => entry.recommendation_key === buildSearchRecommendationKey(seafoodRecommendation)
      )
    ).toMatchObject({
      source_run_id: 2,
      last_seen_run_id: 7,
      status: "approved",
      summary: "Updated seafood summary from the latest sync.",
      total_impressions: 57,
      implementation_strategy: "runtime_page_overlay"
    });

    expect(
      mutations.upserts.find(
        (entry) => entry.recommendation_key === buildSearchRecommendationKey(technicalRecommendation)
      )
    ).toMatchObject({
      status: "new",
      implementation_strategy: "manual_only",
      decision_reason: null
    });
  });
});

describe("search recommendation executor", () => {
  it("applies only approved active supported items and routes technical items to manual review", () => {
    const seafoodRecommendation = createRecommendation({
      id: "seafood-fish-cluster",
      title: "Expand seafood pages around fish and ceviche intent",
      priority: "high",
      action: "retune_existing_page",
      targetPath: "/hot-sauces/best-for-seafood",
      relatedPaths: ["/blog/how-to-choose-a-hot-sauce-for-seafood"],
      summary: "Seafood summary.",
      suggestedTitle: "Best Hot Sauces for Seafood and Fish | FlamingFoodies",
      suggestedChanges: ["Retune the seafood guide."],
      supportingQueries: ["best hot sauce for seafood"],
      totalImpressions: 44,
      avgPosition: 7.2
    });
    const technicalRecommendation = createRecommendation({
      id: "canonical-host-split",
      title: "Verify the apex-domain redirect for duplicated hosts",
      priority: "medium",
      action: "verify_technical",
      targetPath: "/hot-sauces/best-for-wings",
      summary: "Host split summary.",
      suggestedChanges: ["Force www to redirect to apex."],
      supportingQueries: ["https://www.flamingfoodies.com/hot-sauces/best-for-wings"],
      totalImpressions: 12
    });
    const wingsRecommendation = createRecommendation({
      id: "wings-fried-chicken-cluster",
      title: "Retune the wings page so fried chicken is first-class intent",
      priority: "high",
      action: "retune_existing_page",
      targetPath: "/hot-sauces/best-for-wings",
      summary: "Wings summary.",
      suggestedChanges: ["Add fried chicken language."],
      supportingQueries: ["best hot sauce for fried chicken"],
      totalImpressions: 22
    });
    const nashvilleRecommendation = createRecommendation({
      id: "nashville-hot-chicken-cluster",
      title: "Expand the Nashville sandwich recipe around sauce and how-to intent",
      priority: "high",
      action: "retune_existing_page",
      targetPath: "/recipes/nashville-hot-chicken-sandwiches",
      summary: "Nashville summary.",
      suggestedChanges: ["Retune the recipe SEO title."],
      supportingQueries: ["nashville hot chicken sandwich recipe"],
      totalImpressions: 18
    });
    const friedChickenRecommendation = createRecommendation({
      id: "fried-chicken-supporting-page",
      title: "Add a dedicated fried-chicken hot-sauce page",
      priority: "medium",
      action: "add_supporting_page",
      targetPath: "/hot-sauces/best-for-fried-chicken",
      summary: "Fried chicken summary.",
      suggestedChanges: ["Create a dedicated fried-chicken page."],
      supportingQueries: ["best hot sauce for fried chicken"],
      totalImpressions: 8
    });

    const queue = [
      createQueuedRecommendation(seafoodRecommendation, {
        id: 1,
        status: "approved"
      }),
      createQueuedRecommendation(technicalRecommendation, {
        id: 2,
        status: "approved"
      }),
      createQueuedRecommendation(wingsRecommendation, {
        id: 3,
        status: "new"
      }),
      createQueuedRecommendation(nashvilleRecommendation, {
        id: 4,
        status: "approved",
        isActive: false
      }),
      createQueuedRecommendation(friedChickenRecommendation, {
        id: 5,
        status: "dismissed"
      })
    ];

    const execution = executeSearchRecommendationQueue(
      queue,
      {
        startDate: "2026-01-19",
        endDate: "2026-04-18",
        latestAvailableDate: "2026-04-18"
      },
      "2026-04-21T16:00:00.000Z"
    );

    expect(execution.appliedRecommendationKeys).toEqual([
      buildSearchRecommendationKey(seafoodRecommendation)
    ]);
    expect(execution.manualReviewRecommendationKeys).toEqual([
      buildSearchRecommendationKey(technicalRecommendation)
    ]);

    expect(
      execution.nextRecommendations.find(
        (entry) => entry.recommendationKey === buildSearchRecommendationKey(seafoodRecommendation)
      )?.status
    ).toBe("applied");
    expect(
      execution.nextRecommendations.find(
        (entry) => entry.recommendationKey === buildSearchRecommendationKey(technicalRecommendation)
      )
    ).toMatchObject({
      status: "manual_review",
      decisionReason:
        "This recommendation needs manual technical verification before any runtime overlay can be applied."
    });
    expect(
      execution.nextRecommendations.find(
        (entry) => entry.recommendationKey === buildSearchRecommendationKey(wingsRecommendation)
      )?.status
    ).toBe("new");

    expect(execution.runtime.appliedRecommendationIds).toEqual(["seafood-fish-cluster"]);
    expect(execution.runtime.pages["/hot-sauces/best-for-seafood"]?.metadataTitle).toBe(
      "Best Hot Sauces for Seafood and Fish | FlamingFoodies"
    );
    expect(execution.runtime.blog["how-to-choose-a-hot-sauce-for-seafood"]?.seoTitle).toBe(
      "How to Choose the Best Hot Sauce for Seafood, Fish, and Ceviche | FlamingFoodies"
    );
    expect(execution.runtime.pages["/hot-sauces/best-for-wings"]).toBeUndefined();
    expect(execution.runtime.recipes["nashville-hot-chicken-sandwiches"]).toBeUndefined();
    expect(execution.runtime.pages["/hot-sauces/best-for-fried-chicken"]).toBeUndefined();
  });

  it("summarizes only active queue items by status", () => {
    const queue: Array<Pick<SearchQueuedRecommendation, "status" | "isActive">> = [
      { status: "new", isActive: true },
      { status: "approved", isActive: true },
      { status: "manual_review", isActive: true },
      { status: "applied", isActive: true },
      { status: "dismissed", isActive: true },
      { status: "approved", isActive: false }
    ];

    expect(summarizeSearchRecommendationQueue(queue)).toEqual({
      total: 6,
      active: 5,
      inactive: 1,
      newCount: 1,
      approvedCount: 1,
      appliedCount: 1,
      manualReviewCount: 1,
      dismissedCount: 1
    });
  });
});
