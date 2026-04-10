export type GrowthLoopTrafficPage = {
  label: string;
  path: string;
  section: string;
  views: number;
};

export type GrowthLoopContentPage = {
  label: string;
  path: string;
  source: string;
  views: number;
  saves: number;
  ratings: number;
  comments: number;
  interactions: number;
};

export type GrowthLoopShareContent = {
  label: string;
  path: string;
  contentType: string;
  shares: number;
};

export type GrowthLoopShareLandingPage = {
  path: string;
  count: number;
};

export type GrowthLoopAffiliateSourcePage = {
  path: string;
  clicks: number;
};

export type GrowthLoopStage = "acquisition" | "activation" | "referral" | "revenue";
export type GrowthLoopContentType = "recipe" | "blog_post" | "review";

export type GrowthLoopWinner = {
  label: string;
  path: string;
  section: string;
  views: number;
  interactions: number;
  shares: number;
  affiliateClicks: number;
  stage: GrowthLoopStage;
  reason: string;
};

export type GrowthLoopBrief = {
  title: string;
  targetPath: string;
  stage: GrowthLoopStage;
  whyNow: string;
  moves: string[];
};

export type GrowthLoopPromotionCandidate = {
  label: string;
  path: string;
  section: string;
  contentType: GrowthLoopContentType;
  score: number;
  reason: string;
  views: number;
  interactions: number;
  shares: number;
  affiliateClicks: number;
};

export type GrowthLoopReport = {
  windowDays: number;
  totals: {
    trackedPages: number;
    trafficPages: number;
    sharePages: number;
    revenuePages: number;
  };
  winners: {
    acquisition: GrowthLoopWinner[];
    activation: GrowthLoopWinner[];
    referral: GrowthLoopWinner[];
    revenue: GrowthLoopWinner[];
  };
  briefs: GrowthLoopBrief[];
  autoPromotionCandidates: GrowthLoopPromotionCandidate[];
};

type GrowthLoopPageSignal = {
  label: string;
  path: string;
  section: string;
  views: number;
  interactions: number;
  shares: number;
  affiliateClicks: number;
  source?: string;
};

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatPathLabel(path: string) {
  const normalized = path === "/" ? "home" : path.split("/").filter(Boolean).pop() ?? "page";
  return normalized
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getSectionFromPath(path: string) {
  if (path === "/") return "home";
  if (path.startsWith("/recipes")) return "recipes";
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/reviews")) return "reviews";
  if (path.startsWith("/hot-sauces")) return "hot-sauces";
  if (path.startsWith("/shop")) return "shop";
  if (path.startsWith("/guides")) return "guides";
  return "other";
}

function describeWinner(stage: GrowthLoopStage, signal: GrowthLoopPageSignal) {
  if (stage === "revenue") {
    return `${formatCount(signal.affiliateClicks, "affiliate click")} from a page that already has buying intent.`;
  }

  if (stage === "referral") {
    return `${formatCount(signal.shares, "share")} shows this page is earning pass-along behavior.`;
  }

  if (stage === "activation") {
    return `${formatCount(signal.interactions, "interaction")} suggest readers are doing more than just bouncing.`;
  }

  return `${formatCount(signal.views, "view")} make this one of the clearest discovery pages in the current window.`;
}

function describePromotionReason(signal: GrowthLoopPageSignal) {
  if (signal.affiliateClicks > 0 && signal.shares > 0) {
    return "Already earns clicks and sharing. Re-promote it while the page has both trust and reach.";
  }

  if (signal.affiliateClicks > 0) {
    return "Already converts. Re-promote it to squeeze more revenue out of traffic that already exists.";
  }

  if (signal.shares > 0) {
    return "Already gets passed around. Re-promote it to widen referral traffic without creating new content.";
  }

  return "Already has live traffic. Re-promote it to test whether more reach turns into clicks or saves.";
}

function buildBriefMoves(signal: GrowthLoopPageSignal, stage: GrowthLoopStage) {
  if (signal.path.startsWith("/reviews") || signal.path.startsWith("/hot-sauces")) {
    return [
      "Publish one adjacent best-for page around the same use case or meal.",
      "Add a tighter comparison block and a clearer top pick near the first screenful.",
      "Pair it with one recipe or guide that links back into the same bottle decision."
    ];
  }

  if (signal.path.startsWith("/recipes")) {
    return [
      "Spin out one supporting pantry or technique guide that links back here.",
      "Add one stronger sauce-pairing or gear CTA where the cook is most likely to act.",
      "Promote the recipe again on Pinterest and in the weekly digest while it is already moving."
    ];
  }

  if (signal.path.startsWith("/blog")) {
    return [
      "Turn the strongest angle into one more search page or comparison page.",
      "Add sharper internal links into the most relevant hot sauce or recipe pages.",
      "Queue the article again with a more specific social angle tied to the buying problem it solves."
    ];
  }

  return [
    "Tighten the page’s main next action so readers know what to do immediately.",
    "Link it to one recipe, one hot sauce page, and one shop lane.",
    "Re-promote it with a clearer utility angle instead of a generic share caption."
  ];
}

function createBrief(signal: GrowthLoopPageSignal, stage: GrowthLoopStage): GrowthLoopBrief {
  const whyNow =
    stage === "revenue"
      ? `${signal.label} is already producing ${formatCount(signal.affiliateClicks, "affiliate click")} in the current window.`
      : stage === "referral"
        ? `${signal.label} is already getting shared, which makes it a strong candidate for more distribution.`
        : stage === "activation"
          ? `${signal.label} is turning pageviews into saves, ratings, or comments instead of empty browsing.`
          : `${signal.label} is already a top discovery surface, so it deserves more cluster support around it.`;

  return {
    title: `Double down on ${signal.label}`,
    targetPath: signal.path,
    stage,
    whyNow,
    moves: buildBriefMoves(signal, stage)
  };
}

function sortSignals(
  signals: GrowthLoopPageSignal[],
  metric: (signal: GrowthLoopPageSignal) => number
) {
  return [...signals]
    .sort((left, right) => {
      const delta = metric(right) - metric(left);
      if (delta !== 0) return delta;
      return right.views - left.views;
    })
    .filter((signal) => metric(signal) > 0);
}

export function getGrowthLoopContentTypeFromPath(path: string): GrowthLoopContentType | null {
  if (path.startsWith("/recipes/")) return "recipe";
  if (path.startsWith("/blog/")) return "blog_post";
  if (path.startsWith("/reviews/")) return "review";
  return null;
}

export function buildGrowthLoopReport(input: {
  windowDays?: number;
  trafficPages: GrowthLoopTrafficPage[];
  contentPages: GrowthLoopContentPage[];
  sharePages: GrowthLoopShareContent[];
  shareLandingPages: GrowthLoopShareLandingPage[];
  affiliatePages: GrowthLoopAffiliateSourcePage[];
}) {
  const pageSignals = new Map<string, GrowthLoopPageSignal>();

  const upsertSignal = (
    path: string,
    updates: Partial<GrowthLoopPageSignal> & Pick<GrowthLoopPageSignal, "path">
  ) => {
    const current = pageSignals.get(path) ?? {
      label: updates.label ?? formatPathLabel(path),
      path,
      section: updates.section ?? getSectionFromPath(path),
      views: 0,
      interactions: 0,
      shares: 0,
      affiliateClicks: 0,
      source: updates.source
    };

    const next = {
      ...current,
      ...updates,
      label: updates.label || current.label,
      section: updates.section || current.section,
      views: updates.views ?? current.views,
      interactions: updates.interactions ?? current.interactions,
      shares: updates.shares ?? current.shares,
      affiliateClicks: updates.affiliateClicks ?? current.affiliateClicks
    };

    pageSignals.set(path, next);
  };

  input.trafficPages.forEach((page) => {
    upsertSignal(page.path, {
      path: page.path,
      label: page.label,
      section: page.section,
      views: page.views
    });
  });

  input.contentPages.forEach((page) => {
    const existing = pageSignals.get(page.path);
    upsertSignal(page.path, {
      path: page.path,
      label: page.label,
      section: existing?.section ?? getSectionFromPath(page.path),
      views: Math.max(existing?.views ?? 0, page.views),
      interactions: page.interactions,
      source: page.source
    });
  });

  input.sharePages.forEach((page) => {
    const existing = pageSignals.get(page.path);
    upsertSignal(page.path, {
      path: page.path,
      label: existing?.label ?? page.label,
      section: existing?.section ?? getSectionFromPath(page.path),
      shares: page.shares
    });
  });

  input.shareLandingPages.forEach((page) => {
    const existing = pageSignals.get(page.path);
    upsertSignal(page.path, {
      path: page.path,
      label: existing?.label ?? formatPathLabel(page.path),
      section: existing?.section ?? getSectionFromPath(page.path),
      shares: Math.max(existing?.shares ?? 0, page.count)
    });
  });

  input.affiliatePages.forEach((page) => {
    const existing = pageSignals.get(page.path);
    upsertSignal(page.path, {
      path: page.path,
      label: existing?.label ?? formatPathLabel(page.path),
      section: existing?.section ?? getSectionFromPath(page.path),
      affiliateClicks: page.clicks
    });
  });

  const signals = Array.from(pageSignals.values());

  const acquisitionSignals = sortSignals(signals, (signal) => signal.views).slice(0, 4);
  const activationSignals = sortSignals(signals, (signal) => signal.interactions).slice(0, 4);
  const referralSignals = sortSignals(signals, (signal) => signal.shares).slice(0, 4);
  const revenueSignals = sortSignals(signals, (signal) => signal.affiliateClicks).slice(0, 4);

  const topUniqueBriefSignals = [
    ...revenueSignals.map((signal) => ({ signal, stage: "revenue" as const })),
    ...referralSignals.map((signal) => ({ signal, stage: "referral" as const })),
    ...activationSignals.map((signal) => ({ signal, stage: "activation" as const })),
    ...acquisitionSignals.map((signal) => ({ signal, stage: "acquisition" as const }))
  ].filter(
    (entry, index, all) =>
      all.findIndex((candidate) => candidate.signal.path === entry.signal.path) === index
  );

  const promotionCandidates = signals
    .map((signal) => {
      const contentType = getGrowthLoopContentTypeFromPath(signal.path);
      if (!contentType) return null;

      const score =
        signal.affiliateClicks * 20 +
        signal.shares * 5 +
        signal.interactions * 3 +
        signal.views;

      return {
        label: signal.label,
        path: signal.path,
        section: signal.section,
        contentType,
        score,
        reason: describePromotionReason(signal),
        views: signal.views,
        interactions: signal.interactions,
        shares: signal.shares,
        affiliateClicks: signal.affiliateClicks
      } satisfies GrowthLoopPromotionCandidate;
    })
    .filter(
      (candidate): candidate is GrowthLoopPromotionCandidate =>
        Boolean(candidate && candidate.score > 0)
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  return {
    windowDays: input.windowDays ?? 30,
    totals: {
      trackedPages: signals.length,
      trafficPages: acquisitionSignals.length,
      sharePages: referralSignals.length,
      revenuePages: revenueSignals.length
    },
    winners: {
      acquisition: acquisitionSignals.map((signal) => ({
        ...signal,
        stage: "acquisition" as const,
        reason: describeWinner("acquisition", signal)
      })),
      activation: activationSignals.map((signal) => ({
        ...signal,
        stage: "activation" as const,
        reason: describeWinner("activation", signal)
      })),
      referral: referralSignals.map((signal) => ({
        ...signal,
        stage: "referral" as const,
        reason: describeWinner("referral", signal)
      })),
      revenue: revenueSignals.map((signal) => ({
        ...signal,
        stage: "revenue" as const,
        reason: describeWinner("revenue", signal)
      }))
    },
    briefs: topUniqueBriefSignals.slice(0, 5).map(({ signal, stage }) => createBrief(signal, stage)),
    autoPromotionCandidates: promotionCandidates
  } satisfies GrowthLoopReport;
}
