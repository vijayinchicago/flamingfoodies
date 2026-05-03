-- Adds referral tracking to the newsletter system. Each subscriber gets a
-- short referral_token used in share links (?ref=TOKEN). When a new signup
-- arrives with a ref token, we record the relationship and increment the
-- referrer's referral_count so milestone tiers can fire.

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS referral_token TEXT,
  ADD COLUMN IF NOT EXISTS referrer_token TEXT,
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_tier INTEGER NOT NULL DEFAULT 0;

-- Backfill tokens for any existing subscribers
UPDATE newsletter_subscribers
SET referral_token = encode(gen_random_bytes(6), 'hex')
WHERE referral_token IS NULL;

CREATE OR REPLACE FUNCTION set_newsletter_referral_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_token IS NULL OR NEW.referral_token = '' THEN
    NEW.referral_token := encode(gen_random_bytes(6), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS newsletter_subscribers_set_referral_token
  ON newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_set_referral_token
  BEFORE INSERT ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION set_newsletter_referral_token();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'newsletter_subscribers_referral_token_unique'
  ) THEN
    ALTER TABLE newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_referral_token_unique
      UNIQUE (referral_token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_newsletter_referrer_token
  ON newsletter_subscribers(referrer_token)
  WHERE referrer_token IS NOT NULL;

-- Per-referral audit log so we can verify counts and prevent double-credit
CREATE TABLE IF NOT EXISTS newsletter_referrals (
  id             BIGSERIAL PRIMARY KEY,
  referrer_token TEXT NOT NULL,
  referrer_email TEXT NOT NULL,
  referee_email  TEXT NOT NULL UNIQUE,
  source         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_referrals_referrer_email
  ON newsletter_referrals(referrer_email);
CREATE INDEX IF NOT EXISTS idx_newsletter_referrals_referrer_token
  ON newsletter_referrals(referrer_token);
