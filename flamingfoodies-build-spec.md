# FlamingFoodies — Full Platform Build Spec

> **Domain:** flamingfoodies.com  
> **Concept:** Spicy & hot food community platform — recipes, hot sauce reviews, competitions, UGC, merch, subscriptions  
> **Reference build:** AsGoodAsGold (assgoodasgold.com) — same stack, lessons learned baked in

---

## TABLE OF CONTENTS

1. [Stack & Brand](#stack--brand)
2. [Architecture Decision](#architecture-decision)
3. [Supabase Schema](#supabase-schema)
4. [Content Collections (Velite/MDX — optional static layer)](#content-collections)
5. [Key Routes](#key-routes)
6. [Admin Section](#admin-section)
7. [Content Automation Pipeline](#content-automation-pipeline)
8. [Newsletter System](#newsletter-system)
9. [Analytics Stack](#analytics-stack)
10. [SEO Strategy](#seo-strategy)
11. [Social Media Automation](#social-media-automation)
12. [Affiliate & Monetization](#affiliate--monetization)
13. [Competitive Insights](#competitive-insights)
14. [Environment Variables](#environment-variables)
15. [Build Order](#build-order)
16. [Daily Spot Audit Checklist](#daily-spot-audit-checklist)
17. [Lessons Learned from AsGoodAsGold](#lessons-learned-from-assgoodasgold)

---

## STACK & BRAND

### Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + Auth + Storage)
- **Auth:** NextAuth.js v5 (Auth.js) — Google, GitHub, Email/magic link
- **Content (static/evergreen):** Velite + MDX (optional, for handcrafted guides)
- **Content (dynamic/AI):** Supabase tables, fetched via ISR
- **Email:** ConvertKit / Kit.com
- **Analytics:** Plausible + GA4 + Microsoft Clarity
- **Deployment:** Vercel (with Cron Jobs)
- **Redis:** Upstash (anonymous like counters)
- **AI Generation:** Anthropic Claude API (claude-opus-4-6)
- **Social Scheduling:** Buffer API or Later API
- **Image CDN:** Supabase Storage + Unsplash API (for AI content)

### Brand
- **Name:** FlamingFoodies
- **Tagline:** "Turn Up the Heat"
- **Logo mark:** 🔥
- **Colors:**
  - Flame red: `#E63946` (primary)
  - Deep orange: `#F4631E` (secondary)
  - Charcoal: `#1A1A1A` (dark background)
  - Cream: `#FFF8F0` (light background)
- **Tone:** Bold, fun, slightly irreverent. Not corporate.
- **Typography:** Serif for display headers (heritage feel), sans-serif for body

---

## ARCHITECTURE DECISION

**Do NOT use Velite/MDX as the sole content layer.** MDX is great for handcrafted evergreen content but impractical when Claude is generating 10+ posts/day.

### New model:
- **All dynamic content** (blog posts, recipes, reviews) → **Supabase Postgres tables**
- **Next.js fetches from Supabase** via ISR (`revalidate = 3600`) or on-demand revalidation after publish
- **Admin CMS** → custom `/admin` section in the Next.js app (not a third-party like Sanity)
- **Generation pipeline** → Vercel Cron Jobs → your API route → Claude generates → inserts as `draft` → auto-publishes after N hours or you approve in admin
- **Optional static layer** → keep Velite for long-form handcrafted guides (e.g. "Ultimate Scoville Scale Guide") that won't be auto-generated

---

## SUPABASE SCHEMA

Run the following SQL in your Supabase SQL editor in order.

```sql
-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE heat_level AS ENUM ('mild', 'medium', 'hot', 'inferno', 'reaper');
CREATE TYPE post_status AS ENUM ('draft', 'pending_review', 'published', 'archived');
CREATE TYPE content_source AS ENUM ('editorial', 'ai_generated', 'community');
CREATE TYPE cuisine_type AS ENUM (
  'american', 'mexican', 'thai', 'korean', 'indian', 'chinese',
  'japanese', 'ethiopian', 'peruvian', 'jamaican', 'cajun',
  'szechuan', 'vietnamese', 'west_african', 'middle_eastern',
  'caribbean', 'italian', 'moroccan', 'other'
);
CREATE TYPE user_role AS ENUM ('user', 'contributor', 'moderator', 'admin');
CREATE TYPE competition_status AS ENUM ('upcoming', 'active', 'voting', 'closed');
CREATE TYPE media_type AS ENUM ('photo', 'recipe', 'video_url');
CREATE TYPE social_platform AS ENUM ('twitter', 'instagram', 'pinterest', 'facebook', 'tiktok');
CREATE TYPE social_post_status AS ENUM ('pending', 'scheduled', 'published', 'failed');
CREATE TYPE generation_status AS ENUM ('queued', 'generating', 'completed', 'failed', 'skipped');


-- ============================================
-- USERS & PROFILES
-- ============================================

-- Extends Supabase auth.users (do NOT modify auth.users directly)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  website_url   TEXT,
  heat_score    INTEGER NOT NULL DEFAULT 0,
  role          user_role NOT NULL DEFAULT 'user',
  is_banned     BOOLEAN NOT NULL DEFAULT false,
  ban_reason    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Heat score transaction log (source of truth for heat_score)
CREATE TABLE heat_score_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  -- 'recipe_approved' | 'photo_approved' | 'like_received' | 'competition_entry' | 'comment_approved' | 'competition_winner' | 'referral_signup'
  points      INTEGER NOT NULL,
  ref_id      TEXT,          -- optional: id of the content this event relates to
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_heat_score_events_user ON heat_score_events(user_id);

-- Follows (user → user)
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);


-- ============================================
-- BLOG POSTS (editorial + AI-generated)
-- ============================================

CREATE TABLE blog_posts (
  id                   BIGSERIAL PRIMARY KEY,
  slug                 TEXT UNIQUE NOT NULL,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  content              TEXT NOT NULL,         -- full HTML or markdown body
  author_name          TEXT NOT NULL DEFAULT 'FlamingFoodies Team',
  author_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category             TEXT NOT NULL,
  -- 'recipes' | 'reviews' | 'news' | 'culture' | 'science' | 'gear' | 'competitions' | 'guides'
  tags                 TEXT[] NOT NULL DEFAULT '{}',
  image_url            TEXT,
  image_alt            TEXT,
  heat_level           heat_level,
  cuisine_type         cuisine_type,
  scoville_rating      INTEGER,               -- fun heat rating 0-10
  featured             BOOLEAN NOT NULL DEFAULT false,
  affiliate_disclosure BOOLEAN NOT NULL DEFAULT true,
  status               post_status NOT NULL DEFAULT 'draft',
  source               content_source NOT NULL DEFAULT 'editorial',
  seo_title            TEXT,
  seo_description      TEXT,
  canonical_url        TEXT,
  read_time_minutes    INTEGER,
  view_count           INTEGER NOT NULL DEFAULT 0,
  like_count           INTEGER NOT NULL DEFAULT 0,
  published_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured) WHERE status = 'published';
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);
CREATE INDEX idx_blog_posts_fts ON blog_posts
  USING GIN(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));


-- ============================================
-- RECIPES (editorial + AI-generated + community)
-- ============================================

CREATE TABLE recipes (
  id                   BIGSERIAL PRIMARY KEY,
  slug                 TEXT UNIQUE NOT NULL,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  intro                TEXT,                  -- longer intro paragraph with cultural context
  author_name          TEXT NOT NULL DEFAULT 'FlamingFoodies Team',
  author_id            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  heat_level           heat_level NOT NULL DEFAULT 'medium',
  cuisine_type         cuisine_type NOT NULL DEFAULT 'other',
  prep_time_minutes    INTEGER,
  cook_time_minutes    INTEGER,
  total_time_minutes   INTEGER GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,
  servings             INTEGER,
  difficulty           TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  ingredients          JSONB NOT NULL DEFAULT '[]', -- [{amount, unit, item, notes}]
  instructions         JSONB NOT NULL DEFAULT '[]', -- [{step, text, tip}]
  nutrition            JSONB,                 -- {calories, protein, carbs, fat, fiber}
  equipment            TEXT[],
  tips                 TEXT[],
  variations           TEXT[],
  tags                 TEXT[] NOT NULL DEFAULT '{}',
  image_url            TEXT,
  image_alt            TEXT,
  video_url            TEXT,                  -- YouTube embed URL
  featured             BOOLEAN NOT NULL DEFAULT false,
  status               post_status NOT NULL DEFAULT 'draft',
  source               content_source NOT NULL DEFAULT 'editorial',
  affiliate_disclosure BOOLEAN NOT NULL DEFAULT true,
  seo_title            TEXT,
  seo_description      TEXT,
  view_count           INTEGER NOT NULL DEFAULT 0,
  like_count           INTEGER NOT NULL DEFAULT 0,
  save_count           INTEGER NOT NULL DEFAULT 0,
  rating_avg           DECIMAL(3,2),
  rating_count         INTEGER NOT NULL DEFAULT 0,
  published_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_heat_level ON recipes(heat_level);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine_type);
CREATE INDEX idx_recipes_published ON recipes(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_fts ON recipes
  USING GIN(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

-- Recipe ratings (authenticated users, 1 per user per recipe)
CREATE TABLE recipe_ratings (
  id          BIGSERIAL PRIMARY KEY,
  recipe_id   BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- Recipe saves / bookmarks (user recipe box)
CREATE TABLE recipe_saves (
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id  BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);


-- ============================================
-- HOT SAUCE & PRODUCT REVIEWS
-- ============================================

CREATE TABLE reviews (
  id                BIGSERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  content           TEXT NOT NULL,
  product_name      TEXT NOT NULL,
  brand             TEXT NOT NULL,
  rating            DECIMAL(3,2) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  price_usd         DECIMAL(8,2),
  affiliate_url     TEXT NOT NULL,
  image_url         TEXT,
  image_alt         TEXT,
  heat_level        heat_level,
  scoville_min      INTEGER,
  scoville_max      INTEGER,
  flavor_notes      TEXT[],               -- ['smoky', 'fruity', 'vinegary', 'earthy']
  cuisine_origin    cuisine_type,         -- which cuisine/country this sauce comes from
  category          TEXT NOT NULL,
  -- 'hot-sauce' | 'spice-blend' | 'snack' | 'condiment' | 'gear' | 'book' | 'subscription-box'
  pros              TEXT[],
  cons              TEXT[],
  tags              TEXT[] NOT NULL DEFAULT '{}',
  recommended       BOOLEAN NOT NULL DEFAULT false,
  featured          BOOLEAN NOT NULL DEFAULT false,
  status            post_status NOT NULL DEFAULT 'draft',
  source            content_source NOT NULL DEFAULT 'editorial',
  seo_title         TEXT,
  seo_description   TEXT,
  view_count        INTEGER NOT NULL DEFAULT 0,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_category ON reviews(category);
CREATE INDEX idx_reviews_heat_level ON reviews(heat_level);


-- ============================================
-- COMMUNITY / UGC
-- ============================================

CREATE TABLE community_posts (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          media_type NOT NULL,
  title         TEXT,
  caption       TEXT NOT NULL,
  media_url     TEXT,                     -- Supabase Storage URL
  video_url     TEXT,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  heat_level    heat_level,
  cuisine_type  cuisine_type,
  status        post_status NOT NULL DEFAULT 'pending_review',
  like_count    INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  view_count    INTEGER NOT NULL DEFAULT 0,
  is_pinned     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_posts_status ON community_posts(status);
CREATE INDEX idx_community_posts_user ON community_posts(user_id);
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC) WHERE status = 'published';

-- Community-submitted recipes (linked to a community_post)
CREATE TABLE community_recipes (
  id                BIGSERIAL PRIMARY KEY,
  community_post_id BIGINT UNIQUE REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  heat_level        heat_level NOT NULL,
  cuisine_type      cuisine_type NOT NULL,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings          INTEGER,
  ingredients       JSONB NOT NULL DEFAULT '[]',
  instructions      JSONB NOT NULL DEFAULT '[]',
  tips              TEXT[],
  status            post_status NOT NULL DEFAULT 'pending_review',
  like_count        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- LIKES & ENGAGEMENT
-- ============================================

CREATE TABLE likes (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE, -- null = anonymous
  content_type  TEXT NOT NULL,
  -- 'blog_post' | 'recipe' | 'review' | 'community_post' | 'community_recipe' | 'competition_entry'
  content_id    BIGINT NOT NULL,
  ip_hash       TEXT,           -- for anonymous dedup (hashed, never raw IP)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX idx_likes_content ON likes(content_type, content_id);
CREATE INDEX idx_likes_user ON likes(user_id);

-- Comments (on any content type)
CREATE TABLE comments (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type  TEXT NOT NULL,
  content_id    BIGINT NOT NULL,
  parent_id     BIGINT REFERENCES comments(id) ON DELETE CASCADE, -- threading
  body          TEXT NOT NULL,
  is_flagged    BOOLEAN NOT NULL DEFAULT false,
  is_approved   BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_content ON comments(content_type, content_id);


-- ============================================
-- COMPETITIONS
-- ============================================

CREATE TABLE competitions (
  id                       BIGSERIAL PRIMARY KEY,
  slug                     TEXT UNIQUE NOT NULL,
  title                    TEXT NOT NULL,
  description              TEXT NOT NULL,
  theme                    TEXT NOT NULL,       -- e.g. "Hottest Homemade Sauce"
  rules                    TEXT,
  prize_description        TEXT,
  image_url                TEXT,
  submission_type          media_type NOT NULL,
  status                   competition_status NOT NULL DEFAULT 'upcoming',
  max_submissions_per_user INTEGER NOT NULL DEFAULT 1,
  start_date               TIMESTAMPTZ NOT NULL,
  end_date                 TIMESTAMPTZ NOT NULL,
  voting_end_date          TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE competition_entries (
  id               BIGSERIAL PRIMARY KEY,
  competition_id   BIGINT NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT,
  caption          TEXT NOT NULL,
  media_url        TEXT,
  video_url        TEXT,
  vote_count       INTEGER NOT NULL DEFAULT 0,
  status           post_status NOT NULL DEFAULT 'pending_review',
  is_winner        BOOLEAN NOT NULL DEFAULT false,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(competition_id, user_id)
);

CREATE TABLE competition_votes (
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_id      BIGINT NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
  voted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, entry_id)
);


-- ============================================
-- NEWSLETTER
-- ============================================

CREATE TABLE newsletter_subscribers (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  first_name      TEXT,
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'unsubscribed' | 'bounced'
  source          TEXT,                             -- 'homepage', 'quiz', 'recipe_page', etc.
  tags            TEXT[] NOT NULL DEFAULT '{}',     -- ConvertKit segments
  convertkit_id   TEXT,                             -- ConvertKit subscriber ID for sync
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_status ON newsletter_subscribers(status);

CREATE TABLE newsletter_campaigns (
  id              BIGSERIAL PRIMARY KEY,
  subject         TEXT NOT NULL,
  preview_text    TEXT,
  html_content    TEXT NOT NULL,
  text_content    TEXT,
  status          TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'scheduled' | 'sent'
  send_at         TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  recipient_count INTEGER,
  open_count      INTEGER,
  click_count     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================
-- AFFILIATE TRACKING
-- ============================================

CREATE TABLE affiliate_clicks (
  id          BIGSERIAL PRIMARY KEY,
  partner     TEXT NOT NULL,
  product     TEXT,
  url         TEXT NOT NULL,
  source_page TEXT,
  position    TEXT,             -- 'sidebar' | 'in-content' | 'quiz-result' | 'recipe-card'
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id  TEXT,
  clicked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_affiliate_clicks_partner ON affiliate_clicks(partner);
CREATE INDEX idx_affiliate_clicks_date ON affiliate_clicks(clicked_at DESC);


-- ============================================
-- CONTENT GENERATION (AI automation)
-- ============================================

CREATE TABLE content_generation_jobs (
  id               BIGSERIAL PRIMARY KEY,
  job_type         TEXT NOT NULL,
  -- 'blog_post' | 'recipe' | 'review' | 'social_post' | 'newsletter'
  prompt_template  TEXT,
  parameters       JSONB,     -- {cuisine_type, heat_level, category, topic, keywords[]}
  status           generation_status NOT NULL DEFAULT 'queued',
  result_id        BIGINT,    -- id of created record
  result_type      TEXT,      -- 'blog_post' | 'recipe' | 'review'
  error_message    TEXT,
  tokens_used      INTEGER,
  model_used       TEXT DEFAULT 'claude-opus-4-6',
  attempts         SMALLINT NOT NULL DEFAULT 0,
  queued_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ
);

CREATE INDEX idx_gen_jobs_status ON content_generation_jobs(status);
CREATE INDEX idx_gen_jobs_type ON content_generation_jobs(job_type);

-- What to auto-generate and when
CREATE TABLE generation_schedule (
  id          BIGSERIAL PRIMARY KEY,
  job_type    TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,   -- how many per run
  cron_expr   TEXT NOT NULL,               -- e.g. '0 6 * * *' = 6am daily
  parameters  JSONB,                       -- defaults, e.g. rotate through cuisines
  is_active   BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default schedule
INSERT INTO generation_schedule (job_type, quantity, cron_expr, parameters) VALUES
  ('recipe',    3, '0 6 * * *',   '{"rotate_cuisines": true, "heat_levels": ["mild","medium","hot","inferno","reaper"]}'),
  ('blog_post', 2, '0 7 * * *',   '{"categories": ["culture","science","guides","gear"]}'),
  ('review',    1, '0 8 * * 1,4', '{"category": "hot-sauce", "rotate_origins": true}');


-- ============================================
-- SOCIAL MEDIA AUTOMATION
-- ============================================

CREATE TABLE social_posts (
  id               BIGSERIAL PRIMARY KEY,
  platform         social_platform NOT NULL,
  content_type     TEXT,          -- 'blog_post' | 'recipe' | 'review' | 'competition' | 'custom'
  content_id       BIGINT,        -- reference to source content
  caption          TEXT NOT NULL,
  hashtags         TEXT[],
  image_url        TEXT,
  link_url         TEXT,
  status           social_post_status NOT NULL DEFAULT 'pending',
  scheduled_at     TIMESTAMPTZ,
  published_at     TIMESTAMPTZ,
  platform_post_id TEXT,          -- ID returned by Buffer/Later/platform API
  error_message    TEXT,
  engagement       JSONB,         -- {likes, shares, comments, impressions} synced weekly
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE status = 'scheduled';


-- ============================================
-- ADMIN & MODERATION
-- ============================================

CREATE TABLE moderation_queue (
  id            BIGSERIAL PRIMARY KEY,
  content_type  TEXT NOT NULL,
  -- 'community_post' | 'community_recipe' | 'competition_entry' | 'comment'
  content_id    BIGINT NOT NULL,
  reported_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason        TEXT CHECK (reason IN ('spam','inappropriate','copyright','misleading','harassment','other')),
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected' | 'escalated'
  reviewed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_note   TEXT,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ
);

CREATE TABLE admin_audit_log (
  id           BIGSERIAL PRIMARY KEY,
  admin_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  -- 'publish_post' | 'reject_submission' | 'ban_user' | 'generate_content' | 'delete_comment'
  target_type  TEXT,
  target_id    TEXT,
  metadata     JSONB,
  ip_address   INET,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_date ON admin_audit_log(performed_at DESC);

-- Site-wide feature flags and settings
CREATE TABLE site_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings(key, value) VALUES
  ('show_ads',                    'false'),
  ('maintenance_mode',            'false'),
  ('auto_publish_ai_content',     'false'),   -- if true, AI content skips human review
  ('auto_publish_delay_hours',    '4'),        -- hours before AI draft auto-publishes
  ('daily_recipe_quota',          '3'),
  ('daily_blog_quota',            '2'),
  ('daily_review_quota',          '1'),
  ('moderation_auto_approve_trusted', 'true'); -- auto-approve posts from 'contributor' role


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_saves ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "profiles_public_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_update"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Published content: public read
CREATE POLICY "blog_published_read"    ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "recipes_published_read" ON recipes    FOR SELECT USING (status = 'published');
CREATE POLICY "reviews_published_read" ON reviews    FOR SELECT USING (status = 'published');

-- Community posts: public read of approved, owner can see own
CREATE POLICY "community_approved_read" ON community_posts FOR SELECT
  USING (status = 'published' OR user_id = auth.uid());
CREATE POLICY "community_insert" ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_owner_update" ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Likes: anyone can read, authenticated to insert own
CREATE POLICY "likes_public_read"  ON likes FOR SELECT USING (true);
CREATE POLICY "likes_auth_insert"  ON likes FOR INSERT  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "likes_owner_delete" ON likes FOR DELETE  USING (auth.uid() = user_id);

-- Comments: public read of approved only
CREATE POLICY "comments_approved_read" ON comments FOR SELECT USING (is_approved = true);
CREATE POLICY "comments_auth_insert"   ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_owner_update"  ON comments FOR UPDATE USING (auth.uid() = user_id);

-- Recipe saves: only owner
CREATE POLICY "saves_owner_all" ON recipe_saves USING (auth.uid() = user_id);

-- Follows: public read, authenticated insert/delete
CREATE POLICY "follows_public_read"  ON follows FOR SELECT USING (true);
CREATE POLICY "follows_auth_insert"  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_auth_delete"  ON follows FOR DELETE USING (auth.uid() = follower_id);


-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at on any table that has the column
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON blog_posts        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON recipes           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reviews           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON community_posts   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON competitions      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update recipe rating_avg + rating_count when a rating is added/updated
CREATE OR REPLACE FUNCTION update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE recipes SET
    rating_avg   = (SELECT AVG(rating)   FROM recipe_ratings WHERE recipe_id = NEW.recipe_id),
    rating_count = (SELECT COUNT(*)      FROM recipe_ratings WHERE recipe_id = NEW.recipe_id)
  WHERE id = NEW.recipe_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recipe_rating_on_change
AFTER INSERT OR UPDATE ON recipe_ratings
FOR EACH ROW EXECUTE FUNCTION update_recipe_rating();

-- Award heat score when a community post is approved (status → published)
CREATE OR REPLACE FUNCTION award_heat_score_on_approval()
RETURNS TRIGGER AS $$
DECLARE pts INTEGER;
BEGIN
  IF OLD.status != 'published' AND NEW.status = 'published' THEN
    pts := CASE NEW.type WHEN 'recipe' THEN 5 ELSE 2 END;
    INSERT INTO heat_score_events(user_id, event_type, points, ref_id)
    VALUES (NEW.user_id, 'post_approved', pts, NEW.id::text);
    UPDATE profiles SET heat_score = heat_score + pts WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER award_heat_score
AFTER UPDATE ON community_posts
FOR EACH ROW EXECUTE FUNCTION award_heat_score_on_approval();

-- Increment like_count denormalized column + award heat score on like
CREATE OR REPLACE FUNCTION handle_like_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.content_type = 'blog_post' THEN
      UPDATE blog_posts SET like_count = like_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'recipe' THEN
      UPDATE recipes SET like_count = like_count + 1 WHERE id = NEW.content_id;
    ELSIF NEW.content_type = 'community_post' THEN
      UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.content_id;
      -- Award 1 heat point to the post author
      UPDATE profiles SET heat_score = heat_score + 1
        WHERE id = (SELECT user_id FROM community_posts WHERE id = NEW.content_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.content_type = 'blog_post' THEN
      UPDATE blog_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.content_id;
    ELSIF OLD.content_type = 'recipe' THEN
      UPDATE recipes SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.content_id;
    ELSIF OLD.content_type = 'community_post' THEN
      UPDATE community_posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.content_id;
      UPDATE profiles SET heat_score = GREATEST(0, heat_score - 1)
        WHERE id = (SELECT user_id FROM community_posts WHERE id = OLD.content_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION handle_like_change();
```

---

## CONTENT COLLECTIONS

Keep Velite only for long-form, handcrafted, evergreen content that will not be auto-generated:

```
content/
  guides/        → /guides/[slug]   — e.g. "Ultimate Scoville Scale Guide", "How to Ferment Hot Sauce"
  glossary/      → /glossary/[slug] — ingredient and technique definitions
```

All recipes, blog posts, and reviews live in **Supabase** and are fetched via ISR.

---

## KEY ROUTES

```
PUBLIC CONTENT
/                              Homepage: featured recipes, top sauces, heat quiz CTA, email signup
/blog                          Blog index (filter by category, cuisine, heat level)
/blog/[slug]                   Blog post
/recipes                       Recipe index (filter by heat level, cuisine, time, difficulty)
/recipes/[slug]                Recipe detail (with RecipeSchema structured data)
/reviews                       Review index
/reviews/[slug]                Product review (with ReviewSchema structured data)
/gear                          Curated gear pages
/gear/best-hot-sauces          Roundup page
/gear/cast-iron-cookware       Roundup page (+ more)
/guides/[slug]                 Long-form evergreen guides (Velite/MDX)
/go/[partner]                  Affiliate redirect (307, no-referrer headers)
/api/og                        Dynamic OG image generation (edge runtime)
/api/subscribe                 ConvertKit email signup (POST)
/api/like/[type]/[id]          Anonymous like counter (GET = count, POST = increment, Upstash Redis)

COMMUNITY (requires auth)
/community                     Feed: latest approved photos + recipes from users
/community/submit              Submit photo or recipe (auth required)
/profile/[username]            User public profile: posts, heat score, followers
/profile/[username]/edit       Edit own profile (auth, own profile only)
/leaderboard                   Top contributors ranked by heat score

COMPETITIONS
/competitions                  Active + past competitions
/competitions/[slug]           Competition detail, entry gallery, vote button (auth)
/competitions/[slug]/enter     Submit an entry (auth)

COMMERCE
/shop                          FlamingFoodies merch (Printful embed or Shopify Buy Button)
/subscriptions                 Spicy subscription box (link to Fuego Box or CrateJoy partner)

QUIZ
/quiz                          "What's Your Heat Tolerance?" (5-7 questions)
/quiz/results/[type]           Result page + personalized affiliate product recs + email capture

AUTH
/login                         NextAuth sign in (Google, GitHub, Email magic link)
/signup                        Redirect to /login (Auth.js handles this)
/auth/callback                 NextAuth callback handler
/onboarding                    Username picker shown on first login

ADMIN (role = admin only)
/admin                         Dashboard
/admin/content/...             Content management
/admin/community/...           Moderation
/admin/competitions/...        Competition management
/admin/newsletter/...          Campaigns + subscribers
/admin/automation/...          Generation jobs + schedule
/admin/social/...              Social post queue
/admin/analytics/...           Traffic + affiliate charts
/admin/settings/...            Feature flags + site settings
```

---

## ADMIN SECTION

All routes under `/admin` are protected by middleware checking `role = 'admin'` from Supabase session.

```
/admin
  Dashboard         KPIs: today's views, new users, affiliate clicks, pending moderation count,
                    top recipe this week, social posts queued, newsletter subs (with % growth)

  Content
    /blog           Table: all blog posts (filter: status, source=ai/editorial, category)
                    Bulk actions: publish, archive, delete
                    Per row: Edit (Tiptap rich text editor), preview, toggle featured
    /recipes        Same as blog, plus heat_level and cuisine_type filters
    /reviews        Same pattern

  Community
    /moderation     Cards: pending community_posts + competition_entries
                    Actions: Approve / Reject (with reason) / Pin / Ban user
    /users          Searchable user list, view heat score, ban/unban, change role
    /comments       Flagged comments queue

  Competitions
    /list           All competitions with status badge
    /new            Create competition form
    /[id]/entries   Entry gallery, approve/reject entries, mark winner, trigger voting phase

  Newsletter
    /subscribers    List with search + export CSV
    /campaigns      Sent history + open/click rates
    /new            Compose campaign (rich editor, schedule send)

  Automation
    /jobs           Generation job queue (filter: status, type)
                    Per job: status badge, preview output, approve to publish, retry failed
    /schedule       Edit generation_schedule table (quantities, cron expressions, parameters)
    /trigger        Manual "Generate now" button per content type

  Social
    /queue          Calendar view of scheduled social_posts, edit caption, approve/skip
    /history        Published posts + engagement stats
    /templates      Caption prompt templates per platform

  Analytics
    /traffic        Plausible embed (page views, top pages, referrers, countries)
    /affiliate      Clicks by partner (bar chart), estimated revenue, top products
    /content        AI vs editorial: views, likes, time-on-page comparison

  Settings
    /general        site_settings key-value editor (show_ads, quotas, delays)
    /affiliates     AFFILIATE_LINKS registry editor
    /audit-log      Paginated admin_audit_log viewer
```

**Admin components to build:**
- `<ContentTable>` — sortable/filterable table with bulk actions + status badges
- `<RichTextEditor>` — Tiptap editor with Supabase Storage image upload
- `<ModerationCard>` — shows submission media + approve/reject/request-changes
- `<GenerationJobPanel>` — queue viewer, preview JSON output, approve button
- `<KPICard>` — metric + sparkline + delta vs yesterday

---

## CONTENT AUTOMATION PIPELINE

### How it works

```
Vercel Cron Job (vercel.json)
  → POST /api/admin/generate?type=recipe&qty=3
      (secured with Authorization: Bearer {CRON_SECRET} header)
    → reads generation_schedule for parameters
    → inserts N content_generation_jobs rows (status: queued)
    → processes queue sequentially:
        → calls Claude API with structured prompt
        → parses JSON response
        → generates slug, read_time, seo fields
        → fetches image from Unsplash API by tags
        → inserts into blog_posts / recipes / reviews (status: draft)
        → sets published_at = NOW() + auto_publish_delay_hours (from site_settings)
        → generates social_posts rows for each new piece of content
        → logs to admin_audit_log
  → /api/admin/publish-scheduled cron (every 30 min)
        → finds records WHERE status = 'draft' AND published_at <= NOW()
        → sets status = 'published'
        → triggers Next.js revalidatePath for that slug
```

### Vercel Cron Config (`vercel.json`)

```json
{
  "crons": [
    { "path": "/api/admin/generate?type=recipe&qty=3",    "schedule": "0 6 * * *"     },
    { "path": "/api/admin/generate?type=blog_post&qty=2", "schedule": "0 7 * * *"     },
    { "path": "/api/admin/generate?type=review&qty=1",    "schedule": "0 8 * * 1,4"   },
    { "path": "/api/admin/publish-scheduled",             "schedule": "*/30 * * * *"  },
    { "path": "/api/admin/social-scheduler",              "schedule": "0 9,12,17,20 * * *" },
    { "path": "/api/admin/newsletter-digest",             "schedule": "0 10 * * 0"    }
  ]
}
```

### Generation Prompts (`lib/generation/prompts.ts`)

```typescript
const HEAT_DESCRIPTIONS = {
  mild:    'a gentle warmth, suitable for all audiences',
  medium:  'noticeable heat that excites without overwhelming',
  hot:     'serious heat for enthusiasts (habanero/scotch bonnet range)',
  inferno: 'extreme heat for experienced chilli heads (7-pot/Trinidad Moruga range)',
  reaper:  'Carolina Reaper-level — the absolute limit of culinary heat'
};

export const RECIPE_PROMPT = (params) => `
You are a professional food writer for FlamingFoodies.com, a site celebrating spicy and hot food from around the world.

Generate a complete, authentic recipe. Requirements:
- Cuisine: ${params.cuisine_type} (be authentic to this cuisine's actual culinary traditions and flavor profiles)
- Heat level: ${params.heat_level} (${HEAT_DESCRIPTIONS[params.heat_level]})
- The dish should authentically use chilli heat in the way that cuisine does (e.g. Korean gochujang fermented, Mexican dried chillies, Thai fresh bird's eye, Ethiopian berbere spice blend)

Return ONLY valid JSON matching this exact structure:
{
  "title": "...",
  "description": "1-2 sentences, SEO-friendly, include cuisine and heat level naturally",
  "intro": "3-4 sentences covering the dish's cultural origin, why it's special, and what makes the heat unique in this cuisine",
  "heat_level": "${params.heat_level}",
  "cuisine_type": "${params.cuisine_type}",
  "prep_time_minutes": 0,
  "cook_time_minutes": 0,
  "servings": 0,
  "difficulty": "beginner|intermediate|advanced",
  "ingredients": [{"amount": "1", "unit": "cup", "item": "ingredient name", "notes": "optional tip"}],
  "instructions": [{"step": 1, "text": "instruction", "tip": "optional pro tip for this step"}],
  "tips": ["make-ahead tip", "storage tip", "heat adjustment tip"],
  "variations": ["how to make hotter", "how to make milder", "ingredient substitution"],
  "equipment": ["cast iron skillet", "mortar and pestle"],
  "tags": ["spicy", "quick", "weeknight", "cuisine-specific tag"],
  "seo_title": "50-60 chars max, include primary keyword like 'spicy [dish] recipe'",
  "seo_description": "150-160 chars, include primary keyword and a CTA",
  "image_alt": "descriptive alt text for the hero image",
  "image_search_query": "2-3 word Unsplash search query for a hero image of this dish",
  "affiliate_products": [
    {"name": "product name", "reason": "why this product helps with this recipe", "amazon_search": "amazon search query"}
  ]
}`;

export const BLOG_POST_PROMPT = (params) => `
You are a food writer for FlamingFoodies.com. Write an engaging, informative blog post.

Topic category: ${params.category}
Topic: ${params.topic || 'choose a relevant, high-interest topic in spicy food culture'}
Target keywords: ${params.keywords?.join(', ') || 'naturally relevant keywords'}

Return ONLY valid JSON:
{
  "title": "...",
  "description": "...",
  "content": "full post content in markdown (800-1200 words, H2 subheadings, conversational tone)",
  "category": "${params.category}",
  "tags": ["..."],
  "heat_level": "mild|medium|hot|inferno|reaper (if relevant)",
  "cuisine_type": "cuisine if relevant, null otherwise",
  "seo_title": "...",
  "seo_description": "...",
  "image_alt": "...",
  "image_search_query": "..."
}`;

// Cuisine rotation — ensures global diversity, cycles daily
export const CUISINE_ROTATION: string[] = [
  'mexican', 'thai', 'korean', 'indian', 'ethiopian', 'peruvian',
  'jamaican', 'cajun', 'szechuan', 'vietnamese', 'west_african',
  'middle_eastern', 'caribbean', 'moroccan', 'japanese', 'american',
  'italian', 'chinese', 'other'
];

export function getTodayCuisines(count: number): string[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return Array.from(
    { length: count },
    (_, i) => CUISINE_ROTATION[(dayOfYear + i) % CUISINE_ROTATION.length]
  );
}
```

### Image Sourcing for AI Content

AI cannot generate images. Use this fallback chain:
1. **Unsplash API** — query by `image_search_query` from Claude output (free with attribution or commercial plan)
2. **Pexels API** — same, free
3. **Branded gradient placeholder** — generate via `/api/og` with the dish name (like AsGoodAsGold pattern)
4. Admin replaces image in CMS later

### Volume Projection

| Content Type | Per Day | Per Year |
|---|---|---|
| Recipes | 3 | 1,095 |
| Blog posts | 2 | 730 |
| Reviews | 0.3 (2/week) | 104 |
| **Total pages** | **~5/day** | **~1,930** |

At 500 avg monthly views per page after 12 months = **~965,000 monthly sessions from content alone**.

---

## NEWSLETTER SYSTEM

- **Provider:** ConvertKit / Kit.com
- **Env vars:** `CONVERTKIT_API_KEY`, `CONVERTKIT_FORM_ID`
- **Sync strategy:** Supabase `newsletter_subscribers` is the source of truth; sync to ConvertKit via API on subscribe/unsubscribe

### Automated weekly digest

Every Sunday at 10am the `/api/admin/newsletter-digest` cron:
1. Queries top 3 recipes by `view_count` published in the last 7 days
2. Queries top hot sauce review of the week
3. Queries any active competitions
4. Calls Claude to write a short intro paragraph
5. Inserts a `newsletter_campaigns` row as `draft`
6. Admin reviews and sends (or auto-sends if `auto_publish_ai_content = true`)

### Email capture segmentation

Tag subscribers based on source so you can target future campaigns:

| Source | ConvertKit Tag |
|--------|---------------|
| Homepage hero | `homepage-hero` |
| Quiz result (mild) | `quiz-mild-adventurer` |
| Quiz result (reaper) | `quiz-reaper-chaser` |
| Recipe page | `recipe-reader` |
| Competition entry | `competitor` |
| Community signup | `community-member` |

---

## ANALYTICS STACK

### Three layers

| Layer | Tool | Purpose |
|-------|------|---------|
| Page analytics | **Plausible** (privacy-first, no cookies) | Page views, referrers, top content — GDPR compliant |
| Behavior | **Microsoft Clarity** | Heatmaps, session recordings, rage clicks |
| Business events | **GA4** | Conversion funnels, affiliate attribution, revenue tracking |

### Custom GA4 events (instrument all of these in `lib/analytics.ts`)

```typescript
affiliate_click       { partner, product, url, source_page, position }
email_signup          { source, tag, variant }
quiz_start            {}
quiz_complete         { result_type }
recipe_rating         { recipe_id, rating }
recipe_save           { recipe_id }
recipe_share          { recipe_id, platform }
community_submit      { type: 'photo' | 'recipe' }
competition_enter     { competition_id }
vote_cast             { competition_id, entry_id }
like_post             { content_type, content_id }
comment_posted        { content_type, content_id }
user_follow           { following_id }
search_performed      { query, results_count }
heat_score_milestone  { score, milestone: 100 | 500 | 1000 }
scroll_depth          { depth: 25 | 50 | 75 | 100, page }
```

### Admin analytics dashboard

Embed a Plausible dashboard + build custom Supabase queries for:
- Top recipes by saves this week
- Affiliate click-through rate by partner (clicks ÷ views)
- Daily new user signups (7-day sparkline)
- Community post approval rate (approved ÷ submitted)
- Heat score distribution (histogram of users by score bucket)
- AI vs editorial content performance (avg views/likes per piece)

---

## SEO STRATEGY

### Technical (build once)

```typescript
// components/schema/RecipeSchema.tsx — output application/ld+json
// Google Rich Results = star ratings + cook time in SERPs = big CTR lift
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": recipe.title,
  "description": recipe.description,
  "image": recipe.image_url,
  "author": { "@type": "Person", "name": recipe.author_name },
  "datePublished": recipe.published_at,
  "prepTime": `PT${recipe.prep_time_minutes}M`,
  "cookTime": `PT${recipe.cook_time_minutes}M`,
  "recipeYield": `${recipe.servings} servings`,
  "recipeCategory": recipe.cuisine_type,
  "recipeIngredient": recipe.ingredients.map(i => `${i.amount} ${i.unit} ${i.item}`),
  "recipeInstructions": recipe.instructions.map(i => ({
    "@type": "HowToStep", "text": i.text
  })),
  "aggregateRating": recipe.rating_count > 0 ? {
    "@type": "AggregateRating",
    "ratingValue": recipe.rating_avg,
    "reviewCount": recipe.rating_count
  } : undefined
}

// Also add: ReviewSchema, BreadcrumbSchema, OrganizationSchema on homepage
```

- **Sitemap:** regenerate daily (Vercel cron), includes all `status = 'published'` records
- **Canonical URLs:** always `https://flamingfoodies.com/...` (no trailing slash)
- **Noindex:** `/community/submit`, `/profile/*/edit`, `/admin/*`, empty filter pages
- **Internal linking:** each recipe links to 2-3 related recipes + 1 relevant hot sauce review

### Content SEO (automated via generation pipeline)

The generation prompt rotates through cuisines and heat levels specifically to target long-tail keywords:

```
"spicy [cuisine] [dish] recipe"          → "spicy Korean tteokbokki recipe"
"[heat level] [cuisine] recipes"         → "reaper-level Mexican recipes"
"how to make [dish] spicier"
"[cuisine] hot sauce guide"
"best hot sauce for [dish type]"
"[country] chilli peppers guide"
```

### Keyword tier strategy

| Tier | Examples | Monthly Volume | Difficulty | Timeline |
|------|----------|---------------|------------|----------|
| Quick wins | "ghost pepper salsa recipe", "gochujang noodle stir fry" | 1k–5k | Low | Weeks |
| Medium | "spicy Korean recipes", "Ethiopian berbere chicken" | 5k–20k | Medium | 3–6 months |
| Long-term | "hot sauce review", "spicy recipes", "best hot sauce" | 50k–200k | High | 12–18 months |

### Annual awards (link bait + PR)

Run **FlamingFoodies Annual Heat Awards** every December:
- Best New Hot Sauce Brand
- Best Caribbean Sauce
- Best Fermented Sauce
- Hottest Community Recipe of the Year

Press releases → backlinks. Community voting → engagement. Repeat annually.

---

## SOCIAL MEDIA AUTOMATION

### Platform strategy

| Platform | Content Type | Frequency | Primary Goal |
|----------|-------------|-----------|--------------|
| **Pinterest** | Recipe cards, roundup pins | 5–10 pins/day | Recipe SEO traffic (huge for food) |
| **Instagram** | Recipe photos, community UGC spotlights | 1–2 posts/day + Stories | Brand awareness |
| **TikTok / Reels** | 60s recipe clips, sauce taste tests | 3–5/week | Discovery + virality |
| **X / Twitter** | Recipe drops, spicy news, hot takes | 2–3 tweets/day | Authority + links |
| **Facebook** | Blog posts, competition announcements | 1/day | Community + ads later |
| **YouTube** | Long-form reviews, recipe walkthroughs | 1/week | Long-term SEO + monetization |

### Automation flow (set-and-forget after initial setup)

```
New content published in Supabase
  → Vercel webhook → POST /api/admin/social-scheduler
    → Claude generates platform-specific captions (tone varies per platform)
    → Creates social_posts rows with staggered scheduled_at:
        Twitter:   published_at + 1 hour
        Instagram: published_at + 2 hours
        Pinterest: published_at + 3 hours (3 pin variants per recipe)
        Facebook:  published_at + 4 hours
    → /api/admin/social-scheduler cron (4x/day) posts via Buffer API
    → Updates social_posts.platform_post_id + status = 'published'
    → Weekly cron syncs engagement stats back to social_posts.engagement JSONB
```

### Caption generation prompt

```typescript
export const SOCIAL_CAPTION_PROMPT = (content, platform) => `
Generate a ${platform} caption for this FlamingFoodies ${content.type}: "${content.title}"

Brand voice: Bold, fun, food-obsessed. Never corporate. Use "🔥" max once if heat is relevant.

Platform-specific rules:
- twitter:    Max 240 chars. 2-3 hashtags. Include [LINK]. Strong hook in first line.
- instagram:  150-200 chars of caption + 8-10 hashtags below a line break. Say "link in bio".
- pinterest:  200-300 chars, keyword-rich description for search. 2-3 hashtags. Be descriptive.
- facebook:   1-2 conversational sentences. End with a question to drive comments.
- tiktok:     Short punchy hook line only (for caption — video content is separate). 5-6 hashtags.

Return JSON: { "caption": "...", "hashtags": ["..."] }`;
```

### Pinterest automation (highest food traffic ROI)

Each recipe generates **3 pin variants** automatically:
1. Finished dish hero image
2. Ingredient flat lay (use Unsplash search for "flat lay [cuisine] ingredients")
3. Text overlay with recipe title + heat level badge (generate via `/api/og` endpoint)

Pinterest boards to create:
- By heat level: Mild Recipes, Medium Heat, Hot & Spicy, Inferno Level, Reaper Recipes
- By cuisine: Mexican Recipes, Korean Recipes, Thai Recipes, Indian Recipes (etc.)
- By type: Quick Weeknight Spicy Meals, Spicy Breakfast, Hot Sauce Reviews

---

## AFFILIATE & MONETIZATION

### Affiliate partner registry (`lib/affiliates.ts`)

```typescript
export const AFFILIATE_PARTNERS = {
  amazon: {
    name: 'Amazon',
    tag: process.env.NEXT_PUBLIC_AMAZON_TAG, // 'flamingfoodies-20'
    buildUrl: (asin: string) =>
      `https://www.amazon.com/dp/${asin}?tag=${process.env.NEXT_PUBLIC_AMAZON_TAG}`
  },
  heatonist: {
    name: 'Heatonist',
    baseUrl: 'https://heatonist.com',
    tag: 'flamingfoodies'
  },
  fuego_box: {
    name: 'Fuego Box',
    baseUrl: 'https://fuegobox.com',
    tag: 'flamingfoodies'
  },
  pepper_joe: {
    name: "Pepper Joe's",
    baseUrl: 'https://pepperjoes.com'
  },
  mike_hot_sauce: {
    name: "Mike's Hot Honey",
    baseUrl: 'https://mikeshothoney.com'
  }
};

// Pre-built link registry (key → destination)
export const AFFILIATE_LINKS: Record<string, {url: string; partner: string; product: string}> = {
  'amazon-carolina-reaper-seeds':      { url: 'https://amazon.com/...', partner: 'amazon',   product: 'Carolina Reaper Seeds' },
  'amazon-cast-iron-skillet':          { url: 'https://amazon.com/...', partner: 'amazon',   product: 'Lodge Cast Iron Skillet' },
  'amazon-mortar-pestle':              { url: 'https://amazon.com/...', partner: 'amazon',   product: 'Marble Mortar & Pestle' },
  'amazon-fermentation-crock':         { url: 'https://amazon.com/...', partner: 'amazon',   product: 'Fermentation Crock' },
  'amazon-instant-pot':                { url: 'https://amazon.com/...', partner: 'amazon',   product: 'Instant Pot Duo' },
  'heatonist-hot-ones-season-22':      { url: 'https://heatonist.com/...', partner: 'heatonist', product: 'Hot Ones Season 22 Pack' },
  'fuego-box-monthly-subscription':    { url: 'https://fuegobox.com/...', partner: 'fuego_box', product: 'Monthly Subscription Box' },
};
```

### Revenue model priority

| Revenue Source | Setup Effort | Time to Revenue |
|----------------|-------------|-----------------|
| Affiliate links (Amazon + partners) | Low | Immediate |
| Skimlinks auto-monetization | Very low | Immediate |
| Google AdSense | Low | At ~10k monthly sessions |
| Sponsored content / brand partnerships | Medium | At ~50k monthly sessions |
| FlamingFoodies merch (Printful) | Medium | Any time |
| Subscription box partnership (Fuego Box affiliate) | Low | Immediate |
| Own subscription box | High | Year 2+ |

---

## COMPETITIVE INSIGHTS

Research findings from top food/community sites — baked into the build:

| Insight | Source | How to Apply |
|---------|--------|-------------|
| **Personal brand = trust** | Chili Pepper Madness, Heatonist | Put a founder voice in all content early, even AI posts carry a consistent editorial persona |
| **Reddit community = free early traffic** | r/hotsauce (drives real Kickstarter $) | Create r/FlamingFoodies on day 1, link from footer |
| **Pinterest is a recipe traffic machine** | AllRecipes, Chili Pepper Madness (200K pins) | Auto-pin every recipe on publish — 3 variants |
| **Review framework = authority** | Serious Eats, Hot Sauce Blog | Standardize: heat level + flavor notes + Scoville + cooking applications + pairings |
| **Membership creates retention** | Heatonist | Add free "Flame Club" (email list) before paid tiers. Referral program: "Share the heat, get a free recipe book" |
| **Annual awards = PR + backlinks** | Hot Sauce Blog (20 years) | Annual FlamingFoodies Awards every December |
| **Food52 cautionary tale** | 2026 acquisition fallout | Don't pivot too fast to commerce. Build content audience first |
| **Monthly competitions = cheap UGC** | General community pattern | "Hottest Recipe" competition monthly — generates content + email signups + social buzz |
| **60s silent videos outperform** | Tasty/BuzzFeed | Start with phone-recorded sauce taste tests — pacing > production quality |
| **Long-form YouTube builds loyalty** | Bon Appétit (34K → 6M subs) | Invest in 15-25 min sauce review videos once content is established |
| **Specificity beats breadth** | Pepper Geek (niche pepper focus) | Go deep on cuisines: "The Complete Guide to Korean Gochugaru" outranks generic "spicy Korean food" |

### Design inspiration (layout references)

- **Navigation pattern:** Food52 — persistent mega-menu with Browse by Cuisine + Browse by Heat Level
- **Recipe card:** Serious Eats — rating stars, time badges, difficulty indicator, heat badge
- **Community feed:** Allrecipes comments section + Reddit card layout hybrid
- **Profile + gamification:** Duolingo-style heat score with milestone badges (🔥 100 | 🌶️ 500 | 💀 1000)
- **Competition gallery:** Pinterest masonry grid with vote counts overlaid on hover
- **Hot sauce review:** Wine rating card — Scoville range, flavor wheel, food pairings

---

## ENVIRONMENT VARIABLES

```bash
# Site
NEXT_PUBLIC_SITE_URL=https://flamingfoodies.com
NEXT_PUBLIC_SITE_NAME=FlamingFoodies

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...         # server-side only, never expose to client

# Auth (NextAuth.js v5)
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://flamingfoodies.com
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Email
CONVERTKIT_API_KEY=xxx
CONVERTKIT_FORM_ID=xxx

# Affiliates
NEXT_PUBLIC_AMAZON_TAG=flamingfoodies-20

# Analytics
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
NEXT_PUBLIC_CLARITY_ID=xxxxxxxxxx
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=flamingfoodies.com

# Ads
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_SHOW_ADS=false

# Redis (Upstash — for anonymous like counters)
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=xxx

# AI Content Generation
ANTHROPIC_API_KEY=sk-ant-xxx
CRON_SECRET=generate-with-openssl-rand-hex-32   # protects /api/admin/* cron endpoints

# Image sourcing for AI content
UNSPLASH_ACCESS_KEY=xxx
PEXELS_API_KEY=xxx

# Social media scheduling
BUFFER_ACCESS_TOKEN=xxx     # or Later API token
BUFFER_PROFILE_IDS='{"twitter":"xxx","instagram":"xxx","pinterest":"xxx","facebook":"xxx"}'

# Skimlinks (auto-affiliate monetization)
NEXT_PUBLIC_SKIMLINKS_ID=xxxxx

# Maintenance
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

---

## BUILD ORDER

Build in this order — each phase is shippable on its own.

### Phase 1 — Foundation (Week 1)
1. Init Next.js 14 + TypeScript + Tailwind + ESLint
2. Run Supabase schema (this file)
3. Configure brand colors in `tailwind.config.ts`
4. Build `<Header>` + `<Footer>` with auth nav
5. Set up NextAuth.js (Google + GitHub providers, `/auth/callback`, `/onboarding`)
6. Build `/api/og` (dynamic OG images — flame gradient)

### Phase 2 — Editorial Content (Week 1-2)
7. Build recipe fetch functions (`lib/supabase/recipes.ts`)
8. Build `/recipes`, `/recipes/[slug]` with `<RecipeSchema>` structured data
9. Build `/blog`, `/blog/[slug]`
10. Build `/reviews`, `/reviews/[slug]` with `<ReviewSchema>`
11. Build `/go/[partner]` affiliate redirect + `lib/affiliates.ts`
12. Wire up SEO: `generateMetadata()`, `sitemap.ts`, `robots.txt`

### Phase 3 — Homepage + Email (Week 2)
13. Build homepage (featured recipes, top sauces, heat quiz CTA, email signup)
14. Build `<EmailCapture>` component + `/api/subscribe` + ConvertKit integration
15. Wire up GA4 + Plausible + Clarity

### Phase 4 — Admin CMS (Week 2-3)
16. Build `/admin` layout with role guard middleware
17. Build `<ContentTable>` + `<RichTextEditor>` (Tiptap + Supabase Storage uploads)
18. Build content pages: `/admin/content/blog`, `/admin/content/recipes`, `/admin/content/reviews`
19. Build `/admin/settings` (site_settings feature flag editor)

### Phase 5 — Content Generation Pipeline (Week 3)
20. Build `/api/admin/generate` endpoint + generation prompts (`lib/generation/prompts.ts`)
21. Build `/api/admin/publish-scheduled` (auto-publish drafts)
22. Build `/admin/automation/jobs` + `/admin/automation/schedule` admin views
23. Configure `vercel.json` crons
24. Seed: run generation 20x to get initial content

### Phase 6 — Community Features (Week 3-4)
25. Build `/community` feed + community post card components
26. Build `/community/submit` form + Supabase Storage image upload
27. Build `/profile/[username]` public profile + heat score display
28. Build `/admin/community/moderation` queue
29. Build like system (authenticated likes in Supabase + anonymous likes via Redis)
30. Build comments system

### Phase 7 — Competitions (Week 4)
31. Build `/competitions` index + `/competitions/[slug]`
32. Build `/competitions/[slug]/enter` submission form
33. Build voting system + competition status management
34. Build `/admin/competitions` management panel

### Phase 8 — Quiz + Newsletter + Social (Week 4-5)
35. Build quiz (`/quiz` → `/quiz/results/[type]`) with 5-6 heat tolerance personalities
36. Build `/admin/newsletter` (subscriber list + campaign composer)
37. Build `/api/admin/social-scheduler` + `/api/admin/newsletter-digest` cron endpoints
38. Set up Buffer API integration + social caption generation
39. Build `/admin/social` queue manager

### Phase 9 — Commerce + Polish (Week 5-6)
40. Build `/shop` (Printful embed) + `/subscriptions` (Fuego Box affiliate)
41. Build leaderboard (`/leaderboard`) + heat score milestones
42. Build `/admin/analytics` (Plausible embed + custom Supabase charts)
43. Set up `ads.txt`, image `remotePatterns`, Skimlinks script
44. Create subreddit r/FlamingFoodies

---

## DAILY SPOT AUDIT CHECKLIST

Your daily routine once everything is running (~15 minutes):

```
MORNING CHECK

Admin → Automation → Jobs:
  □ Did yesterday's cron jobs complete? (all green)
  □ Any failed jobs? → click Retry or skip

Admin → Content → Review Queue:
  □ Skim 2-3 AI-generated drafts (check quality, approve or edit)
  □ Any community submissions pending? Approve/reject

Admin → Community → Moderation:
  □ Moderation queue empty or low? (<5 = healthy)

Admin → Analytics (30 second glance):
  □ Traffic normal? (no unexplained spikes or drops)
  □ Top affiliate click today = opportunity to promote more?

Admin → Social:
  □ Posts for today queued? Caption look good?
  □ Any social engagement to respond to? (do manually, keep it human)

---

WEEKLY (Sunday, ~30 min):

  □ Review auto-generated newsletter draft → approve + send
  □ Check Google Search Console (new keywords ranking? any drops?)
  □ Competition check: running one? Any entries to approve?
  □ Heat leaderboard: any users to spotlight in the newsletter?
  □ Refresh 1-2 low-performing AI recipes manually (add better image, tweak SEO title)
```

---

## LESSONS LEARNED FROM ASSGOODASGOLD

These are production-proven lessons from the reference build — apply them from day one:

- **Build script order matters:** `velite build && next build` — if using Velite, it must compile before Next.js. For Supabase-driven content use `next build` only.
- **Canonical URLs:** decide www vs non-www on day 1 and be consistent everywhere — sitemap, OG, canonical tags, and AdSense verification domain must all match.
- **Apple icon:** add `apple-icon.tsx` (not just `favicon.ico`) to avoid 404s on iOS.
- **Noindex empty filter pages:** if `/recipes?heat=reaper` returns 0 results, add `noindex` — Google penalizes thin content pages.
- **Affiliate redirects:** use 307 (temporary), not 301 (permanent), so affiliate tracking parameters are preserved on redirect.
- **Skimlinks:** load in `<head>` (not deferred) — it needs to parse links on initial DOM render.
- **ISR revalidation:** use `revalidate = 3600` on homepage to refresh like counts + featured content without full rebuild. Use on-demand revalidation (`revalidatePath`) when admin publishes content.
- **Redis like keys:** use a namespaced pattern — `flamingfoodies:likes:recipe:{id}` — prevents key collisions.
- **Clarity + ad blockers:** load Microsoft Clarity non-blocking (don't let it delay render).
- **Sitemap filtering:** filter any content type with 0 published records from sitemap — Google penalizes 404 sitemap URLs.
- **Image remote patterns:** whitelist these in `next.config.mjs`:
  - `images.unsplash.com`
  - `m.media-amazon.com`
  - `cdn.shopify.com`
  - `*.supabase.co` (Supabase Storage)
  - `lh3.googleusercontent.com` (Google OAuth avatars)
  - `avatars.githubusercontent.com` (GitHub OAuth avatars)
- **Server vs client components:** App Router defaults to server. Only add `'use client'` to components that need hooks, events, or browser APIs. Quiz, like buttons, comment forms, community upload = client. Recipe display, blog post, admin tables = server.
- **AI content quality gate:** even with `auto_publish_delay_hours = 4`, always scan the daily queue. Claude occasionally generates plausible but culturally inaccurate recipes — a quick human scan catches these before they index.
- **Social automation caveat:** never fully auto-post without a review step on Instagram — platform ToS is strict and a single bad automated post can get the account flagged. Schedule, then approve.
