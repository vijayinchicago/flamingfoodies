export type HeatLevel = "mild" | "medium" | "hot" | "inferno" | "reaper";
export type MerchAvailability = "preview" | "waitlist" | "live";
export type MerchThemeKey =
  | "flame"
  | "ember"
  | "gold"
  | "cream"
  | "smoke"
  | "charcoal";
export type CuisineType =
  | "american"
  | "mexican"
  | "thai"
  | "korean"
  | "indian"
  | "ethiopian"
  | "peruvian"
  | "jamaican"
  | "cajun"
  | "szechuan"
  | "vietnamese"
  | "west_african"
  | "middle_eastern"
  | "caribbean"
  | "moroccan"
  | "japanese"
  | "italian"
  | "chinese"
  | "other";
export type PostStatus = "draft" | "pending_review" | "published" | "archived";
export type ContentSource = "editorial" | "ai_generated" | "community";

export interface BaseContent {
  id: number;
  slug: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  featured?: boolean;
  source: ContentSource;
  status: PostStatus;
  publishedAt?: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
}

export interface BlogPost extends BaseContent {
  type: "blog";
  authorName: string;
  authorId?: string;
  category: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  cuisineType?: CuisineType;
  heatLevel?: HeatLevel;
  scovilleRating?: number;
  readTimeMinutes?: number;
}

export interface RecipeIngredient {
  amount: string;
  unit: string;
  item: string;
  notes?: string;
}

export interface RecipeIngredientSection {
  title: string;
  items: RecipeIngredient[];
}

export interface RecipeInstruction {
  step: number;
  text: string;
  tip?: string;
}

export interface RecipeMethodStep {
  step: number;
  title: string;
  body: string;
  tip?: string;
  cue?: string;
  durationMinutes?: number;
  ingredientRefs?: string[];
  imageUrl?: string;
  imageAlt?: string;
}

export interface RecipeFaq {
  question: string;
  answer: string;
}

export interface RecipeQaIssue {
  code: string;
  severity: "blocker" | "warning";
  message: string;
}

export interface RecipeQaReport {
  status: "pass" | "warn" | "fail";
  score: number;
  blockers: RecipeQaIssue[];
  warnings: RecipeQaIssue[];
}

export interface Recipe extends BaseContent {
  type: "recipe";
  authorName: string;
  intro?: string;
  heroSummary?: string;
  heatLevel: HeatLevel;
  cuisineType: CuisineType;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  activeTimeMinutes?: number;
  servings: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  ingredients: RecipeIngredient[];
  ingredientSections?: RecipeIngredientSection[];
  instructions: RecipeInstruction[];
  methodSteps?: RecipeMethodStep[];
  tips: string[];
  variations: string[];
  makeAheadNotes?: string;
  storageNotes?: string;
  reheatNotes?: string;
  servingSuggestions?: string[];
  substitutions?: string[];
  faqs?: RecipeFaq[];
  equipment: string[];
  heroImageReviewed?: boolean;
  cuisineQaReviewed?: boolean;
  qaNotes?: string;
  qaReport?: RecipeQaReport;
  seoTitle?: string;
  seoDescription?: string;
  ratingAvg?: number;
  ratingCount: number;
  saveCount: number;
}

export interface Review extends BaseContent {
  type: "review";
  productName: string;
  brand: string;
  rating: number;
  priceUsd?: number;
  affiliateUrl: string;
  content: string;
  heatLevel?: HeatLevel;
  scovilleMin?: number;
  scovilleMax?: number;
  flavorNotes: string[];
  cuisineOrigin?: CuisineType;
  category: string;
  pros: string[];
  cons: string[];
  imageReviewed?: boolean;
  factQaReviewed?: boolean;
  qaNotes?: string;
  qaReport?: RecipeQaReport;
  recommended: boolean;
}

export interface MerchProduct {
  id: number;
  slug: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  priceLabel: string;
  availability: MerchAvailability;
  themeKey: MerchThemeKey;
  href: string;
  ctaLabel: string;
  imageUrl?: string;
  imageAlt?: string;
  featured: boolean;
  status: PostStatus;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityPost {
  id: number;
  slug: string;
  type: "photo" | "recipe" | "video_url";
  title?: string;
  caption: string;
  mediaUrl?: string;
  videoUrl?: string;
  tags: string[];
  heatLevel?: HeatLevel;
  cuisineType?: CuisineType;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  status: PostStatus;
  createdAt: string;
  user: Profile;
  structuredRecipe?: CommunityRecipe;
}

export interface CommunityRecipe {
  id: number;
  communityPostId: number;
  title: string;
  description: string;
  heatLevel: HeatLevel;
  cuisineType: CuisineType;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  ingredients: RecipeIngredient[];
  instructions: RecipeInstruction[];
  tips: string[];
  status: PostStatus;
  createdAt: string;
}

export interface Competition {
  id: number;
  slug: string;
  title: string;
  description: string;
  theme: string;
  rules?: string;
  prizeDescription?: string;
  imageUrl?: string;
  submissionType: "photo" | "recipe" | "video_url";
  status: "upcoming" | "active" | "voting" | "closed";
  startDate: string;
  endDate: string;
  votingEndDate?: string;
  maxSubmissionsPerUser: number;
  entries: CompetitionEntry[];
}

export interface CompetitionEntry {
  id: number;
  competitionId: number;
  user: Profile;
  title?: string;
  caption: string;
  mediaUrl?: string;
  voteCount: number;
  status: PostStatus;
  isWinner: boolean;
  submittedAt: string;
}

export interface ContentComment {
  id: number;
  user: Profile;
  contentType: string;
  contentId: number;
  parentId?: number;
  body: string;
  isFlagged: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  websiteUrl?: string;
  heatScore: number;
  role: "user" | "contributor" | "moderator" | "admin";
  isBanned: boolean;
  followerCount?: number;
  followingCount?: number;
}

export interface SocialPost {
  id: number;
  platform: "twitter" | "instagram" | "pinterest" | "facebook" | "tiktok";
  contentType: string;
  contentId: number;
  caption: string;
  hashtags: string[];
  imageUrl?: string;
  linkUrl?: string;
  platformPostId?: string;
  status: "pending" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  publishedAt?: string;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    impressions?: number;
  };
}

export interface GenerationJob {
  id: number;
  jobType:
    | "blog_post"
    | "recipe"
    | "review"
    | "merch_product"
    | "social_post"
    | "newsletter";
  promptTemplate?: string;
  parameters?: Record<string, unknown>;
  status: "queued" | "generating" | "completed" | "failed" | "skipped";
  resultId?: number;
  resultType?: string;
  errorMessage?: string;
  tokensUsed?: number;
  modelUsed?: string;
  attempts: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GenerationSchedule {
  id: number;
  jobType:
    | "blog_post"
    | "recipe"
    | "review"
    | "merch_product"
    | "social_post"
    | "newsletter";
  quantity: number;
  cronExpr: string;
  parameters?: Record<string, unknown>;
  isActive: boolean;
  lastRunAt?: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  firstName?: string;
  status: "active" | "unsubscribed" | "bounced";
  source?: string;
  tags: string[];
  subscribedAt: string;
}

export interface NewsletterCampaign {
  id: number;
  subject: string;
  previewText?: string;
  htmlContent: string;
  textContent?: string;
  audienceTags?: string[];
  provider?: string;
  providerBroadcastId?: string;
  status: "draft" | "scheduled" | "sent";
  sendAt?: string;
  sentAt?: string;
  recipientCount?: number;
  openCount?: number;
  clickCount?: number;
  createdAt: string;
}

export interface SiteSetting {
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface AdminAuditEntry {
  id: number;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  performedAt: string;
  admin: Pick<Profile, "id" | "username" | "displayName">;
}

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  sparkline: number[];
}
