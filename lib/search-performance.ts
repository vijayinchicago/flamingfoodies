export type SearchMetricRow = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchQueryRow = SearchMetricRow & {
  query: string;
};

export type SearchPageRow = SearchMetricRow & {
  page: string;
};

export type SearchDimensionRow = SearchMetricRow & {
  label: string;
};

export type SearchPerformanceSnapshot = {
  filters: Record<string, string>;
  queries: SearchQueryRow[];
  pages: SearchPageRow[];
  devices: SearchDimensionRow[];
  countries: SearchDimensionRow[];
  searchAppearance: SearchDimensionRow[];
};

export type SearchRecommendationPriority = "high" | "medium";
export type SearchRecommendationAction =
  | "retune_existing_page"
  | "add_supporting_page"
  | "verify_technical";

export type SearchRecommendation = {
  id: string;
  title: string;
  priority: SearchRecommendationPriority;
  action: SearchRecommendationAction;
  targetPath?: string;
  relatedPaths?: string[];
  summary: string;
  suggestedTitle?: string;
  suggestedChanges: string[];
  supportingQueries: string[];
  totalImpressions: number;
  avgPosition?: number;
};

type SearchExportInput = {
  queriesCsv: string;
  pagesCsv: string;
  filtersCsv?: string;
  devicesCsv?: string;
  countriesCsv?: string;
  searchAppearanceCsv?: string;
};

function parseNumber(value: string | undefined) {
  if (!value) return 0;
  const normalized = value.replace(/[%,$\s]/g, "").replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];

    if (character === '"') {
      if (inQuotes && csv[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && csv[index + 1] === "\n") {
        index += 1;
      }

      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function parseRecords(csv?: string) {
  if (!csv?.trim()) return [];

  const rows = parseCsv(csv);
  if (!rows.length) return [];

  const [headers, ...records] = rows;
  return records.map((values) =>
    headers.reduce<Record<string, string>>((result, header, index) => {
      result[header] = values[index] ?? "";
      return result;
    }, {})
  );
}

function parseMetricRecord(record: Record<string, string>) {
  return {
    clicks: parseNumber(record.Clicks),
    impressions: parseNumber(record.Impressions),
    ctr: parseNumber(record.CTR),
    position: parseNumber(record.Position)
  };
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function weightedAveragePosition(rows: SearchMetricRow[]) {
  const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  if (!totalImpressions) return undefined;

  return rows.reduce((sum, row) => sum + row.position * row.impressions, 0) / totalImpressions;
}

function buildQueryCluster(
  queries: SearchQueryRow[],
  matcher: (row: SearchQueryRow) => boolean
) {
  const matches = queries.filter(matcher);

  return {
    matches,
    totalImpressions: matches.reduce((sum, row) => sum + row.impressions, 0),
    avgPosition: weightedAveragePosition(matches),
    supportingQueries: matches
      .slice()
      .sort((left, right) => right.impressions - left.impressions || left.position - right.position)
      .map((row) => row.query)
  };
}

function extractPathname(page: string) {
  try {
    const url = new URL(page);
    const pathname = url.pathname.replace(/\/+$/, "");
    return pathname || "/";
  } catch {
    return undefined;
  }
}

function detectHostSplit(pages: SearchPageRow[]) {
  const grouped = new Map<
    string,
    {
      hosts: Set<string>;
      impressions: number;
    }
  >();

  for (const row of pages) {
    try {
      const url = new URL(row.page);
      const pathname = (url.pathname.replace(/\/+$/, "") || "/").toLowerCase();
      const current = grouped.get(pathname) ?? { hosts: new Set<string>(), impressions: 0 };
      current.hosts.add(url.hostname.toLowerCase());
      current.impressions += row.impressions;
      grouped.set(pathname, current);
    } catch {
      continue;
    }
  }

  return [...grouped.entries()]
    .filter(([, value]) => value.hosts.has("flamingfoodies.com") && value.hosts.has("www.flamingfoodies.com"))
    .map(([pathname, value]) => ({
      pathname,
      impressions: value.impressions
    }));
}

export function parseSearchPerformanceExport(input: SearchExportInput): SearchPerformanceSnapshot {
  const filters = Object.fromEntries(
    parseRecords(input.filtersCsv).map((record) => [record.Filter, record.Value])
  );

  const queries = parseRecords(input.queriesCsv).map((record) => ({
    query: record["Top queries"] || record.Query || "",
    ...parseMetricRecord(record)
  }));

  const pages = parseRecords(input.pagesCsv).map((record) => ({
    page: record["Top pages"] || record.Page || "",
    ...parseMetricRecord(record)
  }));

  const devices = parseRecords(input.devicesCsv).map((record) => ({
    label: record.Device || "",
    ...parseMetricRecord(record)
  }));

  const countries = parseRecords(input.countriesCsv).map((record) => ({
    label: record.Country || "",
    ...parseMetricRecord(record)
  }));

  const searchAppearance = parseRecords(input.searchAppearanceCsv).map((record) => ({
    label: record["Search Appearance"] || "",
    ...parseMetricRecord(record)
  }));

  return {
    filters,
    queries,
    pages,
    devices,
    countries,
    searchAppearance
  };
}

export function buildSearchRecommendations(snapshot: SearchPerformanceSnapshot): SearchRecommendation[] {
  const seafoodCluster = buildQueryCluster(snapshot.queries, (row) => {
    const query = normalizeQuery(row.query);
    return query.includes("seafood") || query.includes("fish") || query.includes("ceviche");
  });

  const nashvilleCluster = buildQueryCluster(snapshot.queries, (row) => {
    const query = normalizeQuery(row.query);
    return query.includes("nashville") || query.includes("hot chicken sandwich");
  });

  const wingsCluster = buildQueryCluster(snapshot.queries, (row) => {
    const query = normalizeQuery(row.query);
    return query.includes("wings") || query.includes("fried chicken");
  });

  const friedChickenSupportCluster = buildQueryCluster(snapshot.queries, (row) =>
    normalizeQuery(row.query).includes("fried chicken")
  );

  const recommendations: SearchRecommendation[] = [];

  if (seafoodCluster.totalImpressions > 0) {
    recommendations.push({
      id: "seafood-fish-cluster",
      title: "Expand seafood pages around fish and ceviche intent",
      priority: "high",
      action: "retune_existing_page",
      targetPath: "/hot-sauces/best-for-seafood",
      relatedPaths: ["/blog/how-to-choose-a-hot-sauce-for-seafood"],
      summary: `${seafoodCluster.totalImpressions} impressions are already clustering around seafood, fish, and ceviche searches, and this cluster is the closest thing to page-one range.`,
      suggestedTitle: "Best Hot Sauces for Seafood and Fish | FlamingFoodies",
      suggestedChanges: [
        "Retune the seafood guide title, intro, and FAQ around fish, fish tacos, shrimp, and ceviche.",
        "Expand the seafood buying-guide blog so it explicitly answers fish and ceviche questions.",
        "Add internal links between the seafood guide and seafood blog to tighten the cluster."
      ],
      supportingQueries: seafoodCluster.supportingQueries,
      totalImpressions: seafoodCluster.totalImpressions,
      avgPosition: seafoodCluster.avgPosition
    });
  }

  if (nashvilleCluster.totalImpressions > 0) {
    recommendations.push({
      id: "nashville-hot-chicken-cluster",
      title: "Expand the Nashville sandwich recipe around sauce and how-to intent",
      priority: "high",
      action: "retune_existing_page",
      targetPath: "/recipes/nashville-hot-chicken-sandwiches",
      summary: `${nashvilleCluster.totalImpressions} impressions are clustering around Nashville hot chicken sandwich recipe and how-to searches, so the existing recipe page should answer sauce and method intent more directly.`,
      suggestedTitle: "Nashville Hot Chicken Sandwich Recipe | How to Make the Sauce",
      suggestedChanges: [
        "Retune the recipe SEO title and description around Nashville hot chicken sandwich and sauce intent.",
        "Add FAQ coverage for the Nashville oil, crispness, and how-to questions.",
        "Add visible editorial copy that explains the sauce method and what keeps the sandwich balanced."
      ],
      supportingQueries: nashvilleCluster.supportingQueries,
      totalImpressions: nashvilleCluster.totalImpressions,
      avgPosition: nashvilleCluster.avgPosition
    });
  }

  if (wingsCluster.totalImpressions > 0) {
    recommendations.push({
      id: "wings-fried-chicken-cluster",
      title: "Retune the wings page so fried chicken is first-class intent",
      priority: "high",
      action: "retune_existing_page",
      targetPath: "/hot-sauces/best-for-wings",
      summary: `${wingsCluster.totalImpressions} impressions are clustering around wings and fried-chicken buying intent, but the current wings page title underplays fried chicken.`,
      suggestedTitle: "Best Hot Sauces for Wings and Fried Chicken | FlamingFoodies",
      suggestedChanges: [
        "Add fried chicken language to the title, H1, intro, and FAQ.",
        "Make hot chicken sandwiches an explicit use case in the body copy.",
        "Cross-link to a dedicated fried-chicken page if the cluster keeps growing."
      ],
      supportingQueries: wingsCluster.supportingQueries,
      totalImpressions: wingsCluster.totalImpressions,
      avgPosition: wingsCluster.avgPosition
    });
  }

  if (friedChickenSupportCluster.totalImpressions >= 5) {
    recommendations.push({
      id: "fried-chicken-supporting-page",
      title: "Add a dedicated fried-chicken hot-sauce page",
      priority: "medium",
      action: "add_supporting_page",
      targetPath: "/hot-sauces/best-for-fried-chicken",
      relatedPaths: ["/hot-sauces/best-for-wings"],
      summary: `${friedChickenSupportCluster.totalImpressions} impressions are already showing for fried-chicken hot sauce intent, which is enough to justify a tighter supporting page.`,
      suggestedTitle: "Best Hot Sauces for Fried Chicken and Hot Sandwiches | FlamingFoodies",
      suggestedChanges: [
        "Create a dedicated fried-chicken page instead of treating fried chicken as a footnote on the wings page.",
        "Tie the page to Nashville hot chicken sandwiches, tenders, and crispy cutlets.",
        "Link the new page from the wings page and the main hot-sauce hub."
      ],
      supportingQueries: friedChickenSupportCluster.supportingQueries,
      totalImpressions: friedChickenSupportCluster.totalImpressions,
      avgPosition: friedChickenSupportCluster.avgPosition
    });
  }

  for (const split of detectHostSplit(snapshot.pages)) {
    recommendations.push({
      id: "canonical-host-split",
      title: "Verify the apex-domain redirect for duplicated hosts",
      priority: "medium",
      action: "verify_technical",
      targetPath: split.pathname,
      summary: `${split.impressions} impressions were split across both apex and www hosts for the same path, which is a technical cleanliness issue worth closing.`,
      suggestedChanges: [
        "Force www to 308-redirect to the apex domain.",
        "Keep canonical tags pinned to the apex host.",
        "Re-request indexing once the redirect is confirmed live."
      ],
      supportingQueries: snapshot.pages
        .filter((row) => extractPathname(row.page) === split.pathname)
        .map((row) => row.page),
      totalImpressions: split.impressions
    });
  }

  return recommendations.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority === "high" ? -1 : 1;
    }

    return right.totalImpressions - left.totalImpressions;
  });
}
