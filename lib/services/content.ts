import {
  sampleBlogPosts,
  sampleComments,
  sampleCompetitions,
  sampleCommunityPosts,
  sampleFollows,
  sampleMerchProducts,
  sampleProfiles,
  sampleRecipeRatings,
  sampleRecipes,
  sampleRecipeSaves,
  sampleReviews
} from "@/lib/sample-data";
import { flags } from "@/lib/env";
import { getRecipeHeroFields } from "@/lib/recipe-hero";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  BlogPost,
  Competition,
  CompetitionEntry,
  ContentComment,
  CommunityPost,
  CommunityRecipe,
  MerchProduct,
  Profile,
  Recipe,
  Review
} from "@/lib/types";
import { slugify } from "@/lib/utils";

function sortPublished<T extends { publishedAt?: string }>(items: T[]) {
  return [...items].sort((left, right) =>
    (right.publishedAt || "").localeCompare(left.publishedAt || "")
  );
}

function sortMerch(items: MerchProduct[]) {
  return [...items].sort((left, right) => {
    if (left.featured !== right.featured) {
      return left.featured ? -1 : 1;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return (right.createdAt || "").localeCompare(left.createdAt || "");
  });
}

function mapProfileRow(row: any): Profile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    websiteUrl: row.website_url ?? undefined,
    heatScore: row.heat_score ?? 0,
    role: row.role,
    isBanned: row.is_banned ?? false
  };
}

function mapBlogRow(row: any): BlogPost {
  return {
    id: row.id,
    type: "blog",
    slug: row.slug,
    title: row.title,
    description: row.description,
    content: row.content,
    authorName: row.author_name,
    category: row.category,
    tags: row.tags ?? [],
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    featured: row.featured ?? false,
    source: row.source,
    status: row.status,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    cuisineType: row.cuisine_type ?? undefined,
    heatLevel: row.heat_level ?? undefined,
    scovilleRating: row.scoville_rating ?? undefined,
    readTimeMinutes: row.read_time_minutes ?? undefined,
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0,
    publishedAt: row.published_at ?? undefined
  };
}

function mapRecipeRow(row: any): Recipe {
  const hero = getRecipeHeroFields({
    title: row.title,
    cuisineType: row.cuisine_type,
    heatLevel: row.heat_level,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined
  });

  return {
    id: row.id,
    type: "recipe",
    slug: row.slug,
    title: row.title,
    description: row.description,
    intro: row.intro ?? undefined,
    heroSummary: row.hero_summary ?? undefined,
    authorName: row.author_name,
    heatLevel: row.heat_level,
    cuisineType: row.cuisine_type,
    prepTimeMinutes: row.prep_time_minutes ?? 0,
    cookTimeMinutes: row.cook_time_minutes ?? 0,
    totalTimeMinutes: row.total_time_minutes ?? 0,
    activeTimeMinutes: row.active_time_minutes ?? undefined,
    servings: row.servings ?? 0,
    difficulty: row.difficulty ?? "beginner",
    ingredients: row.ingredients ?? [],
    ingredientSections: row.ingredient_sections ?? [],
    instructions: row.instructions ?? [],
    methodSteps: row.method_steps ?? [],
    tips: row.tips ?? [],
    variations: row.variations ?? [],
    makeAheadNotes: row.make_ahead_notes ?? undefined,
    storageNotes: row.storage_notes ?? undefined,
    reheatNotes: row.reheat_notes ?? undefined,
    servingSuggestions: row.serving_suggestions ?? [],
    substitutions: row.substitutions ?? [],
    faqs: row.faqs ?? [],
    equipment: row.equipment ?? [],
    tags: row.tags ?? [],
    imageUrl: hero.imageUrl,
    imageAlt: hero.imageAlt,
    heroImageReviewed: Boolean(row.hero_image_reviewed) || hero.usesGeneratedHeroCard,
    cuisineQaReviewed: row.cuisine_qa_reviewed ?? undefined,
    qaNotes: row.qa_notes ?? undefined,
    qaReport: row.qa_report ?? undefined,
    featured: row.featured ?? false,
    source: row.source,
    status: row.status,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0,
    saveCount: row.save_count ?? 0,
    ratingAvg: Number(row.rating_avg ?? 0) || undefined,
    ratingCount: row.rating_count ?? 0,
    publishedAt: row.published_at ?? undefined
  };
}

function mapReviewRow(row: any): Review {
  return {
    id: row.id,
    type: "review",
    slug: row.slug,
    title: row.title,
    description: row.description,
    productName: row.product_name,
    brand: row.brand,
    rating: Number(row.rating),
    priceUsd: Number(row.price_usd ?? 0) || undefined,
    affiliateUrl: row.affiliate_url,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    source: row.source,
    status: row.status,
    publishedAt: row.published_at ?? undefined,
    tags: row.tags ?? [],
    viewCount: row.view_count ?? 0,
    likeCount: row.like_count ?? 0,
    content: row.content,
    heatLevel: row.heat_level ?? undefined,
    scovilleMin: row.scoville_min ?? undefined,
    scovilleMax: row.scoville_max ?? undefined,
    flavorNotes: row.flavor_notes ?? [],
    cuisineOrigin: row.cuisine_origin ?? undefined,
    category: row.category,
    pros: row.pros ?? [],
    cons: row.cons ?? [],
    imageReviewed: row.image_reviewed ?? undefined,
    factQaReviewed: row.fact_qa_reviewed ?? undefined,
    qaNotes: row.qa_notes ?? undefined,
    qaReport: row.qa_report ?? undefined,
    recommended: row.recommended ?? false,
    featured: row.featured ?? false
  };
}

function mapMerchRow(row: any): MerchProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    badge: row.badge,
    description: row.description,
    priceLabel: row.price_label,
    availability: row.availability,
    themeKey: row.theme_key,
    href: row.href,
    ctaLabel: row.cta_label,
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    featured: row.featured ?? false,
    status: row.status,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined
  };
}

function mapCommunityRecipeRow(row: any): CommunityRecipe {
  return {
    id: row.id,
    communityPostId: row.community_post_id,
    title: row.title,
    description: row.description,
    heatLevel: row.heat_level,
    cuisineType: row.cuisine_type,
    prepTimeMinutes: row.prep_time_minutes ?? undefined,
    cookTimeMinutes: row.cook_time_minutes ?? undefined,
    servings: row.servings ?? undefined,
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    tips: row.tips ?? [],
    status: row.status,
    createdAt: row.created_at
  };
}

function mapCommunityRow(
  row: any,
  profiles: Map<string, Profile>,
  recipesByPostId?: Map<number, CommunityRecipe>
): CommunityPost {
  return {
    id: row.id,
    slug: slugify(`${row.title || row.caption.slice(0, 40)}-${row.id}`),
    type: row.type,
    title: row.title ?? undefined,
    caption: row.caption,
    mediaUrl: row.media_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    tags: row.tags ?? [],
    heatLevel: row.heat_level ?? undefined,
    cuisineType: row.cuisine_type ?? undefined,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    viewCount: row.view_count ?? 0,
    isPinned: row.is_pinned ?? false,
    status: row.status,
    createdAt: row.created_at,
    user: profiles.get(row.user_id) ?? sampleProfiles[0],
    structuredRecipe: recipesByPostId?.get(row.id)
  };
}

function mapCompetitionEntryRow(
  row: any,
  profiles: Map<string, Profile>
): CompetitionEntry {
  return {
    id: row.id,
    competitionId: row.competition_id,
    user: profiles.get(row.user_id) ?? sampleProfiles[0],
    title: row.title ?? undefined,
    caption: row.caption,
    mediaUrl: row.media_url ?? undefined,
    voteCount: row.vote_count ?? 0,
    status: row.status,
    isWinner: row.is_winner ?? false,
    submittedAt: row.submitted_at
  };
}

function mapCompetitionRow(
  row: any,
  entries: CompetitionEntry[]
): Competition {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    theme: row.theme,
    rules: row.rules ?? undefined,
    prizeDescription: row.prize_description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    submissionType: row.submission_type,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    votingEndDate: row.voting_end_date ?? undefined,
    maxSubmissionsPerUser: row.max_submissions_per_user ?? 1,
    entries
  };
}

function mapCommentRow(
  row: any,
  profiles: Map<string, Profile>
): ContentComment {
  return {
    id: row.id,
    user: profiles.get(row.user_id) ?? sampleProfiles[0],
    contentType: row.content_type,
    contentId: row.content_id,
    parentId: row.parent_id ?? undefined,
    body: row.body,
    isFlagged: row.is_flagged ?? false,
    isApproved: row.is_approved ?? true,
    createdAt: row.created_at
  };
}

async function getProfileMap(userIds: string[]) {
  const supabase = createSupabaseAdminClient();
  if (!supabase || !userIds.length) {
    return new Map(sampleProfiles.map((profile) => [profile.id, profile]));
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", Array.from(new Set(userIds)));

  const profileMap = new Map(sampleProfiles.map((profile) => [profile.id, profile]));

  for (const profile of profiles ?? []) {
    profileMap.set(profile.id, mapProfileRow(profile));
  }

  return profileMap;
}

export async function getBlogPosts() {
  if (!flags.hasSupabaseAdmin) return sortPublished(sampleBlogPosts);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return sortPublished(sampleBlogPosts);

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!data?.length) return sortPublished(sampleBlogPosts);

  return data.map(mapBlogRow);
}

export async function getBlogPost(slug: string) {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getAdminBlogPosts() {
  if (!flags.hasSupabaseAdmin) return sortPublished(sampleBlogPosts);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return sortPublished(sampleBlogPosts);

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (!data?.length) return sortPublished(sampleBlogPosts);

  return data.map(mapBlogRow);
}

export async function getAdminBlogPostById(id: number) {
  if (!flags.hasSupabaseAdmin) {
    return sampleBlogPosts.find((post) => post.id === id) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleBlogPosts.find((post) => post.id === id) ?? null;
  }

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return sampleBlogPosts.find((post) => post.id === id) ?? null;
  }

  return mapBlogRow(data);
}

export async function getRecipes() {
  if (!flags.hasSupabaseAdmin) return sortPublished(sampleRecipes);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return sortPublished(sampleRecipes);

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!data?.length) return sortPublished(sampleRecipes);

  return data.map(mapRecipeRow);
}

export async function getRecipe(slug: string) {
  const recipes = await getRecipes();
  return recipes.find((recipe) => recipe.slug === slug) ?? null;
}

export async function getAdminRecipes() {
  if (!flags.hasSupabaseAdmin) return sortPublished(sampleRecipes);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return sortPublished(sampleRecipes);

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (!data?.length) return sortPublished(sampleRecipes);

  return data.map(mapRecipeRow);
}

export async function getAdminRecipeById(id: number) {
  if (!flags.hasSupabaseAdmin) {
    return sampleRecipes.find((recipe) => recipe.id === id) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleRecipes.find((recipe) => recipe.id === id) ?? null;
  }

  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return sampleRecipes.find((recipe) => recipe.id === id) ?? null;
  }

  return mapRecipeRow(data);
}

export async function getReviews() {
  if (!flags.hasSupabaseAdmin) return sortPublished(sampleReviews);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return sortPublished(sampleReviews);

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (!data?.length) return sortPublished(sampleReviews);

  return data.map(mapReviewRow);
}

export async function getReview(slug: string) {
  const reviews = await getReviews();
  return reviews.find((review) => review.slug === slug) ?? null;
}

export async function getAdminReviews() {
  if (!flags.hasSupabaseAdmin) return sortPublished(sampleReviews);

  const supabase = createSupabaseAdminClient();
  if (!supabase) return sortPublished(sampleReviews);

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (!data?.length) return sortPublished(sampleReviews);

  return data.map(mapReviewRow);
}

export async function getAdminReviewById(id: number) {
  if (!flags.hasSupabaseAdmin) {
    return sampleReviews.find((review) => review.id === id) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleReviews.find((review) => review.id === id) ?? null;
  }

  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return sampleReviews.find((review) => review.id === id) ?? null;
  }

  return mapReviewRow(data);
}

export async function getMerchProducts() {
  if (!flags.hasSupabaseAdmin) {
    return sortMerch(
      sampleMerchProducts.filter((product) => product.status === "published")
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sortMerch(
      sampleMerchProducts.filter((product) => product.status === "published")
    );
  }

  const { data } = await supabase
    .from("merch_products")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!data?.length) {
    return sortMerch(
      sampleMerchProducts.filter((product) => product.status === "published")
    );
  }

  return data.map(mapMerchRow);
}

export async function getFeaturedMerchProducts(limit = 3) {
  const products = await getMerchProducts();
  return products.filter((product) => product.featured).slice(0, limit);
}

export async function getAdminMerchProducts() {
  if (!flags.hasSupabaseAdmin) {
    return sortMerch(sampleMerchProducts);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sortMerch(sampleMerchProducts);
  }

  const { data } = await supabase
    .from("merch_products")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (!data?.length) {
    return sortMerch(sampleMerchProducts);
  }

  return data.map(mapMerchRow);
}

export async function getAdminMerchProductById(id: number) {
  if (!flags.hasSupabaseAdmin) {
    return sampleMerchProducts.find((product) => product.id === id) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleMerchProducts.find((product) => product.id === id) ?? null;
  }

  const { data } = await supabase
    .from("merch_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    return sampleMerchProducts.find((product) => product.id === id) ?? null;
  }

  return mapMerchRow(data);
}

export async function getCommunityPosts() {
  if (!flags.hasSupabaseAdmin) {
    return sampleCommunityPosts.filter((post) => post.status === "published");
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleCommunityPosts.filter((post) => post.status === "published");
  }

  const { data: posts } = await supabase
    .from("community_posts")
    .select("*")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (!posts?.length) {
    return sampleCommunityPosts.filter((post) => post.status === "published");
  }

  const recipePostIds = posts
    .filter((post) => post.type === "recipe")
    .map((post) => post.id);
  const { data: communityRecipes } = recipePostIds.length
    ? await supabase
        .from("community_recipes")
        .select("*")
        .in("community_post_id", recipePostIds)
    : { data: [] as any[] };

  const userIds = Array.from(new Set(posts.map((post) => post.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [profile.id, mapProfileRow(profile)])
  );
  const recipesByPostId = new Map(
    (communityRecipes ?? []).map((recipe) => [
      recipe.community_post_id,
      mapCommunityRecipeRow(recipe)
    ])
  );

  return posts.map((row) => mapCommunityRow(row, profileMap, recipesByPostId));
}

export async function getAdminCommunityPosts(status?: string) {
  if (!flags.hasSupabaseAdmin) {
    return sampleCommunityPosts.filter((post) =>
      status ? post.status === status : true
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleCommunityPosts.filter((post) =>
      status ? post.status === status : true
    );
  }

  let query = supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: posts } = await query;

  if (!posts?.length) {
    return sampleCommunityPosts.filter((post) =>
      status ? post.status === status : true
    );
  }

  const recipePostIds = posts
    .filter((post) => post.type === "recipe")
    .map((post) => post.id);
  const { data: communityRecipes } = recipePostIds.length
    ? await supabase
        .from("community_recipes")
        .select("*")
        .in("community_post_id", recipePostIds)
    : { data: [] as any[] };

  const profileMap = await getProfileMap(posts.map((post) => post.user_id));
  const recipesByPostId = new Map(
    (communityRecipes ?? []).map((recipe) => [
      recipe.community_post_id,
      mapCommunityRecipeRow(recipe)
    ])
  );

  return posts.map((row) => mapCommunityRow(row, profileMap, recipesByPostId));
}

export async function getLeaderboard() {
  if (!flags.hasSupabaseAdmin) {
    return [...sampleProfiles].sort((left, right) => right.heatScore - left.heatScore);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [...sampleProfiles].sort((left, right) => right.heatScore - left.heatScore);
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_banned", false)
    .order("heat_score", { ascending: false })
    .limit(100);

  if (!data?.length) {
    return [...sampleProfiles].sort((left, right) => right.heatScore - left.heatScore);
  }

  return data.map(mapProfileRow);
}

export async function getAdminUsers() {
  if (!flags.hasSupabaseAdmin) {
    return [...sampleProfiles].sort((left, right) => right.heatScore - left.heatScore);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [...sampleProfiles].sort((left, right) => right.heatScore - left.heatScore);
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (!data?.length) {
    return [...sampleProfiles].sort((left, right) => right.heatScore - left.heatScore);
  }

  const counts = await Promise.all(
    data.map(async (row) => {
      const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", row.id),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", row.id)
      ]);

      return {
        id: row.id,
        followerCount: followerCount ?? 0,
        followingCount: followingCount ?? 0
      };
    })
  );

  const countMap = new Map(
    counts.map((entry) => [entry.id, entry])
  );

  return data.map((row) => ({
    ...mapProfileRow(row),
    followerCount: countMap.get(row.id)?.followerCount ?? 0,
    followingCount: countMap.get(row.id)?.followingCount ?? 0
  }));
}

export async function getProfile(username: string): Promise<Profile | null> {
  if (!flags.hasSupabaseAdmin) {
    return sampleProfiles.find((profile) => profile.username === username) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleProfiles.find((profile) => profile.username === username) ?? null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!data) {
    return sampleProfiles.find((profile) => profile.username === username) ?? null;
  }
  const profile = mapProfileRow(data);

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id)
  ]);

  return {
    ...profile,
    followerCount: followerCount ?? 0,
    followingCount: followingCount ?? 0
  };
}

export async function getCompetitions() {
  if (!flags.hasSupabaseAdmin) {
    return sampleCompetitions as Competition[];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleCompetitions as Competition[];
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .order("start_date", { ascending: false });

  if (!competitions?.length) {
    return sampleCompetitions as Competition[];
  }

  const competitionIds = competitions.map((competition) => competition.id);
  const { data: entries } = await supabase
    .from("competition_entries")
    .select("*")
    .in("competition_id", competitionIds)
    .eq("status", "published")
    .order("vote_count", { ascending: false });

  const profileMap = await getProfileMap(
    (entries ?? []).map((entry) => entry.user_id)
  );

  const entriesByCompetition = new Map<number, CompetitionEntry[]>();
  for (const entry of entries ?? []) {
    const mapped = mapCompetitionEntryRow(entry, profileMap);
    const group = entriesByCompetition.get(entry.competition_id) ?? [];
    group.push(mapped);
    entriesByCompetition.set(entry.competition_id, group);
  }

  return competitions.map((competition) =>
    mapCompetitionRow(
      competition,
      entriesByCompetition.get(competition.id) ?? []
    )
  );
}

export async function getCompetition(slug: string) {
  if (!flags.hasSupabaseAdmin) {
    return sampleCompetitions.find((competition) => competition.slug === slug) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleCompetitions.find((competition) => competition.slug === slug) ?? null;
  }

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!competition) {
    return sampleCompetitions.find((entry) => entry.slug === slug) ?? null;
  }

  const { data: entries } = await supabase
    .from("competition_entries")
    .select("*")
    .eq("competition_id", competition.id)
    .eq("status", "published")
    .order("vote_count", { ascending: false });

  const profileMap = await getProfileMap(
    (entries ?? []).map((entry) => entry.user_id)
  );

  return mapCompetitionRow(
    competition,
    (entries ?? []).map((entry) => mapCompetitionEntryRow(entry, profileMap))
  );
}

export async function getAdminCompetitions() {
  if (!flags.hasSupabaseAdmin) {
    return sampleCompetitions as Competition[];
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleCompetitions as Competition[];
  }

  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .order("start_date", { ascending: false });

  if (!competitions?.length) {
    return sampleCompetitions as Competition[];
  }

  const competitionIds = competitions.map((competition) => competition.id);
  const { data: entries } = await supabase
    .from("competition_entries")
    .select("*")
    .in("competition_id", competitionIds)
    .order("submitted_at", { ascending: false });

  const profileMap = await getProfileMap(
    (entries ?? []).map((entry) => entry.user_id)
  );

  const entriesByCompetition = new Map<number, CompetitionEntry[]>();
  for (const entry of entries ?? []) {
    const mapped = mapCompetitionEntryRow(entry, profileMap);
    const group = entriesByCompetition.get(entry.competition_id) ?? [];
    group.push(mapped);
    entriesByCompetition.set(entry.competition_id, group);
  }

  return competitions.map((competition) =>
    mapCompetitionRow(
      competition,
      entriesByCompetition.get(competition.id) ?? []
    )
  );
}

export async function getAdminCompetitionById(id: number) {
  const competitions = await getAdminCompetitions();
  return competitions.find((competition) => competition.id === id) ?? null;
}

export async function getCompetitionVoteIdsForUser(
  competitionId: number,
  userId?: string | null
) {
  if (!userId || !flags.hasSupabaseAdmin) {
    return new Set<number>();
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return new Set<number>();
  }

  const { data: entries } = await supabase
    .from("competition_entries")
    .select("id")
    .eq("competition_id", competitionId);

  const entryIds = (entries ?? []).map((entry) => entry.id);
  if (!entryIds.length) {
    return new Set<number>();
  }

  const { data: votes } = await supabase
    .from("competition_votes")
    .select("entry_id")
    .eq("user_id", userId)
    .in("entry_id", entryIds);

  return new Set((votes ?? []).map((vote) => vote.entry_id));
}

export async function getFeaturedCollection() {
  const [recipes, posts, reviews] = await Promise.all([
    getRecipes(),
    getBlogPosts(),
    getReviews()
  ]);

  return {
    recipes: recipes.filter((item) => item.featured).slice(0, 6),
    blogPosts: posts.filter((item) => item.featured).slice(0, 2),
    reviews: reviews.filter((item) => item.featured).slice(0, 4)
  };
}

export async function getCommentsForContent(
  contentType: string,
  contentId: number
): Promise<ContentComment[]> {
  if (!flags.hasSupabaseAdmin) {
    return sampleComments.filter(
      (comment) =>
        comment.contentType === contentType &&
        comment.contentId === contentId &&
        comment.isApproved
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleComments.filter(
      (comment) =>
        comment.contentType === contentType &&
        comment.contentId === contentId &&
        comment.isApproved
    );
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (!comments?.length) {
    return sampleComments.filter(
      (comment) =>
        comment.contentType === contentType &&
        comment.contentId === contentId &&
        comment.isApproved
    );
  }

  const profileMap = await getProfileMap(comments.map((comment) => comment.user_id));
  return comments.map((comment) => mapCommentRow(comment, profileMap));
}

export async function getAdminComments(): Promise<ContentComment[]> {
  if (!flags.hasSupabaseAdmin) {
    return sampleComments;
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleComments;
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .order("is_flagged", { ascending: false })
    .order("created_at", { ascending: false });

  if (!comments?.length) {
    return sampleComments;
  }

  const profileMap = await getProfileMap(comments.map((comment) => comment.user_id));
  return comments.map((comment) => mapCommentRow(comment, profileMap));
}

export async function getRecipeUserState(recipeId: number, userId?: string | null) {
  if (!userId) {
    return { saved: false, rating: undefined as number | undefined };
  }

  if (!flags.hasSupabaseAdmin) {
    const saved = sampleRecipeSaves.some(
      (save) => save.userId === userId && save.recipeId === recipeId
    );
    const rating = sampleRecipeRatings.find(
      (entry) => entry.userId === userId && entry.recipeId === recipeId
    )?.rating;
    return { saved, rating };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    const saved = sampleRecipeSaves.some(
      (save) => save.userId === userId && save.recipeId === recipeId
    );
    const rating = sampleRecipeRatings.find(
      (entry) => entry.userId === userId && entry.recipeId === recipeId
    )?.rating;
    return { saved, rating };
  }

  const [{ data: save }, { data: rating }] = await Promise.all([
    supabase
      .from("recipe_saves")
      .select("recipe_id")
      .eq("user_id", userId)
      .eq("recipe_id", recipeId)
      .maybeSingle(),
    supabase
      .from("recipe_ratings")
      .select("rating")
      .eq("user_id", userId)
      .eq("recipe_id", recipeId)
      .maybeSingle()
  ]);

  return {
    saved: Boolean(save),
    rating: rating?.rating ? Number(rating.rating) : undefined
  };
}

export async function getFollowState(targetUserId: string, viewerUserId?: string | null) {
  if (!viewerUserId || viewerUserId === targetUserId) {
    return false;
  }

  if (!flags.hasSupabaseAdmin) {
    return sampleFollows.some(
      (follow) =>
        follow.followerId === viewerUserId && follow.followingId === targetUserId
    );
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return sampleFollows.some(
      (follow) =>
        follow.followerId === viewerUserId && follow.followingId === targetUserId
    );
  }

  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", viewerUserId)
    .eq("following_id", targetUserId)
    .maybeSingle();

  return Boolean(data);
}
