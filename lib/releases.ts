export type ReleaseType =
  | "new-product"
  | "limited-edition"
  | "collab"
  | "restock"
  | "brand-news";

export interface Release {
  slug: string;
  title: string;
  brand: string;
  type: ReleaseType;
  publishedAt: string; // ISO date string
  description: string;
  body: string;
  affiliateKey?: string;
  sourceUrl?: string;
  featured: boolean;
}

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  "new-product":    "New Product",
  "limited-edition":"Limited Edition",
  "collab":         "Collaboration",
  "restock":        "Restock",
  "brand-news":     "Brand News"
};

// No static seed data — releases are entirely agent-driven
// The pages fall back to an empty state with clear messaging

// ---------------------------------------------------------------------------
// DB layer
// ---------------------------------------------------------------------------

type ReleaseRow = {
  slug: string; title: string; brand: string; type: string;
  published_at: string; description: string; body: string;
  affiliate_key: string | null; source_url: string | null; featured: boolean;
};

function rowToRelease(row: ReleaseRow): Release {
  return {
    slug: row.slug, title: row.title, brand: row.brand,
    type: row.type as ReleaseType,
    publishedAt: row.published_at,
    description: row.description, body: row.body,
    affiliateKey: row.affiliate_key ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    featured: row.featured
  };
}

export async function getReleasesFromDb(limit = 30): Promise<Release[]> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("releases")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as ReleaseRow[]).map(rowToRelease);
  } catch { return []; }
}

export async function getReleaseFromDb(slug: string): Promise<Release | undefined> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return undefined;
    const { data, error } = await supabase
      .from("releases").select("*").eq("slug", slug).eq("status", "published").single();
    if (error || !data) return undefined;
    return rowToRelease(data as ReleaseRow);
  } catch { return undefined; }
}
