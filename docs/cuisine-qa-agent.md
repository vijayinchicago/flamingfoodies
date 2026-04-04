# Cuisine QA Agent

This document is internal-only. It defines the source-of-truth review pass for recipes and spicy-product reviews before they move from `draft` or `pending_review` to `published`.

## Goal

Catch the failures that make recipe pages feel untrustworthy:

- hero images that do not actually depict the dish
- cuisine labels that are too loose for the ingredient and method details
- recipe pages that still read like thin AI output instead of tested editorial content
- missing storage, reheating, serving, or FAQ guidance

## How We Use It

Use this QA agent after drafting and before publishing.

1. Run the deterministic recipe QA validator in the app.
2. Run the deterministic review QA validator for reviews and fix every blocker it returns.
3. Resolve every blocker before changing status from `pending_review` to `published`.
4. Run the cuisine QA agent prompt below against the full recipe payload when the content is cuisine-sensitive or AI-assisted.
5. Manually verify the hero image against the actual dish or product.
6. Record the outcome in the content item's QA notes and only then mark it publish-ready.

## Mandatory Checks

The QA reviewer must verify all of the following:

- The hero image actually shows the core dish named in the title.
- The hero image does not substitute a related but different dish.
- The selected cuisine label is supported by the ingredients, method, and language on the page.
- The recipe contains grouped ingredients and structured method steps.
- The method includes concrete sensory cues, not just vague instructions.
- The page includes make-ahead, storage, reheating, serving, and FAQ support when applicable.
- The alt text accurately describes the actual image, not the intended recipe.
- Review pages include honest pros and cons, concrete flavor notes, and a credible product identity.
- AI-generated recipes and reviews stay in `pending_review` until a human editor clears them.

## Recommended Prompt

```text
You are the FlamingFoodies Cuisine QA agent.

Your job is to review a recipe draft for publication readiness.
Be strict, concrete, and editorially useful.

You must evaluate:
1. Dish identity:
   Does the title, description, ingredient list, method, and image all describe the same dish?
2. Cuisine fit:
   Does the selected cuisine make sense for the ingredients, methods, and flavor framing?
3. Method credibility:
   Are the steps specific, sequential, and realistic for an experienced home cook?
4. Heat credibility:
   Does the claimed heat level match the chiles, sauces, and method?
5. Support quality:
   Are storage, reheating, make-ahead, serving, substitutions, and FAQs strong enough?
6. Image accuracy:
   Does the hero image actually depict the named dish, not a nearby or generic food category?

Return JSON with:
- verdict: pass | revise | fail
- blockers: array of concise blocker strings
- warnings: array of concise warning strings
- cuisine_assessment: short paragraph
- image_assessment: short paragraph
- method_assessment: short paragraph
- suggested_fixes: array of specific edits

Do not praise weak drafts. If the image looks wrong for the dish, say so plainly.
```

## Notes

- The deterministic validators block obvious failures in the admin publish flow.
- This agent layer is for deeper editorial and cuisine judgment, especially on AI-assisted drafts.
- If there is tension between a catchy title and what the recipe actually is, prefer fixing the title or the image rather than hand-waving the mismatch.
- Generated recipes and reviews should store their QA report at insert time so editors can see blocker context immediately.
