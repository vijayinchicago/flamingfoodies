ALTER TABLE newsletter_campaigns
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS provider_broadcast_id TEXT;
