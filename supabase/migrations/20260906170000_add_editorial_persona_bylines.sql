-- Give every first-party editorial item a stable, topic-matched byline.
-- The corresponding public profiles disclose that these names are editorial
-- pen names; the database values must never be presented as personal
-- credentials or as evidence of hands-on testing.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS author_name TEXT NOT NULL DEFAULT 'Miles Hart';

ALTER TABLE blog_posts
  ALTER COLUMN author_name SET DEFAULT 'Mara Santiago';

ALTER TABLE recipes
  ALTER COLUMN author_name SET DEFAULT 'Tess Calder';

UPDATE blog_posts
SET author_name = CASE
  WHEN lower(coalesce(category, '')) IN ('gear', 'reviews')
    OR lower(concat_ws(' ', title, category, array_to_string(tags, ' ')))
      ~ '\m(best|bottle|brand|buy|buyer|buying|choose|comparison|gift|gear|pick|price|product|review|shelf|shop|subscription|value)\M'
    THEN 'Miles Hart'
  WHEN lower(coalesce(category, '')) = 'science'
    OR lower(concat_ws(' ', title, category, array_to_string(tags, ' ')))
      ~ '\m(barbecue|bbq|brais[[:alnum:]_]*|capsaicin|chemistry|ferment[[:alnum:]_]*|grill[[:alnum:]_]*|method|pressure[- ]cook[[:alnum:]_]*|roast[[:alnum:]_]*|science|scoville|slow[- ]cook[[:alnum:]_]*|smok[[:alnum:]_]*|technique)\M'
    THEN 'Rowan Flint'
  WHEN lower(coalesce(category, '')) = 'recipes'
    OR lower(concat_ws(' ', title, category, array_to_string(tags, ' ')))
      ~ '\m(bowl|breakfast|cook[[:alnum:]_]*|dinner|lunch|meal|noodle|pasta|quick|recipe|serve|substitut[[:alnum:]_]*|taco|weeknight)\M'
    THEN 'Tess Calder'
  ELSE 'Mara Santiago'
END
WHERE lower(trim(author_name)) IN (
  'flamingfoodies',
  'flamingfoodies team',
  'flamingfoodies editorial',
  'flamingfoodies editorial team',
  'flamingfoodies ai desk',
  'qa'
);

UPDATE recipes
SET author_name = CASE
  WHEN difficulty = 'advanced'
    OR coalesce(total_time_minutes, 0) >= 75
    OR lower(concat_ws(' ', title, array_to_string(tags, ' ')))
      ~ '\m(barbecue|bbq|birria|brais[[:alnum:]_]*|brisket|ferment[[:alnum:]_]*|grill[[:alnum:]_]*|jerk|pressure[- ]cook[[:alnum:]_]*|project|rib[[:alnum:]_]*|roast[[:alnum:]_]*|slow[- ]cook[[:alnum:]_]*|smok[[:alnum:]_]*)\M'
    THEN 'Rowan Flint'
  ELSE 'Tess Calder'
END
WHERE lower(trim(author_name)) IN (
  'flamingfoodies',
  'flamingfoodies team',
  'flamingfoodies test kitchen',
  'flamingfoodies ai test kitchen',
  'qa'
);

UPDATE reviews
SET author_name = 'Miles Hart'
WHERE author_name IS NULL
  OR lower(trim(author_name)) IN (
    'flamingfoodies',
    'flamingfoodies team',
    'flamingfoodies review desk',
    'flamingfoodies ai desk',
    'qa'
  );

CREATE INDEX IF NOT EXISTS idx_blog_posts_author_name ON blog_posts(author_name);
CREATE INDEX IF NOT EXISTS idx_recipes_author_name ON recipes(author_name);
CREATE INDEX IF NOT EXISTS idx_reviews_author_name ON reviews(author_name);

COMMENT ON COLUMN blog_posts.author_name IS
  'Public byline. Named editorial personas are disclosed as pen names on their profile pages.';
COMMENT ON COLUMN recipes.author_name IS
  'Public byline. Named editorial personas are disclosed as pen names on their profile pages.';
COMMENT ON COLUMN reviews.author_name IS
  'Public byline. Named editorial personas are disclosed as pen names on their profile pages.';
