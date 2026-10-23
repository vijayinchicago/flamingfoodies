-- Recovery: restore missing discovery schema; no row mutations or public-client access.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- ============================================================
-- Peppers table
-- ============================================================
CREATE TABLE IF NOT EXISTS peppers (
  id              BIGSERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  aliases         TEXT[] NOT NULL DEFAULT '{}',
  origin          TEXT NOT NULL DEFAULT 'north-america',
  scoville_min    INTEGER NOT NULL DEFAULT 0,
  scoville_max    INTEGER NOT NULL DEFAULT 0,
  heat_tier       TEXT NOT NULL DEFAULT 'medium',
  color           TEXT NOT NULL DEFAULT '',
  flavor_profile  TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  editorial_note  TEXT NOT NULL DEFAULT '',
  culinary_uses   TEXT[] NOT NULL DEFAULT '{}',
  pairs_with      TEXT[] NOT NULL DEFAULT '{}',
  fun_fact        TEXT NOT NULL DEFAULT '',
  affiliate_keys  TEXT[] NOT NULL DEFAULT '{}',
  recipe_tag_match TEXT[] NOT NULL DEFAULT '{}',
  featured        BOOLEAN NOT NULL DEFAULT false,
  source          TEXT NOT NULL DEFAULT 'editorial',
  status          TEXT NOT NULL DEFAULT 'published',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE peppers ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Brands table
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id                  BIGSERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  tagline             TEXT NOT NULL DEFAULT '',
  founded             TEXT NOT NULL DEFAULT '',
  origin              TEXT NOT NULL DEFAULT 'usa',
  city                TEXT NOT NULL DEFAULT '',
  tier                TEXT NOT NULL DEFAULT 'craft',
  description         TEXT NOT NULL DEFAULT '',
  editorial_note      TEXT NOT NULL DEFAULT '',
  why_it_matters      TEXT NOT NULL DEFAULT '',
  best_for            TEXT NOT NULL DEFAULT '',
  pepper_slug         TEXT,
  signature_products  JSONB NOT NULL DEFAULT '[]',
  featured            BOOLEAN NOT NULL DEFAULT false,
  source              TEXT NOT NULL DEFAULT 'editorial',
  status              TEXT NOT NULL DEFAULT 'published',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Tutorials table
-- ============================================================
CREATE TABLE IF NOT EXISTS tutorials (
  id                BIGSERIAL PRIMARY KEY,
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'cooking-technique',
  difficulty        TEXT NOT NULL DEFAULT 'beginner',
  time_estimate     TEXT NOT NULL DEFAULT '',
  description       TEXT NOT NULL DEFAULT '',
  intro             TEXT NOT NULL DEFAULT '',
  steps             JSONB NOT NULL DEFAULT '[]',
  pro_tips          TEXT[] NOT NULL DEFAULT '{}',
  affiliate_keys    TEXT[] NOT NULL DEFAULT '{}',
  recipe_tag_match  TEXT[] NOT NULL DEFAULT '{}',
  featured          BOOLEAN NOT NULL DEFAULT false,
  source            TEXT NOT NULL DEFAULT 'editorial',
  status            TEXT NOT NULL DEFAULT 'published',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Releases table
-- ============================================================
CREATE TABLE IF NOT EXISTS releases (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  brand         TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL DEFAULT 'new-product',
  description   TEXT NOT NULL DEFAULT '',
  body          TEXT NOT NULL DEFAULT '',
  affiliate_key TEXT,
  source_url    TEXT,
  featured      BOOLEAN NOT NULL DEFAULT false,
  source        TEXT NOT NULL DEFAULT 'ai_discovered',
  status        TEXT NOT NULL DEFAULT 'published',
  published_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE releases ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- updated_at triggers (peppers, brands, tutorials)
-- ============================================================
CREATE OR REPLACE FUNCTION set_discovery_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS peppers_updated_at ON peppers;
CREATE TRIGGER peppers_updated_at   BEFORE UPDATE ON peppers   FOR EACH ROW EXECUTE FUNCTION set_discovery_updated_at();
DROP TRIGGER IF EXISTS brands_updated_at ON brands;
CREATE TRIGGER brands_updated_at    BEFORE UPDATE ON brands    FOR EACH ROW EXECUTE FUNCTION set_discovery_updated_at();
DROP TRIGGER IF EXISTS tutorials_updated_at ON tutorials;
CREATE TRIGGER tutorials_updated_at BEFORE UPDATE ON tutorials FOR EACH ROW EXECUTE FUNCTION set_discovery_updated_at();

-- Festivals table: seeded from static data, grown nightly by the discovery agent
CREATE TABLE IF NOT EXISTS festivals (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  short_name    TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  state         TEXT NOT NULL DEFAULT '',
  state_code    TEXT NOT NULL DEFAULT '',
  region        TEXT NOT NULL DEFAULT 'south',
  month         INTEGER NOT NULL DEFAULT 1,
  date_range    TEXT NOT NULL DEFAULT '',
  annual        BOOLEAN NOT NULL DEFAULT true,
  website       TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  tagline       TEXT NOT NULL DEFAULT '',
  editorial_note TEXT NOT NULL DEFAULT '',
  what_to_expect TEXT[] NOT NULL DEFAULT '{}',
  best_for      TEXT NOT NULL DEFAULT '',
  pack_intro    TEXT NOT NULL DEFAULT '',
  pack_affiliate TEXT[] NOT NULL DEFAULT '{}',
  cuisine_tags  TEXT[] NOT NULL DEFAULT '{}',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  featured      BOOLEAN NOT NULL DEFAULT false,
  -- provenance
  source        TEXT NOT NULL DEFAULT 'editorial', -- 'editorial' | 'ai_discovered'
  status        TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically bump updated_at on row change
CREATE OR REPLACE FUNCTION set_festivals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS festivals_updated_at ON festivals;
CREATE TRIGGER festivals_updated_at
  BEFORE UPDATE ON festivals
  FOR EACH ROW EXECUTE FUNCTION set_festivals_updated_at();


ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE peppers ADD COLUMN IF NOT EXISTS pinterest_image_url TEXT;
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS start_day SMALLINT CHECK (start_day IS NULL OR start_day BETWEEN 1 AND 31);
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS end_day SMALLINT CHECK (end_day IS NULL OR end_day BETWEEN 1 AND 31);
REVOKE ALL ON peppers, brands, tutorials, releases, festivals FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON peppers, brands, tutorials, releases, festivals TO service_role;
GRANT USAGE, SELECT ON SEQUENCE peppers_id_seq, brands_id_seq, tutorials_id_seq, releases_id_seq, festivals_id_seq TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
