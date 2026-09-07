# Editorial cleanup — September 7, 2026

## Scope

- Audited 228 published recipes, 131 published articles, and 10 published reviews.
- Reviewed changes to 40 recipes and 73 articles (113 pages), including article headlines and search descriptions.
- Removed stock promotional copy and explicit invented personal-experience claims; cut unsupported scientific explanations from the flagged articles.
- Preserved recipe ingredients, quantities, cooking steps, URLs, authors, publication dates, status, source links, and internal provenance.
- Revised homepage, About, author profiles, editorial-policy copy, and deterministic social captions.
- Kept affiliate disclosures, actual image credits, and accurate editorial-pen-name and automation information. Detailed QA notes remain in admin rather than appearing as raw workflow notes on review pages.

## Future generation

All eight model request sites use the shared editorial policy, including research/discovery,
newsletters, and catalog descriptions. Recipe/article/review generation, polish, and model QA
share the rules. The polish and QA passes receive the voice selected by the existing byline
router. The social-caption prompt uses the same standard.

Known model artifacts and stock filler are publishing blockers. Discovery and newsletter
responses receive the same deterministic copy checks before use. The pre-publication gate
also scans raw public copy, including SEO fields omitted from some display models.

This is not an authorship detector or a guarantee against every possible future phrase.
No literal model watermark was identified by the text/source audit or the sampled homepage
image inspection. Hidden image provenance or watermarking has not been removed or certified.
The archive repair is not a substitute for a full recipe-testing or factual-sourcing program.

## Recovery

Original rows, proposed edits, and approved file lists are stored locally under the gitignored
`artifacts/editorial-cleanup` directory. The first article pass was rejected; only filenames
in the approved manifests were applied. Writes compare original field values to avoid
overwriting concurrent changes. Do not commit the database backups or response artifacts.

## Credentials

The repository owner account is `vijayinchicago`. The other signed-in account, `vijay-otl`,
has read access but cannot push. This repository's GitHub helper now requests the owner's
existing stored credential explicitly, independent of the shared CLI's active account.
No credential is stored in the repository or this document. No new GitHub token or Claude
key was needed. The production model setting was not changed by this cleanup.
