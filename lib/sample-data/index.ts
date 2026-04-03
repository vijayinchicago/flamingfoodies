import { buildAmazonSearchUrl } from "@/lib/affiliates";
import type {
  AdminAuditEntry,
  BlogPost,
  Competition,
  ContentComment,
  CommunityPost,
  DashboardMetric,
  GenerationJob,
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
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "12", unit: "oz", item: "ramyun-style noodles" },
      { amount: "3", unit: "tbsp", item: "gochujang" },
      { amount: "2", unit: "tbsp", item: "soy sauce" },
      { amount: "1", unit: "tbsp", item: "sesame oil" }
    ],
    instructions: [
      { step: 1, text: "Whisk the sauce until smooth and glossy." },
      { step: 2, text: "Boil noodles until springy and reserve some cooking water." },
      { step: 3, text: "Toss noodles with sauce and vegetables until lacquered." }
    ],
    tips: [
      "Add a spoon of peanut butter for extra body.",
      "Finish with cucumber for a cooling crunch."
    ],
    variations: [
      "Add crispy tofu for more protein.",
      "Swap in udon for a chewier bowl."
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
    imageUrl:
      "https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Jerk shrimp skewers on a grill with lime wedges",
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
    servings: 4,
    difficulty: "intermediate",
    ingredients: [
      { amount: "1.5", unit: "lb", item: "large shrimp" },
      { amount: "2", unit: "tbsp", item: "jerk seasoning" },
      { amount: "1", unit: "tbsp", item: "brown sugar" }
    ],
    instructions: [
      { step: 1, text: "Marinate the shrimp in jerk seasoning, oil, and lime." },
      { step: 2, text: "Skewer and grill over high heat until just opaque." },
      { step: 3, text: "Brush with glaze and rest briefly before serving." }
    ],
    tips: ["Use metal skewers to avoid flipping issues."],
    variations: ["Make it milder with habanero instead of Scotch bonnet."],
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
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Hot chicken sandwich with pickles and slaw",
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
    servings: 4,
    difficulty: "intermediate",
    ingredients: [
      { amount: "4", unit: "", item: "boneless chicken thighs" },
      { amount: "1", unit: "cup", item: "buttermilk" },
      { amount: "2", unit: "tbsp", item: "cayenne" },
      { amount: "4", unit: "", item: "potato buns" }
    ],
    instructions: [
      { step: 1, text: "Marinate the chicken in buttermilk and spices for at least 30 minutes." },
      { step: 2, text: "Dredge and fry until deeply golden and cooked through." },
      { step: 3, text: "Brush with hot cayenne oil, then stack on buns with pickles and slaw." }
    ],
    tips: ["Rest the fried chicken on a rack so the crust stays crisp."],
    variations: ["Swap in tenders for a faster weeknight version."],
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
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1.5", unit: "lb", item: "ground beef" },
      { amount: "1", unit: "", item: "habanero", notes: "finely minced" },
      { amount: "4", unit: "slices", item: "American cheese" },
      { amount: "4", unit: "", item: "burger buns" }
    ],
    instructions: [
      { step: 1, text: "Stir the habanero into mayo with smoked paprika and lime." },
      { step: 2, text: "Smash seasoned beef balls onto a ripping hot griddle or skillet." },
      { step: 3, text: "Melt cheese, toast buns, and build with mayo, onions, and pickles." }
    ],
    tips: ["Keep the patties loose until they hit the pan for better crust."],
    variations: ["Use pepper jack instead of American for extra bite."],
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
    servings: 4,
    difficulty: "intermediate",
    ingredients: [
      { amount: "14", unit: "oz", item: "wide rice noodles" },
      { amount: "3", unit: "", item: "bird's eye chiles", notes: "sliced" },
      { amount: "3", unit: "tbsp", item: "oyster sauce" },
      { amount: "1", unit: "cup", item: "Thai basil leaves" }
    ],
    instructions: [
      { step: 1, text: "Whisk the sauce and prep all the stir-fry components before the pan gets hot." },
      { step: 2, text: "Sear aromatics and chiles, then toss in noodles and sauce over high heat." },
      { step: 3, text: "Finish with basil and serve immediately while glossy and smoky." }
    ],
    tips: ["Do not overcrowd the pan or the noodles will steam instead of char."],
    variations: ["Add ground chicken or tofu for a fuller bowl."],
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
      "Birria is already rich, so the salsa matters. Arbol and lime keep the whole thing from getting muddy while the consome carries the deep chile tone.",
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
    servings: 6,
    difficulty: "advanced",
    ingredients: [
      { amount: "3", unit: "lb", item: "beef chuck roast" },
      { amount: "5", unit: "", item: "guajillo chiles" },
      { amount: "8", unit: "", item: "corn tortillas" },
      { amount: "2", unit: "cups", item: "Oaxaca cheese", notes: "shredded" }
    ],
    instructions: [
      { step: 1, text: "Blend the chile base, braise the beef until shreddable, and reserve the broth." },
      { step: 2, text: "Dip tortillas in the fat-slicked broth, then griddle with beef and cheese." },
      { step: 3, text: "Serve with hot consome and a quick arbol salsa on the side." }
    ],
    tips: ["Make the birria a day ahead and skim the fat after chilling."],
    variations: ["Use lamb shoulder for a richer version."],
    equipment: ["Dutch oven", "blender", "griddle"],
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
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Dumpling bowl topped with chili crisp and scallions",
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
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1", unit: "bag", item: "frozen dumplings" },
      { amount: "2", unit: "tbsp", item: "chili crisp" },
      { amount: "2", unit: "tbsp", item: "sesame paste" },
      { amount: "1", unit: "tbsp", item: "black vinegar" }
    ],
    instructions: [
      { step: 1, text: "Cook the dumplings according to the package until tender." },
      { step: 2, text: "Whisk the sauce with warm water until pourable." },
      { step: 3, text: "Pile into bowls and finish with chili crisp, herbs, and peanuts." }
    ],
    tips: ["A spoon of dumpling water helps the sauce cling better."],
    variations: ["Add wilted bok choy or cucumbers for crunch."],
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
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1", unit: "lb", item: "rigatoni" },
      { amount: "2", unit: "tbsp", item: "Calabrian chili paste" },
      { amount: "0.5", unit: "cup", item: "vodka" },
      { amount: "0.75", unit: "cup", item: "heavy cream" }
    ],
    instructions: [
      { step: 1, text: "Build the onion, tomato paste, and chile base until darkened and fragrant." },
      { step: 2, text: "Deglaze with vodka, then stir in cream and pasta water." },
      { step: 3, text: "Toss with rigatoni until glossy and finish with pecorino." }
    ],
    tips: ["Save extra pasta water for the final toss."],
    variations: ["Add spicy Italian sausage for a heavier dinner."],
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
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "2", unit: "lb", item: "bone-in chicken thighs" },
      { amount: "2", unit: "", item: "red bell peppers", notes: "sliced" },
      { amount: "3", unit: "tbsp", item: "peri-peri sauce" },
      { amount: "1", unit: "", item: "lemon" }
    ],
    instructions: [
      { step: 1, text: "Marinate the chicken with peri-peri, lemon, garlic, and oil." },
      { step: 2, text: "Scatter the vegetables on a sheet pan and roast the chicken until lacquered." },
      { step: 3, text: "Broil briefly for extra char, then spoon the pan juices over everything." }
    ],
    tips: ["Salt the chicken first so the marinade penetrates faster."],
    variations: ["Roast small potatoes underneath for a one-pan dinner."],
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
    servings: 4,
    difficulty: "beginner",
    ingredients: [
      { amount: "1.5", unit: "lb", item: "salmon fillet" },
      { amount: "2", unit: "tbsp", item: "Cajun seasoning" },
      { amount: "2", unit: "tbsp", item: "hot honey" },
      { amount: "4", unit: "cups", item: "cooked rice" }
    ],
    instructions: [
      { step: 1, text: "Season the salmon generously and roast until just flaky." },
      { step: 2, text: "Brush with hot honey and return to the oven for a glossy finish." },
      { step: 3, text: "Build bowls with rice, cucumbers, herbs, and yogurt sauce." }
    ],
    tips: ["Use short-grain rice if you want the bowl to feel richer."],
    variations: ["Swap salmon for shrimp or tofu."],
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
    servings: 4,
    difficulty: "intermediate",
    ingredients: [
      { amount: "1.5", unit: "lb", item: "ground chicken" },
      { amount: "3", unit: "tbsp", item: "green curry paste" },
      { amount: "1", unit: "can", item: "coconut milk" },
      { amount: "1", unit: "cup", item: "Thai basil leaves" }
    ],
    instructions: [
      { step: 1, text: "Mix, shape, and brown the meatballs until lightly golden." },
      { step: 2, text: "Bloom the curry paste, then simmer with coconut milk until glossy." },
      { step: 3, text: "Return the meatballs to the sauce and finish with basil and lime." }
    ],
    tips: ["Wet your hands to keep the meatball mix from sticking."],
    variations: ["Use turkey or tofu meatballs if preferred."],
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
