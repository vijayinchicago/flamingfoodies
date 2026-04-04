import { createClient } from "@supabase/supabase-js";

const posts = [
  {
    slug: "how-to-build-your-first-hot-sauce-shelf",
    title: "How to Build Your First Hot Sauce Shelf",
    description:
      "A practical way to build a useful starter shelf without overbuying novelty bottles or expensive gift sets.",
    author_name: "FlamingFoodies Team",
    category: "guides",
    content: `
## Start with lanes you actually cook in

If you are building a first shelf, begin with [the best hot sauces overall](/hot-sauces/best) and then branch into the lanes that match your weeknight food. Most people need a taco bottle, a breakfast bottle, and one richer-food bottle long before they need a superhot flex.

## Do not overspend on the first pass

A strong starter shelf can absolutely come from [the best hot sauces under $15](/hot-sauces/under-15). The point is to buy bottles you will actually pour, not to collect labels you are afraid to use generously.

## Match the bottle to the meal

If tacos are constant in your house, go next to [best hot sauces for tacos](/hot-sauces/best-for-tacos). If eggs and breakfast tacos show up every weekend, [best hot sauces for eggs](/hot-sauces/best-for-eggs) is the more useful follow-up. If wings, pizza, and fried chicken matter more, [best hot sauces for wings](/hot-sauces/best-for-wings) will save you more buying mistakes.

## Use reviews when you are narrowing to one bottle

The [hot sauce hub](/hot-sauces) helps you shop by intent, the [reviews archive](/reviews) helps you compare individual bottles, and [the shop](/shop) is the fast lane when you just want to browse sauces and pantry upgrades in one place.
    `,
    tags: ["hot sauce", "shopping guide", "shelf builder"],
    featured: true,
    source: "editorial",
    status: "published",
    seo_title: "How to Build Your First Hot Sauce Shelf | FlamingFoodies",
    seo_description:
      "A beginner-friendly guide to building a smarter hot sauce shelf with the right everyday, taco-night, and richer-food bottles.",
    cuisine_type: "other",
    heat_level: "medium",
    scoville_rating: 6,
    read_time_minutes: 6,
    view_count: 1286,
    like_count: 94,
    published_at: "2026-04-02T14:00:00.000Z",
    image_url: null,
    image_alt: null
  },
  {
    slug: "how-to-pick-a-hot-sauce-for-eggs-breakfast-tacos-and-hash",
    title: "How to Pick a Hot Sauce for Eggs, Breakfast Tacos, and Hash",
    description:
      "What actually works at breakfast: bright pours, chili crisps, and bottles you can use generously before noon.",
    author_name: "FlamingFoodies Team",
    category: "guides",
    content: `
## Breakfast heat should wake food up, not flatten it

Eggs usually want brightness, pourability, or texture. That is why the best breakfast bottles are usually the ones on [best hot sauces for eggs](/hot-sauces/best-for-eggs), not the same bottles you save for dares and wings.

## Keep one pour and one topper

The smartest breakfast setup is a generous everyday pour plus one textural topper. You can see that split on [the best overall shelf](/hot-sauces/best), but it becomes even clearer once you compare [egg-first bottles](/hot-sauces/best-for-eggs) with [taco-night bottles](/hot-sauces/best-for-tacos).

## Breakfast tacos need a different kind of bottle

Breakfast tacos often want a little more acid and structure than scrambled eggs on toast. That is why the overlap between [best hot sauces for tacos](/hot-sauces/best-for-tacos) and [best hot sauces for eggs](/hot-sauces/best-for-eggs) matters so much. The winner is usually the bottle that keeps potatoes, eggs, and cheese from tasting heavy.

## Do not waste your breakfast budget

You do not need a premium subscription box to fix your morning shelf. Start with [our under-$15 picks](/hot-sauces/under-15), then use the longer notes in [reviews](/reviews) when you want to decide between one bottle and another.
    `,
    tags: ["hot sauce", "eggs", "breakfast"],
    featured: false,
    source: "editorial",
    status: "published",
    seo_title: "Best Hot Sauces for Eggs and Breakfast Tacos | FlamingFoodies",
    seo_description:
      "A practical breakfast-hot-sauce guide for eggs, breakfast tacos, hash, and lazy weekend cooking.",
    cuisine_type: "american",
    heat_level: "medium",
    scoville_rating: 5,
    read_time_minutes: 5,
    view_count: 912,
    like_count: 61,
    published_at: "2026-04-03T13:00:00.000Z",
    image_url: null,
    image_alt: null
  },
  {
    slug: "what-makes-a-hot-sauce-good-on-pizza-and-wings",
    title: "What Makes a Hot Sauce Good on Pizza and Wings",
    description:
      "A quick field guide to the garlic, cling, smoke, and heat curves that work best on richer, game-day food.",
    author_name: "FlamingFoodies Team",
    category: "guides",
    content: `
## Rich food can carry more aggression

Pizza, wings, and fried chicken can take more garlic, more cling, and more raw heat than seafood or breakfast. That is why [best hot sauces for wings](/hot-sauces/best-for-wings) and [best hot sauces for pizza](/hot-sauces/best-for-pizza) look different from taco-night picks.

## Cling matters almost as much as flavor

On pizza and wings, a thinner sauce can disappear fast. Bottles with more body, honey, garlic, or richer pepper texture tend to feel more satisfying. That is also why some of the bottles on [the best overall shelf](/hot-sauces/best) are not always the same ones that overperform on late-night food.

## One bigger hitter is enough

If you want more fire, keep one serious bottle and then build around it with more useful sauces. [The under-$15 page](/hot-sauces/under-15) is still a good place to start, because a lot of wing-night value lives in affordable garlic-heavy or pizza-friendly bottles.

## Use reviews to avoid novelty traps

Once you know whether you want buffalo-style cling, garlic weight, or pizza-friendly sweet heat, use [the reviews archive](/reviews) to compare the exact bottles instead of buying the loudest label you can find.
    `,
    tags: ["hot sauce", "pizza", "wings"],
    featured: false,
    source: "editorial",
    status: "published",
    seo_title: "Best Hot Sauces for Pizza and Wings | FlamingFoodies",
    seo_description:
      "Learn what makes a hot sauce actually work on pizza, wings, and richer comfort food.",
    cuisine_type: "american",
    heat_level: "hot",
    scoville_rating: 8,
    read_time_minutes: 5,
    view_count: 844,
    like_count: 58,
    published_at: "2026-04-03T17:00:00.000Z",
    image_url: null,
    image_alt: null
  },
  {
    slug: "how-to-choose-a-hot-sauce-for-seafood",
    title: "How to Choose a Hot Sauce for Seafood",
    description:
      "The bright, gingery, and fruit-forward bottles that sharpen shrimp, fish tacos, grilled fish, and shellfish instead of taking them over.",
    author_name: "FlamingFoodies Team",
    category: "guides",
    content: `
## Seafood usually wants lift first

With shrimp, fish, oysters, and grilled seafood, the best bottle is usually the one that adds brightness, ginger, citrus, or fruit before it adds brute force. That is the logic behind [best hot sauces for seafood](/hot-sauces/best-for-seafood).

## Fish tacos are not the same as wings

A bottle that crushes wings can bully grilled shrimp. If seafood tacos are your main use case, compare [the seafood shelf](/hot-sauces/best-for-seafood) with [the taco shelf](/hot-sauces/best-for-tacos) and look for the overlap: bright, clean, pepper-forward bottles that still have enough character to stand up to crema or slaw.

## Keep your shelf balanced

The smartest setup is not all citrus bottles. Pair one seafood-friendly sauce with one broader everyday bottle from [best hot sauces overall](/hot-sauces/best), then use [the shop](/shop) if you want to browse pantry and gear upgrades around the same meals.

## Reviews matter more once the lane is clear

After you know you want a seafood-friendly bottle, use [reviews](/reviews) to compare exact flavor notes, pricing, and the sauces that pull double duty on tacos, grilled fish, and weeknight bowls.
    `,
    tags: ["hot sauce", "seafood", "buying guide"],
    featured: false,
    source: "editorial",
    status: "published",
    seo_title: "How to Choose the Best Hot Sauce for Seafood | FlamingFoodies",
    seo_description:
      "A buying guide for seafood-friendly hot sauces that work on shrimp, fish tacos, grilled fish, and shellfish.",
    cuisine_type: "other",
    heat_level: "medium",
    scoville_rating: 6,
    read_time_minutes: 5,
    view_count: 713,
    like_count: 44,
    published_at: "2026-04-04T11:00:00.000Z",
    image_url: null,
    image_alt: null
  }
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY before running this script.");
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase
  .from("blog_posts")
  .upsert(posts, { onConflict: "slug" })
  .select("slug");

if (error) {
  throw error;
}

console.log(`Synced ${data?.length ?? posts.length} hot sauce guide posts:`);
for (const post of posts) {
  console.log(`- ${post.slug}`);
}
