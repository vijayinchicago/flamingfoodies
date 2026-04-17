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
CREATE POLICY "peppers_public_read" ON peppers FOR SELECT USING (status = 'published');

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
CREATE POLICY "brands_public_read" ON brands FOR SELECT USING (status = 'published');

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
CREATE POLICY "tutorials_public_read" ON tutorials FOR SELECT USING (status = 'published');

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
CREATE POLICY "releases_public_read" ON releases FOR SELECT USING (status = 'published');

-- ============================================================
-- updated_at triggers (peppers, brands, tutorials)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER peppers_updated_at   BEFORE UPDATE ON peppers   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER brands_updated_at    BEFORE UPDATE ON brands    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER tutorials_updated_at BEFORE UPDATE ON tutorials FOR EACH ROW EXECUTE FUNCTION set_updated_at();
