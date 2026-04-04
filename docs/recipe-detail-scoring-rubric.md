# Recipe Detail Scoring Rubric

This document is the internal source of truth for evaluating every FlamingFoodies recipe detail page.

Use it in three moments:

- before a redesign, to define what "better" means
- during editorial QA, to catch weak pages before publishing
- after launch, to score the live page against the benchmark cohort

## Benchmark cohort

These sites informed the rubric because they each solve different parts of the recipe-detail problem well:

- **Maunika Gowardhan**: chef-led headnotes, cultural framing, and concise but confident method writing
- **Food Network**: planning metadata, equipment context, and strong utility-first cooking setup
- **Chili Pepper Madness**: spicy niche authority, heat-specific guidance, and recipe pages built for cooks who want extra help
- **Pinch of Yum**: jump navigation, friendly article structure, FAQ support, and strong scanability
- **Epicurious**: editorial trust, ratings-driven confidence, and polished recipe presentation
- **Bon Appetit**: premium visuals, strong headnotes, and tool-oriented recipe framing

We also use FlamingFoodies itself as the baseline so the rubric stays product-real, not just aspirational.

## Scoring scale

Score each category from 0 to 5:

- **0**: absent
- **1**: thin, confusing, or mostly decorative
- **2**: present but shallow
- **3**: solid and usable
- **4**: strong, polished, and genuinely helpful
- **5**: category-leading and hard to improve without custom tooling

Calculate the final score like this:

- `weighted points = category weight x (category score / 5)`

## Score bands

- **85-100**: flagship recipe page
- **70-84**: strong page with clear room to improve
- **55-69**: serviceable but underpowered
- **Below 55**: rewrite-level weak

## The rubric

### 1. Orientation and editorial promise - 10 points

The top of the page should answer three questions quickly: what is this dish, why should I make it, and what kind of cooking session is this going to be?

To score **5/5**, the page should include:

- a descriptive title and strong subhead
- a clear hero image or equally persuasive visual
- fast-read context like cuisine, heat level, or difficulty
- a "why it works" or "why it lands" frame that gives the cook confidence before scrolling

### 2. Planning metadata and setup confidence - 10 points

The best recipe pages help people decide whether this is a Tuesday dinner, a weekend project, or something to make ahead.

To score **5/5**, the page should include:

- prep, cook, and total time
- servings or yield
- difficulty or effort level
- equipment or tool context
- make-ahead, active-time, or storage cues when relevant

### 3. Ingredient usability - 15 points

Ingredients should help the cook shop, prep, and move through the recipe cleanly.

To score **5/5**, the page should include:

- amounts, units, and ingredient names in a scan-friendly layout
- ingredient notes that prevent common mistakes
- grouping when the recipe has components like marinade, sauce, salsa, or garnish
- scaling or at least a very clear serving baseline
- ingredient substitutions where they materially affect success

### 4. Method clarity and sequencing - 20 points

This is the most important category. The strongest recipe pages break the method into steps that feel cookable, not merely readable.

To score **5/5**, the page should include:

- distinct steps with strong action-led headlines
- one clear move per step instead of overloaded paragraphs
- a visible sense of progression through the cook
- enough detail to prevent guessing, but not so much that the method becomes a wall of text
- setup that minimizes bouncing between ingredients, equipment, and instructions

### 5. Sensory cues and troubleshooting - 15 points

Great recipe pages tell you what success looks, smells, sounds, and feels like.

To score **5/5**, the page should include:

- doneness cues beyond time alone
- signs to watch for when browning, reducing, thickening, or emulsifying
- common failure points and how to recover
- tips that reduce risk for home cooks
- clear guidance when heat level, texture, or moisture can vary

### 6. Visual support and alternate formats - 10 points

The benchmark cohort wins a lot of trust by helping cooks who prefer watching, printing, or scanning visually.

To score **5/5**, the page should include:

- a strong hero image
- step images or a process gallery for more complex recipes
- video or alternate watch mode when useful
- jump links, print support, or another alternate consumption mode
- visuals that clarify texture, not just decorate the page

### 7. Adaptation, storage, and serving guidance - 5 points

The best recipe pages make the dish feel flexible and repeatable, not one-and-done.

To score **5/5**, the page should include:

- variations or swaps that keep the recipe coherent
- storage or leftover guidance
- reheating or make-ahead notes when relevant
- serving suggestions, pairings, or finishing advice

### 8. Trust and social proof - 5 points

Recipe pages perform better when the cook believes the recipe has been tested, used, and improved by real people.

To score **5/5**, the page should include:

- clear author attribution
- publish or update date
- ratings, reviews, or comments
- editorial voice that signals competence rather than filler

### 9. Mobile cookability - 5 points

Many people cook from a phone. A page that looks good on desktop but fails at the stove is not a strong recipe page.

To score **5/5**, the page should include:

- clear section order on mobile
- tap-friendly jump points
- text blocks that are easy to scan while cooking
- reduced friction between ingredients and steps
- a layout that respects sticky headers, thumb reach, and scroll fatigue

### 10. Adjacent utility without distraction - 5 points

FlamingFoodies should keep save, rate, comments, gear, and commerce present, but they must support the cook instead of interrupting the recipe.

To score **5/5**, the page should include:

- save and rate tools that feel useful, not needy
- comments or community context that adds trust
- gear and affiliate picks that are relevant to the recipe
- adjacent merch or commerce modules that stay secondary to cooking

## How to score a recipe page

1. Score the live page in every category from 0 to 5.
2. Convert each category to weighted points.
3. Note the three weakest categories.
4. Fix those categories first unless the page has a critical UX failure.
5. Re-score the page after implementation before marking the work complete.

This rubric is the acceptance checklist for design, engineering, editorial QA, and future AI-assisted recipe work.
