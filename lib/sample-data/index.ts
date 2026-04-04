import { buildAmazonSearchUrl } from "@/lib/affiliates";
import type {
  AdminAuditEntry,
  BlogPost,
  Competition,
  ContentComment,
  CommunityPost,
  DashboardMetric,
  GenerationJob,
  MerchProduct,
  GenerationSchedule,
  NewsletterCampaign,
  NewsletterSubscriber,
  Profile,
  Recipe,
  Review,
  SiteSetting,
  SocialPost
} from "@/lib/types";

export const sampleProfiles: Profile[] = [
  {
    id: "admin-1",
    username: "firekeeper",
    displayName: "Mara Santiago",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=320&q=80",
    bio: "Founder voice, recipe tester, and relentless hot sauce critic.",
    heatScore: 1240,
    role: "admin",
    isBanned: false,
    followerCount: 1820,
    followingCount: 114
  },
  {
    id: "user-1",
    username: "ghostpeppergabe",
    displayName: "Gabe Holloway",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80",
    bio: "Heat-chasing home cook and Korean fried chicken obsessive.",
    heatScore: 680,
    role: "contributor",
    isBanned: false,
    followerCount: 219,
    followingCount: 93
  },
  {
    id: "user-2",
    username: "berberebelle",
    displayName: "Nia Ayele",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=320&q=80",
    bio: "Fermented heat, Ethiopian spice blends, and community challenge winner.",
    heatScore: 920,
    role: "moderator",
    isBanned: false,
    followerCount: 441,
    followingCount: 77
  }
];

export const sampleRecipes: Recipe[] = [
  {
    id: 1,
    type: "recipe",
    slug: "spicy-korean-gochujang-noodles",
    title: "Spicy Korean Gochujang Noodles",
    description:
      "A glossy weeknight noodle bowl with fermented chilli depth, crisp vegetables, and real heat.",
    intro:
      "This bowl leans on gochujang for a deep, savory heat instead of blunt spice. The result is fast, bold, and balanced enough to keep craving another forkful.",
    heroSummary:
      "A fast, high-reward noodle bowl with fermented chile depth, springy noodles, and enough crunch on top to keep every bite moving.",
    imageUrl:
      "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Bowl of spicy Korean noodles with sesame and scallions",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-28T12:00:00.000Z",
    tags: ["korean", "weeknight", "noodles", "spicy"],
    viewCount: 4812,
    likeCount: 318,
    authorName: "FlamingFoodies Team",
    heatLevel: "hot",
    cuisineType: "korean",
    prepTimeMinutes: 20,
    cookTimeMinutes: 15,
    totalTimeMinutes: 35,
    activeTimeMinutes: 25,
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "12", unit: "oz", item: "ramyun-style noodles" },
      { amount: "3", unit: "tbsp", item: "gochujang" },
      { amount: "2", unit: "tbsp", item: "soy sauce" },
      { amount: "1", unit: "tbsp", item: "rice vinegar" },
      { amount: "2", unit: "tsp", item: "honey" },
      { amount: "1", unit: "tbsp", item: "toasted sesame oil" },
      { amount: "3", unit: "", item: "garlic cloves", notes: "grated" },
      { amount: "1", unit: "tsp", item: "fresh ginger", notes: "grated" },
      { amount: "2", unit: "cups", item: "baby spinach" },
      { amount: "1", unit: "", item: "Persian cucumber", notes: "thinly sliced" },
      { amount: "4", unit: "", item: "scallions", notes: "thinly sliced" },
      { amount: "2", unit: "tsp", item: "toasted sesame seeds" }
    ],
    ingredientSections: [
      {
        title: "For the gochujang sauce",
        items: [
          { amount: "3", unit: "tbsp", item: "gochujang" },
          { amount: "2", unit: "tbsp", item: "soy sauce" },
          { amount: "1", unit: "tbsp", item: "rice vinegar" },
          { amount: "2", unit: "tsp", item: "honey" },
          { amount: "1", unit: "tbsp", item: "toasted sesame oil" },
          { amount: "3", unit: "", item: "garlic cloves", notes: "grated" },
          { amount: "1", unit: "tsp", item: "fresh ginger", notes: "grated" }
        ]
      },
      {
        title: "For the noodles and finish",
        items: [
          { amount: "12", unit: "oz", item: "ramyun-style noodles" },
          { amount: "2", unit: "cups", item: "baby spinach" },
          { amount: "1", unit: "", item: "Persian cucumber", notes: "thinly sliced" },
          { amount: "4", unit: "", item: "scallions", notes: "thinly sliced" },
          { amount: "2", unit: "tsp", item: "toasted sesame seeds" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Whisk the gochujang, soy, vinegar, honey, sesame oil, garlic, and ginger until the sauce turns smooth and glossy.",
        tip: "You want a sauce that tastes rounded and savory before it ever hits the noodles."
      },
      {
        step: 2,
        text: "Boil the noodles until springy and reserve a generous splash of noodle water before draining.",
        tip: "Pull the noodles just shy of fully soft because they keep cooking in the sauce."
      },
      {
        step: 3,
        text: "Toss the hot noodles with the sauce and spinach until the noodles are lacquered and the greens barely wilt.",
        tip: "Add noodle water a splash at a time until the sauce clings instead of clumping."
      },
      {
        step: 4,
        text: "Finish with cucumber, scallions, and sesame seeds so the bowl stays bright, crunchy, and balanced.",
        tip: "The cool toppings are what keep the fermented heat from feeling heavy."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Build a glossy sauce first",
        body:
          "Whisk the gochujang, soy, vinegar, honey, sesame oil, garlic, and ginger until the mixture looks smooth and spoonable.",
        cue: "The sauce should taste balanced, with savory depth and a little sweetness, not just raw heat.",
        tip: "If the gochujang is stiff, add a teaspoon of warm water to loosen it.",
        durationMinutes: 5,
        ingredientRefs: ["gochujang", "soy sauce", "rice vinegar", "honey", "toasted sesame oil", "garlic cloves", "fresh ginger"]
      },
      {
        step: 2,
        title: "Cook the noodles with some bounce left",
        body:
          "Boil the noodles until just springy and reserve some cooking water before draining so you can loosen the sauce later.",
        cue: "The noodles should bend easily but still feel resilient in the center.",
        tip: "Overcooked noodles go dull and gummy fast in this style of sauce.",
        durationMinutes: 6,
        ingredientRefs: ["ramyun-style noodles"]
      },
      {
        step: 3,
        title: "Lacquer the noodles, then wilt the greens",
        body:
          "Return the hot noodles to the pot, add the sauce, and toss until everything turns glossy. Fold in the spinach at the end so it softens without disappearing.",
        cue: "You want shiny noodles with a loose sheen, not a dry paste sitting on top.",
        tip: "Use noodle water in small splashes until the sauce coats every strand cleanly.",
        durationMinutes: 6,
        ingredientRefs: ["ramyun-style noodles", "baby spinach"],
        imageUrl:
          "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Gochujang noodles being tossed until glossy"
      },
      {
        step: 4,
        title: "Finish with contrast",
        body:
          "Pile the noodles into bowls and top with cucumber, scallions, and sesame seeds so the bowl gets crunch, freshness, and a cooler edge against the heat.",
        cue: "The final bowl should look glossy and feel restless, not flat and one-note.",
        tip: "Serve immediately while the noodles still have spring and the toppings stay crisp.",
        durationMinutes: 3,
        ingredientRefs: ["Persian cucumber", "scallions", "toasted sesame seeds"]
      }
    ],
    tips: [
      "Add a spoon of peanut butter for extra body.",
      "Finish with cucumber for a cooling crunch."
    ],
    variations: [
      "Add crispy tofu for more protein.",
      "Swap in udon for a chewier bowl."
    ],
    makeAheadNotes:
      "The sauce can be mixed a day ahead and kept in the fridge. Slice the cucumber and scallions right before serving so the bowl still feels fresh.",
    storageNotes:
      "Store leftover noodles in an airtight container for up to 2 days. Keep the crunchy toppings separate so they do not turn watery.",
    reheatNotes:
      "Reheat gently in a skillet or microwave with a splash of water to loosen the sauce, then add fresh scallions and cucumber before serving.",
    servingSuggestions: [
      "Add a jammy egg or crispy tofu if you want the bowl to land more like a full dinner.",
      "Serve with kimchi or quick-pickled cucumbers if you want even more sharpness against the heat.",
      "Scatter extra sesame seeds and a last drizzle of sesame oil at the table for a richer finish."
    ],
    substitutions: [
      "Use udon if you want a chewier, heavier bowl, but keep extra noodle water ready because thicker noodles absorb more sauce.",
      "Use maple syrup or brown sugar in place of honey if that is what you already have open.",
      "Swap spinach for bok choy or napa cabbage if you want more texture."
    ],
    faqs: [
      {
        question: "Can I make these noodles less spicy?",
        answer:
          "Yes. Start with 2 tablespoons of gochujang instead of 3, then taste the sauce before tossing the noodles."
      },
      {
        question: "What noodles work best if I cannot find ramyun-style noodles?",
        answer:
          "Fresh ramen, yakisoba noodles, or even udon all work. Just adjust the noodle-water addition so the sauce stays glossy instead of tight."
      },
      {
        question: "Does this hold up for leftovers?",
        answer:
          "It holds up well for lunch the next day, but the noodles will drink up sauce. Reheat with a splash of water and add fresh toppings before eating."
      }
    ],
    equipment: ["large pot", "mixing bowl", "tongs"],
    seoTitle: "Spicy Korean Gochujang Noodles Recipe",
    seoDescription: "Make glossy, deeply savory gochujang noodles in 35 minutes.",
    ratingAvg: 4.8,
    ratingCount: 121,
    saveCount: 882
  },
  {
    id: 2,
    type: "recipe",
    slug: "jamaican-jerk-shrimp-skewers",
    title: "Jamaican Jerk Shrimp Skewers",
    description:
      "Charred skewers layered with allspice, thyme, Scotch bonnet heat, and a sticky citrus glaze.",
    intro:
      "Jerk is about aromatic depth as much as spice. These skewers keep the warm spice backbone intact while staying fast enough for a grill-night staple.",
    heroSummary:
      "Fast-grilled shrimp with real jerk character, a sticky lime glaze, and enough char to make the whole platter taste bigger than the ingredient list.",
    imageUrl:
      "https://images.unsplash.com/photo-1746212087584-edcdb21f44b9?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=1200",
    imageAlt: "Grilled shrimp cooking on a barbecue grill",
    featured: true,
    source: "ai_generated",
    status: "published",
    publishedAt: "2026-03-30T17:00:00.000Z",
    tags: ["jamaican", "grill", "seafood"],
    viewCount: 2310,
    likeCount: 145,
    authorName: "FlamingFoodies Team",
    heatLevel: "inferno",
    cuisineType: "jamaican",
    prepTimeMinutes: 25,
    cookTimeMinutes: 8,
    totalTimeMinutes: 33,
    activeTimeMinutes: 22,
    servings: 4,
    difficulty: "intermediate",
    ingredients: [
      { amount: "1 1/2", unit: "lb", item: "large shrimp", notes: "peeled and deveined" },
      { amount: "2", unit: "tbsp", item: "jerk seasoning" },
      { amount: "2", unit: "tbsp", item: "neutral oil" },
      { amount: "1", unit: "tbsp", item: "lime juice" },
      { amount: "1", unit: "tbsp", item: "soy sauce" },
      { amount: "1", unit: "tbsp", item: "brown sugar" },
      { amount: "2", unit: "", item: "garlic cloves", notes: "grated" },
      { amount: "1", unit: "tbsp", item: "fresh thyme leaves" },
      { amount: "2", unit: "tbsp", item: "melted butter" },
      { amount: "2", unit: "", item: "limes", notes: "cut into wedges" },
      { amount: "2", unit: "", item: "scallions", notes: "thinly sliced" }
    ],
    ingredientSections: [
      {
        title: "For the jerk marinade",
        items: [
          { amount: "2", unit: "tbsp", item: "jerk seasoning" },
          { amount: "2", unit: "tbsp", item: "neutral oil" },
          { amount: "1", unit: "tbsp", item: "lime juice" },
          { amount: "1", unit: "tbsp", item: "soy sauce" },
          { amount: "1", unit: "tbsp", item: "brown sugar" },
          { amount: "2", unit: "", item: "garlic cloves", notes: "grated" },
          { amount: "1", unit: "tbsp", item: "fresh thyme leaves" }
        ]
      },
      {
        title: "For the shrimp and grill finish",
        items: [
          { amount: "1 1/2", unit: "lb", item: "large shrimp", notes: "peeled and deveined" },
          { amount: "2", unit: "tbsp", item: "melted butter" }
        ]
      },
      {
        title: "For serving",
        items: [
          { amount: "2", unit: "", item: "limes", notes: "cut into wedges" },
          { amount: "2", unit: "", item: "scallions", notes: "thinly sliced" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Whisk the jerk seasoning, oil, lime juice, soy sauce, brown sugar, garlic, and thyme into a loose marinade, then coat the shrimp well.",
        tip: "The marinade should read savory and aromatic first, not just hot."
      },
      {
        step: 2,
        text: "Thread the shrimp onto skewers and let them sit just long enough to take on the seasoning while the grill gets fully hot.",
        tip: "Do not leave the shrimp for hours. The lime can start to toughen them."
      },
      {
        step: 3,
        text: "Grill over high heat until the shrimp just curl and char at the edges, turning once and brushing with butter for shine.",
        tip: "Pull them as soon as they go opaque so they stay snappy, not rubbery."
      },
      {
        step: 4,
        text: "Rest briefly, then shower with scallions and serve with lime wedges while the shrimp are still hot and smoky.",
        tip: "These are at their best straight off the grill."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Build a marinade with depth, not just heat",
        body:
          "Whisk together the jerk seasoning, oil, lime, soy, brown sugar, garlic, and thyme until you have a loose marinade that tastes warm, savory, and sharp.",
        cue: "The mixture should smell like allspice, thyme, and chile before the shrimp ever touch it.",
        tip: "If your jerk seasoning is salt-heavy, hold back a pinch until you taste the finished marinade.",
        durationMinutes: 5,
        ingredientRefs: ["jerk seasoning", "neutral oil", "lime juice", "soy sauce", "brown sugar", "garlic cloves", "fresh thyme leaves"]
      },
      {
        step: 2,
        title: "Coat and skewer the shrimp",
        body:
          "Toss the shrimp in the marinade, thread them onto skewers, and let them stand while the grill preheats so the seasoning can grab on without curing the shrimp.",
        cue: "The shrimp should look evenly coated and glossy, not drenched in excess liquid.",
        tip: "Double-skewer if you want easier flipping over high heat.",
        durationMinutes: 12,
        ingredientRefs: ["large shrimp"]
      },
      {
        step: 3,
        title: "Grill fast for char and snap",
        body:
          "Grill the skewers over high heat, turning once, until the shrimp are opaque with charred edges. Brush with melted butter right at the end for shine and extra richness.",
        cue: "You want tight curls, bright color, and a little blackening on the ridges without any dry, chalky centers.",
        tip: "As soon as the shrimp firm up, they are done. Grill bravado dries them out fast.",
        durationMinutes: 6,
        ingredientRefs: ["large shrimp", "melted butter"],
        imageUrl:
          "https://images.unsplash.com/photo-1746212087584-edcdb21f44b9?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=1000",
        imageAlt: "Shrimp charring over high heat on a grill"
      },
      {
        step: 4,
        title: "Finish bright and serve immediately",
        body:
          "Slide the shrimp off the grill, rest for a minute, then hit them with scallions and plenty of lime so the plate stays bright against all that spice and smoke.",
        cue: "The final platter should smell spicy and citrusy, not just charred.",
        tip: "Serve these with extra napkins and extra lime. Both earn their place.",
        durationMinutes: 2,
        ingredientRefs: ["limes", "scallions"]
      }
    ],
    tips: [
      "Use metal skewers or soak wooden ones well so the shrimp turn cleanly on the grill.",
      "Keep one edge of the grill cooler in case the sugars in the marinade start darkening too fast."
    ],
    variations: [
      "Swap shrimp for chunks of chicken thigh if you want a heavier grill-night version.",
      "Use habanero instead of Scotch bonnet style jerk seasoning if that is easier to find."
    ],
    makeAheadNotes:
      "Mix the marinade earlier in the day, but coat the shrimp only shortly before grilling so they keep a bouncy texture.",
    storageNotes:
      "Leftover shrimp keep for up to 2 days in the fridge. Store them separate from any sides so they do not get soggy.",
    reheatNotes:
      "Rewarm quickly in a skillet or hot oven just until heated through. Avoid long reheating or the shrimp will turn rubbery.",
    servingSuggestions: [
      "Serve with grilled pineapple, coconut rice, or a crisp cabbage slaw if you want a full plate.",
      "An icy lager or citrusy sparkling water works well with the allspice-heavy heat.",
      "A little extra lime over the platter right before serving makes the jerk flavors pop."
    ],
    substitutions: [
      "Use chicken thighs or thick strips of tofu if you want to take the same flavor profile in a different direction.",
      "If your jerk seasoning is very hot already, skip extra fresh chile and let the spice blend do the work.",
      "Use honey instead of brown sugar if you want a glossier finish on the grill."
    ],
    faqs: [
      {
        question: "How long should I marinate the shrimp?",
        answer:
          "About 10 to 20 minutes is plenty. Much longer and the lime can start to change the texture of the shrimp."
      },
      {
        question: "Can I cook these indoors?",
        answer:
          "Yes. A ripping-hot grill pan or cast-iron skillet works well if you cannot get outside, though you will lose a little smokiness."
      },
      {
        question: "What makes jerk taste like jerk?",
        answer:
          "It is the allspice, thyme, chile, and a little sweetness working together. The profile should taste aromatic and savory, not like generic hot sauce."
      }
    ],
    equipment: ["grill", "metal skewers"],
    ratingAvg: 4.6,
    ratingCount: 48,
    saveCount: 244
  },
  {
    id: 3,
    type: "recipe",
    slug: "berbere-roasted-cauliflower",
    title: "Berbere Roasted Cauliflower",
    description:
      "A sheet-pan side with smoky berbere warmth, crisp edges, and a cooling lemon yogurt finish.",
    intro:
      "Berbere brings warmth, fragrance, and cumulative heat instead of a one-note punch. It makes cauliflower feel complex enough to headline the table.",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-20T18:00:00.000Z",
    tags: ["ethiopian", "vegetarian", "sheet pan"],
    viewCount: 1670,
    likeCount: 84,
    authorName: "FlamingFoodies Team",
    heatLevel: "medium",
    cuisineType: "ethiopian",
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    totalTimeMinutes: 45,
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1", unit: "head", item: "cauliflower" },
      { amount: "2", unit: "tbsp", item: "olive oil" },
      { amount: "2", unit: "tsp", item: "berbere" }
    ],
    instructions: [
      { step: 1, text: "Coat cauliflower in oil and berbere." },
      { step: 2, text: "Roast until browned on the edges." },
      { step: 3, text: "Serve over lemon yogurt with herbs." }
    ],
    tips: ["Let the pan preheat for better char."],
    variations: ["Use carrots or cabbage for the same spice profile."],
    equipment: ["sheet pan"],
    ratingAvg: 4.4,
    ratingCount: 22,
    saveCount: 119
  },
  {
    id: 4,
    type: "recipe",
    slug: "nashville-hot-chicken-sandwiches",
    title: "Nashville Hot Chicken Sandwiches",
    description:
      "Crisp fried chicken, cayenne oil, pickles, and slaw stacked into a sandwich that actually earns the mess.",
    intro:
      "The goal here is crunchy, juicy, and aggressively seasoned without collapsing into pure heat bravado. The slaw buys you balance, not mercy.",
    heroSummary:
      "A real crunchy-hot sandwich with juicy thigh meat, cayenne oil, cold slaw, and just enough pickle snap to make the heat addictive.",
    imageUrl:
      "https://images.unsplash.com/photo-1700768400970-428c50bffc11?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGhvdCUyMGNoaWNrZW4lMjBzYW5kd2ljaHxlbnwwfHwwfHx8MA%3D%3D&ixlib=rb-4.1.0&q=60&w=1200",
    imageAlt: "Fried chicken sandwich with pickles and mayonnaise",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-04-02T18:00:00.000Z",
    tags: ["sandwich", "fried chicken", "american"],
    viewCount: 5220,
    likeCount: 334,
    authorName: "FlamingFoodies Team",
    heatLevel: "inferno",
    cuisineType: "american",
    prepTimeMinutes: 30,
    cookTimeMinutes: 20,
    totalTimeMinutes: 50,
    activeTimeMinutes: 40,
    servings: 4,
    difficulty: "intermediate",
    ingredients: [
      { amount: "4", unit: "", item: "boneless chicken thighs" },
      { amount: "1", unit: "cup", item: "buttermilk" },
      { amount: "1/4", unit: "cup", item: "pickle brine" },
      { amount: "1", unit: "tbsp", item: "hot sauce" },
      { amount: "1 1/2", unit: "cups", item: "all-purpose flour" },
      { amount: "1/2", unit: "cup", item: "cornstarch" },
      { amount: "2", unit: "tbsp", item: "cayenne" },
      { amount: "1", unit: "tsp", item: "smoked paprika" },
      { amount: "1", unit: "tsp", item: "garlic powder" },
      { amount: "2", unit: "tbsp", item: "brown sugar" },
      { amount: "1/3", unit: "cup", item: "frying oil", notes: "for the Nashville hot brush-on" },
      { amount: "4", unit: "", item: "potato buns" },
      { amount: "1 1/2", unit: "cups", item: "slaw mix" },
      { amount: "3", unit: "tbsp", item: "mayonnaise" },
      { amount: "2", unit: "tbsp", item: "dill pickle chips" }
    ],
    ingredientSections: [
      {
        title: "For the chicken marinade and dredge",
        items: [
          { amount: "4", unit: "", item: "boneless chicken thighs" },
          { amount: "1", unit: "cup", item: "buttermilk" },
          { amount: "1/4", unit: "cup", item: "pickle brine" },
          { amount: "1", unit: "tbsp", item: "hot sauce" },
          { amount: "1 1/2", unit: "cups", item: "all-purpose flour" },
          { amount: "1/2", unit: "cup", item: "cornstarch" },
          { amount: "1", unit: "tsp", item: "smoked paprika" },
          { amount: "1", unit: "tsp", item: "garlic powder" }
        ]
      },
      {
        title: "For the Nashville hot oil",
        items: [
          { amount: "2", unit: "tbsp", item: "cayenne" },
          { amount: "2", unit: "tbsp", item: "brown sugar" },
          { amount: "1/3", unit: "cup", item: "frying oil", notes: "for the brush-on" }
        ]
      },
      {
        title: "For sandwich assembly",
        items: [
          { amount: "4", unit: "", item: "potato buns" },
          { amount: "1 1/2", unit: "cups", item: "slaw mix" },
          { amount: "3", unit: "tbsp", item: "mayonnaise" },
          { amount: "2", unit: "tbsp", item: "dill pickle chips" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Marinate the chicken in buttermilk, pickle brine, and hot sauce for at least 30 minutes.",
        tip: "The pickle brine seasons the chicken deeper and keeps the meat tasting sharp, not heavy."
      },
      {
        step: 2,
        text: "Dredge in the flour-cornstarch coating and fry until deeply golden and cooked through.",
        tip: "Let the dredged chicken rest briefly before frying so the crust grabs harder."
      },
      {
        step: 3,
        text: "Stir the cayenne, brown sugar, and hot frying oil into a loose paste, then brush it over the chicken while still hot.",
        tip: "The chicken needs to be hot enough to drink in the oil, not just wear it on the surface."
      },
      {
        step: 4,
        text: "Toast the buns and stack with mayo slaw, pickles, and the hot chicken right away.",
        tip: "Cold slaw and pickles are the balance, not a garnish afterthought."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Marinate the thighs for seasoned juiciness",
        body:
          "Soak the chicken in buttermilk, pickle brine, and hot sauce long enough for the seasoning to get beneath the crust.",
        cue: "The marinade should cling to the chicken in a loose, well-seasoned coat.",
        tip: "Thirty minutes works, but an hour gives you an even juicier sandwich.",
        durationMinutes: 30,
        ingredientRefs: ["boneless chicken thighs", "buttermilk", "pickle brine", "hot sauce"]
      },
      {
        step: 2,
        title: "Build a craggy crust",
        body:
          "Coat the chicken in the seasoned flour and cornstarch mixture, pressing firmly so the exterior picks up ridges and flakes before it ever hits the oil.",
        cue: "The dredged chicken should look shaggy and dry on the outside, not slick with marinade.",
        tip: "Letting the coated chicken sit for 5 minutes helps the breading stay on during frying.",
        durationMinutes: 10,
        ingredientRefs: ["all-purpose flour", "cornstarch", "smoked paprika", "garlic powder"]
      },
      {
        step: 3,
        title: "Fry until the crust goes deep bronze",
        body:
          "Fry the chicken until the exterior is hard-crisp and richly golden while the interior stays juicy and fully cooked.",
        cue: "You want a crust that sounds crisp when tapped and chicken that reads done without looking dry.",
        tip: "Rest the fried chicken on a rack, never directly on paper towels, so the crust stays audible.",
        durationMinutes: 12,
        ingredientRefs: ["boneless chicken thighs"],
        imageUrl:
          "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Hot chicken frying until deeply golden and crisp"
      },
      {
        step: 4,
        title: "Brush on the Nashville heat",
        body:
          "Whisk cayenne, brown sugar, and hot frying oil into a fiery brush-on mixture, then coat the hot chicken while the crust still wants to absorb it.",
        cue: "The oil should look loose enough to brush, and the chicken should take on a glossy red finish rather than patchy streaks.",
        tip: "Start with a lighter brush for the first sandwich, then push hotter if you want more punishment.",
        durationMinutes: 3,
        ingredientRefs: ["cayenne", "brown sugar", "frying oil"]
      },
      {
        step: 5,
        title: "Stack with cold, sharp contrast",
        body:
          "Toast the buns, toss together the mayo slaw, and stack with pickles so the sandwich hits crunchy, juicy, hot, and sharp all at once.",
        cue: "The finished sandwich should feel messy in a good way, but still structured enough to bite cleanly.",
        tip: "Serve immediately. This style loses its magic once the crust sits too long under slaw.",
        durationMinutes: 5,
        ingredientRefs: ["potato buns", "slaw mix", "mayonnaise", "dill pickle chips"]
      }
    ],
    tips: ["Rest the fried chicken on a rack so the crust stays crisp."],
    variations: ["Swap in tenders for a faster weeknight version."],
    makeAheadNotes:
      "Marinate the chicken and mix the slaw base ahead, but fry and brush with the hot oil right before serving so the crust stays loud.",
    storageNotes:
      "Store leftover fried chicken separately from buns and slaw for up to 2 days. Keep the hot oil mixture and assembly pieces chilled apart.",
    reheatNotes:
      "Reheat the chicken on a rack in a hot oven or air fryer until the crust wakes back up, then brush with a little extra hot oil before serving.",
    servingSuggestions: [
      "Serve with crinkle fries, dill pickles, and lots of cold napkins.",
      "A simple vinegar slaw or extra pickle chips help if you want even more cut against the cayenne oil.",
      "Sweet tea or a citrusy lager both make sense next to this level of heat."
    ],
    substitutions: [
      "Use tenders if you want a faster fry, but shorten the cooking time and watch them closely.",
      "Use boneless breasts only if you pound them evenly first; thighs stay juicier and make a better Nashville sandwich.",
      "If you want a gentler sandwich, cut the cayenne with more brown sugar and brush a lighter coat."
    ],
    faqs: [
      {
        question: "Can I make this without deep frying?",
        answer:
          "You can shallow fry in a heavy skillet, but the sandwich really wants a full crisp crust. Air frying works in a pinch, though the texture is not quite the same."
      },
      {
        question: "How spicy is the Nashville oil?",
        answer:
          "It is aggressively hot as written. Start by brushing a little on one piece of chicken, then scale up if you want the full inferno effect."
      },
      {
        question: "What keeps the sandwich from feeling too heavy?",
        answer:
          "The slaw and pickles do that job. Without them, all you taste is crust and fat, which gets tiring fast."
      }
    ],
    equipment: ["Dutch oven", "wire rack", "thermometer"],
    seoTitle: "Nashville Hot Chicken Sandwich Recipe",
    seoDescription: "Build a crunchy, spicy Nashville hot chicken sandwich at home.",
    ratingAvg: 4.9,
    ratingCount: 168,
    saveCount: 1124
  },
  {
    id: 5,
    type: "recipe",
    slug: "smoky-habanero-smash-burgers",
    title: "Smoky Habanero Smash Burgers",
    description:
      "Cast-iron burgers with hard sear, smoked chile mayo, and enough habanero bite to wake up the whole cookout.",
    intro:
      "Smash burgers are already about texture and speed, so the sauce has to do the flavor lift. Smoky mayo plus melty cheese gets it there fast.",
    heroSummary:
      "A hard-seared burger build with smoky habanero mayo, lacy edges, and the kind of fast griddle energy that still tastes intentional.",
    imageUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Smash burger with melted cheese and spicy sauce",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-04-01T17:00:00.000Z",
    tags: ["burger", "griddle", "cookout"],
    viewCount: 4011,
    likeCount: 241,
    authorName: "FlamingFoodies Team",
    heatLevel: "hot",
    cuisineType: "american",
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    totalTimeMinutes: 27,
    activeTimeMinutes: 20,
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1.5", unit: "lb", item: "ground beef" },
      { amount: "1", unit: "", item: "habanero", notes: "finely minced" },
      { amount: "1/3", unit: "cup", item: "mayonnaise" },
      { amount: "1", unit: "tsp", item: "smoked paprika" },
      { amount: "1", unit: "tsp", item: "lime juice" },
      { amount: "4", unit: "slices", item: "American cheese" },
      { amount: "4", unit: "", item: "burger buns" },
      { amount: "1/2", unit: "", item: "white onion", notes: "thinly sliced" },
      { amount: "8", unit: "", item: "pickle chips" }
    ],
    ingredientSections: [
      {
        title: "For the smoky habanero mayo",
        items: [
          { amount: "1/3", unit: "cup", item: "mayonnaise" },
          { amount: "1", unit: "", item: "habanero", notes: "finely minced" },
          { amount: "1", unit: "tsp", item: "smoked paprika" },
          { amount: "1", unit: "tsp", item: "lime juice" }
        ]
      },
      {
        title: "For the burgers",
        items: [
          { amount: "1.5", unit: "lb", item: "ground beef" },
          { amount: "4", unit: "slices", item: "American cheese" },
          { amount: "4", unit: "", item: "burger buns" }
        ]
      },
      {
        title: "For the finish",
        items: [
          { amount: "1/2", unit: "", item: "white onion", notes: "thinly sliced" },
          { amount: "8", unit: "", item: "pickle chips" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Stir the habanero into mayo with smoked paprika and lime until the sauce tastes smoky, bright, and just sharp enough.",
        tip: "The mayo should taste punchy on its own because the beef will soften the heat once assembled."
      },
      {
        step: 2,
        text: "Form loose beef balls and smash them onto a ripping hot griddle or skillet until the edges turn deeply lacy.",
        tip: "Do not compact the meat beforehand or you lose the texture that makes smash burgers worth doing."
      },
      {
        step: 3,
        text: "Flip, melt on the cheese, and toast the buns while the burgers finish.",
        tip: "The cheese should look fully relaxed and glossy by the time the buns are ready."
      },
      {
        step: 4,
        text: "Build with smoky mayo, onions, and pickles while everything is still hot and crisp.",
        tip: "Smash burgers want to be eaten right away, not held on a tray."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Make the smoky sauce first",
        body:
          "Mix the habanero into mayo with smoked paprika and lime until the sauce tastes sharp, smoky, and balanced enough to cut through beef.",
        cue: "The sauce should hit spicy but still creamy, with the lime keeping the habanero from tasting flat.",
        tip: "Start with half the habanero if you are unsure of the pepper's strength, then adjust upward.",
        durationMinutes: 5,
        ingredientRefs: ["mayonnaise", "habanero", "smoked paprika", "lime juice"]
      },
      {
        step: 2,
        title: "Smash fast on ripping-hot metal",
        body:
          "Drop loose balls of beef onto the hot surface and smash hard right away so the patties get maximum contact and the edges crisp up fast.",
        cue: "You want a loud sizzle and frilled edges that turn dark brown without the center drying out.",
        tip: "Use parchment between the spatula and the beef if you want cleaner, flatter patties.",
        durationMinutes: 6,
        ingredientRefs: ["ground beef"],
        imageUrl:
          "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Smash burger patties searing on a hot griddle"
      },
      {
        step: 3,
        title: "Melt the cheese and toast the buns",
        body:
          "Flip once the crust is set, add the cheese, and toast the buns while the second side finishes so everything lands together.",
        cue: "The cheese should slump over the burger and the buns should pick up light golden edges.",
        tip: "Do not overcook the second side. Smash burgers are about crust, not a long cook.",
        durationMinutes: 4,
        ingredientRefs: ["American cheese", "burger buns"]
      },
      {
        step: 4,
        title: "Build with contrast before the crust softens",
        body:
          "Spread on the smoky habanero mayo and stack with onion and pickles while the patties are still hot enough to stay juicy and crisp.",
        cue: "The burger should eat messy, but the crust should still feel crisp under the sauce.",
        tip: "Have every topping ready before you start smashing because this whole cook moves fast.",
        durationMinutes: 3,
        ingredientRefs: ["smoky habanero mayo", "white onion", "pickle chips"]
      }
    ],
    tips: ["Keep the patties loose until they hit the pan for better crust."],
    variations: ["Use pepper jack instead of American for extra bite."],
    makeAheadNotes:
      "Mix the mayo and slice the onions ahead, but cook the burgers right before serving. Smash burgers are all about immediate texture.",
    storageNotes:
      "Cooked patties keep in the fridge for 2 days, though the crust softens. Store the sauce and burger toppings separately.",
    reheatNotes:
      "Reheat the patties in a hot skillet for the best recovery, then rebuild the burgers fresh with more mayo and cold toppings.",
    servingSuggestions: [
      "Serve with salted fries, kettle chips, or grilled corn if you want a full cookout plate.",
      "A cold lager or limey sparkling water helps cut the richness and habanero heat.",
      "Extra pickles on the side are worth it because the burger gets richer as you eat."
    ],
    substitutions: [
      "Use pepper jack instead of American if you want a sharper melt and a little more bite.",
      "Swap in jalapeno if habanero feels too aggressive, but keep the smoked paprika so the sauce still has depth.",
      "Use Martin's-style rolls or any soft potato bun that can compress without tearing."
    ],
    faqs: [
      {
        question: "Can I cook these on a regular skillet instead of a griddle?",
        answer:
          "Yes. A heavy cast-iron skillet works great as long as you cook in batches and let the pan stay ripping hot between patties."
      },
      {
        question: "Why use loose beef balls instead of formed patties?",
        answer:
          "Loose beef lets you create the thin, lacy edges that define a true smash burger. Pre-shaped patties usually steam more than they crisp."
      },
      {
        question: "How spicy is the habanero mayo?",
        answer:
          "It is clearly spicy but still burger-friendly as written. If your habanero is especially hot, start small and taste as you go."
      }
    ],
    equipment: ["cast-iron skillet", "metal spatula"],
    ratingAvg: 4.7,
    ratingCount: 101,
    saveCount: 694
  },
  {
    id: 6,
    type: "recipe",
    slug: "thai-drunken-noodles-birds-eye-chili",
    title: "Thai Drunken Noodles with Bird's Eye Chili",
    description:
      "A wok-fired noodle bowl with holy basil, soy-dark caramelization, and the kind of chili bite that keeps the dish restless.",
    intro:
      "This is a high-heat, high-speed noodle dinner. Bird's eye chiles sharpen the edges while basil and oyster sauce keep it fragrant and round.",
    heroSummary:
      "A true high-heat noodle dinner with smoky wok flavor, sharp chile bite, and enough basil at the end to keep the whole bowl alive.",
    imageUrl:
      "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Thai drunken noodles in a bowl",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-31T19:00:00.000Z",
    tags: ["thai", "noodles", "wok"],
    viewCount: 3442,
    likeCount: 221,
    authorName: "FlamingFoodies Team",
    heatLevel: "inferno",
    cuisineType: "thai",
    prepTimeMinutes: 20,
    cookTimeMinutes: 10,
    totalTimeMinutes: 30,
    activeTimeMinutes: 25,
    servings: 4,
    difficulty: "intermediate",
    ingredients: [
      { amount: "14", unit: "oz", item: "wide rice noodles" },
      { amount: "3", unit: "", item: "bird's eye chiles", notes: "sliced" },
      { amount: "3", unit: "tbsp", item: "oyster sauce" },
      { amount: "2", unit: "tbsp", item: "soy sauce" },
      { amount: "1", unit: "tbsp", item: "fish sauce" },
      { amount: "1", unit: "tsp", item: "dark soy sauce" },
      { amount: "2", unit: "tsp", item: "brown sugar" },
      { amount: "4", unit: "", item: "garlic cloves", notes: "sliced" },
      { amount: "2", unit: "", item: "shallots", notes: "thinly sliced" },
      { amount: "1", unit: "", item: "red bell pepper", notes: "thinly sliced" },
      { amount: "1", unit: "cup", item: "Thai basil leaves" },
      { amount: "1", unit: "", item: "lime", notes: "cut into wedges" }
    ],
    ingredientSections: [
      {
        title: "For the sauce",
        items: [
          { amount: "3", unit: "tbsp", item: "oyster sauce" },
          { amount: "2", unit: "tbsp", item: "soy sauce" },
          { amount: "1", unit: "tbsp", item: "fish sauce" },
          { amount: "1", unit: "tsp", item: "dark soy sauce" },
          { amount: "2", unit: "tsp", item: "brown sugar" }
        ]
      },
      {
        title: "For the wok",
        items: [
          { amount: "14", unit: "oz", item: "wide rice noodles" },
          { amount: "3", unit: "", item: "bird's eye chiles", notes: "sliced" },
          { amount: "4", unit: "", item: "garlic cloves", notes: "sliced" },
          { amount: "2", unit: "", item: "shallots", notes: "thinly sliced" },
          { amount: "1", unit: "", item: "red bell pepper", notes: "thinly sliced" },
          { amount: "1", unit: "cup", item: "Thai basil leaves" },
          { amount: "1", unit: "", item: "lime", notes: "cut into wedges" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Whisk the sauce and prep every stir-fry component before the pan gets hot.",
        tip: "Once the wok is on, there is no time left for chopping."
      },
      {
        step: 2,
        text: "Soften the noodles if needed, then sear the garlic, shallots, and bird's eye chiles over high heat.",
        tip: "The wok should stay hot enough to smell smoky, not soupy."
      },
      {
        step: 3,
        text: "Add the noodles, peppers, and sauce, tossing hard until the noodles darken and pick up charred edges.",
        tip: "Use the spatula like you mean it. This dish wants fast movement, not gentle stirring."
      },
      {
        step: 4,
        text: "Kill the heat, fold in the basil, and serve with lime while the noodles are still glossy.",
        tip: "Thai basil should wilt just enough to perfume the whole bowl without turning gray."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Set the whole station before you light the wok",
        body:
          "Whisk the sauce and line up the noodles, aromatics, peppers, basil, and lime before heat starts because this is a real fast-cook dish.",
        cue: "Everything should be within arm's reach before the wok gets hot.",
        tip: "This is the recipe where mise en place actually matters.",
        durationMinutes: 10,
        ingredientRefs: ["oyster sauce", "soy sauce", "fish sauce", "dark soy sauce", "brown sugar", "wide rice noodles", "Thai basil leaves"]
      },
      {
        step: 2,
        title: "Hit the wok with aromatics and chile first",
        body:
          "Sear the garlic, shallots, and bird's eye chiles over high heat until they smell fragrant and aggressive without turning bitter.",
        cue: "You want a sharp, smoky aroma and edges that look lightly blistered rather than pale.",
        tip: "If the pan starts looking wet instead of hot, stop crowding it and cook in a larger surface area.",
        durationMinutes: 3,
        ingredientRefs: ["bird's eye chiles", "garlic cloves", "shallots"]
      },
      {
        step: 3,
        title: "Sauce the noodles until they darken and shine",
        body:
          "Add the noodles and peppers, then pour in the sauce and toss hard so the noodles pick up color, smokiness, and a little sticky gloss.",
        cue: "The noodles should turn darker and pick up spots of char without breaking apart.",
        tip: "If the noodles clump, loosen them with a small splash of water instead of more sauce.",
        durationMinutes: 5,
        ingredientRefs: ["wide rice noodles", "red bell pepper", "oyster sauce", "soy sauce"],
        imageUrl:
          "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Drunken noodles tossed in a hot wok until glossy"
      },
      {
        step: 4,
        title: "Finish with basil and lime while the pan is still hot",
        body:
          "Fold in the Thai basil at the end so it perfumes the noodles, then hit the bowl with lime for the bright edge that keeps the heat lively.",
        cue: "The basil should look just wilted and the noodles should still feel glossy, not dry.",
        tip: "Serve immediately. Drunken noodles lose a lot of their magic when they sit.",
        durationMinutes: 2,
        ingredientRefs: ["Thai basil leaves", "lime"]
      }
    ],
    tips: ["Do not overcrowd the pan or the noodles will steam instead of char."],
    variations: ["Add ground chicken or tofu for a fuller bowl."],
    makeAheadNotes:
      "Whisk the sauce and prep every vegetable ahead, but do not cook the noodles or basil until just before dinner if you want the best texture.",
    storageNotes:
      "Store leftovers for up to 2 days in the fridge. The noodles soften as they sit, so this one is better fresh than long-held.",
    reheatNotes:
      "Reheat in a hot skillet with a splash of water to loosen the sauce, then add fresh basil and lime at the end to wake the bowl back up.",
    servingSuggestions: [
      "Serve with lime wedges and extra sliced chiles at the table so people can tune the last layer of heat.",
      "A crisp cucumber salad or simple stir-fried greens work well if you want a fuller dinner spread.",
      "This bowl really wants to be eaten straight from the wok while the edges still taste smoky."
    ],
    substitutions: [
      "Add ground chicken, shrimp, or tofu if you want a more protein-heavy dinner.",
      "Use serranos if bird's eye chiles are hard to find, but expect a slightly less pointed heat.",
      "Fresh wide rice noodles work best, but dried ones are fine if you soak or boil them carefully."
    ],
    faqs: [
      {
        question: "Why are they called drunken noodles if there is no alcohol?",
        answer:
          "It is more about the loose, spicy late-night spirit of the dish than booze in the pan. The recipe is built around high heat, basil, and chiles."
      },
      {
        question: "How do I keep the noodles from breaking apart?",
        answer:
          "Do not overcook them before they hit the wok, and toss with confident movements instead of stirring slowly once the sauce goes in."
      },
      {
        question: "Can I make this less spicy?",
        answer:
          "Yes. Cut the bird's eye chiles down first, then finish with lime and basil so the bowl still tastes bright and complete."
      }
    ],
    equipment: ["wok", "mixing bowl", "tongs"],
    ratingAvg: 4.8,
    ratingCount: 88,
    saveCount: 533
  },
  {
    id: 7,
    type: "recipe",
    slug: "birria-quesatacos-with-arbol-salsa",
    title: "Birria Quesatacos with Arbol Salsa",
    description:
      "Crisp-edged tacos dipped in chile-rich broth, loaded with melty cheese, and finished with a sharper salsa for extra lift.",
    intro:
      "This version leans into the things that make birria worth the time: a broth that tastes deep instead of flat, beef that shreds without drying out, and a finishing salsa with enough lift to keep every taco from collapsing into pure richness. The arbol gives the last bite a sharper edge, which is exactly what keeps the whole plate moving.",
    heroSummary:
      "A long-braised, high-payoff taco project with deep chile broth, crisp-edged tortillas, and just enough sharp salsa to keep the plate from turning heavy.",
    imageUrl:
      "https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Birria tacos with dipping broth",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-29T20:00:00.000Z",
    tags: ["mexican", "tacos", "braise"],
    viewCount: 6122,
    likeCount: 398,
    authorName: "FlamingFoodies Team",
    heatLevel: "hot",
    cuisineType: "mexican",
    prepTimeMinutes: 35,
    cookTimeMinutes: 180,
    totalTimeMinutes: 215,
    activeTimeMinutes: 70,
    servings: 6,
    difficulty: "advanced",
    ingredients: [
      { amount: "3", unit: "lb", item: "beef chuck roast", notes: "cut into large chunks" },
      { amount: "1", unit: "lb", item: "beef short ribs", notes: "optional but great for richer broth" },
      { amount: "2", unit: "tsp", item: "kosher salt" },
      { amount: "1", unit: "tsp", item: "black pepper" },
      { amount: "5", unit: "", item: "guajillo chiles", notes: "stemmed and seeded" },
      { amount: "3", unit: "", item: "ancho chiles", notes: "stemmed and seeded" },
      { amount: "6", unit: "", item: "dried arbol chiles", notes: "split between broth and salsa" },
      { amount: "1", unit: "", item: "white onion", notes: "quartered" },
      { amount: "6", unit: "", item: "garlic cloves" },
      { amount: "1", unit: "14-oz can", item: "fire-roasted tomatoes" },
      { amount: "2", unit: "tsp", item: "Mexican oregano" },
      { amount: "1", unit: "tsp", item: "ground cumin" },
      { amount: "4", unit: "cups", item: "beef stock" },
      { amount: "2", unit: "tbsp", item: "apple cider vinegar" },
      { amount: "16", unit: "", item: "corn tortillas" },
      { amount: "3", unit: "cups", item: "Oaxaca cheese", notes: "shredded" },
      { amount: "1", unit: "cup", item: "white onion", notes: "finely chopped for serving" },
      { amount: "1/2", unit: "cup", item: "cilantro", notes: "chopped" },
      { amount: "4", unit: "", item: "limes", notes: "cut into wedges" }
    ],
    ingredientSections: [
      {
        title: "For the birria braise",
        items: [
          { amount: "3", unit: "lb", item: "beef chuck roast", notes: "cut into large chunks" },
          { amount: "1", unit: "lb", item: "beef short ribs", notes: "optional but great for richer broth" },
          { amount: "2", unit: "tsp", item: "kosher salt" },
          { amount: "1", unit: "tsp", item: "black pepper" },
          { amount: "5", unit: "", item: "guajillo chiles", notes: "stemmed and seeded" },
          { amount: "3", unit: "", item: "ancho chiles", notes: "stemmed and seeded" },
          { amount: "3", unit: "", item: "dried arbol chiles", notes: "for the braise base" },
          { amount: "1", unit: "", item: "white onion", notes: "quartered" },
          { amount: "6", unit: "", item: "garlic cloves" },
          { amount: "1", unit: "14-oz can", item: "fire-roasted tomatoes" },
          { amount: "2", unit: "tsp", item: "Mexican oregano" },
          { amount: "1", unit: "tsp", item: "ground cumin" },
          { amount: "4", unit: "cups", item: "beef stock" },
          { amount: "2", unit: "tbsp", item: "apple cider vinegar" }
        ]
      },
      {
        title: "For the arbol salsa and taco assembly",
        items: [
          { amount: "3", unit: "", item: "dried arbol chiles", notes: "for the salsa" },
          { amount: "16", unit: "", item: "corn tortillas" },
          { amount: "3", unit: "cups", item: "Oaxaca cheese", notes: "shredded" },
          { amount: "1", unit: "cup", item: "white onion", notes: "finely chopped for serving" },
          { amount: "1/2", unit: "cup", item: "cilantro", notes: "chopped" },
          { amount: "4", unit: "", item: "limes", notes: "cut into wedges" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text:
          "Season the beef with salt and pepper. Toast the guajillo, ancho, and half of the arbol chiles just until fragrant, then soak them in hot water until pliable.",
        tip: "Do not blacken the chiles or the broth will pick up bitterness fast."
      },
      {
        step: 2,
        text:
          "Blend the soaked chiles with onion, garlic, tomatoes, oregano, cumin, vinegar, and a splash of stock until completely smooth.",
        tip: "A silky blend gives you a broth that tastes long-cooked even before the braise starts."
      },
      {
        step: 3,
        text:
          "Sear the beef in a Dutch oven, pour in the chile base and remaining stock, then braise until the meat shreds easily and the broth tastes deep and savory.",
        tip: "If the liquid reduces too hard during the braise, add a little water so the consome stays brothy."
      },
      {
        step: 4,
        text:
          "Shred the beef, skim some of the red fat to the surface, and blitz the remaining arbol chiles with lime and a spoonful of broth for the salsa.",
        tip: "That fat on top of the consome is what gives quesatacos their signature color and crust."
      },
      {
        step: 5,
        text:
          "Dip each tortilla into the fat-slicked broth, griddle it, then fold in birria and Oaxaca cheese until the outside is crisp and the cheese fully melts.",
        tip: "Work in batches and keep the griddle hot so the tortillas fry instead of steaming."
      },
      {
        step: 6,
        text:
          "Serve immediately with hot consome, arbol salsa, chopped onion, cilantro, and plenty of lime for the sharp finish.",
        tip: "The garnishes are not optional here, because they are what keep the tacos feeling bright."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Toast and wake up the chiles",
        body:
          "Season the beef with salt and pepper. Toast the guajillo, ancho, and half of the arbol chiles until aromatic, then soak them in hot water until fully pliable.",
        cue: "The chiles should smell nutty and warm, not burnt or acrid.",
        tip: "Pull them as soon as the skin softens and the aroma opens up.",
        durationMinutes: 15,
        ingredientRefs: ["beef chuck roast", "beef short ribs", "guajillo chiles", "ancho chiles", "dried arbol chiles", "kosher salt", "black pepper"]
      },
      {
        step: 2,
        title: "Blend a smooth braising base",
        body:
          "Blend the soaked chiles with onion, garlic, tomatoes, oregano, cumin, vinegar, and a splash of stock until the base is completely smooth and brick-red.",
        cue: "The puree should pour like thick cream with no gritty chile skin left behind.",
        tip: "If your blender runs hot, add a little extra stock to keep the blend silky.",
        durationMinutes: 10,
        ingredientRefs: ["white onion", "garlic cloves", "fire-roasted tomatoes", "Mexican oregano", "ground cumin", "apple cider vinegar", "beef stock"]
      },
      {
        step: 3,
        title: "Sear, braise, and build the consome",
        body:
          "Sear the beef in a Dutch oven, pour in the chile base and remaining stock, then braise until the meat shreds easily and the broth tastes deep, savory, and fully rounded.",
        cue: "A fork should slide through the beef with almost no resistance, and the broth should taste layered instead of sharp.",
        tip: "Top up with a splash of water if the pot reduces too aggressively before the meat is tender.",
        durationMinutes: 180,
        ingredientRefs: ["beef chuck roast", "beef short ribs", "beef stock"]
      },
      {
        step: 4,
        title: "Shred the beef and sharpen the finish",
        body:
          "Lift out the beef, shred it into juicy strands, then skim some chile-red fat to the surface. Blitz the remaining arbol chiles with lime and a spoonful of broth for a sharper salsa.",
        cue: "The salsa should hit bright and pointed, not muddy, so it can cut through the richness of the tacos.",
        tip: "Keep the shredded beef lightly moistened with broth so it stays lush on the griddle.",
        durationMinutes: 15,
        ingredientRefs: ["dried arbol chiles", "limes"]
      },
      {
        step: 5,
        title: "Griddle crisp-edged quesatacos",
        body:
          "Dip each tortilla into the fat-slicked broth, lay it on the hot griddle, then fill with birria and Oaxaca cheese. Fold and cook until the outside is crisp and the cheese fully melts into the meat.",
        cue: "The tortillas should sizzle on contact and develop bronze-red patches before you flip.",
        tip: "Work in small batches so the tortillas fry instead of steaming.",
        durationMinutes: 20,
        ingredientRefs: ["corn tortillas", "Oaxaca cheese"],
        imageUrl:
          "https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Birria quesatacos crisping on a griddle before serving"
      },
      {
        step: 6,
        title: "Serve with contrast, not just heat",
        body:
          "Serve the tacos immediately with hot consome, arbol salsa, chopped onion, cilantro, and generous lime so every bite gets richness, freshness, and acid in balance.",
        cue: "The plate should feel bright enough that you want the next taco, not just admire the first one.",
        tip: "Warm bowls for the consome if you want the full taqueria effect.",
        durationMinutes: 10,
        ingredientRefs: ["white onion", "cilantro", "limes"]
      }
    ],
    tips: [
      "Make the birria a day ahead and skim the fat after chilling for an even cleaner broth.",
      "Keep the consome hot on the stove while you griddle tacos so every plate hits the table ready to dip.",
      "Shred the cheese yourself if you can, because bagged cheese does not melt as cleanly into the meat."
    ],
    variations: [
      "Use lamb shoulder for a richer version that leans even more celebratory.",
      "Swap in Monterey Jack if Oaxaca is hard to find, but keep the melt high and stretchy.",
      "Turn leftovers into birria ramen or breakfast hash the next day."
    ],
    makeAheadNotes:
      "Braise the birria a day ahead, chill overnight, then skim the fat before reheating. The broth tastes even deeper the next day and taco assembly goes much faster.",
    storageNotes:
      "Store the shredded beef and consome together in the fridge for up to 4 days. Keep the tortillas, garnishes, and salsa separate so the tacos still cook up crisp.",
    reheatNotes:
      "Warm the birria gently in the broth over medium-low heat. Re-crisp tacos fresh on a hot griddle instead of microwaving fully assembled leftovers.",
    servingSuggestions: [
      "Serve with small bowls of hot consome for dipping and plenty of lime at the table.",
      "Add a simple cabbage-lime slaw or charred scallions if you want the meal to feel sharper and lighter.",
      "Cold Mexican lager, agua fresca, or sparkling mineral water all work well against the richness."
    ],
    substitutions: [
      "Use Monterey Jack if Oaxaca is hard to find, but choose a cheese that melts cleanly.",
      "Skip the short ribs and use all chuck if you want a simpler shop without losing the core birria effect.",
      "Use a mix of guajillo and pasilla if ancho chiles are unavailable, then taste for sweetness before serving."
    ],
    faqs: [
      {
        question: "Can I make the birria ahead before taco night?",
        answer:
          "Yes. In fact, it is better that way. Braise the meat and store it in the broth overnight, then reheat and griddle the tacos fresh when you want to serve."
      },
      {
        question: "Do I need to strain the consome?",
        answer:
          "Only if your blender leaves visible chile skin behind. A strong blender usually gets the broth smooth enough to skip that step."
      },
      {
        question: "Can I freeze leftovers?",
        answer:
          "Freeze the shredded meat and broth together for up to 2 months. Thaw in the fridge and crisp new tacos on the griddle when you are ready to eat."
      }
    ],
    equipment: ["Dutch oven", "high-speed blender", "cast-iron griddle", "fine-mesh strainer"],
    ratingAvg: 4.9,
    ratingCount: 206,
    saveCount: 1452
  },
  {
    id: 8,
    type: "recipe",
    slug: "szechuan-chili-crisp-dumpling-bowls",
    title: "Szechuan Chili Crisp Dumpling Bowls",
    description:
      "Frozen dumplings leveled up with sesame-peanut sauce, sharp vinegar, and a chili crisp finish that tastes bigger than the effort.",
    intro:
      "This is the kind of fast dinner the site needs more of: pantry-smart, actually spicy, and built around one great condiment doing real work.",
    heroSummary:
      "A fast pantry dinner with plush dumplings, a nutty sesame sauce, and enough chili crisp crunch to make the bowl feel far more ambitious than the effort.",
    imageUrl:
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZHVtcGxpbmd8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=1200",
    imageAlt: "Dumplings on a wooden plate with chopsticks",
    featured: true,
    source: "ai_generated",
    status: "published",
    publishedAt: "2026-03-27T16:00:00.000Z",
    tags: ["dumplings", "chili crisp", "weeknight"],
    viewCount: 2899,
    likeCount: 183,
    authorName: "FlamingFoodies Team",
    heatLevel: "hot",
    cuisineType: "szechuan",
    prepTimeMinutes: 12,
    cookTimeMinutes: 10,
    totalTimeMinutes: 22,
    activeTimeMinutes: 18,
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1", unit: "bag", item: "frozen dumplings" },
      { amount: "2", unit: "tbsp", item: "sesame paste" },
      { amount: "1", unit: "tbsp", item: "peanut butter" },
      { amount: "2", unit: "tbsp", item: "soy sauce" },
      { amount: "1", unit: "tbsp", item: "black vinegar" },
      { amount: "1", unit: "tbsp", item: "chili crisp" },
      { amount: "2", unit: "tbsp", item: "warm water" },
      { amount: "2", unit: "", item: "baby bok choy", notes: "halved" },
      { amount: "1", unit: "", item: "Persian cucumber", notes: "smashed and sliced" },
      { amount: "3", unit: "", item: "scallions", notes: "thinly sliced" },
      { amount: "1/4", unit: "cup", item: "roasted peanuts", notes: "roughly chopped" }
    ],
    ingredientSections: [
      {
        title: "For the sesame-chile sauce",
        items: [
          { amount: "2", unit: "tbsp", item: "sesame paste" },
          { amount: "1", unit: "tbsp", item: "peanut butter" },
          { amount: "2", unit: "tbsp", item: "soy sauce" },
          { amount: "1", unit: "tbsp", item: "black vinegar" },
          { amount: "1", unit: "tbsp", item: "chili crisp" },
          { amount: "2", unit: "tbsp", item: "warm water" }
        ]
      },
      {
        title: "For the bowl build",
        items: [
          { amount: "1", unit: "bag", item: "frozen dumplings" },
          { amount: "2", unit: "", item: "baby bok choy", notes: "halved" },
          { amount: "1", unit: "", item: "Persian cucumber", notes: "smashed and sliced" },
          { amount: "3", unit: "", item: "scallions", notes: "thinly sliced" },
          { amount: "1/4", unit: "cup", item: "roasted peanuts", notes: "roughly chopped" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Whisk the sesame paste, peanut butter, soy, black vinegar, chili crisp, and warm water until the sauce turns smooth and spoonable.",
        tip: "Keep adding water in tiny splashes until the sauce falls off a spoon in ribbons."
      },
      {
        step: 2,
        text: "Cook the dumplings and bok choy until both are tender but still lively, then reserve a little dumpling water before draining.",
        tip: "That starchy water is perfect for loosening the sauce if it tightens up."
      },
      {
        step: 3,
        text: "Pile everything into bowls and spoon over the sauce while the dumplings are still hot enough to soften it.",
        tip: "You want the sauce to cling, not pool underneath the dumplings."
      },
      {
        step: 4,
        text: "Finish with cucumber, scallions, peanuts, and extra chili crisp so the bowl gets crunch and contrast.",
        tip: "The toppings are what keep the bowl from eating too soft and rich."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Whisk a sauce with body and bite",
        body:
          "Whisk together sesame paste, peanut butter, soy, black vinegar, chili crisp, and warm water until the sauce goes smooth, nutty, and pourable.",
        cue: "The sauce should taste savory, tangy, and spicy, not like straight sesame paste.",
        tip: "Sesame sauces always tighten at first. Keep whisking and add warm water a teaspoon at a time.",
        durationMinutes: 5,
        ingredientRefs: ["sesame paste", "peanut butter", "soy sauce", "black vinegar", "chili crisp", "warm water"]
      },
      {
        step: 2,
        title: "Cook the dumplings and greens together",
        body:
          "Boil or steam the dumplings until tender and add the bok choy near the end so the greens soften without losing their bite.",
        cue: "The dumplings should feel plush and hot all the way through, while the bok choy stays bright.",
        tip: "Reserve a splash of dumpling water before draining in case the sauce needs loosening.",
        durationMinutes: 8,
        ingredientRefs: ["frozen dumplings", "baby bok choy"]
      },
      {
        step: 3,
        title: "Coat the bowls while everything is still hot",
        body:
          "Pile the dumplings and bok choy into bowls and spoon the sauce over the top while the heat from the dumplings turns it glossy and clingy.",
        cue: "The sauce should coat the dumplings in a light sheen instead of sitting like a thick blob.",
        tip: "Use dumpling water, not more soy sauce, if you need to loosen the texture.",
        durationMinutes: 3,
        ingredientRefs: ["frozen dumplings", "sesame-chile sauce"],
        imageUrl:
          "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZHVtcGxpbmd8ZW58MHx8MHx8fDA%3D&ixlib=rb-4.1.0&q=60&w=1000",
        imageAlt: "Dumplings plated with chopsticks"
      },
      {
        step: 4,
        title: "Finish with crunch and extra heat",
        body:
          "Scatter on the smashed cucumber, scallions, peanuts, and another spoonful of chili crisp so the bowl gets texture and a sharper final edge.",
        cue: "The final bowl should look glossy, crunchy, and a little chaotic in the best way.",
        tip: "Add the cucumber at the end so it stays cold and snappy against the hot dumplings.",
        durationMinutes: 2,
        ingredientRefs: ["Persian cucumber", "scallions", "roasted peanuts", "chili crisp"]
      }
    ],
    tips: [
      "A splash of dumpling water is the fastest way to rescue a sauce that tightens too much.",
      "Use dumplings you genuinely like on their own because they are still the backbone of the bowl."
    ],
    variations: [
      "Add wilted spinach or shredded cabbage if bok choy is not around.",
      "Use chili crunch or salsa macha if your favorite spicy condiment is not technically chili crisp."
    ],
    makeAheadNotes:
      "Whisk the sauce and prep the toppings ahead so dinner becomes a 10-minute finish once the dumplings hit the pot.",
    storageNotes:
      "Store leftover dumplings, sauce, and crunchy toppings separately for up to 2 days so the bowl does not go soft.",
    reheatNotes:
      "Reheat the dumplings gently by steaming or microwaving with a damp towel, then reassemble with fresh cucumber and scallions.",
    servingSuggestions: [
      "A jammy egg fits naturally here if you want the bowl to feel even more substantial.",
      "Serve with extra black vinegar and chili crisp at the table so everyone can tune the balance.",
      "Pair it with a simple cucumber salad if you want to lean even harder into contrast and crunch."
    ],
    substitutions: [
      "Use tahini if sesame paste is all you can find, but add a little more soy and vinegar because tahini tastes gentler.",
      "Swap the bok choy for spinach, napa cabbage, or broccoli if that is what is in the fridge.",
      "Use any frozen dumplings you love, whether pork, chicken, shrimp, or vegetable."
    ],
    faqs: [
      {
        question: "What kind of dumplings work best here?",
        answer:
          "Any good frozen dumpling works, but smaller potstickers or soup-dumpling-style wrappers are especially nice because they pick up more sauce per bite."
      },
      {
        question: "Is the sauce very spicy?",
        answer:
          "It has a clear kick, but the sesame and peanut mellow it out. Start with less chili crisp if you want a gentler bowl."
      },
      {
        question: "Can I eat this cold later?",
        answer:
          "You can, but it is much better warm. The sauce tastes fuller and silkier when it hits hot dumplings."
      }
    ],
    equipment: ["pot", "mixing bowl"],
    ratingAvg: 4.5,
    ratingCount: 63,
    saveCount: 388
  },
  {
    id: 9,
    type: "recipe",
    slug: "calabrian-chili-vodka-rigatoni",
    title: "Calabrian Chili Vodka Rigatoni",
    description:
      "Creamy rigatoni with tomato depth, Calabrian chile fruitiness, and enough heat to keep it from tasting too plush.",
    intro:
      "Vodka sauce needs edge or it gets sleepy. Calabrian chile paste adds fruit and heat without crushing the creaminess.",
    heroSummary:
      "A glossy vodka rigatoni with fruit-forward chile heat, real tomato depth, and enough sharpness to keep the creaminess moving.",
    imageUrl:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Rigatoni coated in spicy vodka sauce",
    featured: false,
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-25T18:00:00.000Z",
    tags: ["italian", "pasta", "calabrian chili"],
    viewCount: 2541,
    likeCount: 164,
    authorName: "FlamingFoodies Team",
    heatLevel: "medium",
    cuisineType: "italian",
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    totalTimeMinutes: 35,
    activeTimeMinutes: 22,
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1", unit: "lb", item: "rigatoni" },
      { amount: "2", unit: "tbsp", item: "olive oil" },
      { amount: "1", unit: "", item: "shallot", notes: "finely chopped" },
      { amount: "3", unit: "", item: "garlic cloves", notes: "thinly sliced" },
      { amount: "3", unit: "tbsp", item: "tomato paste" },
      { amount: "2", unit: "tbsp", item: "Calabrian chili paste" },
      { amount: "1/2", unit: "cup", item: "vodka" },
      { amount: "3/4", unit: "cup", item: "heavy cream" },
      { amount: "3/4", unit: "cup", item: "pecorino romano", notes: "finely grated" },
      { amount: "1/4", unit: "cup", item: "basil", notes: "torn for finishing" }
    ],
    ingredientSections: [
      {
        title: "For the sauce base",
        items: [
          { amount: "2", unit: "tbsp", item: "olive oil" },
          { amount: "1", unit: "", item: "shallot", notes: "finely chopped" },
          { amount: "3", unit: "", item: "garlic cloves", notes: "thinly sliced" },
          { amount: "3", unit: "tbsp", item: "tomato paste" },
          { amount: "2", unit: "tbsp", item: "Calabrian chili paste" },
          { amount: "1/2", unit: "cup", item: "vodka" },
          { amount: "3/4", unit: "cup", item: "heavy cream" }
        ]
      },
      {
        title: "For the pasta and finish",
        items: [
          { amount: "1", unit: "lb", item: "rigatoni" },
          { amount: "3/4", unit: "cup", item: "pecorino romano", notes: "finely grated" },
          { amount: "1/4", unit: "cup", item: "basil", notes: "torn for finishing" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Sweat the shallot and garlic in olive oil, then cook the tomato paste and Calabrian chile paste until they darken and smell jammy.",
        tip: "Letting the paste deepen is what keeps the sauce from tasting flat and creamy-sweet."
      },
      {
        step: 2,
        text: "Deglaze with vodka and reduce until the pan looks syrupy instead of boozy.",
        tip: "The raw alcohol smell should mostly disappear before the cream goes in."
      },
      {
        step: 3,
        text: "Add cream and pasta water, then toss in the rigatoni until the sauce turns glossy and clings inside every tube.",
        tip: "The sauce should coat, not flood, the bowl."
      },
      {
        step: 4,
        text: "Finish with pecorino and basil right before serving so the pasta lands rich but still bright.",
        tip: "Keep the basil torn, not chopped, so it perfumes the bowl instead of bruising into it."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Cook the chile-tomato base until it turns jammy",
        body:
          "Sweat the shallot and garlic in olive oil, then work in the tomato paste and Calabrian chile paste until the mixture darkens, thickens, and smells sweet-hot.",
        cue: "The base should look deeper brick-red than when it started, with a little sheen from the oil.",
        tip: "Do not rush this part. It is what gives vodka sauce real depth instead of canned-tomato brightness.",
        durationMinutes: 8,
        ingredientRefs: ["olive oil", "shallot", "garlic cloves", "tomato paste", "Calabrian chili paste"]
      },
      {
        step: 2,
        title: "Reduce the vodka until it stops smelling sharp",
        body:
          "Pour in the vodka and simmer until the pan looks syrupy and the raw alcohol edge mostly cooks off.",
        cue: "You want the sauce base to smell warm and tomato-rich, not aggressively boozy.",
        tip: "Keep the heat lively here so the reduction happens quickly and cleanly.",
        durationMinutes: 4,
        ingredientRefs: ["vodka"]
      },
      {
        step: 3,
        title: "Emulsify the sauce with cream and pasta water",
        body:
          "Stir in the cream, add the rigatoni, and loosen with pasta water until the sauce turns glossy enough to cling to the pasta inside and out.",
        cue: "The pasta should look lacquered, not drowned, with the sauce holding to the ridges and the center of each tube.",
        tip: "Reserve more pasta water than you think you need because this style of sauce tightens fast.",
        durationMinutes: 8,
        ingredientRefs: ["heavy cream", "rigatoni"],
        imageUrl:
          "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Rigatoni being tossed in glossy Calabrian chili vodka sauce"
      },
      {
        step: 4,
        title: "Finish with pecorino and basil",
        body:
          "Kill the heat, fold in the pecorino, and scatter over torn basil so the bowl stays lively against all the cream and chile.",
        cue: "The finished pasta should feel glossy, rich, and sharp enough that you still want the next bite.",
        tip: "Serve immediately. Vodka sauce is best at its silkiest, not after a long wait.",
        durationMinutes: 2,
        ingredientRefs: ["pecorino romano", "basil"]
      }
    ],
    tips: [
      "Save more pasta water than you think you need because rigatoni drinks sauce fast.",
      "Use a wide pan for the final toss so the sauce can emulsify instead of steaming."
    ],
    variations: [
      "Add spicy Italian sausage if you want a heavier, more restaurant-style bowl.",
      "Finish with burrata for an even richer, dinner-party version."
    ],
    makeAheadNotes:
      "The chile-tomato base can be made a day ahead. Rewarm it gently before adding cream and pasta water.",
    storageNotes:
      "Leftovers keep for up to 3 days in the fridge, though the sauce thickens as it sits.",
    reheatNotes:
      "Reheat slowly with a splash of water or cream to bring the sauce back to a glossy texture before serving.",
    servingSuggestions: [
      "Serve with a bitter green salad or lemony broccolini if you want relief from the richness.",
      "Extra pecorino at the table makes sense, but a squeeze of lemon can be even more useful.",
      "A peppery arugula salad and chilled red wine both work well here."
    ],
    substitutions: [
      "Use parmesan if pecorino is what you have, though pecorino gives the bowl a sharper finish.",
      "If you skip the vodka, add a splash of water and lemon juice, but expect a softer, less classic finish.",
      "Use penne or mezzi rigatoni if full-size rigatoni is sold out."
    ],
    faqs: [
      {
        question: "Does the vodka really matter?",
        answer:
          "It helps pull extra flavor out of the tomato and chile base and gives the sauce its classic edge, though the alcohol itself cooks off."
      },
      {
        question: "Is this very spicy?",
        answer:
          "It lands more warm and persistent than punishing. Calabrian chile has fruit and heat, so the bowl stays lively without going brutal."
      },
      {
        question: "Can I make this without cream?",
        answer:
          "You can use mascarpone or a smaller amount of creme fraiche, but the sauce will eat differently and lose some of the classic vodka-sauce feel."
      }
    ],
    equipment: ["Dutch oven", "large pot"],
    ratingAvg: 4.6,
    ratingCount: 74,
    saveCount: 477
  },
  {
    id: 10,
    type: "recipe",
    slug: "peri-peri-roast-chicken-traybake",
    title: "Peri-Peri Roast Chicken Traybake",
    description:
      "Chicken thighs roasted over peppers and onions in a fiery lemon-garlic peri-peri marinade with crisp pan edges.",
    intro:
      "A traybake should feel low effort but not low impact. Peri-peri gives you acid, garlic, and chili all in one move.",
    heroSummary:
      "A high-impact traybake with lacquered chicken, softened peppers, and enough lemon-garlic heat in the pan juices to make every spoonful count.",
    imageUrl:
      "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Roasted chicken with peppers on a tray",
    featured: false,
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-24T19:00:00.000Z",
    tags: ["roast chicken", "traybake", "meal prep"],
    viewCount: 2334,
    likeCount: 129,
    authorName: "FlamingFoodies Team",
    heatLevel: "hot",
    cuisineType: "other",
    prepTimeMinutes: 15,
    cookTimeMinutes: 40,
    totalTimeMinutes: 55,
    activeTimeMinutes: 20,
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "2", unit: "lb", item: "bone-in chicken thighs" },
      { amount: "3", unit: "tbsp", item: "peri-peri sauce" },
      { amount: "2", unit: "tbsp", item: "olive oil" },
      { amount: "4", unit: "", item: "garlic cloves", notes: "grated" },
      { amount: "1", unit: "", item: "lemon", notes: "zested and juiced" },
      { amount: "1", unit: "tsp", item: "smoked paprika" },
      { amount: "2", unit: "", item: "red bell peppers", notes: "thickly sliced" },
      { amount: "1", unit: "", item: "red onion", notes: "thickly sliced" },
      { amount: "1", unit: "pint", item: "cherry tomatoes" },
      { amount: "2", unit: "tbsp", item: "parsley", notes: "chopped for finishing" }
    ],
    ingredientSections: [
      {
        title: "For the peri-peri marinade",
        items: [
          { amount: "3", unit: "tbsp", item: "peri-peri sauce" },
          { amount: "2", unit: "tbsp", item: "olive oil" },
          { amount: "4", unit: "", item: "garlic cloves", notes: "grated" },
          { amount: "1", unit: "", item: "lemon", notes: "zested and juiced" },
          { amount: "1", unit: "tsp", item: "smoked paprika" }
        ]
      },
      {
        title: "For the traybake",
        items: [
          { amount: "2", unit: "lb", item: "bone-in chicken thighs" },
          { amount: "2", unit: "", item: "red bell peppers", notes: "thickly sliced" },
          { amount: "1", unit: "", item: "red onion", notes: "thickly sliced" },
          { amount: "1", unit: "pint", item: "cherry tomatoes" }
        ]
      },
      {
        title: "For finishing",
        items: [{ amount: "2", unit: "tbsp", item: "parsley", notes: "chopped for finishing" }]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Stir together the peri-peri sauce, olive oil, garlic, lemon, and smoked paprika, then coat the chicken until every piece is fully glossed.",
        tip: "The marinade should taste hot, bright, and deeply garlicky."
      },
      {
        step: 2,
        text: "Spread the peppers, onion, and tomatoes on a sheet pan, then nestle the chicken on top so the vegetables can baste underneath.",
        tip: "A little crowding is fine here because the pan juices are part of the point."
      },
      {
        step: 3,
        text: "Roast until the chicken is lacquered and the vegetables have collapsed into spicy, jammy pan edges.",
        tip: "If the skin needs help, give the pan a short broil right at the end."
      },
      {
        step: 4,
        text: "Finish with parsley and spoon the hot pan juices over everything before serving.",
        tip: "Those juices are the sauce, so do not leave them behind."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Coat the chicken in a bright, garlicky marinade",
        body:
          "Whisk together the peri-peri sauce, olive oil, garlic, lemon, and smoked paprika, then rub the mixture all over the chicken so every piece is fully seasoned.",
        cue: "The chicken should look glossy and aggressively seasoned, not lightly dabbed with sauce.",
        tip: "Get some marinade under the skin if you want even deeper flavor.",
        durationMinutes: 8,
        ingredientRefs: ["peri-peri sauce", "olive oil", "garlic cloves", "lemon", "smoked paprika", "bone-in chicken thighs"]
      },
      {
        step: 2,
        title: "Build the tray so the vegetables catch every drop",
        body:
          "Scatter the peppers, onion, and tomatoes across a sheet pan and set the chicken on top so the vegetables roast in the spicy chicken juices.",
        cue: "The tray should look full but not stacked; you still want exposed edges for browning.",
        tip: "Use a real sheet pan, not a deep baking dish, if you want good edge color.",
        durationMinutes: 5,
        ingredientRefs: ["red bell peppers", "red onion", "cherry tomatoes", "bone-in chicken thighs"]
      },
      {
        step: 3,
        title: "Roast until the chicken is lacquered and the pan goes jammy",
        body:
          "Roast until the chicken skin looks burnished and the vegetables slump into spicy, glossy edges. Broil briefly at the end if you want extra char.",
        cue: "The pan should smell lemony and smoky, and the chicken skin should look tight and deeply colored.",
        tip: "Rotate the tray if one side of your oven colors faster than the other.",
        durationMinutes: 40,
        ingredientRefs: ["bone-in chicken thighs", "red bell peppers", "red onion", "cherry tomatoes"],
        imageUrl:
          "https://images.unsplash.com/photo-1518492104633-130d0cc84637?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Peri-peri chicken roasting with peppers on a sheet pan"
      },
      {
        step: 4,
        title: "Finish with herbs and every drop of pan juice",
        body:
          "Scatter parsley over the tray and spoon the hot, spicy juices back across the chicken and vegetables so nothing eats dry.",
        cue: "The finished tray should look glossy, not dusty or dry, with vegetables that still have some shape.",
        tip: "Serve straight from the pan for the most dramatic, least fussy dinner-table move.",
        durationMinutes: 2,
        ingredientRefs: ["parsley"]
      }
    ],
    tips: [
      "Salt the chicken first if your peri-peri sauce is low-sodium.",
      "Let the tray rest for 5 minutes before serving so the juices settle back into the chicken."
    ],
    variations: [
      "Add baby potatoes under the chicken if you want the traybake to land as a full one-pan dinner.",
      "Swap in boneless thighs if you want a slightly faster roast, but expect less juicy meat."
    ],
    makeAheadNotes:
      "Marinate the chicken earlier in the day, then build and roast the tray right before dinner for the best texture.",
    storageNotes:
      "Leftovers keep in the fridge for up to 3 days. Store the chicken and vegetables together with the pan juices.",
    reheatNotes:
      "Reheat in a hot oven until the chicken is warmed through and the vegetables start sizzling again at the edges.",
    servingSuggestions: [
      "Serve with rice, warm flatbread, or crispy potatoes to catch the spicy lemon-garlic juices.",
      "A cucumber salad or yogurt sauce is useful if you want more cooling contrast.",
      "This tray also works really well as meal prep if you portion the juices over everything before chilling."
    ],
    substitutions: [
      "Use any peri-peri style sauce you love, then tune the garlic and lemon to taste.",
      "Swap peppers for zucchini or broccolini if that is what is on hand, but keep something in the pan to catch the juices.",
      "Boneless breasts work in a pinch, though thighs are more forgiving and more flavorful here."
    ],
    faqs: [
      {
        question: "Can I use boneless chicken?",
        answer:
          "Yes, though boneless thighs are the best swap. They cook a little faster, so start checking early."
      },
      {
        question: "What makes the pan juices so good?",
        answer:
          "The chicken fat, peri-peri sauce, lemon, and vegetable juices all mix together as the tray roasts. That combination is the real sauce here."
      },
      {
        question: "How spicy is this traybake?",
        answer:
          "It has a strong kick, but the roasted vegetables and lemon keep it from tasting one-note. You can always use a milder peri-peri sauce if needed."
      }
    ],
    equipment: ["sheet pan", "mixing bowl"],
    ratingAvg: 4.5,
    ratingCount: 59,
    saveCount: 362
  },
  {
    id: 11,
    type: "recipe",
    slug: "cajun-hot-honey-salmon-rice-bowls",
    title: "Cajun Hot Honey Salmon Rice Bowls",
    description:
      "Roasted salmon brushed with hot honey over rice, crunchy vegetables, and a cooling herbed yogurt sauce.",
    intro:
      "This one lands in the sweet spot between meal-prep useful and dinner-party photogenic. Cajun seasoning and hot honey do the heavy lifting.",
    heroSummary:
      "A glossy weeknight bowl with spiced salmon, sticky hot honey, cool yogurt, and enough fresh crunch to keep the whole thing balanced.",
    imageUrl:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Salmon rice bowl with vegetables and spicy glaze",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-23T16:00:00.000Z",
    tags: ["salmon", "rice bowls", "cajun"],
    viewCount: 2788,
    likeCount: 173,
    authorName: "FlamingFoodies Team",
    heatLevel: "medium",
    cuisineType: "cajun",
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    totalTimeMinutes: 30,
    activeTimeMinutes: 20,
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1 1/2", unit: "lb", item: "salmon fillet", notes: "cut into 4 portions" },
      { amount: "2", unit: "tbsp", item: "Cajun seasoning" },
      { amount: "1", unit: "tbsp", item: "olive oil" },
      { amount: "3", unit: "tbsp", item: "hot honey" },
      { amount: "3/4", unit: "cup", item: "Greek yogurt" },
      { amount: "1", unit: "tbsp", item: "lemon juice" },
      { amount: "2", unit: "tbsp", item: "dill", notes: "chopped" },
      { amount: "4", unit: "cups", item: "cooked rice" },
      { amount: "1", unit: "", item: "English cucumber", notes: "thinly sliced" },
      { amount: "1", unit: "", item: "avocado", notes: "sliced" },
      { amount: "2", unit: "", item: "scallions", notes: "thinly sliced" }
    ],
    ingredientSections: [
      {
        title: "For the salmon",
        items: [
          { amount: "1 1/2", unit: "lb", item: "salmon fillet", notes: "cut into 4 portions" },
          { amount: "2", unit: "tbsp", item: "Cajun seasoning" },
          { amount: "1", unit: "tbsp", item: "olive oil" },
          { amount: "3", unit: "tbsp", item: "hot honey" }
        ]
      },
      {
        title: "For the herbed yogurt",
        items: [
          { amount: "3/4", unit: "cup", item: "Greek yogurt" },
          { amount: "1", unit: "tbsp", item: "lemon juice" },
          { amount: "2", unit: "tbsp", item: "dill", notes: "chopped" }
        ]
      },
      {
        title: "For the bowls",
        items: [
          { amount: "4", unit: "cups", item: "cooked rice" },
          { amount: "1", unit: "", item: "English cucumber", notes: "thinly sliced" },
          { amount: "1", unit: "", item: "avocado", notes: "sliced" },
          { amount: "2", unit: "", item: "scallions", notes: "thinly sliced" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Rub the salmon with Cajun seasoning and olive oil, then roast until just shy of fully done.",
        tip: "The fish should still look slightly translucent in the center before the glaze step."
      },
      {
        step: 2,
        text: "Brush with hot honey and return to the oven briefly so the glaze turns shiny and sticky.",
        tip: "This second blast is what makes the bowl look dinner-party polished instead of meal-prep plain."
      },
      {
        step: 3,
        text: "Stir together the yogurt, lemon, and dill while the salmon rests.",
        tip: "Keep the yogurt tangy so it actually cools the bowl."
      },
      {
        step: 4,
        text: "Build the bowls with rice, vegetables, glazed salmon, and plenty of herbed yogurt.",
        tip: "Use more yogurt than you think at first. It is part of the balance, not decoration."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Season the salmon hard enough to matter",
        body:
          "Rub the salmon with Cajun seasoning and olive oil so the fish gets a real spice crust before it ever meets the hot honey.",
        cue: "The fish should be evenly coated and already smell savory and peppery before roasting.",
        tip: "Check your Cajun blend for salt level before you pile it on.",
        durationMinutes: 5,
        ingredientRefs: ["salmon fillet", "Cajun seasoning", "olive oil"]
      },
      {
        step: 2,
        title: "Roast, then lacquer with hot honey",
        body:
          "Roast the salmon until nearly done, brush with hot honey, and return it to the oven just long enough for the glaze to turn shiny and sticky.",
        cue: "The glaze should look glossy and cling to the fish in a thin layer instead of sliding off.",
        tip: "Pull the salmon while it is still juicy in the center because carryover heat finishes the job.",
        durationMinutes: 12,
        ingredientRefs: ["salmon fillet", "hot honey"],
        imageUrl:
          "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Roasted salmon glazed with hot honey for rice bowls"
      },
      {
        step: 3,
        title: "Mix a cool yogurt counterpoint",
        body:
          "Stir the yogurt with lemon and dill while the salmon rests so the bowl gets a cold, herby element to cut the glaze and Cajun spice.",
        cue: "The yogurt should taste bright and clean enough to reset your palate.",
        tip: "If the yogurt feels too thick, loosen it with a tiny splash of water or lemon juice.",
        durationMinutes: 3,
        ingredientRefs: ["Greek yogurt", "lemon juice", "dill"]
      },
      {
        step: 4,
        title: "Build bowls with hot, cool, and crunchy layers",
        body:
          "Spoon rice into bowls, add cucumber and avocado, then top with the glazed salmon and generous swoops of herbed yogurt so every bite lands balanced.",
        cue: "The final bowl should look layered and glossy, not like the toppings were just dumped in one corner.",
        tip: "Scatter the scallions at the end so the bowls still read fresh when they hit the table.",
        durationMinutes: 4,
        ingredientRefs: ["cooked rice", "English cucumber", "avocado", "scallions"]
      }
    ],
    tips: [
      "Use short-grain or jasmine rice if you want the bowl to feel softer and richer.",
      "Let the salmon rest for a couple of minutes before flaking into the bowls so the glaze stays put."
    ],
    variations: [
      "Swap salmon for shrimp or tofu if you want the same bowl structure with a different protein.",
      "Use pickled onions instead of avocado if you want the bowl to read brighter and sharper."
    ],
    makeAheadNotes:
      "Cook the rice and mix the yogurt ahead, then roast and glaze the salmon right before serving so the fish still feels juicy.",
    storageNotes:
      "Store the salmon, rice, yogurt, and vegetables in separate containers for up to 3 days if you are meal prepping.",
    reheatNotes:
      "Reheat the rice and salmon gently, then add the cold toppings and yogurt after warming so the bowl keeps its contrast.",
    servingSuggestions: [
      "Add quick-pickled onions or charred corn if you want the bowl to feel even bigger and brighter.",
      "Serve with extra lemon wedges or hot sauce at the table depending on whether you want more acid or more fire.",
      "This bowl is strong enough for meal prep but polished enough for company."
    ],
    substitutions: [
      "Use trout or steelhead if salmon is pricey or hard to find.",
      "Swap dill for chives or parsley if that is what your fridge is offering.",
      "Brown rice works fine, but use something tender enough that the bowl still feels cohesive."
    ],
    faqs: [
      {
        question: "Can I cook the salmon in an air fryer?",
        answer:
          "Yes. Air fry it until nearly done, then brush with hot honey and finish for a minute or two more so the glaze sets."
      },
      {
        question: "Is this recipe very spicy?",
        answer:
          "It lands more warm and punchy than brutal. The yogurt and cucumber keep the bowl from eating hot all the way through."
      },
      {
        question: "What keeps the bowl from tasting too sweet?",
        answer:
          "The Cajun spice, lemony yogurt, and fresh vegetables do that job. Without those, hot honey can take over fast."
      }
    ],
    equipment: ["sheet pan", "small bowl"],
    ratingAvg: 4.7,
    ratingCount: 85,
    saveCount: 521
  },
  {
    id: 12,
    type: "recipe",
    slug: "green-curry-coconut-meatballs",
    title: "Green Curry Coconut Meatballs",
    description:
      "Tender meatballs simmered in green curry coconut sauce with basil, lime, and a slow-building chili finish.",
    intro:
      "This is a comfort-dinner version of green curry: rich enough for a weeknight centerpiece, but still sharp and herbaceous.",
    heroSummary:
      "A comfort-dinner curry with tender chicken meatballs, a silky coconut sauce, and enough basil and lime at the end to keep it from going sleepy.",
    imageUrl:
      "https://images.unsplash.com/photo-1604908176997-4318c0c0b7c2?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Meatballs in green curry sauce with herbs",
    featured: false,
    source: "ai_generated",
    status: "published",
    publishedAt: "2026-03-21T18:00:00.000Z",
    tags: ["thai", "meatballs", "coconut"],
    viewCount: 1891,
    likeCount: 104,
    authorName: "FlamingFoodies Team",
    heatLevel: "hot",
    cuisineType: "thai",
    prepTimeMinutes: 20,
    cookTimeMinutes: 25,
    totalTimeMinutes: 45,
    activeTimeMinutes: 28,
    servings: 4,
    difficulty: "intermediate",
    ingredients: [
      { amount: "1 1/2", unit: "lb", item: "ground chicken" },
      { amount: "1/2", unit: "cup", item: "panko" },
      { amount: "1", unit: "", item: "egg" },
      { amount: "2", unit: "", item: "scallions", notes: "thinly sliced" },
      { amount: "1", unit: "tbsp", item: "fish sauce" },
      { amount: "3", unit: "tbsp", item: "green curry paste" },
      { amount: "1", unit: "13.5-oz can", item: "coconut milk" },
      { amount: "1/2", unit: "cup", item: "chicken stock" },
      { amount: "8", unit: "oz", item: "green beans", notes: "trimmed and cut in half" },
      { amount: "1", unit: "cup", item: "Thai basil leaves" },
      { amount: "1", unit: "", item: "lime", notes: "cut into wedges" }
    ],
    ingredientSections: [
      {
        title: "For the meatballs",
        items: [
          { amount: "1 1/2", unit: "lb", item: "ground chicken" },
          { amount: "1/2", unit: "cup", item: "panko" },
          { amount: "1", unit: "", item: "egg" },
          { amount: "2", unit: "", item: "scallions", notes: "thinly sliced" },
          { amount: "1", unit: "tbsp", item: "fish sauce" }
        ]
      },
      {
        title: "For the green curry sauce",
        items: [
          { amount: "3", unit: "tbsp", item: "green curry paste" },
          { amount: "1", unit: "13.5-oz can", item: "coconut milk" },
          { amount: "1/2", unit: "cup", item: "chicken stock" },
          { amount: "8", unit: "oz", item: "green beans", notes: "trimmed and cut in half" }
        ]
      },
      {
        title: "For finishing",
        items: [
          { amount: "1", unit: "cup", item: "Thai basil leaves" },
          { amount: "1", unit: "", item: "lime", notes: "cut into wedges" }
        ]
      }
    ],
    instructions: [
      {
        step: 1,
        text: "Mix the chicken, panko, egg, scallions, and fish sauce gently, then form the meatballs and brown them until lightly golden.",
        tip: "You want lightly set exteriors, not fully cooked-through meatballs yet."
      },
      {
        step: 2,
        text: "Bloom the green curry paste in the pan, then add the coconut milk and stock and let the sauce simmer until glossy.",
        tip: "Cooking the paste first is what gives the curry a rounder, deeper flavor."
      },
      {
        step: 3,
        text: "Add the green beans and return the meatballs to the pan until everything cooks through in the sauce.",
        tip: "The meatballs should finish juicy and tender, not tight."
      },
      {
        step: 4,
        text: "Kill the heat and finish with Thai basil and lime so the curry lands fragrant instead of heavy.",
        tip: "Basil added too early loses the lift this dish needs."
      }
    ],
    methodSteps: [
      {
        step: 1,
        title: "Mix a tender meatball base",
        body:
          "Combine the chicken, panko, egg, scallions, and fish sauce just until it comes together, then shape into even meatballs so they cook at the same pace.",
        cue: "The mixture should feel cohesive and sticky, not densely packed.",
        tip: "Wet your hands if the mixture starts clinging too hard while you shape.",
        durationMinutes: 10,
        ingredientRefs: ["ground chicken", "panko", "egg", "scallions", "fish sauce"]
      },
      {
        step: 2,
        title: "Brown the meatballs, then wake up the curry paste",
        body:
          "Brown the meatballs until lightly golden, remove them, then bloom the green curry paste in the same pan so the sauce starts with real aromatic depth.",
        cue: "The curry paste should smell fragrant and rounded, not raw and grassy.",
        tip: "You do not need the meatballs fully cooked here. They finish in the sauce.",
        durationMinutes: 10,
        ingredientRefs: ["ground chicken", "green curry paste"]
      },
      {
        step: 3,
        title: "Simmer until the sauce turns silky",
        body:
          "Add the coconut milk and stock, return the meatballs, and simmer with the green beans until the sauce goes glossy and the meatballs finish cooking through.",
        cue: "The sauce should lightly coat a spoon and the meatballs should feel springy and tender, not dense.",
        tip: "Keep the simmer gentle so the coconut milk stays smooth instead of breaking.",
        durationMinutes: 12,
        ingredientRefs: ["coconut milk", "chicken stock", "green beans", "ground chicken"],
        imageUrl:
          "https://images.unsplash.com/photo-1604908176997-4318c0c0b7c2?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Chicken meatballs simmering in green curry coconut sauce"
      },
      {
        step: 4,
        title: "Finish with basil and lime for lift",
        body:
          "Fold in the basil right at the end and serve with lime wedges so the curry stays fragrant, bright, and just sharp enough to balance the richness.",
        cue: "The basil should wilt into the sauce without turning dark and tired.",
        tip: "Serve this one hot. The sauce tightens as it cools.",
        durationMinutes: 3,
        ingredientRefs: ["Thai basil leaves", "lime"]
      }
    ],
    tips: [
      "Wet your hands when shaping the meatballs to keep the mix from sticking and compacting.",
      "Taste your curry paste brand first if you are unsure of its salt and heat level."
    ],
    variations: [
      "Use turkey if you want a leaner meatball, though chicken stays a little softer.",
      "Swap the green beans for snap peas or zucchini if that is what is in season."
    ],
    makeAheadNotes:
      "Shape the meatballs and prep the sauce ingredients ahead, then cook everything fresh so the basil and lime still feel bright.",
    storageNotes:
      "Leftovers keep for up to 3 days in the fridge. The sauce thickens a bit as it cools.",
    reheatNotes:
      "Reheat gently over low heat with a splash of water or stock, then add a fresh squeeze of lime before serving.",
    servingSuggestions: [
      "Serve over jasmine rice if you want the curry to eat like a full centerpiece dinner.",
      "A spoonful of chili crisp on top works surprisingly well if you want a hotter finish.",
      "Keep extra basil and lime at the table because both help the last bites stay lively."
    ],
    substitutions: [
      "Use turkey in place of chicken if needed, but do not overmix or the meatballs will tighten up.",
      "Coconut cream makes the sauce richer; stock plus regular coconut milk keeps it lighter.",
      "Use store-bought fish balls or tofu puffs only if you are comfortable with a very different texture."
    ],
    faqs: [
      {
        question: "Can I bake the meatballs instead of browning them?",
        answer:
          "Yes, but browning them in the pan adds more flavor to the curry base. If you bake them, be sure to bloom the curry paste well on the stove."
      },
      {
        question: "How spicy is this curry?",
        answer:
          "It lands warmly spicy as written, not punishing. Curry paste brands vary a lot, though, so taste yours if you know it runs hot."
      },
      {
        question: "What keeps the curry from tasting too rich?",
        answer:
          "The basil and lime do that work. Without them, coconut milk can make the whole pan feel heavy pretty quickly."
      }
    ],
    equipment: ["saute pan", "mixing bowl"],
    ratingAvg: 4.5,
    ratingCount: 44,
    saveCount: 289
  }
];

export const sampleBlogPosts: BlogPost[] = [
  {
    id: 1,
    type: "blog",
    slug: "how-korean-chilli-pastes-build-layered-heat",
    title: "How Korean Chilli Pastes Build Layered Heat",
    description:
      "A practical guide to the sweet, fermented, and deeply savory spice architecture behind Korean cooking.",
    imageUrl:
      "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Jars of Korean chilli paste and spices",
    featured: true,
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-26T14:00:00.000Z",
    tags: ["korean", "gochujang", "guide"],
    viewCount: 3021,
    likeCount: 211,
    authorName: "Mara Santiago",
    category: "guides",
    content: `
## Fermentation changes the shape of heat

Korean chilli pastes do not just deliver capsaicin. They bring sweetness, umami, and a slow-building warmth that keeps dishes feeling rounded instead of sharp.

## Gochujang is not gochugaru

One gives you a thick, savory backbone. The other offers a brighter, more direct pepper note. The best spicy Korean dishes often rely on both.

## Layering matters more than max heat

When you build with aromatic base notes, acid, and just enough sweetness, even a hot dish stays craveable. That is the difference between punishing spice and magnetic heat.
    `,
    seoTitle: "Korean Chilli Pastes Guide | FlamingFoodies",
    seoDescription: "Understand gochujang, gochugaru, and the layered heat of Korean cooking.",
    cuisineType: "korean",
    heatLevel: "medium",
    scovilleRating: 7,
    readTimeMinutes: 6
  },
  {
    id: 2,
    type: "blog",
    slug: "best-hot-sauces-for-taco-night",
    title: "Best Hot Sauces for Taco Night",
    description:
      "From smoky chipotle to bright habanero blends, these are the bottles that actually earn fridge space.",
    imageUrl:
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Assorted hot sauce bottles on a kitchen counter",
    featured: false,
    source: "ai_generated",
    status: "published",
    publishedAt: "2026-03-31T16:00:00.000Z",
    tags: ["hot sauce", "mexican", "roundup"],
    viewCount: 1903,
    likeCount: 87,
    authorName: "FlamingFoodies Team",
    category: "gear",
    content: `
## Match the sauce to the filling

Tacos with rich meats want acid and brightness. Seafood tacos often like fruit-forward heat. Bean-heavy tacos benefit from smoky, earthy sauces.

## A bottle should solve a problem

The best taco-night sauce is not always the hottest. It is the one that adds missing contrast and keeps you reaching for another bite.
    `,
    seoTitle: "Best Hot Sauces for Taco Night",
    seoDescription: "The bottles we actually recommend for tacos, from chipotle to habanero.",
    cuisineType: "mexican",
    heatLevel: "hot",
    scovilleRating: 8,
    readTimeMinutes: 5
  }
];

export const sampleReviews: Review[] = [
  {
    id: 1,
    type: "review",
    slug: "heatonist-los-calientes-rojo-review",
    title: "Heatonist Los Calientes Rojo Review",
    description:
      "A balanced, smoky-red sauce that hits the sweet spot between everyday usability and enough bite to stay interesting.",
    productName: "Los Calientes Rojo",
    brand: "Heatonist",
    rating: 4.7,
    priceUsd: 12.99,
    affiliateUrl: "https://heatonist.com/products/los-calientes-rojo",
    imageUrl:
      "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Hot sauce bottle on a table beside tacos",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-24T13:00:00.000Z",
    tags: ["hot sauce", "review", "smoky"],
    viewCount: 2210,
    likeCount: 173,
    content: `
## First impression

This sauce opens fruity, lands smoky, and never flattens your food under vinegar. It is dialed-in enough for eggs, tacos, and grilled chicken without feeling generic.

## The real strength

The heat curve is friendly, but the flavor stays layered. That makes it a high-rotation bottle instead of a once-a-month dare.
    `,
    heatLevel: "medium",
    scovilleMin: 1200,
    scovilleMax: 1800,
    flavorNotes: ["smoky", "tomato", "cumin", "bright"],
    cuisineOrigin: "mexican",
    category: "hot-sauce",
    pros: ["Balanced smoke", "Crowd-friendly heat", "Versatile"],
    cons: ["Not hot enough for extremists"],
    recommended: true,
    featured: true
  },
  {
    id: 2,
    type: "review",
    slug: "fuego-box-monthly-subscription-review",
    title: "Fuego Box Monthly Subscription Review",
    description:
      "A reliable discovery box for people who want more than supermarket sauces without going full novelty heat gimmick.",
    productName: "Fuego Box Subscription",
    brand: "Fuego Box",
    rating: 4.3,
    affiliateUrl: "https://fuegobox.com/products/monthly-subscription",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-18T13:00:00.000Z",
    tags: ["subscription", "gift", "review"],
    viewCount: 1188,
    likeCount: 59,
    content: `
## What works

The curation is credible. You get enough range to discover new makers without being buried in novelty labels.

## Best for

People who want a gentler on-ramp to serious hot sauce, or a giftable recurring box that still feels thoughtful.
    `,
    heatLevel: "hot",
    flavorNotes: ["varied", "curated", "giftable"],
    category: "subscription-box",
    pros: ["Good discovery value", "Giftable", "Consistent curation"],
    cons: ["Less useful if you already buy small-batch sauces directly"],
    recommended: true,
    featured: false
  },
  {
    id: 3,
    type: "review",
    slug: "yellowbird-habanero-hot-sauce-review",
    title: "Yellowbird Habanero Hot Sauce Review",
    description:
      "A bright, carrot-forward bottle with enough heat to stay lively and enough sweetness to stay versatile.",
    productName: "Yellowbird Habanero",
    brand: "Yellowbird",
    rating: 4.5,
    priceUsd: 8.99,
    affiliateUrl: buildAmazonSearchUrl("Yellowbird habanero hot sauce"),
    imageUrl:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Orange hot sauce bottle near tacos",
    source: "editorial",
    status: "published",
    publishedAt: "2026-04-02T14:00:00.000Z",
    tags: ["hot sauce", "habanero", "everyday"],
    viewCount: 2602,
    likeCount: 171,
    content: `
## Where it lands

Yellowbird lives in the everyday bottle lane. The carrot base rounds out the habanero so the sauce feels bright and useful instead of sharp for the sake of it.

## Best use case

Breakfast tacos, rice bowls, grilled vegetables, and anything that wants a generous pour rather than a warning label.
    `,
    heatLevel: "hot",
    scovilleMin: 1500,
    scovilleMax: 4500,
    flavorNotes: ["carrot", "citrus", "peppery", "slightly sweet"],
    cuisineOrigin: "mexican",
    category: "hot-sauce",
    pros: ["Easy to use often", "Balanced texture", "Great on eggs"],
    cons: ["Less interesting if you want smoky depth"],
    recommended: true,
    featured: true
  },
  {
    id: 4,
    type: "review",
    slug: "torchbearer-garlic-reaper-review",
    title: "Torchbearer Garlic Reaper Review",
    description:
      "An extremely hot garlic-forward sauce that somehow keeps real flavor structure under all that reaper pressure.",
    productName: "Torchbearer Garlic Reaper",
    brand: "Torchbearer",
    rating: 4.6,
    priceUsd: 15.99,
    affiliateUrl: buildAmazonSearchUrl("Torchbearer Garlic Reaper sauce"),
    imageUrl:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Dark hot sauce bottle on wooden table",
    source: "editorial",
    status: "published",
    publishedAt: "2026-04-01T15:00:00.000Z",
    tags: ["hot sauce", "reaper", "garlic"],
    viewCount: 2458,
    likeCount: 180,
    content: `
## Serious heat warning

This is not an everyday glugger. Garlic Reaper is a tiny-dashes sauce, but it earns that role because the flavor is savory and aggressive instead of chemically flat.

## Who it is for

People who want a wings and pizza weapon with real personality, not just shock value.
    `,
    heatLevel: "reaper",
    scovilleMin: 90000,
    scovilleMax: 120000,
    flavorNotes: ["garlic", "dense", "savory", "sharp"],
    cuisineOrigin: "american",
    category: "hot-sauce",
    pros: ["Huge garlic character", "Real reaper heat", "Great for small-dose cooking"],
    cons: ["Too intense for casual table use"],
    recommended: true,
    featured: true
  },
  {
    id: 5,
    type: "review",
    slug: "queen-majesty-scotch-bonnet-ginger-review",
    title: "Queen Majesty Scotch Bonnet and Ginger Review",
    description:
      "A bright, elegant sauce that leans on fruit, ginger, and Scotch bonnet lift instead of brute force.",
    productName: "Scotch Bonnet and Ginger",
    brand: "Queen Majesty",
    rating: 4.7,
    priceUsd: 14.0,
    affiliateUrl: buildAmazonSearchUrl("Queen Majesty Scotch Bonnet Ginger"),
    imageUrl:
      "https://images.unsplash.com/photo-1625944525533-473f1e4fd6ed?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Hot sauce bottle with tropical ingredients",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-30T14:00:00.000Z",
    tags: ["hot sauce", "scotch bonnet", "ginger"],
    viewCount: 1987,
    likeCount: 131,
    content: `
## Why it works

Ginger keeps the sauce moving. Instead of a flat fruit-forward profile, you get a more lifted, aromatic bottle that loves seafood and grilled vegetables.

## The catch

It is a little more specific than an all-purpose red sauce. That is also why it stands out.
    `,
    heatLevel: "hot",
    scovilleMin: 5000,
    scovilleMax: 8000,
    flavorNotes: ["ginger", "citrus", "fruity", "clean"],
    cuisineOrigin: "jamaican",
    category: "hot-sauce",
    pros: ["Distinct profile", "Excellent on seafood", "Beautiful balance"],
    cons: ["Not the best fit for heavy tomato dishes"],
    recommended: true,
    featured: true
  },
  {
    id: 6,
    type: "review",
    slug: "fly-by-jing-sichuan-gold-review",
    title: "Fly By Jing Sichuan Gold Review",
    description:
      "A citrusy, tingly sauce with real peppercorn presence and enough versatility to move beyond dumplings.",
    productName: "Sichuan Gold",
    brand: "Fly By Jing",
    rating: 4.4,
    priceUsd: 14.99,
    affiliateUrl: buildAmazonSearchUrl("Fly By Jing Sichuan Gold"),
    imageUrl:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Sauce bottle with dumplings and noodles",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-29T14:00:00.000Z",
    tags: ["hot sauce", "sichuan", "peppercorn"],
    viewCount: 1741,
    likeCount: 113,
    content: `
## Flavor profile

This one is more about sensation than blunt heat. You get citrus, savory depth, and that numbing peppercorn edge that changes the whole bite.

## Best use case

Dumplings, fried eggs, cold noodles, and spooning into mayo for sandwiches.
    `,
    heatLevel: "medium",
    scovilleMin: 800,
    scovilleMax: 2000,
    flavorNotes: ["citrus", "numbing", "savory", "peppercorn"],
    cuisineOrigin: "szechuan",
    category: "hot-sauce",
    pros: ["Distinct texture", "Great peppercorn lift", "Useful beyond dumplings"],
    cons: ["Not ideal if you only want classic vinegar heat"],
    recommended: true,
    featured: false
  },
  {
    id: 7,
    type: "review",
    slug: "mikes-hot-honey-review",
    title: "Mike's Hot Honey Review",
    description:
      "Sweet heat done right: sticky, quick, and versatile enough to become a finishing move instead of a novelty.",
    productName: "Mike's Hot Honey",
    brand: "Mike's Hot Honey",
    rating: 4.5,
    priceUsd: 11.99,
    affiliateUrl: "https://mikeshothoney.com/products/mikes-hot-honey-original",
    imageUrl:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Honey bottle near pizza and fried chicken",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-27T13:00:00.000Z",
    tags: ["hot honey", "condiment", "review"],
    viewCount: 2098,
    likeCount: 142,
    content: `
## Why people keep buying it

It solves a very specific problem quickly. Pizza, salmon, fried chicken, and roasted vegetables all get more interesting with almost no effort.

## What to watch for

It can dominate delicate dishes if you pour like it is regular honey.
    `,
    heatLevel: "medium",
    flavorNotes: ["sweet", "sticky", "peppery", "floral"],
    cuisineOrigin: "american",
    category: "pantry-condiment",
    pros: ["Ridiculously easy to use", "Good gift item", "Wide application"],
    cons: ["Less useful if you avoid sweet heat"],
    recommended: true,
    featured: false
  },
  {
    id: 8,
    type: "review",
    slug: "hot-ones-lineup-collection-review",
    title: "Hot Ones Lineup Collection Review",
    description:
      "A curated shelf-builder for tasting nights, gifts, and anyone who wants to compare heat styles side by side.",
    productName: "Hot Ones Lineup Collection",
    brand: "Heatonist",
    rating: 4.6,
    priceUsd: 39.0,
    affiliateUrl: "https://heatonist.com/collections/hot-ones-hot-sauces",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-26T15:00:00.000Z",
    tags: ["collection", "gift", "hot ones"],
    viewCount: 1566,
    likeCount: 97,
    content: `
## Where it wins

It saves you the work of building a tasting lineup from scratch. For parties and gifts, that convenience matters more than shaving a few dollars off bottle by bottle.

## Best fit

People who want comparison as much as they want individual sauces.
    `,
    heatLevel: "hot",
    flavorNotes: ["varied", "tasting-ready", "giftable"],
    category: "subscription-box",
    pros: ["Great for tastings", "Giftable", "Easy shelf upgrade"],
    cons: ["You may not love every bottle equally"],
    recommended: true,
    featured: true
  },
  {
    id: 9,
    type: "review",
    slug: "heatonist-gift-set-review",
    title: "Heatonist Gift Set Review",
    description:
      "A cleaner gift move than random marketplace bundles, with better bottle quality and a more intentional heat curve.",
    productName: "Heatonist Gift Set",
    brand: "Heatonist",
    rating: 4.4,
    priceUsd: 34.0,
    affiliateUrl: "https://heatonist.com/collections/hot-sauce-gift-sets",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-22T12:00:00.000Z",
    tags: ["gift", "bundle", "review"],
    viewCount: 1184,
    likeCount: 68,
    content: `
## The upside

This is the easier recommendation for casual gift buyers because the selection feels curated instead of algorithmic.

## The downside

If you already know exactly which maker you want, building a custom box can still be better.
    `,
    heatLevel: "medium",
    flavorNotes: ["curated", "balanced", "giftable"],
    category: "gift-set",
    pros: ["Cleaner curation", "Good for new fans", "Easy holiday recommendation"],
    cons: ["Less exciting for people with very niche taste"],
    recommended: true,
    featured: false
  },
  {
    id: 10,
    type: "review",
    slug: "pepper-joe-superhot-seed-pack-review",
    title: "Pepper Joe Superhot Seed Pack Review",
    description:
      "A grow-your-own route for readers who care as much about peppers and fermentation projects as finished sauces.",
    productName: "Superhot Pepper Seed Pack",
    brand: "Pepper Joe",
    rating: 4.1,
    priceUsd: 14.99,
    affiliateUrl: "https://pepperjoe.com/collections/super-hot-pepper-seeds",
    source: "editorial",
    status: "published",
    publishedAt: "2026-03-19T12:00:00.000Z",
    tags: ["seeds", "grow your own", "peppers"],
    viewCount: 1001,
    likeCount: 49,
    content: `
## Why it belongs here

Some of the most committed hot sauce readers eventually want to grow peppers, ferment mash, and make their own bottles. This is the on-ramp product for that audience.

## Tradeoff

It is a hobby purchase, not an instant table-sauce fix.
    `,
    heatLevel: "reaper",
    flavorNotes: ["gardening", "future heat", "DIY"],
    category: "grow-kit",
    pros: ["Good gateway to sauce projects", "Broad pepper selection", "Fun long-term play"],
    cons: ["Not for people who want immediate gratification"],
    recommended: true,
    featured: false
  }
];

export const sampleMerchProducts: MerchProduct[] = [
  {
    id: 1,
    slug: "sauce-lab-tee",
    name: "Sauce Lab Tee",
    category: "Apparel",
    badge: "Drop 01",
    description:
      "Soft heavyweight tee with a back print that maps the brand's five-stage heat ladder.",
    priceLabel: "$32",
    availability: "preview",
    themeKey: "flame",
    href: "/shop#merch-waitlist",
    ctaLabel: "Join merch waitlist",
    featured: true,
    status: "published",
    sortOrder: 10,
    createdAt: "2026-03-25T12:00:00.000Z",
    updatedAt: "2026-03-25T12:00:00.000Z"
  },
  {
    id: 2,
    slug: "flame-club-hoodie",
    name: "Flame Club Hoodie",
    category: "Apparel",
    badge: "Cold-weather staple",
    description:
      "Oversized hoodie for smokers, late-night cooks, and anyone who treats hot sauce like pantry infrastructure.",
    priceLabel: "$68",
    availability: "waitlist",
    themeKey: "ember",
    href: "/shop#merch-waitlist",
    ctaLabel: "Reserve the first drop",
    featured: true,
    status: "published",
    sortOrder: 20,
    createdAt: "2026-03-25T12:10:00.000Z",
    updatedAt: "2026-03-25T12:10:00.000Z"
  },
  {
    id: 3,
    slug: "kitchen-apron",
    name: "Kitchen Apron",
    category: "Kitchen gear",
    badge: "Cook-ready",
    description:
      "Waxed-canvas style apron concept with towel loop, tasting spoon pocket, and FlamingFoodies chest mark.",
    priceLabel: "$44",
    availability: "preview",
    themeKey: "gold",
    href: "/shop#merch-waitlist",
    ctaLabel: "Get launch access",
    featured: true,
    status: "published",
    sortOrder: 30,
    createdAt: "2026-03-25T12:20:00.000Z",
    updatedAt: "2026-03-25T12:20:00.000Z"
  },
  {
    id: 4,
    slug: "tasting-flight-enamel-mugs",
    name: "Tasting Flight Enamel Mug Set",
    category: "Drinkware",
    badge: "Gift set",
    description:
      "Four mugs labeled mild through reaper for sauce flights, camp coffee, and competition judging days.",
    priceLabel: "$36",
    availability: "waitlist",
    themeKey: "smoke",
    href: "/shop#merch-waitlist",
    ctaLabel: "Join merch waitlist",
    featured: false,
    status: "published",
    sortOrder: 40,
    createdAt: "2026-03-25T12:30:00.000Z",
    updatedAt: "2026-03-25T12:30:00.000Z"
  },
  {
    id: 5,
    slug: "heat-scale-hat",
    name: "Heat Scale Dad Hat",
    category: "Headwear",
    badge: "Low-key logo",
    description:
      "Clean cap with tonal embroidery for the people who want spicy references without billboard branding.",
    priceLabel: "$28",
    availability: "preview",
    themeKey: "cream",
    href: "/shop#merch-waitlist",
    ctaLabel: "Get launch access",
    featured: false,
    status: "published",
    sortOrder: 50,
    createdAt: "2026-03-25T12:40:00.000Z",
    updatedAt: "2026-03-25T12:40:00.000Z"
  },
  {
    id: 6,
    slug: "sauce-station-towel-pack",
    name: "Sauce Station Towel Pack",
    category: "Kitchen linens",
    badge: "Utility set",
    description:
      "A trio of heavy kitchen towels built around wipe-down duty, grill nights, and messy wing sessions.",
    priceLabel: "$24",
    availability: "waitlist",
    themeKey: "charcoal",
    href: "/shop#merch-waitlist",
    ctaLabel: "Reserve the first drop",
    featured: false,
    status: "published",
    sortOrder: 60,
    createdAt: "2026-03-25T12:50:00.000Z",
    updatedAt: "2026-03-25T12:50:00.000Z"
  }
];

export const sampleCommunityPosts: CommunityPost[] = [
  {
    id: 1,
    slug: "ghostpeppergabe-korean-fried-chicken",
    type: "photo",
    title: "Late-night Korean fried chicken",
    caption: "Double-fried, brushed with gochujang glaze, and absolutely not for beginners.",
    mediaUrl:
      "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=80",
    tags: ["fried chicken", "korean", "late-night"],
    heatLevel: "hot",
    cuisineType: "korean",
    likeCount: 91,
    commentCount: 13,
    viewCount: 620,
    isPinned: true,
    status: "published",
    createdAt: "2026-03-29T22:00:00.000Z",
    user: sampleProfiles[1]
  },
  {
    id: 2,
    slug: "nia-berbere-lentils",
    type: "recipe",
    title: "Weeknight berbere lentils",
    caption: "Fast, smoky, and big enough for leftovers all week.",
    mediaUrl:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80",
    tags: ["lentils", "ethiopian", "meal prep"],
    heatLevel: "medium",
    cuisineType: "ethiopian",
    likeCount: 68,
    commentCount: 8,
    viewCount: 488,
    isPinned: false,
    status: "published",
    createdAt: "2026-03-27T18:00:00.000Z",
    user: sampleProfiles[2],
    structuredRecipe: {
      id: 1,
      communityPostId: 2,
      title: "Weeknight berbere lentils",
      description: "A pantry-friendly lentil pot with enough spice to stay interesting all week.",
      heatLevel: "medium",
      cuisineType: "ethiopian",
      prepTimeMinutes: 15,
      cookTimeMinutes: 35,
      servings: 4,
      ingredients: [
        { amount: "1", unit: "cup", item: "brown lentils" },
        { amount: "1", unit: "tbsp", item: "berbere" },
        { amount: "1", unit: "medium", item: "yellow onion", notes: "diced" },
        { amount: "3", unit: "cups", item: "vegetable stock" }
      ],
      instructions: [
        { step: 1, text: "Cook onion with oil and berbere until fragrant." },
        { step: 2, text: "Add lentils and stock, then simmer until tender." },
        { step: 3, text: "Finish with lemon and serve over rice or flatbread." }
      ],
      tips: ["A spoon of niter kibbeh makes the finish richer."],
      status: "published",
      createdAt: "2026-03-27T18:00:00.000Z"
    }
  }
];

export const sampleCompetitions: Competition[] = [
  {
    id: 1,
    slug: "hottest-homemade-sauce-spring-showdown",
    title: "Spring Sauce Showdown",
    description:
      "A monthly challenge for the boldest homemade sauces, with community votes deciding the winner.",
    theme: "Hottest Homemade Sauce",
    rules:
      "One entry per member. Show the finished sauce and explain the pepper blend. No unsafe canning claims.",
    prizeDescription: "Winner gets a featured profile spot, merch pack, and Heatonist gift card.",
    imageUrl:
      "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80",
    submissionType: "photo",
    status: "active",
    startDate: "2026-04-01T12:00:00.000Z",
    endDate: "2026-04-21T23:59:00.000Z",
    votingEndDate: "2026-04-28T23:59:00.000Z",
    maxSubmissionsPerUser: 1,
    entries: [
      {
        id: 1,
        competitionId: 1,
        user: sampleProfiles[1],
        title: "Pineapple Reaper Firestarter",
        caption: "Sweet-front, devastating finish, built for grilled pork.",
        mediaUrl:
          "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
        voteCount: 203,
        status: "published",
        isWinner: false,
        submittedAt: "2026-04-02T12:30:00.000Z"
      },
      {
        id: 2,
        competitionId: 1,
        user: sampleProfiles[2],
        title: "Berbere Ghost Blend",
        caption: "Fermented ghost peppers with berbere, tamarind, and charred onion.",
        mediaUrl:
          "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
        voteCount: 187,
        status: "published",
        isWinner: false,
        submittedAt: "2026-04-02T17:10:00.000Z"
      }
    ]
  }
];

export const sampleComments: ContentComment[] = [
  {
    id: 1,
    user: sampleProfiles[1],
    contentType: "recipe",
    contentId: 1,
    body: "This sauce ratio is perfect. I added crispy tofu and it absolutely worked.",
    isFlagged: false,
    isApproved: true,
    createdAt: "2026-03-29T18:00:00.000Z"
  },
  {
    id: 2,
    user: sampleProfiles[2],
    contentType: "recipe",
    contentId: 1,
    body: "A little rice vinegar at the end makes the heat feel even brighter.",
    isFlagged: false,
    isApproved: true,
    createdAt: "2026-03-30T08:30:00.000Z"
  },
  {
    id: 3,
    user: sampleProfiles[0],
    contentType: "blog_post",
    contentId: 1,
    body: "Exactly right. Fermented heat lands differently than fresh chilli heat, and people underestimate how much sweetness matters.",
    isFlagged: false,
    isApproved: true,
    createdAt: "2026-03-31T12:15:00.000Z"
  },
  {
    id: 4,
    user: sampleProfiles[1],
    contentType: "review",
    contentId: 1,
    body: "This is the bottle I keep recommending to people who say they want flavor first and pain second.",
    isFlagged: true,
    isApproved: true,
    createdAt: "2026-04-01T09:10:00.000Z"
  }
];

export const sampleRecipeSaves: Array<{ userId: string; recipeId: number }> = [
  { userId: sampleProfiles[0].id, recipeId: 1 },
  { userId: sampleProfiles[1].id, recipeId: 2 }
];

export const sampleRecipeRatings: Array<{
  userId: string;
  recipeId: number;
  rating: number;
}> = [
  { userId: sampleProfiles[0].id, recipeId: 1, rating: 5 },
  { userId: sampleProfiles[1].id, recipeId: 2, rating: 4 }
];

export const sampleFollows: Array<{ followerId: string; followingId: string }> = [
  { followerId: sampleProfiles[0].id, followingId: sampleProfiles[1].id },
  { followerId: sampleProfiles[1].id, followingId: sampleProfiles[2].id }
];

export const sampleGenerationJobs: GenerationJob[] = [
  {
    id: 1,
    jobType: "recipe",
    promptTemplate: "RECIPE_PROMPT",
    parameters: { cuisine_type: "thai", heat_level: "hot" },
    status: "completed",
    resultId: 2,
    resultType: "recipe",
    tokensUsed: 3352,
    modelUsed: "claude-opus-4-6",
    attempts: 1,
    queuedAt: "2026-04-03T10:00:00.000Z",
    startedAt: "2026-04-03T10:00:03.000Z",
    completedAt: "2026-04-03T10:00:12.000Z"
  },
  {
    id: 2,
    jobType: "blog_post",
    promptTemplate: "BLOG_POST_PROMPT",
    parameters: { category: "culture" },
    status: "queued",
    attempts: 0,
    queuedAt: "2026-04-03T11:00:00.000Z"
  },
  {
    id: 3,
    jobType: "review",
    promptTemplate: "REVIEW_PROMPT",
    parameters: { category: "hot-sauce" },
    status: "failed",
    errorMessage: "Image fetch fallback exhausted.",
    attempts: 2,
    queuedAt: "2026-04-02T09:00:00.000Z",
    startedAt: "2026-04-02T09:00:01.000Z",
    completedAt: "2026-04-02T09:00:33.000Z"
  }
];

export const sampleGenerationSchedule: GenerationSchedule[] = [
  {
    id: 1,
    jobType: "recipe",
    quantity: 3,
    cronExpr: "0 6 * * *",
    parameters: {
      rotate_cuisines: true,
      heat_levels: ["mild", "medium", "hot", "inferno", "reaper"]
    },
    isActive: true,
    lastRunAt: "2026-04-03T10:00:12.000Z",
    createdAt: "2026-03-01T09:00:00.000Z"
  },
  {
    id: 2,
    jobType: "blog_post",
    quantity: 2,
    cronExpr: "0 7 * * *",
    parameters: { categories: ["culture", "science", "guides", "gear"] },
    isActive: true,
    createdAt: "2026-03-01T09:00:00.000Z"
  },
  {
    id: 3,
    jobType: "review",
    quantity: 1,
    cronExpr: "0 8 * * 1,4",
    parameters: { category: "hot-sauce", rotate_origins: true },
    isActive: true,
    createdAt: "2026-03-01T09:00:00.000Z"
  }
];

export const sampleSocialPosts: SocialPost[] = [
  {
    id: 1,
    platform: "instagram",
    contentType: "recipe",
    contentId: 1,
    caption: "Gochujang noodles, glossy sauce, real bite. Link in bio.",
    hashtags: ["#spicyfood", "#gochujang", "#weeknightdinner"],
    imageUrl: sampleRecipes[0].imageUrl,
    linkUrl: "/recipes/spicy-korean-gochujang-noodles",
    status: "scheduled",
    scheduledAt: "2026-04-03T18:00:00.000Z"
  },
  {
    id: 2,
    platform: "pinterest",
    contentType: "recipe",
    contentId: 2,
    caption: "Jamaican jerk shrimp skewers with Scotch bonnet heat and a sticky citrus glaze.",
    hashtags: ["#jamaicanfood", "#spicyrecipes"],
    imageUrl: sampleRecipes[1].imageUrl,
    linkUrl: "/recipes/jamaican-jerk-shrimp-skewers",
    status: "published",
    scheduledAt: "2026-04-02T15:00:00.000Z",
    publishedAt: "2026-04-02T15:01:00.000Z",
    engagement: {
      likes: 83,
      shares: 18,
      comments: 6,
      impressions: 4920
    }
  }
];

export const sampleSubscribers: NewsletterSubscriber[] = [
  {
    id: 1,
    email: "heatseeker@example.com",
    firstName: "Aria",
    status: "active",
    source: "homepage",
    tags: ["homepage-hero"],
    subscribedAt: "2026-03-21T12:00:00.000Z"
  },
  {
    id: 2,
    email: "ghostclub@example.com",
    firstName: "Noah",
    status: "active",
    source: "quiz",
    tags: ["quiz-reaper-chaser"],
    subscribedAt: "2026-03-27T09:10:00.000Z"
  }
];

export const sampleNewsletterCampaigns: NewsletterCampaign[] = [
  {
    id: 1,
    subject: "The week’s hottest recipes",
    previewText: "Three new dishes, one sauce review, and a community flex.",
    htmlContent:
      "<h2>This Week in Heat</h2><p>Start with the boldest recipe, then the sharpest review.</p>",
    textContent: "This Week in Heat\n\nStart with the boldest recipe, then the sharpest review.",
    status: "draft",
    createdAt: "2026-04-03T09:00:00.000Z"
  },
  {
    id: 2,
    subject: "Three sauces worth buying this month",
    previewText: "Small-batch bottles we’d actually keep on the table.",
    htmlContent:
      "<h2>Sauce shortlist</h2><p>Three bottles that earn fridge space.</p>",
    status: "sent",
    recipientCount: 3184,
    openCount: 1401,
    clickCount: 256,
    sentAt: "2026-04-01T14:00:00.000Z",
    createdAt: "2026-03-31T11:00:00.000Z"
  }
];

export const sampleSettings: SiteSetting[] = [
  { key: "show_ads", value: false, updatedAt: "2026-04-01T12:00:00.000Z" },
  {
    key: "auto_publish_ai_content",
    value: false,
    updatedAt: "2026-04-01T12:00:00.000Z"
  },
  {
    key: "auto_publish_delay_hours",
    value: 4,
    updatedAt: "2026-04-01T12:00:00.000Z"
  },
  {
    key: "social_template_instagram",
    value: "Lead with appetite, then authority, then link-in-bio.",
    updatedAt: "2026-04-01T12:00:00.000Z"
  },
  {
    key: "social_template_pinterest",
    value: "Make the save-worthy benefit obvious in the first sentence.",
    updatedAt: "2026-04-01T12:00:00.000Z"
  }
];

export const sampleAuditLog: AdminAuditEntry[] = [
  {
    id: 1,
    action: "generate_content",
    targetType: "recipe",
    targetId: "2",
    metadata: { jobType: "recipe", qty: 1 },
    performedAt: "2026-04-03T10:00:00.000Z",
    admin: {
      id: sampleProfiles[0].id,
      username: sampleProfiles[0].username,
      displayName: sampleProfiles[0].displayName
    }
  },
  {
    id: 2,
    action: "publish_post",
    targetType: "blog_post",
    targetId: "12",
    metadata: { source: "editorial" },
    performedAt: "2026-04-02T14:20:00.000Z",
    admin: {
      id: sampleProfiles[0].id,
      username: sampleProfiles[0].username,
      displayName: sampleProfiles[0].displayName
    }
  }
];

export const sampleDashboardMetrics: DashboardMetric[] = [
  {
    label: "Today’s views",
    value: "12.4K",
    delta: "+18%",
    sparkline: [12, 18, 14, 22, 24, 31, 28]
  },
  {
    label: "Affiliate clicks",
    value: "486",
    delta: "+9%",
    sparkline: [5, 7, 8, 10, 12, 14, 16]
  },
  {
    label: "Pending moderation",
    value: "7",
    delta: "-3",
    sparkline: [12, 10, 9, 8, 7, 8, 7]
  },
  {
    label: "Newsletter subs",
    value: "3,184",
    delta: "+11%",
    sparkline: [240, 260, 282, 303, 325, 351, 380]
  }
];
