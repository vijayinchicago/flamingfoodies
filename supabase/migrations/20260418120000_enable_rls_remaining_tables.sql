-- ============================================================
-- Enable RLS on all tables that were missing it.
-- Tables already covered: profiles, blog_posts, recipes, reviews,
--   community_posts, likes, comments, follows, recipe_saves,
--   merch_products, telemetry_events (rls enabled, no policies),
--   festivals, peppers, brands, tutorials, releases.
-- ============================================================


-- ============================================================
-- 1. NEWSLETTER SUBSCRIBERS — most critical: email + convertkit_id
--    Service-role only. No public or authenticated access at all.
-- ============================================================
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
-- No policies added: service_role bypasses RLS and is the only path in.


-- ============================================================
-- 2. NEWSLETTER CAMPAIGNS — internal content, no public access
-- ============================================================
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
-- No policies: service_role only.


-- ============================================================
-- 3. AFFILIATE CLICKS — insert-only for tracking; reads are internal
-- ============================================================
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Allow any request (anon or authenticated) to insert a click event.
-- The app's API route records clicks server-side, but this allows
-- direct client calls if needed. No SELECT exposed to public.
CREATE POLICY "affiliate_clicks_insert"
  ON affiliate_clicks FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read their own clicks (e.g. for dedup).
CREATE POLICY "affiliate_clicks_owner_read"
  ON affiliate_clicks FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================================
-- 4. CONTENT GENERATION JOBS — internal automation only
-- ============================================================
ALTER TABLE content_generation_jobs ENABLE ROW LEVEL SECURITY;
-- No policies: service_role only.


-- ============================================================
-- 5. GENERATION SCHEDULE — internal automation config
-- ============================================================
ALTER TABLE generation_schedule ENABLE ROW LEVEL SECURITY;
-- No policies: service_role only.


-- ============================================================
-- 6. SOCIAL POSTS — internal automation only
-- ============================================================
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
-- No policies: service_role only.


-- ============================================================
-- 7. MODERATION QUEUE — admin/moderator only
-- ============================================================
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit a report (insert).
CREATE POLICY "moderation_queue_auth_insert"
  ON moderation_queue FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Moderators and admins can read and update the queue.
-- (Reads by service_role for automated moderation are always allowed.)
CREATE POLICY "moderation_queue_moderator_read"
  ON moderation_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );

CREATE POLICY "moderation_queue_moderator_update"
  ON moderation_queue FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('moderator', 'admin')
    )
  );


-- ============================================================
-- 8. ADMIN AUDIT LOG — contains ip_address; admin read only
-- ============================================================
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read the audit log. Inserts come from service_role triggers.
CREATE POLICY "admin_audit_log_admin_read"
  ON admin_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );


-- ============================================================
-- 9. SITE SETTINGS — public read (feature flags), service_role writes
-- ============================================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_settings_public_read"
  ON site_settings FOR SELECT
  USING (true);

-- No INSERT/UPDATE policy: only service_role (backend) can write settings.


-- ============================================================
-- 10. HEAT SCORE EVENTS — user engagement log
-- ============================================================
ALTER TABLE heat_score_events ENABLE ROW LEVEL SECURITY;

-- Users can read their own score history.
CREATE POLICY "heat_score_events_owner_read"
  ON heat_score_events FOR SELECT
  USING (auth.uid() = user_id);

-- Inserts come from trusted server-side triggers; no direct client insert.


-- ============================================================
-- 11. RECIPE RATINGS — authenticated users rate recipes
-- ============================================================
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can read ratings (displayed on recipe pages).
CREATE POLICY "recipe_ratings_public_read"
  ON recipe_ratings FOR SELECT
  USING (true);

-- Authenticated users can submit and update their own rating.
CREATE POLICY "recipe_ratings_auth_insert"
  ON recipe_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recipe_ratings_owner_update"
  ON recipe_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "recipe_ratings_owner_delete"
  ON recipe_ratings FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 12. COMMUNITY RECIPES — linked to community_posts
-- ============================================================
ALTER TABLE community_recipes ENABLE ROW LEVEL SECURITY;

-- Public can read published community recipes.
CREATE POLICY "community_recipes_published_read"
  ON community_recipes FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = user_id
  );

-- Authenticated users can submit their own community recipe.
CREATE POLICY "community_recipes_auth_insert"
  ON community_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_recipes_owner_update"
  ON community_recipes FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================================
-- 13. COMPETITIONS — public listing, no public writes
-- ============================================================
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competitions_public_read"
  ON competitions FOR SELECT
  USING (true);


-- ============================================================
-- 14. COMPETITION ENTRIES — public read of approved; auth insert
-- ============================================================
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can see approved entries.
CREATE POLICY "competition_entries_approved_read"
  ON competition_entries FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = user_id
  );

-- Authenticated users can submit their own entry.
CREATE POLICY "competition_entries_auth_insert"
  ON competition_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competition_entries_owner_update"
  ON competition_entries FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================================
-- 15. COMPETITION VOTES — owner can read/delete own vote; auth insert
-- ============================================================
ALTER TABLE competition_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "competition_votes_owner_read"
  ON competition_votes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "competition_votes_auth_insert"
  ON competition_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "competition_votes_owner_delete"
  ON competition_votes FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 16. TELEMETRY EVENTS — already has RLS enabled, add policies
--     Insert from any client (anonymous tracking); reads are internal.
-- ============================================================
CREATE POLICY "telemetry_events_anon_insert"
  ON telemetry_events FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read their own events.
CREATE POLICY "telemetry_events_owner_read"
  ON telemetry_events FOR SELECT
  USING (auth.uid() = user_id);
