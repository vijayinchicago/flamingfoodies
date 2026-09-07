# FlamingFoodies editorial standard

The executable source of truth is [editorial-policy.json](../lib/generation/editorial-policy.json).
Every model-writing call uses it. Recipe, article and review publishing QA checks known
generation artifacts and stock filler; discovery and newsletter outputs are checked before use.

## Voice and identity

FlamingFoodies is about good food and adjustable heat. Write clear, welcoming, original
copy with useful ingredients, textures and cooking decisions. A pepper is an ingredient,
not a test of courage. Do not copy another publication's slogans, signature prose or branding.

We borrow general editorial principles, not claimed credentials or testing:
- [Serious Eats](https://www.seriouseats.com/about-us-5120006): useful explanations of how and why.
- [King Arthur Baking](https://www.kingarthurbaking.com/blog/2021/07/02/king-arthur-recipe-test-kitchen-process): precise, reproducible instructions and testing transparency.

These references do not mean FlamingFoodies has their test kitchens or testing history.

## Four editorial voices

- **Tess Calder:** weeknight cooking. Practical timing, fewer unnecessary steps, realistic swaps.
- **Rowan Flint:** technique and weekend projects. Texture, temperature and observable cues.
- **Mara Santiago:** ingredients and culture. Regional names, context and sourced history.
- **Miles Hart:** reviews and gear. Evidence, tradeoffs, price context, who should buy or skip.

These are disclosed editorial pen names. Never fabricate biographies, credentials, memories,
travel, tasting panels or experiments. Topic routing controls the byline; the prompt selects
the corresponding voice. No stock catchphrases for any persona.

## Write for the cook

Lead with what distinguishes this dish, ingredient or product. Keep introductions short.
Use action-led instructions with quantities, realistic timing and visible doneness cues.
Explain only supported mechanisms. Name adaptations instead of claiming universal authenticity.
Keep useful substitutions and heat adjustments; do not improvise preservation or safety advice.

Avoid empty praise such as “packed with flavor,” “mouthwatering,” “game-changer,”
“culinary journey,” “taste buds dancing” and “elevate your cooking.” Replace it with
specific information, not a new synonym for praise. Do not pad to hit a word count.
Do not repeat a prescribed opening, conclusion or three-item rhythm across the archive.

Normal punctuation, accents, non-Latin food names and meaningful joiners are not evidence of
machine writing. Do not flatten them or strip attribution in pursuit of an AI-detector score.

## Evidence and disclosures

A generated draft is not evidence for its own claims. Omit invented research, physiological
explanations and health benefits. Product descriptions are not hands-on tasting evidence.
Attribute manufacturer claims and keep source links. Verify time-sensitive claims against
primary sources; omit unverifiable discovery candidates.

Preserve affiliate disclosures, licensing, image credits, documented testing limits and
accurate information about automation. Keep provenance and detailed QA notes in admin.
Never represent a passed automated check as a kitchen test or human review.

## Generation and QA

Return only the requested schema. No assistant introductions, prompt echoes, reasoning tags,
model signatures, raw provider citation tokens, invisible formatting debris or JSON fences.
Never delete valid source links to conceal their origin.

The shared QA checker blocks recognized artifacts and stock phrases. The model QA must return
**fail**, with actionable blockers, for unsupported tests or sources, fabricated science,
unsafe advice and unresolved filler. Reserve **revise** for optional polish.

This is a quality standard, not a guarantee that text can pass an authorship detector.
No text scan can establish whether an image contains a hidden provenance watermark.

## Archive repairs

Run `node --env-file=.env.verify scripts/clean-editorial-copy.mjs` to audit.
Use `--propose` to create reviewable prose edits and backups under the gitignored
`artifacts/editorial-cleanup` directory. `--articles` uses a separate articles subdirectory.
Review every proposed edit, then put only approved proposal filenames into `approved.json`
in that directory before using `--apply` (with `--articles` for that batch).
The script preserves quantities and cooking instructions, allows only selected public prose
fields, and checks for concurrent changes. Article titles may be corrected to match the body;
URLs, recipe titles, bylines, publication dates, status, ingredients and internal provenance
are not rewritten by this repair. Do not add numerical changes to recipe prose during review.
