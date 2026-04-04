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
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    CASE
      WHEN NULLIF(NEW.raw_user_meta_data->>'user_name', '') IS NOT NULL THEN
        NEW.raw_user_meta_data->>'user_name'
      ELSE
        COALESCE(
          NULLIF(
            regexp_replace(lower(split_part(COALESCE(NEW.email, ''), '@', 1)), '[^a-z0-9-]+', '-', 'g'),
            ''
          ),
          'user'
        ) || '-' || substr(NEW.id::text, 1, 6)
    END,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'FlamingFoodies Member'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- ============================================
-- STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('admin-media', 'admin-media', true),
  ('community-media', 'community-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "admin_media_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'admin-media' AND auth.role() = 'authenticated');

CREATE POLICY "community_media_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community-media' AND auth.role() = 'authenticated');
