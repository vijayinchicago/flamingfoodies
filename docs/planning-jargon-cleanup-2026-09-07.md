# Reader-facing planning-jargon cleanup — September 7, 2026

## Scope and result

- Replaced “lane” metaphors across author pages, shared recipe sections, sauce comparisons,
  guides, quizzes, newsletter choices, shop categories, seasonal pages and festival pages.
- Rewrote related planning phrases, including “browse by intent,” “why-buy case,”
  “use case,” “shopping paths,” “practical signals” and “Action-oriented buyers.”
- Kept analytics identifiers, database taxonomy, URLs and admin operations unchanged.
- Retained affiliate, automation and editorial-pen-name disclosures and image credits.
- Source-backed catalog and sample copy were included, along with the guide sync script.

## Published database content

Audited 228 recipes, 131 blog posts and 10 reviews. Made 11 reviewed, exact-match prose
replacements across blog posts 3, 6 and 68 and reviews 3 and 6. No recipe bodies needed
changes for the searched patterns; shared recipe templates supplied the offending labels.
The post-update audit returned zero matches for the searched jargon in all 369 records.

The optional brands, peppers, festivals and tutorials tables are absent in production.
Their source-backed content was scanned instead; this is not a claim that those database
tables were inspected. Local backups and the approved replacement manifest are in
`artifacts/editorial-cleanup/planning-jargon/` (gitignored).

## Prevention and validation

The shared generation policy now explicitly separates planning inputs from reader prose.
Deterministic QA blocks known planning jargon, and the model QA instruction requires a
contextual review beyond the listed examples. Recipe prompt labels now say “Dish category”
and “Dish guidance” rather than encouraging the metaphor.

Added public-template regression scanning and nested-copy QA tests, including legitimate
street names and internal taxonomy exemptions. Focused tests, TypeScript and lint pass.
The unrelated pre-existing newsletter cron test is not changed by this work.

This is a contextual copy edit, not an AI-authorship detector or a full fact-check of the archive.
