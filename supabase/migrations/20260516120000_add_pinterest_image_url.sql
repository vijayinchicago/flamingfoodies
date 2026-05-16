-- Add pinterest_image_url to the four editorial content tables. The field is
-- optional; when populated with a 1000x1500 portrait variant of the hero
-- image, the runtime metadata layer renders an additional og:image and
-- pinterest:image meta tags so Pinterest readers grab the pin-friendly
-- variant alongside the standard 1200x630 share card.
--
-- Nullable + no default — existing rows continue to render with only the
-- landscape OG image until each entry is curated with a real portrait URL.

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS pinterest_image_url TEXT;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS pinterest_image_url TEXT;

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS pinterest_image_url TEXT;

ALTER TABLE peppers
  ADD COLUMN IF NOT EXISTS pinterest_image_url TEXT;

COMMENT ON COLUMN recipes.pinterest_image_url IS
  'Optional 1000x1500 portrait hero variant for Pinterest pins.';
COMMENT ON COLUMN reviews.pinterest_image_url IS
  'Optional 1000x1500 portrait hero variant for Pinterest pins.';
COMMENT ON COLUMN blog_posts.pinterest_image_url IS
  'Optional 1000x1500 portrait hero variant for Pinterest pins.';
COMMENT ON COLUMN peppers.pinterest_image_url IS
  'Optional 1000x1500 portrait hero variant for Pinterest pins.';
