import { createClient } from "@supabase/supabase-js";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flamingfoodies.com";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase admin env vars.");
  process.exit(1);
}

function formatLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildRecipeHeroImageUrl({ title, cuisineType, heatLevel }) {
  const params = new URLSearchParams({
    title,
    eyebrow: cuisineType ? `${formatLabel(cuisineType)} Recipe` : "FlamingFoodies Recipe",
    subtitle: heatLevel ? `${formatLabel(heatLevel)} heat` : "Flavor-first spicy cooking"
  });

  return new URL(`/api/og?${params.toString()}`, siteUrl).toString();
}

function buildRecipeHeroImageAlt(title) {
  return `FlamingFoodies recipe card for ${title}`;
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase
  .from("recipes")
  .select("id, title, cuisine_type, heat_level, image_url, image_alt, hero_image_reviewed, status");

if (error) {
  console.error(error.message);
  process.exit(1);
}

const rowsToUpdate = (data || []).filter(
  (row) => !row.image_url || !String(row.image_url).trim() || !row.image_alt || !String(row.image_alt).trim()
);

if (!rowsToUpdate.length) {
  console.log("All recipes already have hero image fields.");
  process.exit(0);
}

for (const row of rowsToUpdate) {
  const imageUrl =
    row.image_url && String(row.image_url).trim()
      ? row.image_url
      : buildRecipeHeroImageUrl({
          title: row.title,
          cuisineType: row.cuisine_type,
          heatLevel: row.heat_level
        });
  const imageAlt =
    row.image_alt && String(row.image_alt).trim()
      ? row.image_alt
      : buildRecipeHeroImageAlt(row.title);

  const { error: updateError } = await supabase
    .from("recipes")
    .update({
      image_url: imageUrl,
      image_alt: imageAlt,
      hero_image_reviewed: row.hero_image_reviewed || imageUrl.includes("/api/og?")
    })
    .eq("id", row.id);

  if (updateError) {
    console.error(`Failed updating recipe ${row.id}: ${updateError.message}`);
    process.exit(1);
  }
}

console.log(`Updated ${rowsToUpdate.length} recipe hero image record(s).`);
