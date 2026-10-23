import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const REFERENCE_TABLES = ["peppers", "brands", "festivals", "tutorials", "releases"] as const;
type ReferenceTable = typeof REFERENCE_TABLES[number];
const columns: Record<ReferenceTable, string> = {
  tutorials: "id,slug,title,category,difficulty,time_estimate,description,intro,steps,pro_tips,affiliate_keys,recipe_tag_match,featured",
  releases: "id,slug,title,brand,type,published_at,description,body,affiliate_key,source_url,featured",
  peppers: "id,slug,name,aliases,origin,scoville_min,scoville_max,heat_tier,color,flavor_profile,description,editorial_note,culinary_uses,pairs_with,fun_fact,affiliate_keys,recipe_tag_match,featured,pinterest_image_url",
  brands: "id,slug,name,tagline,founded,origin,city,tier,description,editorial_note,why_it_matters,best_for,pepper_slug,featured,signature_products",
  festivals: "id,slug,name,short_name,city,state,state_code,region,month,date_range,start_day,end_day,annual,website,description,tagline,editorial_note,what_to_expect,best_for,pack_intro,pack_affiliate,cuisine_tags,tags,featured"
};

export function invalidatePublicReferences(table: ReferenceTable) {
  revalidateTag(`public:reference:${table}`);
}

const readers = Object.fromEntries(REFERENCE_TABLES.map(table => [table, unstable_cache(async (page: number) => {
  const client = createSupabaseAdminClient();
  if (!client) throw new Error("Public reference database unavailable");
  const { data, error } = await client.from(table).select(columns[table]).eq("status", "published")
    .order("id", { ascending: true }).range(page * 25, page * 25 + 24);
  if (error) throw new Error(`Cannot load public ${table}: ${error.message}`);
  const rows = data ?? [];
  if (Buffer.byteLength(JSON.stringify(rows), "utf8") > 750_000) throw new Error("Public reference cache page too large");
  return rows;
}, ["public-reference-v1", env.NEXT_PUBLIC_SUPABASE_URL ?? "unconfigured", table, columns[table]], {
  revalidate: 3600, tags: [`public:reference:${table}`]
})])) as Record<ReferenceTable, (page: number) => Promise<any[]>>;

export const getPublicReferenceRows = cache(async (table: ReferenceTable) => {
  const rows: any[] = [];
  for (let page = 0; ; page++) {
    const batch = await readers[table](page);
    rows.push(...batch);
    if (batch.length < 25) return rows;
  }
});
