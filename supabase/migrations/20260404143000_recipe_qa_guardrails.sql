ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS hero_image_reviewed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS cuisine_qa_reviewed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS qa_notes TEXT;

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS qa_report JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS qa_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_recipes_qa_review
  ON recipes (status, hero_image_reviewed, cuisine_qa_reviewed);
