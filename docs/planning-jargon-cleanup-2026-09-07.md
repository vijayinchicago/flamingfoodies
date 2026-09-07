# Reader-facing planning-jargon cleanup — September 7, 2026

## Scope and result

- Replaced “lane” metaphors across author pages, shared recipe sections, sauce comparisons,
  guides, quizzes, newsletter choices, shop categories, seasonal pages and festival pages.
- Rewrote related planning phrases, including “browse by intent,” “why-buy case,”
  “use case,” “shopping paths,” “buying paths,” “More Paths,” “Pillar guide,”
  “practical signals” and “Action-oriented buyers.” Removed publishing-strategy sentences
  such as “If someone lands here from search,” plus “cooking layer,” “Trust links,”
  “Shopping rail,” “highest-signal buys,” and reader-retention labels on recipes.
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

Also inspected the public text in `search_runtime_optimizations`. Cleaned one Nashville
hot chicken intro override and its source defaults, with a full settings backup and an
exact-value concurrency check. All other runtime settings remain unchanged.

Live verification exposed a cached previous version of that intro override alongside the
new source default. Purged this project's data cache and verified that the older duplicate
disappeared. Direct database repairs need cache revalidation as well as a new deployment;
the database audit alone does not prove the rendered page is current.

## Prevention and validation

The shared generation policy now explicitly separates planning inputs from reader prose.
Deterministic QA blocks known planning jargon, and the model QA instruction requires a
contextual review beyond the listed examples. Recipe prompt labels now say “Dish category”
and “Dish guidance” rather than encouraging the metaphor.

Added public-template regression scanning and nested-copy QA tests, including legitimate
street names and internal taxonomy exemptions. Focused tests, TypeScript and lint pass.
The unrelated pre-existing newsletter cron test is not changed by this work.

This is a contextual copy edit, not an AI-authorship detector or a full fact-check of the archive.
