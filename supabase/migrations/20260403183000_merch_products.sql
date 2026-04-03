CREATE TABLE merch_products (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  badge       TEXT NOT NULL,
  description TEXT NOT NULL,
  price_label TEXT NOT NULL,
  availability TEXT NOT NULL DEFAULT 'preview'
    CHECK (availability IN ('preview', 'waitlist', 'live')),
  theme_key   TEXT NOT NULL DEFAULT 'flame'
    CHECK (theme_key IN ('flame', 'ember', 'gold', 'cream', 'smoke', 'charcoal')),
  href        TEXT NOT NULL,
  cta_label   TEXT NOT NULL DEFAULT 'Join merch waitlist',
  image_url   TEXT,
  image_alt   TEXT,
  featured    BOOLEAN NOT NULL DEFAULT false,
  status      post_status NOT NULL DEFAULT 'draft',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merch_products_status ON merch_products(status);
CREATE INDEX idx_merch_products_featured ON merch_products(featured) WHERE status = 'published';
CREATE INDEX idx_merch_products_sort_order ON merch_products(sort_order ASC);

ALTER TABLE merch_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merch_published_read"
  ON merch_products FOR SELECT
  USING (status = 'published');

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON merch_products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
