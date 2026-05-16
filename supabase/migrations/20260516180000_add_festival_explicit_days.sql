-- Add explicit start_day / end_day to the festivals table. The existing
-- date_range field is free text ("Early May", "April 25–26", "Mid October")
-- which works for display but is imprecise for date-aware filtering. With
-- explicit day-of-month columns, getFestivalStatus can determine accurately
-- whether an annual festival has already happened this year.
--
-- Both columns are nullable so existing rows continue to work via the
-- dateRange-parsing fallback in estimateFestivalEndDay.

ALTER TABLE festivals
  ADD COLUMN IF NOT EXISTS start_day SMALLINT
    CHECK (start_day IS NULL OR (start_day BETWEEN 1 AND 31));

ALTER TABLE festivals
  ADD COLUMN IF NOT EXISTS end_day SMALLINT
    CHECK (end_day IS NULL OR (end_day BETWEEN 1 AND 31));

COMMENT ON COLUMN festivals.start_day IS
  'Optional explicit start day-of-month (1-31). When populated, used by the runtime status helper to determine accurately whether an annual festival has already happened this year.';
COMMENT ON COLUMN festivals.end_day IS
  'Optional explicit end day-of-month (1-31). When populated, takes precedence over parsing the free-text date_range field.';
