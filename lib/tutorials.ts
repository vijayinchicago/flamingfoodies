export type TutorialCategory =
  | "making-sauce"
  | "fermentation"
  | "growing"
  | "cooking-technique"
  | "heat-culture"
  | "pairing";

export interface Tutorial {
  slug: string;
  title: string;
  category: TutorialCategory;
  difficulty: "beginner" | "intermediate" | "advanced";
  timeEstimate: string;
  description: string;
  intro: string;
  steps: Array<{ heading: string; body: string }>;
  proTips: string[];
  affiliateKeys: string[];
  recipeTagMatch: string[];
  featured: boolean;
  source: "editorial";
}

export const TUTORIALS: Tutorial[] = [
  {
    slug: "how-to-make-hot-sauce-from-scratch",
    title: "How to Make Hot Sauce From Scratch",
    category: "making-sauce",
    difficulty: "beginner",
    timeEstimate: "2 hours + 24h rest",
    description:
      "Everything you need to make your first bottle of hot sauce at home — peppers, vinegar, garlic, salt, and a blender. No equipment beyond your kitchen.",
    intro:
      "Making hot sauce at home is simpler than most people expect. The core formula is ancient: peppers + acid + salt. Everything beyond that is flavor development. This guide walks you through a foundational sauce that produces a genuine, shelf-stable hot sauce on your first attempt.",
    steps: [
      {
        heading: "Choose your peppers",
        body: "Start with something accessible — jalapeños, serranos, or fresno chilis are ideal for a first batch. You want 8–12 oz of fresh peppers. Remove stems but keep seeds and membrane for now; you can adjust heat down in subsequent batches by seeding before cooking."
      },
      {
        heading: "Simmer with aromatics",
        body: "Combine peppers, 4 cloves garlic, half a white onion (rough-chopped), and 1 cup water in a saucepan. Simmer on medium-low for 20 minutes until peppers are completely soft and the liquid has reduced slightly. The simmering mellows raw pepper bitterness and melds the aromatics."
      },
      {
        heading: "Blend",
        body: "Transfer to a blender with ½ cup white vinegar and 1½ tsp kosher salt. Blend on high for 90 seconds. The vinegar is both flavor and preservation — it drops the pH below 4.0, which is the threshold for shelf stability. Taste and adjust: more vinegar for brightness, more salt for depth."
      },
      {
        heading: "Strain (optional)",
        body: "For a smooth sauce, strain through a fine mesh strainer, pressing solids with a rubber spatula. For a thicker, chunkier sauce, skip this step. Neither is more correct — it depends on how you want to use the sauce."
      },
      {
        heading: "Rest and bottle",
        body: "Let the sauce cool to room temperature, then refrigerate for at least 24 hours before using. The flavors integrate and mellow significantly overnight. Bottle in clean glass jars or swing-top bottles. Refrigerated, it keeps for 2–3 months."
      }
    ],
    proTips: [
      "Roast half your peppers in the oven at 450°F before simmering — it adds smokiness without needing a smoker",
      "Apple cider vinegar adds a subtle sweetness that white vinegar lacks; try a 50/50 blend",
      "A pH meter (under $15) tells you definitively whether your sauce is shelf-stable",
      "Add a small roasted carrot for sweetness and body without sugar"
    ],
    affiliateKeys: ["amazon-immersion-blender", "amazon-digital-meat-thermometer", "amazon-fermentation-jar-kit"],
    recipeTagMatch: ["american", "mexican", "general"],
    featured: true,
    source: "editorial"
  },
  {
    slug: "how-to-ferment-peppers",
    title: "How to Ferment Peppers for Hot Sauce",
    category: "fermentation",
    difficulty: "intermediate",
    timeEstimate: "30 min active + 5–14 days fermentation",
    description:
      "Lacto-fermentation transforms fresh peppers into a complex, probiotic base for hot sauce with depth that no vinegar-only sauce can replicate. Here's how to do it safely and reliably.",
    intro:
      "The most complex hot sauces in the world — Tabasco's aged mash, Korean gochujang, most artisan craft sauces — involve fermentation. Lacto-fermentation uses naturally occurring bacteria to convert sugars to lactic acid, dropping pH, preserving the peppers, and building flavor compounds over days. The process is ancient, reliable, and requires no special equipment beyond a jar and salt.",
    steps: [
      {
        heading: "Prepare your brine",
        body: "Dissolve 2% salt by weight in water: 20g salt per 1000g water, or roughly 1 tablespoon per 2 cups. Use non-chlorinated water — chlorine kills the bacteria you're trying to cultivate. Filtered or spring water works. Kosher or sea salt only; iodized salt inhibits fermentation."
      },
      {
        heading: "Pack your jar",
        body: "Remove stems from 1 lb fresh peppers. Slice or leave whole — whole ferments take longer but develop differently. Pack tightly into a clean mason jar with garlic cloves and any aromatics (ginger, allspice, bay leaf). Pour brine to cover, leaving 1 inch headspace."
      },
      {
        heading: "Keep peppers submerged",
        body: "This is critical: anything above the brine can mold. Use a small zip-lock bag filled with brine as a weight, or a purpose-made fermentation weight. Loose a small amount of CO2 must escape; cover with a cloth secured with a rubber band, or use an airlock lid."
      },
      {
        heading: "Ferment at room temperature",
        body: "Leave at 65–75°F away from direct sunlight. Check daily. Within 24–48 hours you should see bubbles — that's CO2 production, a sign fermentation is active. Press peppers down if they float above brine. Taste from day 3 onward."
      },
      {
        heading: "Blend and finish",
        body: "At 5–14 days (longer = more sour and complex), drain peppers, reserving the brine. Blend peppers with enough brine to reach your desired consistency. No additional vinegar needed — the lactic acid is your preservative. Taste, adjust salt, strain if desired."
      }
    ],
    proTips: [
      "White kahm yeast (flat, white film on surface) is harmless — skim it off; fuzzy colored mold means discard",
      "Fermenting at cooler temperatures (65°F) slows the process and builds more complexity",
      "The spent brine is gold — use it as a finishing acid in cooking or cocktails",
      "Adding a few dry spices (cumin, coriander, cloves) before fermentation creates flavors that can't be added after"
    ],
    affiliateKeys: ["amazon-fermentation-jar-kit", "amazon-immersion-blender", "amazon-digital-meat-thermometer"],
    recipeTagMatch: ["fermented", "general"],
    featured: true,
    source: "editorial"
  },
  {
    slug: "how-to-grow-peppers-in-containers",
    title: "How to Grow Peppers in Containers",
    category: "growing",
    difficulty: "beginner",
    timeEstimate: "Season-long (start seeds 8–10 weeks before last frost)",
    description:
      "Peppers are among the best container vegetables you can grow — they thrive in pots, produce all summer, and let you grow varieties unavailable in any store. Here's how to start from seed through harvest.",
    intro:
      "Growing your own peppers closes the gap between the hot sauce world and your kitchen in a way no other practice can. Store shelves carry maybe fifteen varieties; seed catalogs carry thousands. Container growing is accessible for anyone with outdoor space or even a south-facing window, and the plants produce from mid-summer through first frost.",
    steps: [
      {
        heading: "Start seeds indoors",
        body: "Begin 8–10 weeks before your last frost date. Superhots (ghost pepper, reaper) need 10–12 weeks. Use a seed-starting mix, not potting soil. Sow ¼ inch deep, keep at 80–85°F bottom heat (a seedling heat mat accelerates germination dramatically). Germination takes 7–21 days; superhots can take up to 30."
      },
      {
        heading: "Provide light",
        body: "Pepper seedlings need 14–16 hours of light. A south window is rarely enough — supplement with a grow light positioned 2–4 inches above the seedlings. Leggy (tall and thin) seedlings mean insufficient light. Once true leaves appear, drop light to 12–14 inches above."
      },
      {
        heading: "Choose containers",
        body: "Standard jalapeños and serranos do well in 3–5 gallon containers. Larger plants (habaneros, ghost peppers) prefer 5–10 gallon. Good drainage is mandatory — peppers in standing water develop root rot fast. Fabric grow bags are excellent for air-pruning roots."
      },
      {
        heading: "Pot up and harden off",
        body: "Before moving outside, harden seedlings over 7–10 days: start with 1–2 hours of outdoor shade, increasing daily exposure. Direct sun on unadapted seedlings causes sunscald. After hardening, pot into final containers with well-draining potting mix amended with perlite."
      },
      {
        heading: "Fertilize and water",
        body: "Peppers are heavy feeders. Use a balanced fertilizer (10-10-10) every 2 weeks through flowering, then switch to a lower-nitrogen, higher-phosphorus formula when fruiting. Water when the top inch of soil is dry — consistency matters more than quantity. Container peppers dry out faster than in-ground plants."
      }
    ],
    proTips: [
      "Pinching the first set of flower buds forces the plant to root establish first, producing more fruit total",
      "Superhot peppers overwinter beautifully as houseplants — cut back hard in fall, bring inside, and you get a head start the following year",
      "Calcium deficiency causes blossom end rot — supplement with a calcium spray if you see it",
      "Grow one easy variety (jalapeño) and one stretch variety (ghost pepper, habanero) to compare"
    ],
    affiliateKeys: ["pepper-joe-superhot-seed-pack", "amazon-fermentation-jar-kit"],
    recipeTagMatch: ["growing", "general"],
    featured: false,
    source: "editorial"
  },
  {
    slug: "how-to-build-heat-tolerance",
    title: "How to Build Heat Tolerance",
    category: "heat-culture",
    difficulty: "beginner",
    timeEstimate: "Ongoing — 4–8 weeks to see meaningful progress",
    description:
      "Capsaicin tolerance is a genuine physical adaptation that anyone can develop with consistent, deliberate practice. Here's how to build it without misery.",
    intro:
      "The good news: heat tolerance is real and trainable. Capsaicin desensitizes TRPV1 receptors over repeated exposure — the burn you feel is your nervous system's response, not tissue damage, and that response diminishes with practice. The bad news: the process requires consistent exposure at the edge of your current tolerance, not occasional extreme challenges.",
    steps: [
      {
        heading: "Establish your current baseline",
        body: "Find a sauce or pepper you can eat and enjoy despite the heat — not something that makes you stop eating. This is your starting point. For most people, a jalapeño or a medium commercial hot sauce works. You need a benchmark you can return to and compare against."
      },
      {
        heading: "Eat spicy food daily",
        body: "Frequency matters more than intensity. Daily exposure to moderate heat desensitizes faster than weekly exposure to extreme heat. Add hot sauce to a meal every day. The consistency of exposure is the training."
      },
      {
        heading: "Increase incrementally",
        body: "Every 1–2 weeks, move one step hotter — from jalapeño to serrano, serrano to fresno, fresno to cayenne, cayenne to habanero. The staircase approach works; quantum jumps (jalapeño to ghost pepper) just produce pain without adaptation."
      },
      {
        heading: "Know your dairy",
        body: "Milk's casein protein binds to capsaicin and removes it from receptors. Water moves heat around; milk stops it. Keep full-fat dairy available during early training. As tolerance builds, you'll need it less."
      }
    ],
    proTips: [
      "The 'afterburn' diminishes faster than the initial burn — give it 15 minutes before deciding you've eaten too much",
      "Eating before training reduces absorption and makes tolerance-building sessions more manageable",
      "Mental framing matters: approaching heat as 'interesting sensation' rather than 'pain' measurably changes how you experience it",
      "Sweating is good — it means your body is responding normally to capsaicin's thermoregulatory signal"
    ],
    affiliateKeys: ["amazon-tabasco-original", "amazon-cholula-original", "amazon-yellowbird-serrano", "amazon-yellowbird-habanero"],
    recipeTagMatch: ["general"],
    featured: false,
    source: "editorial"
  },
  {
    slug: "how-to-make-chili-oil",
    title: "How to Make Chili Oil at Home",
    category: "making-sauce",
    difficulty: "beginner",
    timeEstimate: "45 minutes",
    description:
      "Chili oil sits at the intersection of heat and richness — a drizzle transforms plain rice, noodles, or eggs. Making your own takes under an hour and produces something better than any commercial version.",
    intro:
      "Chili oil is fundamentally oil infused with heat, aromatics, and — crucially — texture. The commercial chili crisps that have swept American kitchens in the past five years are just well-made versions of a technique that's been standard in Sichuan and other Asian kitchens for centuries. The bloom method — pouring hot oil over dried chilis and aromatics — is simple and produces results that are hard to match from a jar.",
    steps: [
      {
        heading: "Prepare your aromatics",
        body: "Combine in a heat-proof bowl: 3 tablespoons Korean chili flakes (gochugaru), 1 tablespoon Chinese dried chili flakes, 1 teaspoon ground Sichuan pepper, 2 teaspoons sesame seeds, 1 teaspoon garlic powder, ½ teaspoon salt, 1 teaspoon soy sauce. Mix well."
      },
      {
        heading: "Choose your oil",
        body: "Neutral oil with a high smoke point: grapeseed, avocado, or refined sunflower. You need 1 cup. Avoid olive oil — the low smoke point creates bitter compounds at bloom temperature, and the flavor competes."
      },
      {
        heading: "Heat the oil",
        body: "Heat oil in a saucepan to 325–350°F. Use a thermometer — below 300°F and you don't bloom the aromatics properly; above 375°F and you burn them. A cube of ginger dropped in should sizzle immediately but not violently."
      },
      {
        heading: "The bloom",
        body: "Pour the hot oil over your aromatics in a thin stream, stirring constantly. The mixture will foam and sizzle — this is the bloom. The heat activates the chili compounds, toasts the sesame seeds, and creates the deep red-orange color. Let it settle for 30 seconds."
      },
      {
        heading: "Add texture (optional)",
        body: "For chili crisp texture: fry ¼ cup thinly sliced shallots and 4 cloves sliced garlic in the oil before pouring. Fry until golden and crisp, remove with a slotted spoon, drain on paper towels, then add back to the finished oil."
      }
    ],
    proTips: [
      "Let the oil cool to room temp before sealing — hot oil in a sealed jar can create pressure",
      "Refrigerated, it keeps for 2 months; the flavors deepen significantly after 48 hours",
      "A small piece of cinnamon stick or a star anise added to the aromatics adds complexity without being identifiable",
      "Drizzle over dumplings, fried eggs, noodles, pizza, or anything that needs heat and richness"
    ],
    affiliateKeys: ["amazon-chili-crisp", "amazon-gochujang-paste", "amazon-fly-by-jing-sichuan-gold", "amazon-sambal-oelek"],
    recipeTagMatch: ["korean", "chinese", "sichuan"],
    featured: true,
    source: "editorial"
  },
  {
    slug: "how-to-pair-hot-sauce-with-food",
    title: "How to Pair Hot Sauce With Food",
    category: "pairing",
    difficulty: "beginner",
    timeEstimate: "Reference guide",
    description:
      "Not every hot sauce goes on everything. Understanding why certain sauces work with certain foods unlocks a more deliberate, satisfying use of your hot sauce collection.",
    intro:
      "The instinct to grab whatever bottle is closest is understandable, but hot sauce pairing is a real skill with real payoffs. The fundamental principle is complementing or contrasting the dominant flavor of the dish: vinegar-forward sauces work with rich, fatty foods; fruit-forward sauces work with grilled meats; fermented sauces work with umami-heavy dishes.",
    steps: [
      {
        heading: "Vinegar-forward sauces (Tabasco, Crystal, Frank's)",
        body: "These are acid-first and work best as contrast against rich, fatty, or creamy foods. Oysters and Tabasco is the canonical example — the vinegar cuts the brininess and fat. Frank's on wings works because butter is the base. Use these on eggs, fried food, and anything where you want brightness cutting richness."
      },
      {
        heading: "Fruit-forward sauces (Yellowbird, El Yucateco, mango-habanero)",
        body: "Tropical fruit notes need savory partners to shine. Grilled chicken, pork, and fish give fruit-forward sauces their best stage. The fruit sugar caramelizes against charred protein. Avoid putting these on already-sweet foods — the contrast is gone and the heat amplifies unpleasantly."
      },
      {
        heading: "Fermented/umami sauces (chili crisp, gochujang, sambal)",
        body: "Fermented heat is additive rather than contrasting — it deepens and extends existing savory flavors. Rice, noodles, tofu, and eggs are the natural partners. Adding chili crisp to pizza or a burger works because the umami reinforces the meat and cheese rather than cutting through them."
      },
      {
        heading: "Oil-based and luxury sauces (TRUFF, infused oils)",
        body: "These are finishing ingredients, not cooking sauces. Apply after cooking, as a drizzle on the finished plate. Heat degrades truffle aroma immediately. A few drops of TRUFF on pasta or eggs just before eating does what you want; cooking with it wastes the premium ingredient."
      }
    ],
    proTips: [
      "The rule is: high acid with fat, fruit with smoke, ferment with umami",
      "Temperature affects perception — a sauce that seems mild cold will hit harder on hot food",
      "When in doubt, match regional origin: Mexican sauce on Mexican food, Caribbean sauce on Caribbean food",
      "Build a small collection deliberately: one vinegar, one fruit, one fermented — three bottles that between them cover almost every pairing"
    ],
    affiliateKeys: ["amazon-tabasco-original", "amazon-yellowbird-habanero", "amazon-chili-crisp", "amazon-truff-original"],
    recipeTagMatch: ["general"],
    featured: true,
    source: "editorial"
  }
];

export const CATEGORY_LABELS: Record<TutorialCategory, string> = {
  "making-sauce": "Making Sauce",
  "fermentation": "Fermentation",
  "growing": "Growing Peppers",
  "cooking-technique": "Cooking Techniques",
  "heat-culture": "Heat Culture",
  "pairing": "Pairing & Tasting"
};

export const DIFFICULTY_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced"
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getTutorialBySlug(slug: string): Tutorial | undefined {
  return TUTORIALS.find((t) => t.slug === slug);
}

export function getTutorialsByCategory(cat: TutorialCategory): Tutorial[] {
  return TUTORIALS.filter((t) => t.category === cat);
}

// ---------------------------------------------------------------------------
// DB layer
// ---------------------------------------------------------------------------

type TutorialRow = {
  slug: string; title: string; category: string; difficulty: string;
  time_estimate: string; description: string; intro: string;
  steps: Array<{ heading: string; body: string }>;
  pro_tips: string[]; affiliate_keys: string[]; recipe_tag_match: string[];
  featured: boolean;
};

function rowToTutorial(row: TutorialRow): Tutorial {
  return {
    slug: row.slug, title: row.title,
    category: row.category as TutorialCategory,
    difficulty: row.difficulty as Tutorial["difficulty"],
    timeEstimate: row.time_estimate,
    description: row.description, intro: row.intro,
    steps: row.steps ?? [], proTips: row.pro_tips ?? [],
    affiliateKeys: row.affiliate_keys ?? [],
    recipeTagMatch: row.recipe_tag_match ?? [],
    featured: row.featured, source: "editorial"
  };
}

export async function getTutorialsFromDb(): Promise<Tutorial[]> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return TUTORIALS;
    const { data, error } = await supabase
      .from("tutorials").select("*").eq("status", "published").order("title");
    if (error || !data || data.length === 0) return TUTORIALS;
    return (data as TutorialRow[]).map(rowToTutorial);
  } catch { return TUTORIALS; }
}

export async function getTutorialFromDb(slug: string): Promise<Tutorial | undefined> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return getTutorialBySlug(slug);
    const { data, error } = await supabase
      .from("tutorials").select("*").eq("slug", slug).eq("status", "published").single();
    if (error || !data) return getTutorialBySlug(slug);
    return rowToTutorial(data as TutorialRow);
  } catch { return getTutorialBySlug(slug); }
}
