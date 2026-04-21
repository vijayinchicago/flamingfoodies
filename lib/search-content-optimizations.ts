import type { BlogPost, Recipe, RecipeFaq } from "@/lib/types";

export type SearchInsightBlock = {
  eyebrow: string;
  title: string;
  copy: string;
};

export type BlogSearchOptimization = {
  title?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  appendContent?: string;
};

export type RecipeSearchOptimization = {
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  introAppendix?: string;
  extraFaqs?: RecipeFaq[];
  insightBlocks?: SearchInsightBlock[];
};

const DEFAULT_BLOG_SEARCH_OPTIMIZATIONS: Record<string, BlogSearchOptimization> = {
  "how-to-choose-a-hot-sauce-for-seafood": {
    title: "How to Choose a Hot Sauce for Seafood, Fish, and Ceviche",
    description:
      "A buying guide for seafood-friendly hot sauces that work on shrimp, grilled fish, fish tacos, and ceviche without flattening the plate.",
    seoTitle: "How to Choose the Best Hot Sauce for Seafood, Fish, and Ceviche | FlamingFoodies",
    seoDescription:
      "Learn which hot sauces actually work on seafood, fish tacos, grilled fish, shrimp, and ceviche, plus what to avoid.",
    appendContent: `
## The best hot sauce for fish keeps the fish tasting clear

White fish, salmon, and grilled snapper usually want acidity, citrus, ginger, or a clean pepper finish before they want brute force. If a bottle tastes muddy or overly smoky, it can flatten flaky fish fast. That is why the most useful fish sauces tend to overlap with the bottles we keep on the [seafood shelf](/hot-sauces/best-for-seafood).

## Can you use hot sauce in ceviche?

Yes, but use a light hand. Ceviche already has acid from lime or another citrus, so the hot sauce needs to bring lift, fruit, or pepper character without turning the bowl harsh. Bright habanero, ginger, and citrus-led sauces usually make more sense than heavy garlic-bomb or wing-night bottles.

## Match the bottle to the seafood

Shrimp and fish tacos can handle a little more sweetness or cream-friendly texture. Grilled fish wants brightness and restraint. Salmon can take a little more smoke than snapper or ceviche, but it still benefits from a sauce that finishes clean instead of lingering like a dare.
    `
  }
};

const DEFAULT_RECIPE_SEARCH_OPTIMIZATIONS: Record<string, RecipeSearchOptimization> = {
  "nashville-hot-chicken-sandwiches": {
    description:
      "Crisp fried chicken, cayenne oil sauce, pickles, and slaw stacked into a Nashville hot chicken sandwich that keeps the crust loud and the heat pointed.",
    seoTitle: "Nashville Hot Chicken Sandwich Recipe | How to Make the Sauce",
    seoDescription:
      "Make a crunchy Nashville hot chicken sandwich at home with the right fried chicken method, cayenne oil sauce, slaw, and pickles.",
    introAppendix:
      "If you found this while looking for how to make a hot chicken sandwich, the make-or-break move is the Nashville oil. Fry the chicken until the crust is solid first, then brush on enough cayenne oil to stain the breading without drowning it, and use slaw plus pickles to keep the sandwich moving.",
    extraFaqs: [
      {
        question: "What is Nashville hot chicken sandwich sauce made of?",
        answer:
          "Usually hot frying oil whisked with cayenne, paprika, brown sugar, and a little seasoning. It is more of a spiced hot oil than a creamy sandwich sauce, which is why slaw and pickles matter so much."
      },
      {
        question: "How do I keep a hot chicken sandwich crisp after adding the sauce?",
        answer:
          "Fry the chicken hard enough to build a real crust, rest it on a rack instead of paper towels, then brush on the Nashville oil instead of soaking the piece. Build the sandwich right before serving."
      }
    ],
    insightBlocks: [
      {
        eyebrow: "Sauce method",
        title: "The Nashville oil is the point, not an afterthought.",
        copy:
          "This sandwich reads correctly when the cayenne oil tastes assertive but the crust still stays crisp. Brush on enough to stain the chicken, then let slaw and pickles do the balancing."
      },
      {
        eyebrow: "Sandwich balance",
        title: "Heat alone is not what makes the sandwich work.",
        copy:
          "The best hot chicken sandwich has crunch, fat, acid, and cooling bite in the same stack. Skip the slaw or pickles and it starts eating heavy fast."
      }
    ]
  }
};

function normalizeQuestion(value: string) {
  return value.trim().toLowerCase();
}

function appendParagraph(base: string | undefined, appendix?: string) {
  const trimmedAppendix = appendix?.trim();
  if (!trimmedAppendix) {
    return base;
  }

  const trimmedBase = base?.trim();
  if (!trimmedBase) {
    return trimmedAppendix;
  }

  if (trimmedBase.includes(trimmedAppendix)) {
    return trimmedBase;
  }

  return `${trimmedBase}\n\n${trimmedAppendix}`;
}

function appendMarkdown(base: string, appendix?: string) {
  const trimmedAppendix = appendix?.trim();
  if (!trimmedAppendix) {
    return base;
  }

  const trimmedBase = base.trim();
  if (!trimmedBase) {
    return trimmedAppendix;
  }

  if (trimmedBase.includes(trimmedAppendix)) {
    return trimmedBase;
  }

  return `${trimmedBase}\n\n${trimmedAppendix}`;
}

function mergeFaqs(existing: RecipeFaq[] | undefined, extra: RecipeFaq[] | undefined) {
  const merged = [...(existing ?? [])];
  const seen = new Set(merged.map((faq) => normalizeQuestion(faq.question)));

  for (const faq of extra ?? []) {
    const normalized = normalizeQuestion(faq.question);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    merged.push(faq);
    seen.add(normalized);
  }

  return merged;
}

function mergeInsightBlocks(
  existing: SearchInsightBlock[] | undefined,
  extra: SearchInsightBlock[] | undefined
) {
  const merged = [...(existing ?? [])];
  const seen = new Set(
    merged.map((block) => `${block.eyebrow.trim().toLowerCase()}::${block.title.trim().toLowerCase()}`)
  );

  for (const block of extra ?? []) {
    const key = `${block.eyebrow.trim().toLowerCase()}::${block.title.trim().toLowerCase()}`;
    if (!block.title.trim() || seen.has(key)) {
      continue;
    }

    merged.push(block);
    seen.add(key);
  }

  return merged;
}

export function applyBlogSearchOptimization(
  post: BlogPost,
  runtimeOptimization?: BlogSearchOptimization
): BlogPost {
  const optimization = DEFAULT_BLOG_SEARCH_OPTIMIZATIONS[post.slug];
  let nextPost = post;

  for (const current of [optimization, runtimeOptimization]) {
    if (!current) {
      continue;
    }

    nextPost = {
      ...nextPost,
      title: current.title ?? nextPost.title,
      description: current.description ?? nextPost.description,
      seoTitle: current.seoTitle ?? nextPost.seoTitle,
      seoDescription: current.seoDescription ?? nextPost.seoDescription,
      content: appendMarkdown(nextPost.content, current.appendContent)
    };
  }

  return nextPost;
}

export function enhanceBlogPostForSearch(post: BlogPost): BlogPost {
  const optimization = DEFAULT_BLOG_SEARCH_OPTIMIZATIONS[post.slug];
  if (!optimization) {
    return post;
  }

  return applyBlogSearchOptimization(post);
}

export function applyRecipeSearchOptimization(
  recipe: Recipe,
  runtimeOptimization?: RecipeSearchOptimization
): Recipe {
  const optimization = DEFAULT_RECIPE_SEARCH_OPTIMIZATIONS[recipe.slug];
  let nextRecipe = recipe;

  for (const current of [optimization, runtimeOptimization]) {
    if (!current) {
      continue;
    }

    nextRecipe = {
      ...nextRecipe,
      description: current.description ?? nextRecipe.description,
      seoTitle: current.seoTitle ?? nextRecipe.seoTitle,
      seoDescription: current.seoDescription ?? nextRecipe.seoDescription,
      intro: appendParagraph(nextRecipe.intro, current.introAppendix),
      faqs: mergeFaqs(nextRecipe.faqs, current.extraFaqs)
    };
  }

  return nextRecipe;
}

export function enhanceRecipeForSearch(recipe: Recipe): Recipe {
  const optimization = DEFAULT_RECIPE_SEARCH_OPTIMIZATIONS[recipe.slug];
  if (!optimization) {
    return recipe;
  }

  return applyRecipeSearchOptimization(recipe);
}

export function getRecipeSearchInsightBlocks(
  recipe: Pick<Recipe, "slug">,
  runtimeOptimization?: RecipeSearchOptimization
): SearchInsightBlock[] {
  const defaultBlocks = DEFAULT_RECIPE_SEARCH_OPTIMIZATIONS[recipe.slug]?.insightBlocks ?? [];
  return mergeInsightBlocks(defaultBlocks, runtimeOptimization?.insightBlocks);
}
