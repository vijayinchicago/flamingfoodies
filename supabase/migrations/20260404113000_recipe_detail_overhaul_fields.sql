ALTER TABLE recipes
  ADD COLUMN ingredient_sections JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN method_steps JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN active_time_minutes INTEGER,
  ADD COLUMN make_ahead_notes TEXT,
  ADD COLUMN storage_notes TEXT,
  ADD COLUMN reheat_notes TEXT,
  ADD COLUMN serving_suggestions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN substitutions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN faqs JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN hero_summary TEXT;
