ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS image_reviewed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS fact_qa_reviewed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS qa_notes TEXT;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS qa_report JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS qa_checked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reviews_qa_publish
  ON reviews (status, image_reviewed, fact_qa_reviewed);
