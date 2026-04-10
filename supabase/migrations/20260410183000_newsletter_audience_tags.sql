ALTER TABLE newsletter_campaigns
ADD COLUMN IF NOT EXISTS audience_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tags
  ON newsletter_subscribers
  USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_audience_tags
  ON newsletter_campaigns
  USING GIN (audience_tags);
