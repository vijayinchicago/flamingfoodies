import type { BlogPost } from "@/lib/types";

export interface EditorialFranchise {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  posts: BlogPost[];
}

function normalizeText(value?: string | null) {
  return (value || "").toLowerCase();
}

function buildPostCorpus(post: BlogPost) {
  return normalizeText(
    [post.title, post.description, post.category, post.tags.join(" "), post.slug].join(" ")
  );
}

function matchesTokens(post: BlogPost, tokens: string[]) {
  const corpus = buildPostCorpus(post);
  return tokens.some((token) => corpus.includes(token));
}

function sortFranchisePosts(posts: BlogPost[]) {
  return [...posts].sort((left, right) => {
    if ((left.featured ?? false) !== (right.featured ?? false)) {
      return left.featured ? -1 : 1;
    }

    return (right.publishedAt || "").localeCompare(left.publishedAt || "");
  });
}

export function getEditorialFranchises(posts: BlogPost[]) {
  const blueprints: Array<{
    key: string;
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    ctaLabel: string;
    tokens: string[];
  }> = [
    {
      key: "heat-check",
      eyebrow: "Recurring series",
      title: "Heat Check",
      description: "Short, useful reads on what is worth buying, cooking, or paying attention to right now.",
      href: "/blog?q=worth",
      ctaLabel: "Browse Heat Check",
      tokens: ["best", "worth", "moment", "buy", "under $", "guide", "review"]
    },
    {
      key: "one-bottle-three-dinners",
      eyebrow: "Recurring series",
      title: "One Bottle, Three Dinners",
      description: "Use one strong bottle to make multiple nights of dinner feel sharper, not repetitive.",
      href: "/recipes",
      ctaLabel: "See recipe pairings",
      tokens: ["taco", "eggs", "wings", "pizza", "three dinners", "recipe", "pair"]
    },
    {
      key: "shelf-logic",
      eyebrow: "Recurring series",
      title: "Shelf Logic",
      description: "Practical guidance on how to build a smarter hot sauce shelf, pantry, and gear lineup over time.",
      href: "/hot-sauces",
      ctaLabel: "Build a better shelf",
      tokens: ["shelf", "pantry", "gear", "spice blend", "hot sauce", "kitchen", "shop"]
    }
  ];

  return blueprints.map((blueprint) => ({
    key: blueprint.key,
    eyebrow: blueprint.eyebrow,
    title: blueprint.title,
    description: blueprint.description,
    href: blueprint.href,
    ctaLabel: blueprint.ctaLabel,
    posts: sortFranchisePosts(posts.filter((post) => matchesTokens(post, blueprint.tokens))).slice(0, 2)
  })) satisfies EditorialFranchise[];
}
