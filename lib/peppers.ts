export type HeatTier =
  | "mild"       // 0–2,500
  | "medium"     // 2,500–30,000
  | "hot"        // 30,000–100,000
  | "very-hot"   // 100,000–500,000
  | "extreme"    // 500,000–1,500,000
  | "superhot";  // 1,500,000+

export type PepperOrigin =
  | "mexico" | "central-america" | "caribbean" | "south-america"
  | "north-america" | "africa" | "southeast-asia" | "east-asia" | "south-asia"
  | "europe" | "middle-east";

export type PepperSpecies =
  | "annuum"      // jalapeño, cayenne, bell, ancho
  | "chinense"    // habanero, scotch bonnet, ghost, reaper
  | "frutescens"  // tabasco, malagueta, piri-piri
  | "pubescens"   // rocoto, manzano
  | "baccatum";   // aji amarillo, aji limo, lemon drop

export type PepperType =
  | "fresh-pod"   // jalapeño, serrano (eaten fresh or pickled)
  | "drying"      // ancho, guajillo, cayenne (mainly dried)
  | "smoking"     // chipotle (jalapeño dried + smoked)
  | "superhot"    // ghost, reaper, scorpion
  | "sweet";      // bell-adjacent

export type FlavorNote =
  | "fruity" | "smoky" | "earthy" | "vegetal" | "citrus"
  | "floral" | "tropical" | "nutty" | "bitter" | "sweet";

export interface PepperGrowing {
  usdaZones?: string;                  // "9–11" or "annual in zones 4–8"
  daysToGerminate?: string;            // "10–21"
  daysToHarvest?: number;              // from transplant
  plantHeight?: string;                // "24–36 in"
  containerFriendly?: boolean;
  sunRequirement?: "full" | "partial";
  waterNeeds?: "low" | "moderate" | "high";
  notes?: string;                      // free-form growing notes
}

export interface PepperBuying {
  freshAvailability?: string;          // "year-round at most grocers"
  driedAvailability?: string;          // "Latin markets and online"
  seedSources?: string[];              // seed seller names
  seasonality?: string;                // "peak July–September"
  notes?: string;
}

export interface PepperSubstitute {
  slug: string;                        // slug of substitute pepper
  ratio?: string;                      // "1:1" or "use 2 for every 1"
  note?: string;                       // why this substitution works
}

export interface PepperFaq {
  question: string;
  answer: string;
}

export interface PepperHistory {
  region?: string;                     // "Veracruz, Mexico"
  era?: string;                        // "Pre-Columbian"
  story?: string;                      // 1–2 sentence narrative
}

export interface Pepper {
  slug: string;
  name: string;
  aliases: string[];
  origin: PepperOrigin;
  scovilleMin: number;
  scovilleMax: number;
  heatTier: HeatTier;
  color: string;          // primary ripe color
  flavorProfile: string;  // 1 sentence
  description: string;    // 2–3 sentences editorial
  editorialNote: string;  // deeper paragraph
  culinaryUses: string[]; // bullet list of uses
  pairsWith: string[];    // foods/cuisines
  funFact: string;
  affiliateKeys: string[];
  recipeTagMatch: string[];  // tags to cross-link recipes
  featured: boolean;
  source: "editorial";
  // Optional deep-reference fields. Render only when populated.
  species?: PepperSpecies;
  pepperType?: PepperType;
  flavorNotes?: FlavorNote[];
  imageGallery?: string[];      // additional photo URLs beyond the hero
  /**
   * Optional Pinterest-optimized vertical hero (recommend 1000×1500).
   * When set, page metadata renders a portrait og:image and pinterest:image
   * meta tags alongside the standard 1200×630 card.
   */
  pinterestImageUrl?: string;
  history?: PepperHistory;
  growing?: PepperGrowing;
  buying?: PepperBuying;
  substitutes?: PepperSubstitute[];
  faqs?: PepperFaq[];
}

export const PEPPERS: Pepper[] = [
  {
    slug: "jalapeno",
    name: "Jalapeño",
    aliases: ["jalapeño pepper", "chipotle when smoked"],
    origin: "mexico",
    scovilleMin: 2500,
    scovilleMax: 8000,
    heatTier: "medium",
    color: "Red or green",
    flavorProfile: "Grassy, bright, and mildly vegetal with a clean, manageable heat.",
    description:
      "The most widely consumed hot pepper in the world, the jalapeño is the gateway drug of the spicy food world. Eaten fresh, pickled, roasted, or smoked into chipotles, it appears in more dishes than any other hot pepper.",
    editorialNote:
      "The jalapeño's near-universal availability and predictable heat range make it the chef's workhorse pepper. Ripe red jalapeños are sweeter and slightly hotter than the ubiquitous green; roasting either color mellows the heat and deepens the flavor. When smoked and dried, the jalapeño becomes the chipotle — a completely different flavor identity with the same base ingredient. If you're building heat tolerance, the jalapeño is where to start.",
    culinaryUses: [
      "Sliced fresh into tacos, nachos, and sandwiches",
      "Smoked and dried as chipotle for salsas and adobo",
      "Pickled en escabeche alongside carrots and onion",
      "Roasted and blended into hot sauces and salsas",
      "Stuffed with cheese and bacon (jalapeño popper)"
    ],
    pairsWith: ["Mexican", "Tex-Mex", "American BBQ", "Grilled corn", "Cream cheese"],
    funFact: "The same jalapeño pepper becomes a chipotle when it's left on the plant to ripen red, then smoked and dried — entirely different flavor, same pepper.",
    affiliateKeys: ["amazon-chipotle-in-adobo", "amazon-cholula-original", "amazon-tabasco-green", "amazon-siete-jalapeño-sauce"],
    recipeTagMatch: ["mexican", "tex-mex", "american"],
    featured: true,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["vegetal", "fruity", "citrus"],
    history: {
      region: "Veracruz and Puebla, Mexico",
      era: "Pre-Columbian, cultivated for 6,000+ years",
      story:
        "The jalapeño takes its name from Xalapa (historically Jalapa), the capital of Veracruz, where the pepper was traded for centuries before Spanish contact. Indigenous peoples in southern Mexico cultivated it long before European arrival, and the smoking technique that turns ripe jalapeños into chipotles is itself ancient — likely older than written records of the pepper. Today commercial production centers on Chihuahua, Sinaloa, and Texas, with Mexico still supplying most of the global supply."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "7–21",
      daysToHarvest: 75,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Start seeds indoors 8–10 weeks before last frost; jalapeños need warm soil (75–85°F) to germinate. Transplant after night temperatures stay above 55°F. Pinch the first flower set to push energy into root development. A 3–5 gallon container is enough per plant. Uneven watering causes blossom-end rot, so mulch heavily and water deeply once or twice a week rather than shallow daily."
    },
    buying: {
      freshAvailability: "Year-round at virtually every US grocery store; the most universally stocked hot pepper in the country.",
      driedAvailability: "Smoked-dried form (chipotle) is widely available at Latin grocers, well-stocked supermarkets, and online. Unsmoked dried jalapeños are uncommon.",
      seedSources: ["Burpee", "Bonnie Plants", "Johnny's Selected Seeds", "Pepper Joe's", "Baker Creek"],
      seasonality: "Peak field-grown season is August through October; greenhouse production keeps fresh supply steady year-round.",
      notes:
        "Green jalapeños are picked unripe and are what you'll see in most supermarkets. Red jalapeños are fully ripened — sweeter, slightly hotter, and harder to find fresh. If a recipe specifies red jalapeño, leave green ones on the windowsill for a few days to ripen, or substitute Fresno chiles."
    },
    substitutes: [
      {
        slug: "serrano",
        ratio: "Use about ⅔ as many",
        note: "Serranos are 2–3× hotter with a similar bright, grassy profile. Reduce quantity or remove some seeds to dial the heat back."
      },
      {
        slug: "chipotle",
        ratio: "1 chipotle per 2 jalapeños",
        note: "When you want jalapeño's flavor with smoky depth instead of fresh grassiness — chipotle is the same pepper, smoked and dried."
      }
    ],
    faqs: [
      {
        question: "How hot is a jalapeño compared to a habanero?",
        answer:
          "A habanero is about 25–50 times hotter than a jalapeño. Jalapeños sit in the 2,500–8,000 Scoville range; habaneros run from 100,000 to 350,000 SHU. The two peppers also taste fundamentally different — jalapeños are grassy and vegetal, habaneros are fruity and tropical."
      },
      {
        question: "Are red jalapeños hotter than green?",
        answer:
          "Slightly — but the bigger difference is flavor. Red jalapeños have been left on the plant to ripen and develop sweetness, fruitiness, and a touch more capsaicin. Most commercial jalapeños are picked green because they ship better, not because the green form is preferred."
      },
      {
        question: "What's the difference between a jalapeño and a chipotle?",
        answer:
          "They're the same pepper at different stages. A chipotle is a ripe red jalapeño that has been slow-smoked over wood and dried. The smoking transforms the bright, vegetal jalapeño flavor into something deep, earthy, and lightly sweet. Chipotles are usually sold dried, ground into powder, or canned in adobo sauce."
      },
      {
        question: "Can you eat jalapeño seeds?",
        answer:
          "Yes — seeds are edible and not the source of a jalapeño's heat. Capsaicin lives mostly in the white pith (the placenta) that holds the seeds, not in the seeds themselves. Removing the seeds and pith reduces heat by 60–80% without changing the pepper's flavor."
      },
      {
        question: "What's a good substitute for jalapeño?",
        answer:
          "Serrano peppers are the closest swap — they're hotter (use about two-thirds the amount) with the same grassy, fresh character. Fresno peppers work for red jalapeño calls. For a milder substitute, use poblano or Anaheim; you'll lose heat but keep the vegetal flavor. In a pinch, ¼ teaspoon of cayenne powder approximates the heat of one fresh jalapeño but loses all the fresh-pepper flavor."
      }
    ]
  },
  {
    slug: "serrano",
    name: "Serrano",
    aliases: ["serrano pepper", "serrano chile"],
    origin: "mexico",
    scovilleMin: 10000,
    scovilleMax: 23000,
    heatTier: "medium",
    color: "Red, yellow, or green",
    flavorProfile: "Bright, crisp, and grassy with a sharper heat than jalapeño.",
    description:
      "Smaller and hotter than the jalapeño, the serrano is the preferred fresh pepper for traditional Mexican salsas. It delivers a clean, punchy heat without the fruit notes of habaneros.",
    editorialNote:
      "The serrano sits in a useful middle ground: hot enough to matter, not so hot that it overwhelms. Mexican home cooks reach for it over jalapeños when they want a sharper, brighter heat in fresh preparations. The thin wall means it doesn't need roasting to be used raw — it brings immediate heat to salsas, ceviches, and guacamoles. Less forgiving than jalapeño for beginners, but not intimidating.",
    culinaryUses: [
      "Raw in pico de gallo and fresh salsas",
      "Blended into salsa verde alongside tomatillos",
      "Thinly sliced into ceviche and fish tacos",
      "Pickled for heat with bright acid notes",
      "Roasted in chile sauces"
    ],
    pairsWith: ["Mexican", "Seafood", "Guacamole", "Tomatillo", "Lime"],
    funFact: "Serranos are typically eaten before they ripen — the green version is the most common commercial form, though the ripe red pepper is noticeably sweeter.",
    affiliateKeys: ["amazon-cholula-green-tomatillo", "amazon-yellowbird-serrano", "amazon-tabasco-green"],
    recipeTagMatch: ["mexican", "seafood"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["vegetal", "citrus", "fruity"],
    history: {
      region: "Sierra Madre highlands, Hidalgo and Puebla, Mexico",
      era: "Cultivated for at least 1,500 years",
      story:
        "The serrano takes its name from the sierras — the mountainous regions of Hidalgo and Puebla where it has been grown for centuries. It was a regional staple in central Mexican cooking long before commercial production took off, and remains the default fresh chile in most Mexican home kitchens. Mexican-American cooking elevated it globally in the late 20th century, but in Mexico it never needed elevation."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 75,
      plantHeight: "24–30 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Easier to grow than jalapeño in many ways: more productive per plant, more disease-resistant, and tolerant of slightly cooler nights. Start seeds indoors 8 weeks before last frost. A single plant can produce 30–50 peppers in a season."
    },
    buying: {
      freshAvailability: "Year-round at most US grocery stores; especially common in markets serving Mexican-American communities. Slightly less universal than jalapeño but easy to find.",
      driedAvailability: "Dried serranos (serrano seco) are uncommon — they're a thin-walled fresh pepper that doesn't dry well at home. Pickled versions are widespread.",
      seedSources: ["Burpee", "Bonnie Plants", "Johnny's Selected Seeds", "Baker Creek"],
      seasonality: "Peak field-grown August through October; greenhouse production keeps year-round supply steady.",
      notes:
        "Green serranos are picked unripe and account for nearly all commercial supply. Red serranos are vine-ripened and sweeter — leave green peppers on the counter for a week to ripen at home."
    },
    substitutes: [
      {
        slug: "jalapeno",
        ratio: "Use 1½–2 jalapeños per serrano",
        note: "Jalapeño is the most universal substitute — about a third the heat with a similar grassy profile. You'll need more volume to get equivalent kick."
      },
      {
        slug: "thai-birds-eye",
        ratio: "Use ¼ as many",
        note: "Bird's eye is 3–5× hotter but similarly bright. Reduce quantity sharply or remove seeds."
      }
    ],
    faqs: [
      {
        question: "Is a serrano hotter than a jalapeño?",
        answer:
          "Yes — about two to three times hotter. Jalapeños run 2,500–8,000 SHU; serranos run 10,000–23,000 SHU. The flavor is similar (bright, grassy, vegetal) but the heat is more concentrated and arrives faster."
      },
      {
        question: "Can you use serrano and jalapeño interchangeably?",
        answer:
          "Mostly yes, with quantity adjustments. To swap a serrano for a jalapeño, use ⅓ to ½ of one. To swap a jalapeño for a serrano, use 1½–2 jalapeños. The flavor is close enough that no other ingredient changes are needed."
      },
      {
        question: "Why are serranos always green at the store?",
        answer:
          "Like jalapeños, serranos are typically harvested unripe because green peppers ship better and have longer shelf life. The red ripe form is sweeter and slightly hotter, but rarely makes it to commercial supply. Buy green and let them ripen on the counter for a week if you want red."
      },
      {
        question: "Do you have to roast serranos before using them?",
        answer:
          "No. Serranos have thin walls and are designed to be used raw — they go directly into salsas, ceviches, and guacamole without any cooking. Roasting is optional if you want a smokier flavor, but it's not the default preparation."
      }
    ]
  },
  {
    slug: "cayenne",
    name: "Cayenne",
    aliases: ["cayenne pepper", "red pepper", "Guinea spice"],
    origin: "south-america",
    scovilleMin: 30000,
    scovilleMax: 50000,
    heatTier: "hot",
    color: "Bright red",
    flavorProfile: "Dry, earthy heat with minimal fruit — the backbone of powdered chili and hot sauce.",
    description:
      "Cayenne is arguably the most important pepper in American cooking, even if most people don't know they're eating it. Ground cayenne powder appears in virtually every spice blend; the fresh or dried pepper is the base of Tabasco and many classic Louisiana hot sauces.",
    editorialNote:
      "The cayenne's value is in its clean, dry heat rather than any distinctive flavor. That neutrality is exactly the point — it adds fire without competing with other ingredients. Fresh cayennes appear in Italian-American dishes and some Asian cooking, but the dried powdered form is where it does its heaviest lifting, showing up in everything from barbecue rubs to Cincinnati chili. Frank's RedHot is made from cayenne. Tabasco adds fermented cayenne-range peppers. This is the working pepper.",
    culinaryUses: [
      "Ground into powder for rubs, blends, and spice mixes",
      "Base pepper for Louisiana-style hot sauces",
      "Added whole to Italian-American dishes (arrabbiata, aglio e olio)",
      "Infused into oils and butters for heat base",
      "Used in Korean and Sichuan cooking as a component pepper"
    ],
    pairsWith: ["Italian", "Louisiana", "American BBQ", "Korean", "Butter and cream sauces"],
    funFact: "Frank's RedHot, the most popular hot sauce in the United States, is made primarily from aged cayenne peppers — not a single exotic variety.",
    affiliateKeys: ["amazon-franks-redhot", "amazon-tabasco-original", "amazon-cajun-seasoning", "amazon-pain-is-good-louisiana"],
    recipeTagMatch: ["american", "louisiana", "italian"],
    featured: true,
    source: "editorial",
    species: "annuum",
    pepperType: "drying",
    flavorNotes: ["earthy", "smoky"],
    history: {
      region: "Originally French Guiana / Amazon basin",
      era: "Pre-Columbian, globalized via 16th-century spice trade",
      story:
        "The cayenne pepper takes its name from Cayenne, the capital of French Guiana, though it's likely a slightly older Amazonian cultivar. Portuguese traders carried it from South America across to India and Africa in the 1500s; today most commercial cayenne is grown in India, China, Mexico, and the southern US. Its position in Louisiana cooking comes from a long French-Caribbean trade route rather than any North American origin."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 70,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "One of the most productive home garden peppers — a single plant can yield 50+ pods in a long season. Best when peppers are left on the plant until fully red, then harvested all at once and dried. Grow at the edge of a vegetable bed where the bright red ripening pods give you a visual cue for harvest timing."
    },
    buying: {
      freshAvailability: "Fresh cayenne is uncommon at mainstream grocers but available at Asian, Italian, and Mexican markets, often labeled simply as 'long red chiles' or 'Italian frying peppers.'",
      driedAvailability: "Ground cayenne is sold in every spice aisle in the US; whole dried cayennes are common at Latin and Asian markets.",
      seedSources: ["Burpee", "Bonnie Plants", "Baker Creek", "Pepper Joe's"],
      seasonality: "Fresh peak August–October; ground powder is shelf-stable year-round.",
      notes:
        "Quality varies enormously by brand for ground cayenne — fresh, bright-red powder is much hotter and more flavorful than the brown, sun-faded jar that's been on the shelf for two years. Check the color before buying."
    },
    substitutes: [
      {
        slug: "thai-birds-eye",
        ratio: "Use ½ as many",
        note: "Thai bird's eye is about twice the heat but a similar dry, clean profile when dried. Works especially well as a substitute in Asian recipes."
      },
      {
        slug: "calabrian-chili",
        ratio: "1:1 in dried/flake form",
        note: "Calabrian dried flakes have similar heat but more fruit character. Best in Italian preparations."
      }
    ],
    faqs: [
      {
        question: "Is cayenne the same as paprika?",
        answer:
          "No. Both are dried ground peppers, but they come from different cultivars with very different heat levels. Cayenne is 30,000–50,000 SHU. Paprika is typically 0–500 SHU. Sweet paprika has no heat at all; smoked paprika adds smoke without much fire."
      },
      {
        question: "Why is cayenne in so many spice blends?",
        answer:
          "Because it provides clean, dry heat without competing flavor. Most other hot peppers carry distinctive notes (smoky, fruity, vegetal) that won't blend neutrally. Cayenne's job in a curry powder or Cajun rub is to add fire while letting the other spices express their flavors. It's the most 'neutral' high-heat pepper available."
      },
      {
        question: "What hot sauces are made from cayenne?",
        answer:
          "Most of the iconic American hot sauces: Frank's RedHot, Tabasco (with related Tabasco peppers), Crystal, Louisiana, Texas Pete, and most generic 'Louisiana-style' sauces. The combination of cayenne, vinegar, and salt defines the original American hot sauce category."
      },
      {
        question: "Can you grow cayenne in a pot?",
        answer:
          "Yes, and they do well in containers. A 3-gallon pot is the minimum; 5 gallons is better. They need full sun and warm soil. A single plant in a container can give you a full year's supply of dried peppers if you let them fully ripen before harvest."
      }
    ]
  },
  {
    slug: "habanero",
    name: "Habanero",
    aliases: ["habanero pepper", "red savina habanero"],
    origin: "south-america",
    scovilleMin: 100000,
    scovilleMax: 350000,
    heatTier: "very-hot",
    color: "Orange (most common), red, or chocolate",
    flavorProfile: "Intensely fruity and floral with a fast, aggressive heat that builds quickly.",
    description:
      "The habanero is the first pepper that genuinely surprises people who grew up eating jalapeños. The fruit-forward heat — citrus, mango, apricot — arrives fast and lingers, but never loses its tropical character.",
    editorialNote:
      "The habanero changed how Americans think about hot sauce. Before it became mainstream, the dominant styles were vinegar-and-cayenne Louisiana sauces. The habanero brought fruit into the conversation in a way no previous commercial pepper had. Yellowbird built a brand on it. El Yucateco made it the face of Yucatecan cooking. When used carefully — seeded, roasted, paired with citrus and tropical fruit — it's one of the most culinarily versatile superhot-adjacent peppers available.",
    culinaryUses: [
      "Caribbean and Yucatecan salsas and hot sauces",
      "Mango-habanero wing sauce",
      "Scotch bonnet substitute in Caribbean cooking",
      "Infused into oils and marinades for indirect heat",
      "Paired with tropical fruit in salsas"
    ],
    pairsWith: ["Caribbean", "Mexican", "Mango", "Pineapple", "Citrus", "Grilled meats"],
    funFact: "The habanero was the world's hottest pepper from 1994 to 2006, holding the Guinness record until the Red Savina variety was eventually surpassed by the bhut jolokia.",
    affiliateKeys: ["amazon-yellowbird-habanero", "amazon-el-yucateco-red-habanero", "amazon-mango-habanero-sauce", "amazon-cholula-sweet-habanero"],
    recipeTagMatch: ["caribbean", "mexican", "tropical"],
    featured: true,
    source: "editorial",
    species: "chinense",
    pepperType: "fresh-pod",
    flavorNotes: ["fruity", "tropical", "floral", "citrus"],
    history: {
      region: "Yucatán Peninsula, Mexico (despite the Cuban-sounding name)",
      era: "Cultivated by the Maya for 8,000+ years",
      story:
        "Habanero means 'from Havana' in Spanish, but the pepper is native to the Amazon basin and the Yucatán, not Cuba — the name reflects an old trade route rather than origin. Maya cultivation predates written history by millennia. Today the Yucatán remains the world's most famous habanero growing region, with Mexico's denomination of origin (Habanero de la Península de Yucatán) recognizing the specific terroir that produces the variety's characteristic fruit notes."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9",
      daysToGerminate: "14–28",
      daysToHarvest: 100,
      plantHeight: "24–30 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Slower to germinate than annuum peppers — 75–90°F soil temp speeds things up significantly. Longer growing season too: start indoors 10–12 weeks before last frost. Plants thrive in heat above 85°F and will keep producing until the first cold night. A 5-gallon container is recommended; the root system is larger than jalapeño's."
    },
    buying: {
      freshAvailability: "Orange habaneros are increasingly stocked at mainstream US grocery stores. Red, chocolate, and white variants are at Caribbean and Latin specialty markets.",
      driedAvailability: "Dried whole habaneros and habanero powder available online and at specialty spice shops. Not common in mainstream stores.",
      seedSources: ["Burpee", "Pepper Joe's", "Baker Creek", "Refining Fire Chiles", "White Hot Peppers"],
      seasonality: "Field-grown peak August–October; greenhouse production maintains year-round supply in larger markets.",
      notes:
        "Color matters more for habanero than other peppers: orange is the most common commercial variety, but Yucatecan red habaneros are distinctly fruitier and chocolate habaneros are earthier and slightly milder. Worth seeking out the variants once you know the base flavor."
    },
    substitutes: [
      {
        slug: "scotch-bonnet",
        ratio: "1:1",
        note: "The closest substitute — same species, same heat range, slightly sweeter and more floral. Often interchangeable in Caribbean and Mexican recipes."
      },
      {
        slug: "aji-amarillo",
        ratio: "1:1 (for flavor, less heat)",
        note: "Tropical fruit flavor without the same intensity of heat. Use when you want habanero's fruit character at a lower burn."
      }
    ],
    faqs: [
      {
        question: "How hot is a habanero compared to a jalapeño?",
        answer:
          "About 25–50 times hotter. Habaneros run 100,000–350,000 Scoville Heat Units; jalapeños sit at 2,500–8,000. The flavor is also fundamentally different — jalapeños are vegetal and grassy, habaneros are fruity and tropical."
      },
      {
        question: "What's the difference between habanero and scotch bonnet?",
        answer:
          "They're closely related (same species, Capsicum chinense) and roughly equal heat. Habaneros tend toward citrus and slight pine; scotch bonnets are sweeter and more floral with stronger fruit notes. In most recipes they're interchangeable, but Caribbean cooks insist scotch bonnet is essential for authentic jerk and pepper sauces."
      },
      {
        question: "Can you cook out the heat of a habanero?",
        answer:
          "Not really. Capsaicin survives cooking — heat doesn't dissipate the way some flavor compounds do. What you can do is reduce volume (use less pepper), remove seeds and pith (cuts heat by ~60%), or pair with fat and dairy (which absorb capsaicin and feel cooler on the palate). Roasting won't reduce heat but does deepen the flavor."
      },
      {
        question: "Why are habaneros so fruity?",
        answer:
          "Capsicum chinense peppers contain a different set of aromatic compounds than annuum peppers like jalapeño. The same volatile esters that give peaches, mangoes, and apricots their tropical character are present in habaneros at higher concentrations. The 'fruit' note isn't an illusion — it's chemically related to actual fruit."
      }
    ]
  },
  {
    slug: "scotch-bonnet",
    name: "Scotch Bonnet",
    aliases: ["scotch bonnet pepper", "bonney pepper", "Caribbean red pepper"],
    origin: "caribbean",
    scovilleMin: 100000,
    scovilleMax: 350000,
    heatTier: "very-hot",
    color: "Red, yellow, or orange",
    flavorProfile: "Sweet, fruity, and floral with a deep Caribbean heat that's rounder than habanero.",
    description:
      "The defining pepper of Caribbean cuisine, the scotch bonnet appears in Jamaican jerk, Trinidadian pepper sauce, and West African cooking. Closely related to habanero but with a distinctly sweeter, more complex fruit character.",
    editorialNote:
      "The scotch bonnet is culinarily indispensable in Caribbean cooking in a way no substitute can replicate. The flavor difference from habanero is real — rounder, sweeter, with less of the sharp citrus note. Jamaican jerk marinade without scotch bonnet is technically possible but wrong. Walkerswood and Grace are the definitive commercial expressions of this pepper's potential. If you're cooking Caribbean food seriously, this is the pepper to source.",
    culinaryUses: [
      "Jamaican jerk marinade and seasoning — essential ingredient",
      "Trinidadian pepper sauce with chadon beni",
      "West African pepper soup and stews",
      "Pickled and fermented Caribbean condiments",
      "Rice and pea dishes throughout the Caribbean"
    ],
    pairsWith: ["Jamaican", "Caribbean", "West African", "Grilled chicken", "Rice dishes", "Allspice"],
    funFact: "The scotch bonnet gets its name from its resemblance to a traditional Scottish tam o'shanter hat — the same squat, rounded shape.",
    affiliateKeys: ["amazon-walkerswood-scotch-bonnet", "amazon-encona-original", "amazon-queen-majesty-scotch-bonnet-ginger", "amazon-jerk-seasoning"],
    recipeTagMatch: ["caribbean", "jamaican", "west african"],
    featured: true,
    source: "editorial",
    species: "chinense",
    pepperType: "fresh-pod",
    flavorNotes: ["fruity", "tropical", "sweet", "floral"],
    history: {
      region: "Jamaica and the wider Caribbean",
      era: "Cultivated in the Caribbean since at least the 16th century",
      story:
        "The scotch bonnet is the defining heat ingredient of Caribbean cooking. Likely descended from peppers traded between the Yucatán and the Antilles before European contact, it adapted to Caribbean island climates and became culturally rooted in Jamaican jerk, Trinidadian pepper sauce, and the West African dishes brought across the Atlantic during the colonial era. The name comes from its resemblance to a tam o' shanter — a Scottish bonnet — courtesy of British colonial observers."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9",
      daysToGerminate: "14–28",
      daysToHarvest: 100,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Loves heat. Slow to germinate; consider a heat mat. Plants set fruit best when night temperatures stay above 65°F. Caribbean home growers traditionally let the plants overwinter; in cooler US climates, treat as annual or move pots indoors. Productive once established — 20–40 pods per plant is typical."
    },
    buying: {
      freshAvailability: "Standard at Caribbean grocers; increasingly common at well-stocked supermarkets in cities with Caribbean communities. Specialty stores carry yellow, red, and orange varieties.",
      driedAvailability: "Rare in dried form; the scotch bonnet's thin walls don't dry well. Most preserved versions are in jerk pastes or pepper sauces (Walkerswood, Encona, Grace).",
      seedSources: ["Baker Creek", "Pepper Joe's", "Refining Fire Chiles", "Caribbean Garden Seed", "White Hot Peppers"],
      seasonality: "Year-round in tropical climates; field-grown peak August–October in the southern US.",
      notes:
        "If you can't find fresh scotch bonnets, look for Walkerswood jerk seasoning or a quality Jamaican-made pepper sauce — both deliver the authentic flavor in pantry form. Habaneros are an acceptable but not identical substitute."
    },
    substitutes: [
      {
        slug: "habanero",
        ratio: "1:1",
        note: "Closest substitute by far — same species, same heat range. Habaneros are less sweet and more citrusy, but the swap works in 90% of recipes."
      }
    ],
    faqs: [
      {
        question: "Is scotch bonnet hotter than habanero?",
        answer:
          "Roughly the same heat — both run 100,000–350,000 Scoville Heat Units. Individual peppers vary; you'll find scotch bonnets at the high end of that range as often as habaneros. The bigger difference is flavor: scotch bonnets are sweeter and more floral, habaneros are sharper and more citrusy."
      },
      {
        question: "Why is scotch bonnet essential for jerk seasoning?",
        answer:
          "Jamaican jerk depends on the specific fruit-sweet character of scotch bonnet — the way its tropical notes layer with allspice, thyme, and brown sugar to create the marinade's signature flavor. Habanero substitutes are passable but the cuisine evolved around scotch bonnet specifically, and authentic versions don't compromise."
      },
      {
        question: "Where can I buy scotch bonnet peppers?",
        answer:
          "Caribbean groceries are the most reliable source. Beyond that, look at Latin or West African markets, larger grocery chains in diverse cities, or online specialty pepper suppliers. If you can't find them fresh, jarred pepper sauces from Walkerswood, Grace, or Matouk's deliver the same flavor profile."
      },
      {
        question: "Why are scotch bonnets named after a hat?",
        answer:
          "The pepper's squat, rounded, slightly puckered shape resembles a traditional Scottish tam o' shanter — the bonnet worn by Scottish highlanders. British colonial observers in the Caribbean gave it the name; locals had always called it by other names (bonney pepper, country pepper, scotty)."
      }
    ]
  },
  {
    slug: "ghost-pepper",
    name: "Ghost Pepper",
    aliases: ["bhut jolokia", "naga jolokia", "raja mirchi", "ghost chili"],
    origin: "south-asia",
    scovilleMin: 855000,
    scovilleMax: 1041427,
    heatTier: "extreme",
    color: "Red (most common), chocolate, or yellow",
    flavorProfile: "Smoky, earthy fruit with a building heat that escalates for several minutes.",
    description:
      "The ghost pepper was the world's hottest documented pepper from 2007 to 2011 and remains one of the most culturally significant superhot peppers. Originally from India's Assam region, it holds cultural and culinary significance in Northeastern Indian cooking far beyond its internet fame.",
    editorialNote:
      "The ghost pepper was the first pepper to cross the one million Scoville threshold publicly, and it changed how the world understood capsaicin. But behind the viral challenge videos is a legitimate culinary ingredient used in northeastern Indian cuisine for centuries. The slow-building heat, the deep smoky fruit, and the long duration make it genuinely different from habanero-range peppers — not just hotter, but differently constructed. Dave's Ghost Pepper sauce handles it well. Used in small quantities in curries and chutneys, it's extraordinary.",
    culinaryUses: [
      "Northeastern Indian curries and chutneys in small quantities",
      "Ghost pepper hot sauces and salsas",
      "Infused oils for indirect, deep heat",
      "Dried and powdered for extreme rub applications",
      "Pickling alongside ginger and garlic"
    ],
    pairsWith: ["Indian", "Fermented condiments", "Pork", "Slow-cooked meats"],
    funFact: "The Indian military used ghost peppers to develop smoke grenades and crowd-control sprays — the pepper was weaponized before it became a social media challenge.",
    affiliateKeys: ["amazon-daves-ghost-pepper", "amazon-yellowbird-ghost-pepper", "pepper-joe-superhot-seed-pack"],
    recipeTagMatch: ["indian", "south-asian"],
    featured: true,
    source: "editorial",
    species: "chinense",
    pepperType: "superhot",
    flavorNotes: ["fruity", "smoky", "earthy", "floral"],
    history: {
      region: "Assam, Nagaland, and Manipur — Northeast India",
      era: "Cultivated in Northeast India for centuries; documented globally since the 1850s",
      story:
        "Known locally as bhut jolokia ('ghost chile' in Assamese), the pepper has been part of Northeast Indian cooking for generations — used in pickles, chutneys, and as a preservative in dried meats. Its global moment came in 2007 when Guinness certified it as the world's hottest pepper at over one million Scoville units, a record it held until 2011. The Indian Defence Research and Development Organisation has researched its capsaicin for use in crowd-control sprays and elephant-deterrent grenades."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with care",
      daysToGerminate: "20–35",
      daysToHarvest: 130,
      plantHeight: "24–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Notoriously slow germination — heat mats and patience essential. Plants thrive in extended heat and humidity, mimicking the Indian monsoon. In cooler climates start indoors 12–14 weeks before last frost. Yields are modest (10–25 pods per plant) but each pod has enormous heat impact."
    },
    buying: {
      freshAvailability: "Fresh ghost peppers are rare at general grocers; specialty hot sauce shops, online pepper farms, and South Asian markets in larger cities are the most reliable sources.",
      driedAvailability: "Dried whole pods and ghost pepper powder are widely available online and at specialty spice retailers (Penzeys, World Spice).",
      seedSources: ["Pepper Joe's", "Refining Fire Chiles", "Baker Creek", "Puckerbutt Pepper Company"],
      seasonality: "Late season pepper; fresh peak September–November in US growing.",
      notes:
        "Always handle fresh ghost peppers with gloves. Capsaicin can transfer from your fingers to your eyes, nose, or skin and cause prolonged irritation. Wash everything that touched the pepper, including your cutting board, in soapy water."
    },
    substitutes: [
      {
        slug: "habanero",
        ratio: "Use 3–5 habaneros per ghost pepper",
        note: "Ghost peppers are roughly 5–7× hotter than habanero. Habaneros are the safest stand-in if you want a fruity, intense heat without crossing into 'cannot taste anything' territory."
      },
      {
        slug: "scotch-bonnet",
        ratio: "Use 3–5 scotch bonnets per ghost pepper",
        note: "Same family, similar fruit notes, much more manageable heat. Good for layering flavor without ghost-pepper-level danger."
      }
    ],
    faqs: [
      {
        question: "How hot is a ghost pepper really?",
        answer:
          "Ghost peppers measure 855,000 to 1,041,427 Scoville Heat Units — about 200–400 times hotter than a jalapeño and 3–10 times hotter than a habanero. The heat builds slowly and can keep escalating for several minutes after the first bite, which makes it more disorienting than peppers that peak immediately."
      },
      {
        question: "Can a ghost pepper actually hurt you?",
        answer:
          "Eating one whole can cause severe nausea, vomiting, and esophageal pain in many people; documented cases have included internal injury when eating challenges go wrong. In normal cooking quantities (a small piece, well-cooked, in a sauce or curry), they're safe. Always wear gloves when handling fresh ones — capsaicin transfers easily to skin and eyes."
      },
      {
        question: "What does bhut jolokia mean?",
        answer:
          "Bhut jolokia translates roughly to 'ghost chili' in Assamese — bhut means ghost or spirit, jolokia is the regional word for chile. The name reflects the pepper's eerie reputation: heat that creeps up on you, lingers, and seems to come from nowhere."
      },
      {
        question: "Is the ghost pepper still the hottest in the world?",
        answer:
          "No. The ghost pepper held the Guinness World Record from 2007 to 2011. It was surpassed first by the Trinidad Scorpion, then by the Carolina Reaper (2013–2023), and most recently by Pepper X (over 2.6 million SHU). The ghost pepper is still extraordinarily hot — and culturally significant as the first pepper to cross the one-million SHU threshold."
      }
    ]
  },
  {
    slug: "carolina-reaper",
    name: "Carolina Reaper",
    aliases: ["HP22B", "reaper pepper"],
    origin: "north-america",
    scovilleMin: 1400000,
    scovilleMax: 2200000,
    heatTier: "superhot",
    color: "Red",
    flavorProfile: "Fruity, sweet entry followed by the most intense sustained heat of any widely available pepper.",
    description:
      "Bred by Ed Curlin of the PuckerButt Pepper Company in South Carolina, the Carolina Reaper held the Guinness World Record as the world's hottest pepper from 2013 to 2023. Recognizable by its scorpion-like tail and deeply wrinkled red skin.",
    editorialNote:
      "The Carolina Reaper is the rare pepper that actually delivers on its reputation. The initial fruit sweetness is real and lasts about three seconds before the capsaicin takes over in a way that most people cannot prepare for. Ed Curlin created it as a culinary pepper, not just a contest entry — and at extremely small quantities, it does bring a complex fruity-floral note to sauces. Torchbearer and Bravado have built whole product lines around it. This is the standard against which all superhot sauces are now measured.",
    culinaryUses: [
      "Used in tiny quantities in superhot hot sauces",
      "Dried and powdered for extreme spice blends",
      "Competition cooking and eating challenges",
      "Seed cultivation for superhot growers",
      "Infused into oils at controlled concentrations"
    ],
    pairsWith: ["Managed with dairy", "Sweet fruit bases to balance", "BBQ smoked meats"],
    funFact: "Ed Curlin created the Carolina Reaper by crossing a Pakistani Naga with a Red Habanero — the breeding took over a decade of selective cultivation.",
    affiliateKeys: ["amazon-torchbearer-garlic-reaper", "amazon-bravado-black-garlic-reaper", "pepper-joe-superhot-seed-pack", "amazon-mad-dog-357"],
    recipeTagMatch: ["american", "bbq"],
    featured: true,
    source: "editorial",
    species: "chinense",
    pepperType: "superhot",
    flavorNotes: ["fruity", "sweet", "tropical", "floral"],
    history: {
      region: "Fort Mill, South Carolina, United States",
      era: "Released commercially in 2013",
      story:
        "Bred by Ed Currie at the Puckerbutt Pepper Company in South Carolina, the Carolina Reaper is the most famous American-bred pepper. Currie crossed a Pakistani Naga with a Red Habanero over more than a decade of selective breeding, deliberately targeting both record-breaking heat and a usable culinary flavor. Guinness certified it as the world's hottest pepper in 2013, a title it held for ten years until Pepper X (also bred by Currie) surpassed it in 2023."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with deliberate effort",
      daysToGerminate: "20–35",
      daysToHarvest: 130,
      plantHeight: "24–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Among the most patience-testing peppers to grow. Seeds germinate slowly and need consistent 80–90°F soil. Plants are sensitive to cold and benefit from greenhouse or covered conditions in temperate climates. Start indoors 12–14 weeks before last frost. Distinctive scorpion-tail shape and rough red skin are diagnostic — if your pods look smooth, the seed was probably mislabeled."
    },
    buying: {
      freshAvailability: "Almost never at general grocers. Specialty hot sauce shops, online pepper farms, and direct from Puckerbutt Pepper Company are the realistic sources.",
      driedAvailability: "Dried whole pods and reaper powder widely available online; specialty spice retailers and hot sauce shops carry them.",
      seedSources: ["Puckerbutt Pepper Company (official)", "Pepper Joe's", "Refining Fire Chiles", "Baker Creek"],
      seasonality: "Late season; fresh harvests in October-November when fully ripened red.",
      notes:
        "Buy from Puckerbutt for guaranteed-authentic seeds — many vendors sell 'reaper' seeds that are actually crosses or mislabeled cultivars. The genetics matter for the characteristic shape, color, and heat level."
    },
    substitutes: [
      {
        slug: "ghost-pepper",
        ratio: "Use 1.5–2 ghost peppers per reaper",
        note: "Ghost peppers are about half the heat with a similar tropical fruit character. Best for layering reaper-style flavor at a slightly more sane level."
      },
      {
        slug: "trinidad-moruga-scorpion",
        ratio: "1:1",
        note: "Roughly equivalent heat range and similar fruit-then-fire profile. Largely interchangeable in superhot hot sauce recipes."
      }
    ],
    faqs: [
      {
        question: "How hot is the Carolina Reaper?",
        answer:
          "1.4 million to 2.2 million Scoville Heat Units on average, with individual peppers documented over 2.4 million. That's roughly 200–400 times hotter than a jalapeño, and 5–15 times hotter than a habanero. Pepper X (also bred by Ed Currie) is now the official record holder at 2.69 million SHU."
      },
      {
        question: "What does a Carolina Reaper taste like?",
        answer:
          "Surprisingly fruity for the first 2–3 seconds — sweet tropical notes that read like very ripe stone fruit. Then the capsaicin arrives, and most flavor perception disappears for the next 10–20 minutes. Ed Currie deliberately bred for a fruit-forward flavor profile, not just heat — but the heat is so extreme that most people only register the front-of-palate sweetness."
      },
      {
        question: "Who created the Carolina Reaper?",
        answer:
          "Ed Currie, founder of Puckerbutt Pepper Company in Fort Mill, South Carolina. He started the breeding project in the early 2000s, crossing a Pakistani Naga with a Red Habanero and selecting for both maximum capsaicin and stable flavor character. The pepper was officially certified by Guinness in 2013."
      },
      {
        question: "Is it safe to eat a Carolina Reaper?",
        answer:
          "In tiny culinary quantities, yes. Whole-pepper challenges have caused documented medical emergencies including thunderclap headaches, severe gastrointestinal distress, and at least one case of a vasoconstriction stroke-like episode. Don't eat one whole. In a hot sauce or curry where one pepper is divided across many servings, the heat is intense but manageable."
      }
    ]
  },
  {
    slug: "thai-birds-eye",
    name: "Thai Bird's Eye",
    aliases: ["bird chili", "prik kee noo", "bird pepper", "Thai chili"],
    origin: "southeast-asia",
    scovilleMin: 50000,
    scovilleMax: 100000,
    heatTier: "hot",
    color: "Red or green",
    flavorProfile: "Sharp, bright heat with a clean finish and very little fruit character.",
    description:
      "The dominant hot pepper across Southeast Asian cuisine, bird's eye chilis appear in Thai, Vietnamese, Indonesian, and Filipino cooking. Small, thin-walled, and aggressively hot for their size.",
    editorialNote:
      "Bird's eye chilis are to Southeast Asia what cayenne is to Louisiana — the baseline heat that everything else is measured against. Thai papaya salads, Vietnamese pho condiment trays, sambal, and pad krapow all depend on them. The heat is direct and immediate without the building quality of superhots, which makes them excellent for cooking — you can predict and control the dose. Sambal oelek is essentially bird's eye chilis in paste form.",
    culinaryUses: [
      "Fresh in Thai salads, soups, and stir-fries",
      "Fermented into sambal and chili pastes",
      "Sliced into Vietnamese dipping sauces and pho garnishes",
      "Dried for Southeast Asian spice blends",
      "Whole in Indonesian and Filipino braised dishes"
    ],
    pairsWith: ["Thai", "Vietnamese", "Indonesian", "Filipino", "Fish sauce", "Lime", "Lemongrass"],
    funFact: "Despite being called 'bird's eye' across Southeast Asia, the pepper got its name because birds that ate and spread the seeds were immune to capsaicin — only mammals feel the burn.",
    affiliateKeys: ["amazon-sambal-oelek", "amazon-fly-by-jing-sichuan-gold", "amazon-chili-crisp"],
    recipeTagMatch: ["thai", "vietnamese", "southeast-asian", "indonesian"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["vegetal", "citrus", "sweet"],
    history: {
      region: "Indigenous to South and Central America; cultivated in Southeast Asia since the 16th century",
      era: "Globally distributed via Portuguese and Spanish trade routes after 1500",
      story:
        "Despite being called 'Thai,' the bird's eye chili originated in Central and South America like all chiles. Portuguese traders brought it to Southeast Asia in the 1500s, and the climate and cuisines of Thailand, Vietnam, Indonesia, and the Philippines absorbed it so thoroughly that within a few generations it became culturally inseparable from those cuisines. Today bird's eye chilis are inseparable from Southeast Asian cooking in a way that no other introduced ingredient has matched."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9",
      daysToGerminate: "10–21",
      daysToHarvest: 85,
      plantHeight: "18–24 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "One of the most productive small peppers you can grow — a single mature plant produces hundreds of small pods over a long season. Compact growth habit makes them ideal for containers and even windowsills with enough sun. The plant ornamentally beautiful when loaded with red and green pods at once."
    },
    buying: {
      freshAvailability: "Year-round at Asian groceries, often labeled simply 'Thai chili' or 'bird's eye chili.' Mainstream supermarkets stock them in produce sections serving Asian communities.",
      driedAvailability: "Dried whole 'Thai chilis' are universally available — most pantry-aisle 'red chili flakes' marketed for Asian cooking are bird's eye chilis.",
      seedSources: ["Kitazawa Seed", "Baker Creek", "Pepper Joe's", "Burpee (as Thai chili)"],
      seasonality: "Greenhouse-grown bird's eyes are available year-round; field-grown peaks August–October.",
      notes:
        "Green and red bird's eyes are typically used together in Thai cooking for visual contrast and slightly different flavor — green is brighter and more vegetal, red is sweeter and slightly hotter. Don't avoid one for the other."
    },
    substitutes: [
      {
        slug: "serrano",
        ratio: "Use 2–3 serranos per Thai chili",
        note: "Similar bright, clean heat; serrano is about half the heat of bird's eye. Works well in Southeast Asian dishes when bird's eye isn't available."
      },
      {
        slug: "cayenne",
        ratio: "Use ¼ tsp ground cayenne per fresh Thai chili",
        note: "Same heat level when dried, but loses the fresh-pepper character. Works for cooked applications where you need heat without aromatics."
      }
    ],
    faqs: [
      {
        question: "Are Thai chilis the same as bird's eye chilis?",
        answer:
          "Essentially yes — 'Thai chili' is a marketing name for the same plant (Capsicum annuum var. glabriusculum) sold across Southeast Asia under regional names: prik kee noo in Thai, ớt hiểm in Vietnamese, siling labuyo in Filipino. There are slight cultivar variations but they're functionally interchangeable."
      },
      {
        question: "How many Thai chilis equal one jalapeño?",
        answer:
          "Roughly one Thai chili equals 6–10 jalapeños in heat. They're 50,000–100,000 SHU vs the jalapeño's 2,500–8,000. Most Thai recipes call for 2–8 of these per dish; if substituting jalapeño, you'll need a lot more (and lose the bright bird's eye flavor)."
      },
      {
        question: "Can you eat Thai chilis raw?",
        answer:
          "Yes, and most Southeast Asian recipes do exactly that. They're added raw to nam pla prik (fish sauce condiment), sliced into noodle soups as garnish, pounded into som tam (papaya salad). The thin walls and bright flavor are designed for fresh use. Cooked versions exist (red curry pastes, sambals) but raw is the traditional form."
      },
      {
        question: "Why does the name say 'bird's eye'?",
        answer:
          "Because the chilis grow in upright clusters that resemble small eyes, and because birds eat and disperse the seeds without feeling the heat — capsaicin only affects mammals, so birds spread the seeds widely. The name predates the Thai-specific marketing label by centuries."
      }
    ]
  },
  {
    slug: "piri-piri",
    name: "Piri Piri",
    aliases: ["peri peri", "African bird's eye", "pil pil"],
    origin: "africa",
    scovilleMin: 50000,
    scovilleMax: 175000,
    heatTier: "hot",
    color: "Red",
    flavorProfile: "Citrusy, bright heat with a slight sweetness and a lingering warm finish.",
    description:
      "The defining pepper of Portuguese-African cooking, piri piri anchors the cuisines of Portugal, Mozambique, Angola, and South Africa. Most widely known through Nando's, which built a global fast food chain around a single piri piri marinade.",
    editorialNote:
      "Piri piri is where Africa and Europe met in the kitchen. Portuguese traders brought American peppers to Africa in the 16th century; the African bird's eye chili that evolved there then traveled back to Portugal as a culinary mainstay. The result is one of the most distinctive spicy food traditions in the world — the Nando's peri-peri chicken has done more to export African heat culture globally than perhaps any other single product. At home, piri piri oil over grilled chicken is one of the simplest and most satisfying spicy preparations you can make.",
    culinaryUses: [
      "Peri-peri chicken marinades — the definitive use",
      "Portuguese piri piri oil over seafood",
      "Mozambican and Angolan stews and braises",
      "South African braai condiment",
      "Mixed into aioli and mayonnaise for a mild heat base"
    ],
    pairsWith: ["Grilled chicken", "Seafood", "Portuguese", "Mozambican", "Lemon and garlic"],
    funFact: "Nando's was founded in Johannesburg in 1987 and now operates over 1,200 restaurants in 35 countries — all built around a single recipe using piri piri pepper.",
    affiliateKeys: ["amazon-peri-peri-sauce", "amazon-nandos-peri-peri-hot", "amazon-encona-original"],
    recipeTagMatch: ["african", "portuguese", "grilled"],
    featured: false,
    source: "editorial",
    species: "frutescens",
    pepperType: "fresh-pod",
    flavorNotes: ["citrus", "fruity", "vegetal"],
    history: {
      region: "Southern Africa — Mozambique, Malawi, South Africa, and Angola",
      era: "Indigenous African bird's eye chili crossed with American chiles via 16th-century Portuguese trade",
      story:
        "Piri-piri (also spelled peri-peri or pili-pili) means 'pepper-pepper' in Swahili. The plant is an African bird's eye chili — descended from American Capsicum frutescens varieties carried to Africa by Portuguese traders, then adapted over centuries to grow wild across southern Africa. The Portuguese-Mozambican kitchen invented the now-iconic piri-piri marinade in colonial-era Mozambique and Angola; Nando's took the formula global from a single restaurant in Johannesburg in 1987."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9",
      daysToGerminate: "14–28",
      daysToHarvest: 95,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Tolerates dry conditions better than most peppers. Grown widely on small farms across southern Africa with minimal inputs. Plants are highly productive — 30–80 pods per plant is typical. The wild African bird's eye habit makes them slightly more vigorous than American varieties."
    },
    buying: {
      freshAvailability: "Rare in mainstream US grocers; African and Portuguese specialty markets are the main sources. Mozambican and South African diaspora communities import them.",
      driedAvailability: "Whole dried piri-piris available online and at African specialty stores. Often labeled 'African bird's eye chili.'",
      seedSources: ["Baker Creek", "Pepper Joe's", "Refining Fire Chiles"],
      seasonality: "Year-round in tropical southern Africa; field-grown elsewhere peaks late summer.",
      notes:
        "If sourcing fresh is impossible, the bottled sauces are excellent — Nando's Peri-Peri (medium or hot), Mr Bean Sauces, and authentic Portuguese piri-piri oils deliver the genuine flavor."
    },
    substitutes: [
      {
        slug: "thai-birds-eye",
        ratio: "1:1",
        note: "Closely related botanical relative with similar heat and brightness. The Thai bird's eye is the best fresh substitute when piri-piri can't be sourced."
      },
      {
        slug: "cayenne",
        ratio: "Use 1.5–2 cayennes per piri-piri",
        note: "Similar heat range when dried; works for sauce-making but loses the citrus character of piri-piri."
      }
    ],
    faqs: [
      {
        question: "Is piri-piri the same as peri-peri?",
        answer:
          "Yes — same pepper, different romanizations of the Swahili. 'Piri-piri' is Portuguese-influenced spelling (used widely in Mozambique, Angola, Portugal). 'Peri-peri' is the English/South African spelling that Nando's uses globally. The pepper and the marinade tradition are identical."
      },
      {
        question: "How hot is piri-piri?",
        answer:
          "Around 50,000–175,000 Scoville Heat Units. That puts it roughly equivalent to a Thai bird's eye chili — significantly hotter than a jalapeño, but not in habanero territory. Most commercial piri-piri sauces are diluted with vinegar and other ingredients to a much more accessible heat level."
      },
      {
        question: "What is Nando's peri-peri sauce made from?",
        answer:
          "The base is African bird's eye chili (piri-piri), combined with garlic, lemon, oil, and herbs (typically including oregano, basil, and bay). Different heat tiers vary the pepper concentration. The exact proprietary recipe is closely held, but the genre — grilled chicken marinated in piri-piri oil and citrus — predates Nando's by centuries in Portuguese-African home cooking."
      },
      {
        question: "Can you grow piri-piri at home?",
        answer:
          "Yes, easily. They behave similarly to other Capsicum frutescens varieties (tabasco, Thai bird's eye). Start indoors 10 weeks before last frost, transplant when soil is reliably above 65°F, and expect heavy production from each plant. They tolerate slight drought stress and don't need pampering."
      }
    ]
  },
  {
    slug: "calabrian-chili",
    name: "Calabrian Chili",
    aliases: ["Calabrian pepper", "peperoncino", "diavolicchio"],
    origin: "europe",
    scovilleMin: 25000,
    scovilleMax: 40000,
    heatTier: "hot",
    color: "Deep red",
    flavorProfile: "Rich, oily, slightly smoky heat with a fruity depth that's unique among European peppers.",
    description:
      "The heat pepper of southern Italy's Calabria region, the Calabrian chili has become one of the most sought-after specialty chilis in American restaurant cooking. Deep red, preserved in oil, with a complex heat that transforms pasta, pizza, and meat dishes.",
    editorialNote:
      "Calabrian chilis in oil were a chef's secret for years before they started showing up on grocery shelves. The preservation method — packed in oil rather than vinegar — gives them a richness that no vinegar-based hot sauce can replicate. A spoonful of Calabrian paste into a pasta sauce, on pizza, or over roasted vegetables adds not just heat but depth and a red color that's genuinely beautiful. Mike's Hot Honey co-signs this pepper implicitly; most spicy honey products draw from this flavor tradition.",
    culinaryUses: [
      "Stirred into pasta sauces — arrabbiata, aglio olio, marinara",
      "Scattered over pizza before baking",
      "Mixed into whipped ricotta or mascarpone spreads",
      "Folded into salami and cured meat preparations",
      "Base for spicy Italian vinaigrettes and dressings"
    ],
    pairsWith: ["Italian", "Pizza", "Pasta", "Cured meats", "Burrata", "Olive oil"],
    funFact: "The term 'diavolicchio' (little devil) is the traditional Calabrian name for this pepper, and the region's chile culture predates industrial hot sauce by centuries.",
    affiliateKeys: ["amazon-calabrian-chili-paste", "amazon-truff-original"],
    recipeTagMatch: ["italian", "pasta", "pizza"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["fruity", "smoky", "citrus"],
    history: {
      region: "Calabria, the toe of southern Italy",
      era: "Established in Calabrian cooking by the late 1500s after the Columbian Exchange",
      story:
        "Chiles arrived in Calabria with returning Spanish traders in the 16th century and found ideal soil in the region's volcanic hills. Over centuries Calabrian cooks domesticated specific cultivars (diavolicchi, especially) suited to the local climate and the practice of preserving them in oil — a method developed because vinegar was scarce and oil was the regional currency. The result became one of Italy's most distinctive chile traditions, embedded in 'nduja, soppressata, and the spicy pasta dishes of the south."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9",
      daysToGerminate: "10–20",
      daysToHarvest: 80,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Behaves like a slightly hotter Italian-style sweet pepper — productive, manageable, and not picky. The traditional Calabrian preservation method is to harvest at full red ripeness, pierce each pepper, and pack in olive oil with herbs. Easy to replicate at home with garden-grown peppers."
    },
    buying: {
      freshAvailability: "Rare in fresh form outside specialty Italian grocers and farmers' markets in cities with Italian communities. Most US buyers encounter Calabrian chilis preserved in oil rather than fresh.",
      driedAvailability: "Dried whole and crushed Calabrian chili flakes are available at gourmet grocers and online. Tutto Calabria and similar Italian brands are widely distributed.",
      seedSources: ["Italian seed importers (Grow Italian)", "Baker Creek (sometimes)", "specialty Italian-American garden suppliers"],
      seasonality: "Imported Italian product is available year-round; fresh local supply (if any) peaks August–October.",
      notes:
        "The premium product is jarred Calabrian chili paste or whole peppers in oil — Tutto Calabria and Bomba Calabrese are the benchmark brands. A small jar lasts months in the fridge and transforms pasta, pizza, and sandwiches."
    },
    substitutes: [
      {
        slug: "cayenne",
        ratio: "Use ½–¾ as much dried cayenne",
        note: "Cayenne is hotter and lacks the fruit notes; combine with a touch of smoked paprika and olive oil to approximate the Calabrian profile."
      },
      {
        slug: "chipotle",
        ratio: "1:1 chipotle for smoky character only",
        note: "When you want smoke but can't find Calabrian, chipotle delivers the smoky depth at lower heat. Loses the fruit notes entirely."
      }
    ],
    faqs: [
      {
        question: "What does Calabrian chili taste like?",
        answer:
          "Bright fruit on the front of the palate, a building moderate heat, and (when preserved in oil) a deep, slightly smoky finish from the oil itself. Less hot than cayenne, more fruit-forward than most American hot peppers. The combination of richness and brightness is what makes it culinarily distinctive."
      },
      {
        question: "Why are Calabrian chilis usually sold in oil?",
        answer:
          "Tradition and chemistry. Olive oil was the affordable preservation medium in southern Italy when vinegar was scarce; over centuries the oil-packed version became the regional standard. The oil also infuses with the peppers' flavor, becoming a usable ingredient in its own right — drizzle the spicy oil on bread, pasta, or pizza."
      },
      {
        question: "How spicy is Calabrian chili compared to jalapeño?",
        answer:
          "About 5–7 times hotter than a jalapeño. Calabrian chilis run 25,000–40,000 SHU; jalapeños 2,500–8,000. Still well within the 'usable' range — you can eat them straight (Italian sandwiches do exactly this) without bracing yourself."
      },
      {
        question: "Can I substitute red pepper flakes for Calabrian chili?",
        answer:
          "Partly. Standard red pepper flakes (usually cayenne-based) deliver heat but not the fruity, slightly smoky character that defines Calabrian chili. For a closer match, look for 'Calabrian chili flakes' specifically — same pepper, dried and crushed. The jarred paste is a much better swap for fresh chili applications."
      }
    ]
  },
  {
    slug: "chipotle",
    name: "Chipotle",
    aliases: ["chipotle pepper", "chipotle en adobo", "smoked jalapeño"],
    origin: "mexico",
    scovilleMin: 2500,
    scovilleMax: 8000,
    heatTier: "medium",
    color: "Dark brown (smoked)",
    flavorProfile: "Deep, woody smoke with a moderate heat and a dried fruit complexity.",
    description:
      "Technically a processing method rather than a separate variety, the chipotle is a jalapeño that's been allowed to ripen red, then smoke-dried. The result tastes so different from a fresh jalapeño that most people don't realize they share a source.",
    editorialNote:
      "The chipotle is one of the great flavor transformations in cooking — the same pepper, completely different ingredient. Canned chipotle en adobo (rehydrated chipotles in a vinegar-tomato sauce) is one of the highest-leverage pantry items in Mexican-American cooking: a single chipotle adds smoke, heat, sweetness, and depth to soups, marinades, and sauces in a way that would take multiple ingredients to replicate otherwise. The Chipotle restaurant chain named itself after this single ingredient, which tells you something.",
    culinaryUses: [
      "Canned en adobo as a cooking ingredient in sauces and soups",
      "Blended into chipotle mayo and aioli",
      "Stirred into beans, chili, and stews",
      "Marinade base for grilled and smoked meats",
      "Dried and powdered for spice rubs"
    ],
    pairsWith: ["Mexican", "Tex-Mex", "BBQ", "Beans", "Sweet potato", "Chocolate"],
    funFact: "Mexico City was using chipotles long before European contact — the Aztecs smoked jalapeños specifically because the thin-walled pepper would rot before it dried, and smoking was the only preservation method that worked.",
    affiliateKeys: ["amazon-chipotle-in-adobo", "amazon-tabasco-chipotle", "amazon-cholula-chili-garlic"],
    recipeTagMatch: ["mexican", "tex-mex", "bbq"],
    featured: true,
    source: "editorial",
    species: "annuum",
    pepperType: "smoking",
    flavorNotes: ["smoky", "earthy", "fruity"],
    history: {
      region: "Central Mexico — Aztec heartland",
      era: "Pre-Columbian; the smoking technique predates written record",
      story:
        "Chipotle is the smoked-dried form of a fully ripened jalapeño, and the technique itself is ancient. The Aztecs developed it precisely because the thick-walled red jalapeño would rot before sun-drying could finish — smoking was the only preservation method that worked. The word 'chipotle' comes from the Nahuatl 'chīlpōctli,' meaning 'smoked chile.' Today the highest-quality chipotles still come from Mexico, primarily Chihuahua, with smaller production in the southern US."
    },
    growing: {
      usdaZones: "Same as jalapeño — perennial in 9–11, annual in 4–8",
      daysToGerminate: "7–21",
      daysToHarvest: 95,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Chipotle isn't a separate cultivar — it's a process. To make your own, grow jalapeños and let them fully ripen on the plant to deep red. Slow-smoke over wood (mesquite or pecan) at 180°F for 24–48 hours until the peppers are leathery and dark. This is a project — most home cooks buy canned chipotles in adobo and skip the smoking."
    },
    buying: {
      freshAvailability: "Chipotle is never sold 'fresh' — it's already a preserved form. The fresh equivalent (red ripe jalapeño) is hard to find at most grocers.",
      driedAvailability: "Dried whole chipotles, chipotle powder, and canned chipotles in adobo are widely available at Latin grocers, online, and increasingly at mainstream supermarkets.",
      seedSources: ["Buy jalapeño seeds: Burpee, Bonnie Plants, Johnny's, Pepper Joe's"],
      seasonality: "Year-round availability — the preservation method extends the shelf life indefinitely. Mexican producers do their seasonal smoking after the summer/fall jalapeño harvest.",
      notes:
        "Two main types exist: chipotle morita (smaller, deeper red, slightly sweeter) and chipotle meco (larger, gray-brown, smokier and more intense). Morita is what you'll get in most canned adobo. Meco is the preferred type for traditional mole and rich braises."
    },
    substitutes: [
      {
        slug: "jalapeno",
        ratio: "Use 2 fresh jalapeños plus ½ tsp smoked paprika per chipotle",
        note: "You won't get the same depth, but jalapeño + smoked paprika approximates chipotle's flavor in a pinch. Better than nothing."
      }
    ],
    faqs: [
      {
        question: "What's the difference between chipotle and jalapeño?",
        answer:
          "They're the same pepper — chipotle is a fully ripened, slow-smoked, dried jalapeño. The smoking transforms the bright vegetal jalapeño flavor into something deep, earthy, fruity, and slightly sweet. Heat level stays similar (chipotle is often slightly mellower due to processing), but the flavor identity is entirely different."
      },
      {
        question: "What are chipotles in adobo?",
        answer:
          "Smoked-dried chipotles rehydrated in adobo sauce — a vinegary tomato-and-spice base typically including garlic, oregano, and sometimes paprika. A 7-oz can is one of the highest-leverage pantry items in Mexican-American cooking: one chipotle plus a spoonful of sauce transforms soups, marinades, and braises. Once opened, freeze leftovers in 1-tablespoon portions."
      },
      {
        question: "How spicy is chipotle?",
        answer:
          "Roughly the same as a jalapeño — 2,500 to 8,000 Scoville Heat Units. The smoking and drying don't significantly change capsaicin levels, though the concentrated flavor can feel hotter because it's so intense. A whole chipotle in a stew adds noticeable but manageable heat."
      },
      {
        question: "What's the difference between chipotle morita and chipotle meco?",
        answer:
          "Two regional smoking traditions. Morita (smaller, deep red, slightly sweet) is smoked for shorter periods over fruit wood and is what's usually in canned adobo. Meco (larger, grayish-brown, more intense smoke flavor) is smoked longer over hardwood and is harder to find outside Mexican specialty markets. Meco is preferred for traditional mole."
      }
    ]
  },
  {
    slug: "hatch-green-chile",
    name: "Hatch Green Chile",
    aliases: ["New Mexico chile", "Hatch chile", "New Mexico green chile"],
    origin: "north-america",
    scovilleMin: 500,
    scovilleMax: 2500,
    heatTier: "mild",
    color: "Green (unripe) or red (ripe)",
    flavorProfile: "Earthy, roasted sweetness with a gentle, lingering warmth and a hint of smokiness.",
    description:
      "The soul of New Mexican cooking, the Hatch green chile is grown in the Hatch Valley of New Mexico and is legally protected as a geographic indicator. The roasting ritual — massive drums over open flame at harvest time — is a cultural event as much as a cooking technique.",
    editorialNote:
      "Hatch chile is not just a pepper variety, it's a geography and a tradition. The alluvial soil and climate of the Hatch Valley produces a pepper with a specific sweetness and earthiness that can't be replicated elsewhere — growers in other states have tried. The annual harvest ritual, when rotating metal drums roast peppers by the bushel at every grocery store parking lot in New Mexico, is one of the defining sensory experiences of the American Southwest. The Hatch Chile Festival exists because this pepper matters to people in a way few ingredients do.",
    culinaryUses: [
      "Green chile cheeseburgers — the New Mexico state dish",
      "Stacked enchiladas with green or red chile sauce",
      "Chile rellenos stuffed with cheese",
      "Green chile stew with pork and potatoes",
      "Roasted and frozen for year-round use"
    ],
    pairsWith: ["New Mexican", "Southwest", "Pork", "Beef", "Cheese", "Corn tortillas"],
    funFact: "New Mexico is the only US state with an official state question: 'Red or green?' — referring to which chile sauce you want on your food.",
    affiliateKeys: ["amazon-cholula-green-tomatillo", "amazon-tajin-clasico", "amazon-chipotle-in-adobo"],
    recipeTagMatch: ["new mexican", "southwest", "mexican"],
    featured: true,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["vegetal", "smoky", "earthy"],
    history: {
      region: "Hatch Valley, New Mexico — Rio Grande corridor",
      era: "Cultivated since the late 1800s; protected geographic designation since 2014",
      story:
        "The Hatch chile isn't a single variety — it's a geographic designation for chiles (typically New Mexico 6-4, Big Jim, or Sandia cultivars) grown in the Hatch Valley along the Rio Grande in southern New Mexico. The combination of high elevation, mineral-rich soil, dry climate, and irrigated river water produces a chile with flavor characteristics that don't replicate elsewhere — growers in Arizona and Texas have tried and failed. The annual fall harvest is one of the defining cultural events of the American Southwest."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–20",
      daysToHarvest: 80,
      plantHeight: "24–30 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "You can grow the cultivars (Big Jim, NuMex 6-4, Sandia) anywhere in zones 4–11. You won't get true 'Hatch' flavor outside the Hatch Valley — terroir matters here as much as for wine grapes. Best to grow for general green chile use; for authentic Hatch flavor, buy roasted and frozen from New Mexico producers in the fall."
    },
    buying: {
      freshAvailability: "Limited to harvest season (August–September). Available fresh at Southwest grocers and shipping nationally during the season. The Hatch Chile Festival in Hatch, NM (Labor Day weekend) marks peak season.",
      driedAvailability: "Dried red chile (the ripe version, called chile colorado) is sold whole and powdered year-round. Authentic source: Buenos Aliados, Bueno Foods, Los Chileros.",
      seedSources: ["Plants of the Southwest", "Native Seeds/SEARCH", "Sandia Seed Company"],
      seasonality: "Fresh harvest is sharply seasonal — August through September. Roasted-frozen Hatch chiles are sold year-round to fill the off-season.",
      notes:
        "Buying frozen roasted Hatch chiles in bulk during peak season (most NM grocers stock 5-lb bags) is the standard year-round strategy. Mild, medium, and hot heat levels are graded at harvest based on cultivar and timing."
    },
    substitutes: [
      {
        slug: "jalapeno",
        ratio: "Use 1 mild green jalapeño per Hatch chile",
        note: "Closest mainstream substitute by heat level. Roast the jalapeño to mimic the smoke and char of fire-roasted Hatch."
      }
    ],
    faqs: [
      {
        question: "What's the difference between Hatch chile and Anaheim?",
        answer:
          "Anaheim and Hatch are closely related — Anaheim was bred from a Hatch Valley cultivar transplanted to California in the early 1900s. Today they're considered distinct: Anaheim is milder, sweeter, more uniform; Hatch chiles vary by cultivar and have more flavor complexity and a smokier character. Hatch is also typically hotter, especially the Big Jim and Sandia varieties."
      },
      {
        question: "When is Hatch chile season?",
        answer:
          "August through mid-September is peak. The Hatch Chile Festival is held Labor Day weekend in Hatch, NM. After the harvest, peppers are roasted in massive rotating drum roasters and either sold immediately or vacuum-packed and frozen. Roasted-frozen Hatch chiles sell year-round but the fresh window is narrow."
      },
      {
        question: "How spicy are Hatch green chiles?",
        answer:
          "Mild Hatch chiles are 500–2,500 SHU — well below jalapeño level. Medium runs 1,500–4,500 SHU. Hot Hatch (Sandia cultivar) can reach 6,000–8,000 SHU, similar to a hot jalapeño. The variety is graded at harvest. Most retail offerings let you choose your heat level."
      },
      {
        question: "Why do New Mexicans ask 'red or green?'",
        answer:
          "Red or green refers to the chile sauce you want on your food — green chile sauce (from unripe Hatch chiles, roasted) or red chile sauce (from ripe red Hatch chiles, dried). They taste fundamentally different. The question is so culturally embedded that it's the official state question of New Mexico. The third answer — 'Christmas' (both) — is widely accepted."
      }
    ]
  },
  {
    slug: "trinidad-moruga-scorpion",
    name: "Trinidad Moruga Scorpion",
    aliases: ["moruga scorpion", "Moruga blend"],
    origin: "caribbean",
    scovilleMin: 1200000,
    scovilleMax: 2000000,
    heatTier: "superhot",
    color: "Red",
    flavorProfile: "Fruity sweetness that vanishes instantly as one of the most sustained, intense heats in existence takes over.",
    description:
      "The Trinidad Moruga Scorpion held the Guinness World Record for hottest pepper in 2012. Native to the Moruga district of Trinidad, it carries a distinctive fruity sweetness in its first moment that makes the subsequent extreme heat even more disorienting.",
    editorialNote:
      "The moruga scorpion's party trick is the fruit note — genuine, pleasant sweetness that lasts about two seconds before one of the most intense and long-lasting heats in the pepper world arrives. Researchers at New Mexico State University documented capsaicin levels that continued to rise while chewing rather than peak immediately, meaning the heat keeps building. This is a pepper to be handled with respect, used in sauce-making, and not eaten fresh without deliberate preparation.",
    culinaryUses: [
      "Superhot hot sauce production in controlled quantities",
      "Dried and powdered for extreme spice blends",
      "Seed cultivation for competitive pepper growing",
      "Small quantities in Caribbean pepper mash traditions"
    ],
    pairsWith: ["Only paired carefully — use as a heat additive, not a primary flavor"],
    funFact: "The Trinidad Moruga Scorpion is so hot that researchers handling it during testing reported burning hands through latex gloves and watery eyes from the airborne capsaicin.",
    affiliateKeys: ["pepper-joe-superhot-seed-pack", "amazon-mad-dog-357", "amazon-bravado-black-garlic-reaper"],
    recipeTagMatch: ["caribbean"],
    featured: false,
    source: "editorial",
    species: "chinense",
    pepperType: "superhot",
    flavorNotes: ["fruity", "tropical", "floral"],
    history: {
      region: "Moruga, southern Trinidad",
      era: "Cultivated traditionally in Trinidad; entered the global record books in 2012",
      story:
        "The Trinidad Moruga Scorpion was the world's hottest pepper for a brief window in 2012, between the ghost pepper losing the title and the Carolina Reaper claiming it. New Mexico State University's Chile Pepper Institute did the testing — they documented capsaicin levels that continued rising during chewing rather than peaking at first bite. Locals in Moruga have grown the pepper for generations, using it in traditional pepper sauces; the Guinness certification was its first international moment."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with greenhouse support",
      daysToGerminate: "20–35",
      daysToHarvest: 130,
      plantHeight: "24–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Behaves like other superhot chinense peppers — slow to germinate, slow to fruit, needs sustained heat. Trinidad's climate is the ideal: hot, humid, with a long growing season. In US growing, start indoors 12+ weeks before last frost and consider supplemental heat. Yields are modest but each pod has enormous heat impact."
    },
    buying: {
      freshAvailability: "Extremely rare. A handful of US superhot growers ship fresh in season; otherwise unavailable outside Trinidad and specialty pepper farms.",
      driedAvailability: "Dried whole pods and powder available online through specialty hot sauce shops and pepper companies.",
      seedSources: ["Puckerbutt Pepper Company", "Refining Fire Chiles", "Pepper Joe's", "Trinidad Scorpion Seed Co."],
      seasonality: "Late season pepper; fresh peak October–November in US growing.",
      notes:
        "Handle exclusively with gloves. The capsaicin levels are high enough that researchers at NMSU reported burning through latex gloves and watery eyes from airborne capsaicin during testing. Trinidad cooks who use it traditionally never handle it bare-handed."
    },
    substitutes: [
      {
        slug: "carolina-reaper",
        ratio: "1:1",
        note: "Same superhot heat class with a similar fruit-then-fire profile. Often interchangeable in superhot hot sauce recipes."
      },
      {
        slug: "ghost-pepper",
        ratio: "Use 1.5–2 ghost peppers per scorpion",
        note: "Ghost pepper is roughly half the heat. Use more volume and you'll lose some intensity but keep the tropical fruit character."
      }
    ],
    faqs: [
      {
        question: "How hot is the Trinidad Moruga Scorpion?",
        answer:
          "1.2 million to 2.0 million Scoville Heat Units, with individual peppers documented over 2 million. It's in the same heat class as the Carolina Reaper and significantly hotter than the ghost pepper. NMSU testing showed capsaicin levels that continue rising during consumption — most peppers peak quickly, this one builds."
      },
      {
        question: "What does it taste like?",
        answer:
          "Genuine tropical fruit sweetness in the first 1–2 seconds — passion fruit, pineapple, slight floral notes. Then the capsaicin arrives and most flavor perception disappears for the next 10–30 minutes. The fruit note is real but brief. Most people only experience the burn."
      },
      {
        question: "Why is it called 'scorpion'?",
        answer:
          "The pod has a distinctive pointed tail that resembles a scorpion's stinger. The shape comes from the wrinkled, blocky pod body tapering to a narrow point. The name was used regionally in Trinidad long before international recognition."
      },
      {
        question: "How does it compare to ghost pepper and Carolina Reaper?",
        answer:
          "Ghost pepper is roughly half its heat; Carolina Reaper is similar or slightly hotter. Within the superhot tier (1M+ SHU) the differences are small. Flavor-wise, scorpion is more tropical and floral; reaper is more fruity-sweet; ghost pepper is more smoky-earthy. Useful to keep them all in your superhot pantry for different sauce profiles."
      }
    ]
  },
  {
    slug: "aji-amarillo",
    name: "Ají Amarillo",
    aliases: ["aji amarillo pepper", "yellow chile", "Peruvian yellow pepper"],
    origin: "south-america",
    scovilleMin: 30000,
    scovilleMax: 50000,
    heatTier: "hot",
    color: "Bright orange-yellow",
    flavorProfile: "Uniquely tropical and fruity — passion fruit and mango notes — with a clean, vibrant heat.",
    description:
      "The backbone of Peruvian cuisine, the ají amarillo is one of the most flavorful peppers in the world. Its combination of tropical fruit notes and bright heat is unlike anything in Mexican or Asian pepper traditions.",
    editorialNote:
      "No single ingredient says Peruvian cooking more than ají amarillo. It appears in ceviche leche de tigre, papa a la huancaína, causa, and lomo saltado — essentially the foundation of the national cuisine. The heat is real but secondary to the flavor: passion fruit, mango, citrus, and a brightness that other peppers simply don't carry. Ají amarillo paste is the format most accessible outside Peru and it's one of the most culinarily rewarding specialty ingredients you can add to your pantry.",
    culinaryUses: [
      "Peruvian ceviche — leche de tigre marinade",
      "Papa a la huancaína sauce (Peruvian potato dish)",
      "Lomo saltado stir-fry base",
      "Blended into causa (cold potato terrine)",
      "Ají amarillo mayonnaise for grilled fish"
    ],
    pairsWith: ["Peruvian", "Seafood", "Potatoes", "Lime", "Cilantro"],
    funFact: "The Peruvian word 'ají' predates Spanish colonization — it comes from the Taíno language of the Caribbean and was one of the first chili-related words European explorers learned.",
    affiliateKeys: ["amazon-tajin-clasico", "amazon-yellowbird-habanero"],
    recipeTagMatch: ["peruvian", "south-american", "seafood"],
    featured: false,
    source: "editorial",
    species: "baccatum",
    pepperType: "fresh-pod",
    flavorNotes: ["fruity", "tropical", "citrus", "sweet"],
    history: {
      region: "Andean valleys of Peru and Bolivia",
      era: "Cultivated by Andean peoples for over 7,000 years",
      story:
        "Ají amarillo is one of the oldest cultivated chiles in the Americas, sacred to the Inca and a foundational ingredient in Andean cooking long before the Columbian Exchange. The word 'ají' itself comes from the Taíno language of the Caribbean and was one of the first chile-related words Europeans learned. In Peru today, ají amarillo is considered one of the three pillars of national cuisine alongside potato and corn — all three Andean in origin and all three completely embedded in Peruvian identity."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with effort",
      daysToGerminate: "14–28",
      daysToHarvest: 110,
      plantHeight: "36–60 in",
      containerFriendly: false,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Capsicum baccatum plants grow tall — often 5+ feet — which makes them awkward for small containers. Stake them. They need a longer growing season than annuum peppers, so start indoors 12 weeks before last frost and consider a covered structure or greenhouse in zones cooler than 8. The wait pays off: a mature ají amarillo plant produces dozens of bright orange-yellow pods."
    },
    buying: {
      freshAvailability: "Extremely rare in fresh form outside Peru. Latin grocers in major US cities occasionally stock them; otherwise unavailable.",
      driedAvailability: "Dried whole ají amarillo (called ají mirasol when dried) is more available than fresh. Latin grocers and online specialty stores carry it.",
      seedSources: ["Baker Creek", "Refining Fire Chiles", "Pepper Joe's", "Native Seeds/SEARCH"],
      seasonality: "Imported product is available year-round; fresh local production peaks late summer to fall in growing regions.",
      notes:
        "The most accessible form is ají amarillo paste in jars (Inca's Food, Goya, Doña Isabel brands). One jar lasts months in the fridge and is the easiest way to add authentic Peruvian flavor to home cooking. Far better than trying to source fresh peppers outside Peru."
    },
    substitutes: [
      {
        slug: "habanero",
        ratio: "Use ½ habanero per ají amarillo",
        note: "Habanero is much hotter — use less to avoid blowing out the dish. Habanero brings similar tropical fruit notes but more aggressive heat."
      },
      {
        slug: "scotch-bonnet",
        ratio: "Use ½ scotch bonnet per ají amarillo",
        note: "Same family of fruit notes at higher heat. Reduce quantity and you'll get a recognizable approximation of the ají amarillo profile."
      }
    ],
    faqs: [
      {
        question: "What does ají amarillo taste like?",
        answer:
          "Genuinely tropical — passion fruit, mango, citrus zest, with a clean medium heat that doesn't dominate. Among chiles, it has one of the most distinctive flavor profiles in the world. Peruvian cuisine is built around ají amarillo's combination of fruit and warmth rather than around heat alone."
      },
      {
        question: "How hot is ají amarillo?",
        answer:
          "Around 30,000 to 50,000 Scoville Heat Units — similar to cayenne or a mild habanero, much hotter than jalapeño but well below ghost pepper territory. The heat is bright and clean rather than building, which makes it easy to balance in cooking."
      },
      {
        question: "What dishes use ají amarillo?",
        answer:
          "Most of Peruvian cuisine: leche de tigre (ceviche marinade), papa a la huancaína (cold potato dish with creamy yellow sauce), causa (cold layered potato terrine), lomo saltado (Peruvian-Chinese stir-fry), ají de gallina (creamy chicken stew). The pepper is foundational, not garnish — Peruvian cooking really doesn't work without it."
      },
      {
        question: "Can I substitute another pepper for ají amarillo?",
        answer:
          "With caveats. A half habanero or scotch bonnet brings similar fruit notes at higher heat. Yellow Fresno or yellow bell + a small amount of cayenne approximates the color and heat without the tropical flavor. The honest answer: ají amarillo paste is widely available online and at Latin grocers, and substituting badly hurts traditional Peruvian dishes more than waiting for the real ingredient."
      }
    ]
  },
  {
    slug: "gochugaru",
    name: "Gochugaru",
    aliases: ["Korean chili flakes", "Korean red pepper", "gochugaru flakes"],
    origin: "east-asia",
    scovilleMin: 4000,
    scovilleMax: 8000,
    heatTier: "medium",
    color: "Deep red",
    flavorProfile: "Smoky, sweet, and mildly fruity with a gentle warmth — the defining flavor of Korean cuisine.",
    description:
      "Gochugaru (고추가루) is the sun-dried, coarsely ground Korean chili pepper that forms the flavor backbone of kimchi, gochujang, tteokbokki, and most of Korean cooking. Less about raw heat, more about deep red color and complex umami-adjacent flavor.",
    editorialNote:
      "Gochugaru is proof that a pepper's culinary importance has nothing to do with its Scoville rating. At roughly jalapeño-level heat, this pepper shapes the flavor identity of an entire national cuisine. The characteristic red color of Korean food — kimchi, sundubu jjigae, dakgalbi — comes from gochugaru's pigment. The fermentation process in gochujang concentrates it into a paste of extraordinary depth. This is the pepper to understand if you want to cook Korean food authentically.",
    culinaryUses: [
      "Essential ingredient in kimchi fermentation",
      "Base for gochujang paste (combined with rice and fermented soy)",
      "Tteokbokki sauce with fish cakes",
      "Korean fried chicken marinade and coating",
      "Dubu jorim (spicy braised tofu)"
    ],
    pairsWith: ["Korean", "Fermented soybean", "Rice", "Sesame", "Green onion"],
    funFact: "Despite its central place in Korean cuisine today, chili peppers are not native to Korea — they were introduced by Portuguese or Japanese traders in the late 16th century, around the time of the Imjin War.",
    affiliateKeys: ["amazon-gochujang-paste", "amazon-fly-by-jing-sichuan-gold", "amazon-chili-crisp"],
    recipeTagMatch: ["korean"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "drying",
    flavorNotes: ["smoky", "fruity", "sweet", "earthy"],
    history: {
      region: "Korean peninsula (chile pepper itself American in origin)",
      era: "Introduced to Korea in the late 1500s, embedded in Korean cuisine within a century",
      story:
        "Chiles aren't native to Korea — they arrived via Portuguese or Japanese traders in the late 16th century, around the time of the Imjin War. But within a few generations, Korean cooks had built an entire culinary identity around them. Sun-drying chiles into gochugaru and fermenting them with rice and soybeans into gochujang created the flavor palette that defines modern Korean cooking. The before-and-after of Korean cuisine — what it tasted like in 1500 versus 1700 — is dramatic. The chile is now considered as 'Korean' as kimchi itself."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–20",
      daysToHarvest: 90,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Traditional Korean cultivars (taeyang chili especially) produce thinner, more elongated pods than American varieties. Behaves like a standard annuum: easy to germinate, productive in containers, no special requirements. The traditional preparation is the harder part — peppers are sun-dried on woven mats for weeks until fully leathery, then ground coarse or fine."
    },
    buying: {
      freshAvailability: "Fresh Korean chiles are uncommon outside Korean grocers and Asian markets in cities with Korean communities.",
      driedAvailability: "Gochugaru flakes are sold year-round at Korean grocers, H Mart, and increasingly at mainstream supermarkets in Asian or international sections. Coarse and fine grinds available.",
      seedSources: ["Kitazawa Seed", "Baker Creek", "Asian Garden 2 Table"],
      seasonality: "Imported product is available year-round; Korean home producers do most drying after fall harvest.",
      notes:
        "Quality varies enormously. Look for bright red, slightly oily flakes — pale or brown-tinged gochugaru has been on the shelf too long and lost both flavor and color. Korean brands (Wang, Assi, Chung Jung One) are reliable. Coarse grind (굵은 고추가루) is for kimchi and stews; fine grind (고운 고추가루) is for sauces and seasoning blends."
    },
    substitutes: [
      {
        slug: "calabrian-chili",
        ratio: "1:1 in flake form",
        note: "Calabrian flakes have similar heat and a comparable fruit-and-smoke character, though Italian rather than Korean. Closer than cayenne for substitution."
      }
    ],
    faqs: [
      {
        question: "What's the difference between gochugaru and gochujang?",
        answer:
          "Gochugaru is dried, crushed Korean chile peppers — a dry flake or powder, like a Korean version of red pepper flakes but sweeter and fruitier. Gochujang is a fermented paste made from gochugaru, glutinous rice, soybeans, and salt — completely different format, much more umami-rich. Both are foundational to Korean cooking and not interchangeable."
      },
      {
        question: "How hot is gochugaru?",
        answer:
          "Around 4,000 to 8,000 Scoville Heat Units — similar to a jalapeño. The heat is genuinely moderate; gochugaru's role in Korean cooking is more about flavor and color than burn. The 'spicy' character of Korean food often comes from quantity (lots of gochugaru) rather than capsaicin intensity per gram."
      },
      {
        question: "Can I substitute red pepper flakes for gochugaru?",
        answer:
          "Not well. Standard American red pepper flakes (typically cayenne-based) are hotter, less sweet, and less fruity. They'll add heat to Korean dishes but won't produce the right flavor or color. For better substitution: aleppo pepper or a 50/50 mix of smoked paprika and regular paprika gets closer. Best answer: gochugaru is widely available at any Korean or Asian grocer and online — worth buying the real thing."
      },
      {
        question: "What's coarse vs fine gochugaru?",
        answer:
          "Coarse gochugaru (굵은 고추가루) is large flakes — used for making kimchi, where the visible red pieces are part of the look, and for hearty stews. Fine gochugaru (고운 고추가루) is closer to a powder — used in sauces, soups, and seasoning blends where you want even distribution. Most Korean home cooks keep both on hand."
      }
    ]
  },
  {
    slug: "pepper-x",
    name: "Pepper X",
    aliases: ["pepper-x", "X pepper"],
    origin: "north-america",
    scovilleMin: 2693000,
    scovilleMax: 3180000,
    heatTier: "superhot",
    color: "Yellow-green to greenish-yellow",
    flavorProfile: "Earthy, slightly tropical first note that vanishes into the most intense sustained heat of any verified pepper.",
    description:
      "Bred by Ed Currie of Puckerbutt Pepper Company in South Carolina, Pepper X became the world's hottest verified pepper in October 2023 at an average 2,693,000 Scoville Heat Units — surpassing his earlier Carolina Reaper by nearly half a million units. The pod is small, deeply wrinkled, and yellow-green when ripe.",
    editorialNote:
      "Pepper X is the current Guinness record holder and likely the practical ceiling of pepper heat for now. Currie spent over a decade selectively breeding it from a Carolina Reaper lineage, optimizing for a thicker placental wall — the white pith where capsaicin actually lives. The result delivers heat that builds and sustains in a way no previous pepper does. Like its predecessors it has a real, fleeting flavor (vaguely earthy and tropical) before the burn takes over. Seeds are not widely available — Currie holds cultivar rights and produces sauce in-house.",
    culinaryUses: [
      "Used in tiny quantities in extreme hot sauces (Puckerbutt's 'The Last Dab Apollo' line)",
      "Powdered for spice blends sold by specialty hot sauce producers",
      "Largely a sauce ingredient — not used in home cooking due to extreme heat",
      "Competition pepper eating challenges"
    ],
    pairsWith: ["Managed with dairy", "Sweet fruit bases to balance", "Strictly micro-doses"],
    funFact: "Pepper X was kept secret for ten years while Currie used it in Hot Ones' 'Last Dab' hot sauces — only revealed publicly when Guinness officially certified it as the new record holder in 2023.",
    affiliateKeys: ["pepper-joe-superhot-seed-pack", "amazon-mad-dog-357"],
    recipeTagMatch: ["american"],
    featured: false,
    source: "editorial",
    species: "chinense",
    pepperType: "superhot",
    flavorNotes: ["earthy", "tropical", "floral"],
    history: {
      region: "Fort Mill, South Carolina, United States",
      era: "Bred 2013–2023; certified by Guinness October 2023",
      story:
        "Ed Currie, the breeder behind the Carolina Reaper, spent more than a decade developing Pepper X as the spiritual successor — a pepper engineered for measurably more capsaicin. The strategy targeted the placental wall (the white pith holding the seeds) rather than the flesh, since that's where capsaicin actually concentrates. The pepper had been used commercially in Hot Ones' 'Last Dab' sauces since 2017 before being publicly revealed. Currie remains the sole legal seed source."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with greenhouse support",
      daysToGerminate: "25–40",
      daysToHarvest: 140,
      plantHeight: "30–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Officially unavailable as seed outside Puckerbutt Pepper Company; secondary-market 'Pepper X' seeds are usually mislabeled Reaper or 7-pot crosses. Even with authentic seed, germination is slow and inconsistent. For practical home growing, choose Reaper or 7 Pot Primo instead — Pepper X is currently a closed cultivar."
    },
    buying: {
      freshAvailability: "Not sold fresh to the public. Currie keeps all production in-house for Puckerbutt sauces.",
      driedAvailability: "Not commercially available outside Puckerbutt products. The pepper exists in hot sauces, not as a standalone ingredient.",
      seedSources: ["Puckerbutt Pepper Company (official, limited)"],
      seasonality: "n/a — closed cultivar",
      notes:
        "If you want to cook with Pepper X, the only path is buying sauces that feature it — primarily Puckerbutt's 'Reaper Squeezin's,' 'Pepper X Sauce,' and Hot Ones' 'Last Dab' editions. The pepper itself is not a retail product."
    },
    substitutes: [
      {
        slug: "carolina-reaper",
        ratio: "Use 1.5–2 Carolina Reapers",
        note: "The closest commercially-available substitute. Same lineage, roughly two-thirds the heat. Carolina Reaper is what most home cooks should be using when a recipe calls for 'maximum heat.'"
      },
      {
        slug: "trinidad-moruga-scorpion",
        ratio: "Use 1.5–2 scorpions",
        note: "Similar superhot tier, different fruit profile. More floral and tropical than Pepper X's earthy character."
      }
    ],
    faqs: [
      {
        question: "How hot is Pepper X really?",
        answer:
          "2,693,000 Scoville Heat Units on average — verified by Guinness in October 2023. Peaks have been measured over 3,180,000 SHU. That's about 400–600 times hotter than a jalapeño and 1.5–2× hotter than the Carolina Reaper, the previous record holder."
      },
      {
        question: "Why is Pepper X hotter than the Carolina Reaper?",
        answer:
          "Ed Currie deliberately bred for thicker placental walls — the white pith inside the pepper where capsaicin actually concentrates. Most peppers store capsaicin in the pith rather than the flesh; Pepper X's pith is unusually dense, which packs more capsaicin into each pod."
      },
      {
        question: "Can I buy Pepper X seeds?",
        answer:
          "Not really. Ed Currie / Puckerbutt Pepper Company hold the cultivar and have not released seeds for general sale. Most listings for 'Pepper X seeds' online are mislabeled Carolina Reaper or 7-pot crosses. If you want to cook with Pepper X, buy Puckerbutt's sauces — the pepper isn't sold as a stand-alone ingredient."
      },
      {
        question: "What's the difference between Pepper X and Apollo?",
        answer:
          "Apollo is another Ed Currie cultivar — sometimes claimed to be a parent or sibling of Pepper X. Both are used in Hot Ones' 'Last Dab Apollo' sauce. Apollo's official Scoville rating has not been Guinness-verified, but it's reported to rival Pepper X. For practical purposes the two are interchangeable; only Pepper X holds the official record."
      }
    ]
  },
  {
    slug: "7-pot-primo",
    name: "7 Pot Primo",
    aliases: ["7-pot primo", "7 pod primo", "primo pepper"],
    origin: "north-america",
    scovilleMin: 1400000,
    scovilleMax: 1853000,
    heatTier: "superhot",
    color: "Red",
    flavorProfile: "Sweet, slightly fruity entry that gives way to extreme sustained heat with a distinctive smoky finish.",
    description:
      "Bred by Troy 'Primo' Primeaux of Louisiana, the 7 Pot Primo is a cross between a Naga Morich and a Trinidad 7 Pot Yellow that produces an unmistakable elongated 'stinger tail' pod. It sits in the same heat tier as the Carolina Reaper but predates it as a serious superhot in the craft hot sauce world.",
    editorialNote:
      "The 7 Pot Primo arguably did more than any other pepper to establish that superhots could have flavor character, not just heat. Primeaux selected for both extreme capsaicin and the kind of fruit-and-smoke complexity that makes a pepper worth putting in a sauce instead of a challenge video. The distinctive stinger-tail pod is now widely imitated — many 'superhot' peppers sold commercially are unstable crosses that owe their look to Primo's work. For pepper hobbyists and serious sauce makers, this is one of the most respected cultivars in the world.",
    culinaryUses: [
      "Premium superhot hot sauces from craft producers",
      "Dried and powdered for extreme spice blends",
      "Fermented mash for long-aged superhot sauces",
      "Small-quantity use in superhot Caribbean-style pepper sauces"
    ],
    pairsWith: ["Sweet bases to balance", "Tropical fruit", "Fermented condiments"],
    funFact: "Troy Primeaux is a jazz musician by trade — his pepper-breeding nickname 'Primo' comes from his stage name, not his last name. The 7 Pot Primo is named after him.",
    affiliateKeys: ["pepper-joe-superhot-seed-pack", "amazon-mad-dog-357"],
    recipeTagMatch: ["caribbean", "american"],
    featured: false,
    source: "editorial",
    species: "chinense",
    pepperType: "superhot",
    flavorNotes: ["fruity", "sweet", "smoky", "floral"],
    history: {
      region: "Lafayette, Louisiana, United States",
      era: "Released in the early 2010s",
      story:
        "Troy Primeaux crossed a Naga Morich with a Trinidad 7 Pot Yellow in the late 2000s, stabilized the line over several growing seasons, and released seeds to the craft pepper community by 2010. The pepper was briefly considered the world's hottest before Carolina Reaper certification in 2013. It remains one of the most respected superhots among growers and craft sauce makers, partly because Primeaux openly shared seeds and breeding notes instead of holding the cultivar proprietary."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with greenhouse support",
      daysToGerminate: "20–35",
      daysToHarvest: 140,
      plantHeight: "36–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Behaves like other chinense superhots — slow to germinate, slow to fruit, needs sustained heat and a long growing season. Distinctive stinger-tail pods are diagnostic; if your Primos look smooth and round, your seed is probably crossed. Plants are productive once established (20–30 pods is typical) and tolerate Louisiana-style humidity well."
    },
    buying: {
      freshAvailability: "Rare. Specialty pepper farms and online superhot vendors occasionally sell fresh in late season.",
      driedAvailability: "Dried whole pods and powder available online through specialty hot sauce shops and pepper companies.",
      seedSources: ["Puckerbutt Pepper Company", "Refining Fire Chiles", "Pepper Joe's", "Trinidad Scorpion Seed Co."],
      seasonality: "Late season; fresh peak October–November in US growing.",
      notes:
        "Authentic Primo seeds are widely available because Primeaux shared the cultivar openly — unlike Pepper X or some other modern superhots that are kept proprietary. This makes Primo one of the most accessible superhots for home growers."
    },
    substitutes: [
      {
        slug: "carolina-reaper",
        ratio: "1:1",
        note: "Similar heat range and overall character. Carolina Reaper is fruitier; Primo is smokier. Largely interchangeable in superhot sauce recipes."
      },
      {
        slug: "trinidad-moruga-scorpion",
        ratio: "1:1",
        note: "Same superhot tier with a similar fruit-driven flavor. Scorpion is rounder and more floral; Primo has more smoke depth."
      }
    ],
    faqs: [
      {
        question: "What does '7 Pot' mean in the name?",
        answer:
          "Trinidadian folk shorthand — a pepper hot enough to season seven pots of stew with a single pod. The name predates Primo by decades; it's a category that includes 7 Pot Brain Strain, 7 Pot Douglah, 7 Pot Yellow, and other Trinidadian superhots. Primo crossed an existing 7 Pot Yellow with a Naga Morich to produce his cultivar."
      },
      {
        question: "Is 7 Pot Primo hotter than Carolina Reaper?",
        answer:
          "Roughly the same heat tier. 7 Pot Primo runs 1.4–1.85 million Scoville Heat Units; Carolina Reaper averages 1.64 million. Individual pods of each can hit the high end of the other's range. Both predate the current record holder, Pepper X."
      },
      {
        question: "Why does the 7 Pot Primo have a tail?",
        answer:
          "The elongated 'stinger tail' is the cultivar's signature, inherited from selective breeding. Most superhot pods are blocky or wrinkled-round; Primo's pod tapers into a thin, pointed stinger up to an inch long. The tail has no functional purpose — it's a visual signature."
      },
      {
        question: "What does 7 Pot Primo taste like?",
        answer:
          "Sweet and slightly fruity in the first second — riper than reaper, less floral than scorpion — followed by a building smoky character that comes from the Naga Morich parent. Then the capsaicin takes over. The smoky-fruit complexity is why craft hot sauce makers prefer Primo over straight-heat superhots."
      }
    ]
  },
  {
    slug: "7-pot-douglah",
    name: "7 Pot Douglah",
    aliases: ["chocolate 7 pot", "7 pod douglah", "douglah"],
    origin: "caribbean",
    scovilleMin: 853000,
    scovilleMax: 1853000,
    heatTier: "superhot",
    color: "Chocolate brown",
    flavorProfile: "Earthy, smoky, slightly sweet — among the most complex flavors in the superhot tier.",
    description:
      "The 7 Pot Douglah (also called Chocolate 7 Pot) is a Trinidadian superhot prized as much for its flavor as its heat. The deep brown ripe color is unusual among chinense peppers and signals the rich, earthy notes that have made it a favorite of craft hot sauce producers.",
    editorialNote:
      "If you ask serious pepper enthusiasts which superhot they would actually cook with, the Douglah is the answer that keeps coming up. The flavor depth — earthy, smoky, slightly sweet, distinctly cocoa-adjacent — gives it a usefulness that pure-heat superhots lack. Trinidadian cooks have used Douglahs in pepper sauces for generations; the international craft sauce scene caught up in the 2010s. Less famous than Reaper or Scorpion outside pepper circles, but more respected within them.",
    culinaryUses: [
      "Trinidadian pepper sauces with mustard, lime, and culantro",
      "Premium craft superhot hot sauces emphasizing flavor",
      "Fermented mash for long-aged complex superhot sauces",
      "Smoked and dried for extreme spice blends"
    ],
    pairsWith: ["Caribbean", "Trinidadian", "Slow-cooked meats", "Cocoa and coffee notes", "Mustard-based sauces"],
    funFact: "The name 'Douglah' comes from a Trinidadian term for mixed African and Indian heritage — the pepper's distinctive dark brown color earned it the name from local growers.",
    affiliateKeys: ["pepper-joe-superhot-seed-pack", "amazon-mad-dog-357"],
    recipeTagMatch: ["caribbean", "trinidadian"],
    featured: false,
    source: "editorial",
    species: "chinense",
    pepperType: "superhot",
    flavorNotes: ["earthy", "smoky", "sweet", "nutty"],
    history: {
      region: "Trinidad and Tobago",
      era: "Cultivated traditionally in Trinidad; gained international attention in the 2010s",
      story:
        "The Douglah is part of a family of Trinidadian 7-pot peppers that have been grown on the island for generations. Local pepper sauces — Matouk's, Walkerswood-adjacent Trinidadian brands — used them long before the global superhot craze. International growers and seed sellers began propagating the cultivar in the early 2010s, when the chocolate color and reputation for flavor depth caught the craft sauce scene's attention."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with greenhouse support",
      daysToGerminate: "20–35",
      daysToHarvest: 130,
      plantHeight: "30–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Like other chinense superhots, slow to germinate and slow to fruit — needs a long, warm growing season. The chocolate ripe color is diagnostic and develops late; peppers go through red and brown phases before reaching the final dark chocolate stage. Be patient and don't pick early."
    },
    buying: {
      freshAvailability: "Rare. Specialty pepper farms and Trinidadian-import grocers occasionally have them in late season.",
      driedAvailability: "Dried whole pods and chocolate Douglah powder available online from specialty hot sauce and pepper retailers.",
      seedSources: ["Refining Fire Chiles", "Pepper Joe's", "Trinidad Scorpion Seed Co.", "Baker Creek"],
      seasonality: "Late season; fresh peak October–November in US growing.",
      notes:
        "For sauce-making, the dried form retains more of the cocoa-earthy character than fresh, and is more available. Trinidadian-import pepper sauces (Matouk's Calypso, some Susie's varieties) feature Douglah and are easier to source than the pepper itself."
    },
    substitutes: [
      {
        slug: "trinidad-moruga-scorpion",
        ratio: "1:1",
        note: "Similar Caribbean superhot lineage. Scorpion is brighter and fruitier; Douglah is darker and earthier. Choose Scorpion when you want tropical, Douglah when you want depth."
      },
      {
        slug: "ghost-pepper",
        ratio: "Use 1.5 ghost peppers per Douglah",
        note: "Both have earthy-smoky notes; ghost is about half the heat. Use more volume and you'll approximate the flavor at a slightly more manageable burn."
      }
    ],
    faqs: [
      {
        question: "Why is the 7 Pot Douglah brown instead of red?",
        answer:
          "Genetic — it ripens through red and dark-red phases to a final chocolate brown color. The pigment comes from a different anthocyanin pathway than most chinense peppers, which is why other brown peppers (chocolate habanero, chocolate Bhut Jolokia) all trace back to similar genetic lines. The color signals the earthier, less fruity flavor."
      },
      {
        question: "How does 7 Pot Douglah taste compared to other superhots?",
        answer:
          "Deeper and earthier than reaper or scorpion. Notes that come up consistently in tasting descriptions: cocoa, smoke, dried fruit, slight nuttiness. Less of the bright tropical-fruit character that defines habanero-lineage superhots. This complexity is why craft sauce makers favor it."
      },
      {
        question: "Is Douglah hotter than Carolina Reaper?",
        answer:
          "Slightly lower on average — Douglah averages around 1 million Scoville Heat Units with peaks at 1.85 million; Reaper averages 1.64 million. Practical difference is small, especially in sauce-making where both will dominate. The flavor differences matter more than the heat differences at this level."
      },
      {
        question: "Where can I find 7 Pot Douglah pepper sauce?",
        answer:
          "Trinidadian-import brands like Matouk's Calypso Sauce feature Douglah and are available at Caribbean grocers and online. Craft producers (Heatonist's rotating shelf, Bravado Spice, Mad Dog) also produce Douglah-based sauces. Easier to find the sauce than the fresh pepper outside Trinidad."
      }
    ]
  },
  {
    slug: "naga-viper",
    name: "Naga Viper",
    aliases: ["naga viper pepper", "Cumbrian viper"],
    origin: "europe",
    scovilleMin: 1349000,
    scovilleMax: 1382118,
    heatTier: "superhot",
    color: "Red",
    flavorProfile: "Fruity, slightly sweet entry that yields rapidly to intense, near-immediate heat with little build-up.",
    description:
      "Bred in England by Gerald Fowler at the Chili Pepper Company in Cumbria, the Naga Viper held the Guinness record for hottest pepper briefly in 2011 at 1,382,118 Scoville Heat Units. It is a three-way cross between Naga Morich, Bhut Jolokia, and Trinidad Scorpion.",
    editorialNote:
      "The Naga Viper is interesting more for its history than for its current relevance. It was the first UK-bred pepper to hold the world record, and the first 'cross-bred' superhot widely recognized as a deliberate breeding project rather than a wild-collected cultivar. The pepper is an unstable hybrid, meaning seeds from a Viper pod don't reliably produce Viper plants — they often revert to one of the three parent peppers. This instability has limited its commercial appeal, and the Reaper, Scorpion, and Pepper X have eclipsed it. Still, the Viper marked the start of competitive Western pepper breeding.",
    culinaryUses: [
      "Used in specialty UK hot sauces and ready meals (Tesco famously featured a Naga Viper curry)",
      "Dried and powdered for extreme heat seasoning",
      "Competition pepper eating",
      "Small quantities in superhot sauce-making"
    ],
    pairsWith: ["Slow-cooked curries", "Cream-based sauces to balance", "Indian and British-Indian fusion"],
    funFact: "The Naga Viper held the Guinness world record for less than a year before being surpassed by the Trinidad Scorpion Butch T — making it one of the shortest-reigning record-holders in the pepper world.",
    affiliateKeys: ["pepper-joe-superhot-seed-pack"],
    recipeTagMatch: ["indian", "british"],
    featured: false,
    source: "editorial",
    species: "chinense",
    pepperType: "superhot",
    flavorNotes: ["fruity", "sweet", "floral"],
    history: {
      region: "Cumbria, England",
      era: "Bred 2010; certified by Guinness in 2011",
      story:
        "Gerald Fowler at the Chili Pepper Company in Bewcastle, Cumbria, crossed three of the era's hottest peppers (Naga Morich, Bhut Jolokia, Trinidad Scorpion) into the Naga Viper. The pepper achieved international attention in 2011 when Guinness certified it briefly as the world's hottest. The cross is genetically unstable — seeds don't breed true — which has prevented it from achieving the long-term commercial presence of later superhots."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with greenhouse support",
      daysToGerminate: "25–40",
      daysToHarvest: 140,
      plantHeight: "30–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Seeds from Viper pods are unreliable — many plants revert to one of the parent peppers (Naga Morich, Ghost, or Scorpion). For consistent Viper genetics, source seeds from the original Chili Pepper Company in Cumbria. Otherwise, expect 30–50% of seedlings to look like one of the parents instead."
    },
    buying: {
      freshAvailability: "Rare outside the UK. The Chili Pepper Company sells fresh in season; otherwise very limited.",
      driedAvailability: "Dried whole pods and powder available online, primarily from UK and US specialty pepper retailers.",
      seedSources: ["The Chili Pepper Company (UK)", "Refining Fire Chiles", "Pepper Joe's"],
      seasonality: "Fresh peak September–October in UK growing.",
      notes:
        "If you want stable superhot genetics, choose a non-Viper. Reaper, Primo, and Scorpion all breed true; Viper is an interesting historical pepper but unreliable for serious growers."
    },
    substitutes: [
      {
        slug: "ghost-pepper",
        ratio: "Use 1.5 ghost peppers per Viper",
        note: "Ghost is one of Viper's three parents — using more ghost gets you to a similar fruity superhot heat with stable genetics."
      },
      {
        slug: "trinidad-moruga-scorpion",
        ratio: "1:1",
        note: "Another parent. Scorpion captures the tropical-fruit side of Viper at a similar heat level."
      }
    ],
    faqs: [
      {
        question: "What three peppers were crossed to make the Naga Viper?",
        answer:
          "Naga Morich (Bangladeshi superhot), Bhut Jolokia (ghost pepper), and Trinidad Scorpion. Gerald Fowler crossed all three to produce the Viper in 2010. Because each parent is genetically distinct, the resulting hybrid is unstable — Viper seeds don't reliably grow into Vipers."
      },
      {
        question: "Is the Naga Viper still relevant?",
        answer:
          "Mostly historical. It was the world's hottest pepper for less than a year in 2011. Since then, the Trinidad Moruga Scorpion, Carolina Reaper, and Pepper X have all surpassed it. Most pepper growers and craft sauce makers have moved on to the more stable, hotter cultivars."
      },
      {
        question: "Why is the Naga Viper unstable?",
        answer:
          "Because it's a three-way cross between distinct parent cultivars, not a stabilized line. Stabilizing a pepper requires several generations of selective breeding to lock in the genetic traits. Fowler released the Viper before that stabilization was complete, which is why seeds can revert to parent forms."
      },
      {
        question: "Where can I find Naga Viper seeds?",
        answer:
          "The Chili Pepper Company in Cumbria, UK is the original source. Some US specialty retailers (Refining Fire, Pepper Joe's) sell Viper seeds, but quality varies — buying directly from Fowler is the most reliable path. Expect inconsistent results regardless of source."
      }
    ]
  },
  {
    slug: "komodo-dragon",
    name: "Komodo Dragon",
    aliases: ["komodo dragon pepper", "komodo dragon chili"],
    origin: "europe",
    scovilleMin: 1400000,
    scovilleMax: 2200000,
    heatTier: "superhot",
    color: "Red",
    flavorProfile: "Mild, almost sweet first impression that escalates into one of the most delayed and sustained heat profiles in the pepper world.",
    description:
      "Bred in the UK by Salvatore Genovese and released in 2015, the Komodo Dragon is notable for its slow-build heat — a characteristic delay of around 10 seconds between bite and burn that catches many superhot eaters off guard. Tesco famously sold it in supermarket aisles as a curiosity pepper.",
    editorialNote:
      "The Komodo Dragon is the superhot best known for its delayed reaction. Most peppers register heat almost immediately; the Komodo Dragon's capsaicin compounds activate more slowly, producing a roughly 10-second window where the eater might think the pepper isn't actually that hot — followed by an intense and sustained burn that can last 20+ minutes. This delay made it briefly famous as a UK supermarket challenge pepper. For sauce-making it behaves like other superhots once heat arrives, but the delay makes it a poor choice for fresh applications.",
    culinaryUses: [
      "Specialty UK hot sauces",
      "Dried and powdered for extreme spice blends",
      "Pepper eating challenges",
      "Small quantities in superhot fermented mashes"
    ],
    pairsWith: ["Slow-cooked stews", "Cream-based sauces to balance", "Used carefully"],
    funFact: "When the Komodo Dragon was first sold at UK Tesco stores in 2015, the packaging warned customers about the delayed onset of heat — multiple shoppers had needed medical attention from eating one fresh without expecting the delay.",
    affiliateKeys: ["pepper-joe-superhot-seed-pack"],
    recipeTagMatch: ["british"],
    featured: false,
    source: "editorial",
    species: "chinense",
    pepperType: "superhot",
    flavorNotes: ["sweet", "fruity", "floral"],
    history: {
      region: "Bedfordshire, England",
      era: "Bred and released 2015",
      story:
        "Salvatore Genovese, a UK pepper farmer, developed the Komodo Dragon over several years of selective breeding from Trinidad Scorpion stock. The pepper was released commercially in 2015 through a partnership with Tesco, which sold fresh pods in supermarket produce aisles — an unusual retail moment for a 2-million-Scoville pepper. The delayed-burn property became the pepper's signature."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9 with greenhouse support",
      daysToGerminate: "20–35",
      daysToHarvest: 130,
      plantHeight: "30–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Behaves like other chinense superhots in cultivation — slow to germinate, slow to fruit, needs sustained warmth. UK growers report good results in greenhouse conditions; outdoor cultivation in cooler climates is challenging. Genovese's farm uses heated polytunnels."
    },
    buying: {
      freshAvailability: "Mostly UK availability via Tesco and specialty produce. Rare in the US outside specialty pepper farms.",
      driedAvailability: "Dried whole pods and powder available online from UK and US specialty retailers.",
      seedSources: ["Pepper Joe's", "Refining Fire Chiles", "specialty UK pepper seed sellers"],
      seasonality: "UK greenhouse production is year-round; outdoor fresh peak August–October.",
      notes:
        "If you're in the UK and curious about superhots, the Komodo Dragon is uniquely accessible — sold directly at major grocers. Elsewhere, it requires specialty sourcing similar to other superhots."
    },
    substitutes: [
      {
        slug: "carolina-reaper",
        ratio: "1:1",
        note: "Same heat range. Reaper hits faster; Komodo Dragon delays. If you don't need the delayed onset, Reaper is more available and similar in cooking applications."
      },
      {
        slug: "trinidad-moruga-scorpion",
        ratio: "1:1",
        note: "The Scorpion is one of the Komodo Dragon's breeding ancestors. Similar heat tier, more tropical fruit profile, immediate rather than delayed heat."
      }
    ],
    faqs: [
      {
        question: "Why does the Komodo Dragon have delayed heat?",
        answer:
          "The pepper's capsaicin compounds appear to activate more slowly than other superhots — the typical 10-second delay catches eaters off guard. The exact biochemistry isn't fully understood, but it's consistent enough to be a known characteristic of the cultivar. Some growers speculate it's related to the thicker pith wall."
      },
      {
        question: "How hot is the Komodo Dragon pepper?",
        answer:
          "1,400,000 to 2,200,000 Scoville Heat Units, putting it in the same tier as the Carolina Reaper and Trinidad Moruga Scorpion. Once the delay passes, the heat is comparable to any other superhot — intense, sustained, and slow to fade."
      },
      {
        question: "Is the Komodo Dragon safe to eat?",
        answer:
          "In small culinary quantities, yes. Whole-pod challenges have caused medical incidents when the delayed onset misled eaters into thinking they could handle a second bite. Treat it like any other superhot: use small amounts, expect intense heat, and have dairy on hand."
      },
      {
        question: "Where did the Komodo Dragon get its name?",
        answer:
          "From its appearance — Salvatore Genovese named it after the lizard because of its wrinkled, almost reptilian skin texture. The name also reinforced the marketing angle for Tesco when the pepper hit retail shelves in 2015."
      }
    ]
  },
  {
    slug: "fatalii",
    name: "Fatalii",
    aliases: ["fatali", "fatalli", "African fatalii"],
    origin: "africa",
    scovilleMin: 125000,
    scovilleMax: 400000,
    heatTier: "very-hot",
    color: "Bright yellow (most common), red, or chocolate",
    flavorProfile: "Intensely fruity — citrus, apricot, mango, and tropical floral notes — with a clean, sharp heat.",
    description:
      "The Fatalii is a Central African superhot-adjacent pepper with one of the most distinctive fruit profiles in the chinense family. Native to the Central African Republic, Cameroon, and the surrounding region, it shares heat-tier territory with habanero but delivers a brighter, more concentrated citrus character.",
    editorialNote:
      "If you ask craft sauce makers which underappreciated pepper deserves more attention, the Fatalii is the answer that comes up most often. The flavor is striking — like a habanero with the volume turned up on the fruit notes. Less famous than its Caribbean cousins because Central African peppers haven't had a Nando's-style global moment, but the cultivar is increasingly common in serious hot sauce production. Fatalii Yellow is the standard; Fatalii Red and Chocolate Fatalii exist as color variants with subtly different flavor profiles.",
    culinaryUses: [
      "Premium craft hot sauces emphasizing tropical fruit notes",
      "African pepper sauces and condiments",
      "Mango or pineapple-paired sauces",
      "Fresh in tropical fruit salsas and ceviches",
      "Dried and powdered for fruity spice blends"
    ],
    pairsWith: ["African cuisine", "Caribbean", "Mango", "Pineapple", "Passion fruit", "Citrus", "Grilled fish"],
    funFact: "The Fatalii is named for its heat — 'fatal' in the local sense of dangerously hot. Despite being among the hottest peppers in Africa, it's used liberally in pepper soups and stews where its fruit notes shine through the burn.",
    affiliateKeys: ["amazon-yellowbird-habanero", "amazon-peri-peri-sauce"],
    recipeTagMatch: ["african", "tropical", "caribbean"],
    featured: false,
    source: "editorial",
    species: "chinense",
    pepperType: "fresh-pod",
    flavorNotes: ["fruity", "tropical", "citrus", "floral"],
    history: {
      region: "Central African Republic, Cameroon, and the wider Congo basin",
      era: "Cultivated for centuries; gained craft hot sauce attention in the 2000s",
      story:
        "The Fatalii originated in Central African Republic and the Congo basin, where it has been cultivated as a household pepper for generations. Like other African peppers, it spread to West Africa and into Caribbean cooking traditions through colonial trade routes. The craft hot sauce scene rediscovered Fatalii in the 2000s as superhot interest broadened beyond Caribbean and South Asian peppers, and the fruity flavor profile has made it a favorite for sauce makers who want chinense heat with brighter citrus notes than habanero or scotch bonnet provide."
    },
    growing: {
      usdaZones: "Perennial in 10–11, annual in 4–9",
      daysToGerminate: "14–28",
      daysToHarvest: 110,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Among the easier chinense peppers to grow — less temperamental than habanero and significantly easier than superhots like Reaper or Pepper X. Plants produce heavily once established (20–40 pods per plant is typical) and tolerate slightly cooler nights than most chinense varieties. A good gateway pepper for home growers ready to move past annuum cultivars."
    },
    buying: {
      freshAvailability: "Rare in mainstream US grocers; African and specialty pepper markets are the main sources. Online specialty pepper farms ship fresh in late summer.",
      driedAvailability: "Dried whole Fataliis and powder available online from specialty hot sauce and pepper retailers.",
      seedSources: ["Baker Creek", "Pepper Joe's", "Refining Fire Chiles", "African Bird's Eye seed sellers"],
      seasonality: "Field-grown peak August–October in US; year-round in tropical climates.",
      notes:
        "If buying powder, look for the yellow Fatalii variety as the baseline — Fatalii Red and Chocolate Fatalii are color variants with slightly different flavor profiles that are sometimes labeled separately. Most commercial Fatalii sauce uses the yellow form."
    },
    substitutes: [
      {
        slug: "habanero",
        ratio: "1:1",
        note: "Closest commonly-available substitute. Fatalii is slightly hotter on average with more fruit-forward citrus notes; habanero is more aggressive. For most recipes the swap works."
      },
      {
        slug: "scotch-bonnet",
        ratio: "1:1",
        note: "Similar heat tier and similar fruit-driven profile. Scotch bonnet is sweeter and rounder; Fatalii is brighter and more citrusy."
      },
      {
        slug: "aji-amarillo",
        ratio: "Use 2 aji amarillos per Fatalii",
        note: "Aji amarillo has similar tropical fruit notes at about half the heat. Useful when you want Fatalii's flavor at a more accessible burn."
      }
    ],
    faqs: [
      {
        question: "How hot is a Fatalii compared to habanero?",
        answer:
          "Slightly hotter on average. Fatalii runs 125,000–400,000 Scoville Heat Units; habanero runs 100,000–350,000. Individual peppers overlap heavily — you'll find Fataliis at habanero heat and vice versa. The bigger distinction is flavor: Fatalii is more citrus-forward, habanero is more general tropical."
      },
      {
        question: "What does Fatalii taste like?",
        answer:
          "Concentrated citrus and tropical fruit — lemon, apricot, mango, passion fruit, and a slight floral note. The flavor is one of the most distinctive in the chinense family and the reason craft sauce makers seek it out. Hotter than habanero but doesn't taste hotter because the fruit notes balance the heat character."
      },
      {
        question: "Can I grow Fatalii at home?",
        answer:
          "Yes, easily — Fatalii is among the more cooperative chinense peppers for home growing. Behaves similarly to habanero: 14–28 day germination, 100–110 days to harvest, needs warm soil and full sun. A 5-gallon container is enough per plant. Productive once established, often producing through to first frost in temperate climates."
      },
      {
        question: "Where can I buy Fatalii hot sauce?",
        answer:
          "Craft hot sauce producers increasingly feature Fatalii — look at brands like Mad Dog, Heartbeat, Queen Majesty, and Bravado for current offerings. African import grocers also carry Fatalii-based pepper sauces. The sauce is more accessible than fresh peppers outside specialty growing regions."
      }
    ]
  },
  {
    slug: "poblano",
    name: "Poblano",
    aliases: ["poblano pepper", "fresh ancho", "chile poblano"],
    origin: "mexico",
    scovilleMin: 1000,
    scovilleMax: 2000,
    heatTier: "mild",
    color: "Dark green ripening to deep red",
    flavorProfile: "Rich, earthy, slightly fruity heat — closer to a vegetable than a chile when fresh.",
    description:
      "The poblano is the workhorse mild chile of Mexican cooking, named for the state of Puebla where it originated. Large, heart-shaped, and dark green when picked, it carries enough flavor to anchor a dish but enough restraint to feed an entire table.",
    editorialNote:
      "The poblano sits in the sweet spot of mild Mexican peppers — flavorful enough to matter, mild enough that anyone can eat it. It is the pepper of chiles rellenos and chiles en nogada, two of Mexico's most identifiable dishes. When roasted and peeled, the flesh turns silky and the flavor deepens into something that tastes more like a vegetable than a chile. When dried, the same pepper becomes the ancho — one of the foundations of Mexican mole. Two completely different ingredients, one plant.",
    culinaryUses: [
      "Chiles rellenos stuffed with cheese or picadillo",
      "Chiles en nogada — the patriotic Mexican stuffed-pepper dish",
      "Sliced and sautéed for rajas (with cream or in tacos)",
      "Roasted and blended into mild salsas and crema bases",
      "Dried as ancho for moles, adobos, and pantry use"
    ],
    pairsWith: ["Mexican", "Tex-Mex", "Cheese", "Cream", "Pork", "Walnut and pomegranate"],
    funFact: "The poblano's mild heat varies more than most peppers — some pods register barely any burn, others sneak up to jalapeño-adjacent intensity. Mexican cooks taste a small piece before committing.",
    affiliateKeys: ["amazon-chipotle-in-adobo", "amazon-cholula-original", "amazon-tajin-clasico"],
    recipeTagMatch: ["mexican", "tex-mex"],
    featured: true,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["earthy", "vegetal", "fruity"],
    history: {
      region: "Puebla, Mexico",
      era: "Pre-Columbian, cultivated for thousands of years",
      story:
        "The poblano takes its name from Puebla — 'poblano' meaning 'from Puebla.' Cultivation predates Spanish contact by millennia. The pepper became culturally inseparable from Puebla cuisine when chiles en nogada was reportedly created there in 1821 to honor Agustín de Iturbide; the green poblano, white walnut sauce, and red pomegranate seeds form the Mexican flag's colors on a plate. Today the largest commercial production comes from Mexican states near Puebla plus parts of the southern US."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 75,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "One of the easier mild chiles for US home gardens. Productive (15–25 pods per plant), forgiving of soil conditions, and not as heat-dependent as chinense varieties. Harvest green for fresh poblanos; let pods ripen fully red on the plant and dry them for homemade anchos."
    },
    buying: {
      freshAvailability: "Year-round at most US grocery stores; near-universal at Latin grocers. One of the easiest Mexican chiles to find fresh in the US.",
      driedAvailability: "Dried poblano is sold as ancho — very widely available at Latin grocers and online.",
      seedSources: ["Burpee", "Bonnie Plants", "Native Seeds/SEARCH", "Baker Creek", "Johnny's Selected Seeds"],
      seasonality: "Peak field-grown August–October; greenhouse production keeps fresh supply steady year-round.",
      notes:
        "Look for poblanos with dark, glossy skin and firm flesh. Pale or wrinkled pods are past their prime. The bigger and broader the pod, the better for stuffing; smaller pods are better for slicing into rajas."
    },
    substitutes: [
      {
        slug: "anaheim",
        ratio: "1:1",
        note: "Closest substitute — similar mild heat with a similar vegetal character. Anaheim is slightly sweeter and milder."
      },
      {
        slug: "hatch-green-chile",
        ratio: "1:1",
        note: "Similar mild heat with more smoke and earth. Hatch is preferred for roasted applications where smoky character matters."
      }
    ],
    faqs: [
      {
        question: "What's the difference between poblano and ancho?",
        answer:
          "They're the same pepper at different stages. A poblano is the fresh green pod; an ancho is the same pod ripened red and dried. The drying process transforms the flavor completely — fresh poblanos taste vegetal and bright, ancho tastes like raisin, dried fruit, and chocolate. Both come from the same plant."
      },
      {
        question: "How spicy is a poblano?",
        answer:
          "Mild — 1,000 to 2,000 Scoville Heat Units, which is about a quarter the heat of a jalapeño. Individual peppers vary significantly though; an occasional poblano will register noticeably hotter (closer to a mild jalapeño). Taste a small piece before committing if heat tolerance is a concern."
      },
      {
        question: "Should you peel poblanos before cooking?",
        answer:
          "For chiles rellenos and rajas, yes — roast the peppers until the skin blackens, steam them in a covered bowl for 10 minutes, then peel. The skin is tough and slightly bitter. For sliced raw uses (some salsas, stir-fries) you can skip peeling. Charring also deepens the flavor significantly."
      },
      {
        question: "Can I substitute a green bell pepper for a poblano?",
        answer:
          "Not really. Green bell peppers have no heat and a sharper, more grassy flavor — they'll miss the earthy depth and mild burn that defines a poblano. Anaheim or Hatch are the right substitutes when poblano isn't available. Bell pepper works only if you're already removing the heat dimension entirely."
      }
    ]
  },
  {
    slug: "anaheim",
    name: "Anaheim",
    aliases: ["anaheim pepper", "California chile", "chile verde del norte"],
    origin: "north-america",
    scovilleMin: 500,
    scovilleMax: 2500,
    heatTier: "mild",
    color: "Bright green ripening to red",
    flavorProfile: "Sweet, mildly vegetal, with a gentle warmth that lingers rather than punches.",
    description:
      "The Anaheim is the milder cousin to New Mexico's Hatch chile, named for the California city where commercial cultivation took off in the early 1900s. Long, slender, glossy, and forgiving — the Anaheim is the chile that introduces most Americans to chile cooking.",
    editorialNote:
      "The Anaheim's role is approachability. It carries enough chile flavor to feel authentic in chile verde, chile relleno, and green sauce applications, but the heat stays well below the threshold where it becomes a barrier. The Hatch and Anaheim are genetic siblings — Anaheim was bred from a New Mexico chile transplanted to Southern California by Emilio Ortega in 1900 — but a century of separate breeding has made them measurably different: Hatch is more variable and can be much hotter, Anaheim is consistent and tame. For mainstream American cooks, the Anaheim is the safer reach.",
    culinaryUses: [
      "Chile verde and other green chile stews",
      "Roasted and stuffed for chile rellenos (a milder version)",
      "Sliced into fajitas, stir-fries, and breakfast scrambles",
      "Blended into mild salsa verde",
      "Pickled for sandwiches and burgers"
    ],
    pairsWith: ["Mexican", "Tex-Mex", "Southwestern", "Pork", "Cheese", "Eggs"],
    funFact: "The Anaheim and the Hatch chile share a common ancestor — a cultivar developed at New Mexico State University around 1900. Emilio Ortega moved seeds to Anaheim, California, and a century of separate selection produced two distinct peppers from the same starting point.",
    affiliateKeys: ["amazon-cholula-green-tomatillo", "amazon-tajin-clasico"],
    recipeTagMatch: ["mexican", "southwest", "tex-mex"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["vegetal", "sweet"],
    history: {
      region: "Anaheim, California, United States",
      era: "Cultivated commercially since the early 1900s",
      story:
        "Emilio Ortega, a Mexican-American farmer who learned chile cultivation in New Mexico, brought seeds back to Southern California and began commercial production around 1900 in what is now Anaheim. The Ortega Chile Company canned the peppers and built a brand around them. Over the next century, California growers selected for milder, more uniform pods that ship well — diverging from the Hatch chile lineage that stayed in New Mexico. Today the Anaheim is its own stable cultivar."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 75,
      plantHeight: "24–30 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Among the easiest US chiles for home gardens — productive, forgiving, and tolerant of cooler summers than habanero or chinense varieties. A 3-gallon container is enough per plant. Anaheims can be harvested green for fresh use or left to ripen red and dried (though they're less commonly dried than poblano/ancho)."
    },
    buying: {
      freshAvailability: "Year-round at virtually every US grocery store; one of the most universally stocked fresh chiles in the country.",
      driedAvailability: "Dried red Anaheims (sometimes labeled 'chile colorado') are available at Latin grocers but less common than ancho or guajillo.",
      seedSources: ["Burpee", "Bonnie Plants", "Native Seeds/SEARCH", "Johnny's Selected Seeds", "Baker Creek"],
      seasonality: "Year-round greenhouse and California field production; outdoor peak August–October.",
      notes:
        "Pre-roasted canned Ortega chiles (whole and diced) are pantry staples worth keeping — they're Anaheims processed for chiles rellenos, breakfast scrambles, and quick green chile applications when fresh isn't available."
    },
    substitutes: [
      {
        slug: "poblano",
        ratio: "1:1",
        note: "Very close cousin. Poblano is slightly more earthy, Anaheim slightly more sweet. Largely interchangeable in mild chile applications."
      },
      {
        slug: "hatch-green-chile",
        ratio: "1:1",
        note: "Anaheim's New Mexico sibling. Hatch is more variable — buy mild Hatch if you want the closest swap, hot Hatch for more kick."
      }
    ],
    faqs: [
      {
        question: "Are Anaheim and Hatch the same chile?",
        answer:
          "Closely related but distinct. They share a common ancestor (a New Mexico cultivar from the late 1800s), but a century of separate breeding has made Anaheim milder and more uniform, while Hatch retained more flavor variation and heat potential. Hatch is also a geographic designation — only chiles grown in the Hatch Valley can be sold as Hatch."
      },
      {
        question: "How hot is an Anaheim pepper?",
        answer:
          "Mild — 500 to 2,500 Scoville Heat Units, which is roughly one-fifth the heat of a jalapeño. Most Anaheims sit at the low end of this range. Individual pods can reach the high end (closer to a poblano), but very rarely beyond."
      },
      {
        question: "Can you eat Anaheim peppers raw?",
        answer:
          "Yes, though roasting brings out much more flavor. Raw Anaheims taste vegetal and slightly bitter, similar to a green bell pepper with a small heat note. Roasted, the flesh turns sweet and slightly smoky. Most traditional recipes call for roasting and peeling first."
      },
      {
        question: "What can I use instead of Anaheim peppers?",
        answer:
          "Poblano is the closest swap — similar mild heat and similar size for stuffing. Hatch chiles work but are more variable. Cubanelle peppers (Italian frying peppers) can substitute when only mild vegetal heat is needed. Green bell pepper is the wrong answer — it has no heat and a different flavor character."
      }
    ]
  },
  {
    slug: "ancho",
    name: "Ancho",
    aliases: ["ancho chile", "dried poblano", "chile ancho"],
    origin: "mexico",
    scovilleMin: 1000,
    scovilleMax: 2000,
    heatTier: "mild",
    color: "Dark reddish-brown to nearly black (dried)",
    flavorProfile: "Dried fruit and chocolate — raisin, prune, slight smoke, with a gentle warmth.",
    description:
      "The ancho is a ripe poblano that has been dried, and the transformation produces one of the most flavorful dried chiles in the world. Wrinkled, reddish-brown, slightly sweet, and indispensable to Mexican cooking, the ancho is one of the three pillars of traditional mole sauce.",
    editorialNote:
      "Ancho is the dried chile to know first. Its flavor profile — raisin, prune, cocoa, mild earth — is unlike anything you can get from a fresh pepper, and the heat is mild enough to use generously. Toasted briefly on a dry pan and rehydrated in warm water, an ancho releases the kind of dried-fruit depth that anchors moles, adobos, and slow-cooked meat dishes. The 'holy trinity' of Mexican dried chiles is ancho, pasilla, and guajillo; ancho contributes the sweet, raisin-like backbone of the trio.",
    culinaryUses: [
      "Mole poblano, mole negro, and other traditional mole sauces",
      "Adobo marinade for cochinita pibil and slow-cooked meats",
      "Chile colorado red sauce for enchiladas and tamales",
      "Toasted, rehydrated, and blended into ranchero and chile sauces",
      "Ground into ancho chili powder for rubs and seasoning blends"
    ],
    pairsWith: ["Mexican", "Mole", "Pork", "Beef", "Chocolate", "Cinnamon", "Toasted nuts"],
    funFact: "The word 'ancho' means 'wide' in Spanish — a reference to the broad, heart-shaped pod the chile keeps even after drying. The unrelated chile 'mulato' is also a dried poblano variant, just slightly darker, smokier, and less sweet.",
    affiliateKeys: ["amazon-chipotle-in-adobo", "amazon-cholula-original"],
    recipeTagMatch: ["mexican", "mole"],
    featured: true,
    source: "editorial",
    species: "annuum",
    pepperType: "drying",
    flavorNotes: ["sweet", "smoky", "earthy", "fruity"],
    history: {
      region: "Puebla, Mexico (same as fresh poblano)",
      era: "Pre-Columbian; drying technique predates Spanish contact",
      story:
        "Ancho is the dried form of the poblano pepper — the same plant, the same pre-Columbian Mesoamerican origin. The drying technique (sun-drying ripe red poblanos) was developed for preservation in a culture without refrigeration; the flavor transformation was a happy accident that became central to Mexican cooking. Today's ancho is most associated with Pueblan mole tradition, though the chile is used widely across central and southern Mexico."
    },
    growing: {
      usdaZones: "Same as poblano — perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 75,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Ancho isn't a separate cultivar — it's dried poblano. To make your own, grow poblanos and let pods fully ripen red on the plant. Sun-dry on a wire rack for several days until pods are leathery but still pliable. Store in an airtight container; properly dried anchos keep for over a year."
    },
    buying: {
      freshAvailability: "Ancho is dried by definition — fresh equivalent (ripe red poblano) is hard to find at most grocers since most poblanos are sold green.",
      driedAvailability: "Whole dried anchos and ancho powder are widely available at Latin grocers, online specialty stores, and increasingly at mainstream supermarkets in the international or Mexican food sections.",
      seedSources: ["Grow poblano seeds and dry the ripe red pods at home"],
      seasonality: "Year-round; the dried form has a long shelf life.",
      notes:
        "Look for dried anchos that are still pliable, not brittle — flexibility indicates they have residual moisture and will rehydrate cleanly. Stiff, hard anchos have been on the shelf too long. The best brands are vacuum-sealed or freshly packaged from Mexican importers."
    },
    substitutes: [
      {
        slug: "pasilla",
        ratio: "1:1",
        note: "Closest substitute among dried Mexican chiles. Pasilla is slightly more earthy and less sweet; ancho is more raisin-forward. Both work in mole and adobo applications."
      },
      {
        slug: "chipotle",
        ratio: "Use 1 chipotle per 2 anchos",
        note: "Different flavor (smoky vs raisin-sweet) but similar heat tier. Use when you want smoke instead of sweetness, in much smaller quantities."
      }
    ],
    faqs: [
      {
        question: "Is ancho the same as poblano?",
        answer:
          "Same pepper, different stage. A poblano is the fresh green pod; an ancho is that same pod ripened to red and dried. The drying transforms the flavor completely — from vegetal-bright (poblano) to raisin-sweet (ancho). They function as different ingredients despite sharing a plant."
      },
      {
        question: "How do you use dried ancho chiles?",
        answer:
          "Toast briefly on a dry pan (30 seconds per side, until fragrant), remove the stem and seeds, then rehydrate in warm water for 15–20 minutes until soft. Blend the rehydrated chile into sauces, marinades, or moles. The soaking liquid is also flavorful — strain and use as part of the liquid in the recipe."
      },
      {
        question: "What does ancho taste like?",
        answer:
          "Dried fruit, chocolate, and mild earth — common tasting notes include raisin, prune, fig, and a hint of cocoa. The heat is mild (similar to a fresh poblano). The flavor is what makes it indispensable to mole: it provides the rich, fruit-forward backbone that other chiles can't replicate."
      },
      {
        question: "Can I substitute ancho chile powder for whole dried ancho?",
        answer:
          "Yes, with caveats. About 1 tablespoon of ancho powder substitutes for one whole rehydrated ancho. The powder is more concentrated in heat and slightly less flavorful (some of the aromatic notes degrade in grinding), but it works for quick applications. For traditional mole or adobo, whole rehydrated anchos give a better result."
      }
    ]
  },
  {
    slug: "guajillo",
    name: "Guajillo",
    aliases: ["guajillo chile", "chile guajillo", "dried mirasol"],
    origin: "mexico",
    scovilleMin: 2500,
    scovilleMax: 5000,
    heatTier: "medium",
    color: "Deep red (dried)",
    flavorProfile: "Berry-like, tangy, slightly fruity heat with a hint of green tea and pine.",
    description:
      "The guajillo is the second pillar of Mexican dried chile cooking — the workhorse alongside ancho. Slender, deep red, with a thin papery skin and a flavor that lands between fruit and tartness. One of the most important dried chiles in Mexican cuisine.",
    editorialNote:
      "Guajillo is the dried Mexican chile that you'll see in nearly every traditional recipe alongside ancho. Where ancho contributes raisin sweetness and depth, guajillo brings brightness, tartness, and a hint of fruit — like cranberry or red currant compared to ancho's dried-fig profile. The combination is the foundation of mole, adobo, chile colorado, and pozole rojo. Guajillo also has more heat than ancho (still mild-to-medium, but noticeable), which gives the trinity its baseline warmth without crossing into uncomfortable territory.",
    culinaryUses: [
      "Pozole rojo — the foundational dried chile for red pozole",
      "Birria — slow-braised meat in guajillo-based chile broth",
      "Mole sauces alongside ancho and pasilla",
      "Chile colorado red sauce for tamales and enchiladas",
      "Salsa roja for tacos and table salsa"
    ],
    pairsWith: ["Mexican", "Pozole", "Birria", "Beef", "Goat", "Lime", "Garlic"],
    funFact: "'Guajillo' translates roughly to 'little gourd' or 'little rattle' — the dried pods rattle when shaken because the seeds come loose inside the papery skin.",
    affiliateKeys: ["amazon-chipotle-in-adobo", "amazon-cholula-original"],
    recipeTagMatch: ["mexican", "birria", "pozole"],
    featured: true,
    source: "editorial",
    species: "annuum",
    pepperType: "drying",
    flavorNotes: ["fruity", "smoky", "citrus", "sweet"],
    history: {
      region: "Central and northern Mexico, especially Zacatecas, Aguascalientes, and Durango",
      era: "Pre-Columbian; widely cultivated throughout colonial Mexico",
      story:
        "Guajillo is the dried form of the mirasol pepper, native to central Mexico. The name 'mirasol' means 'looks at the sun' — the fresh pods point upward toward the sky on the plant, unlike most chiles that hang downward. Today commercial production centers on Mexico's central highlands and the surrounding states, with significant additional production in California, New Mexico, and Texas. Guajillo is essential to many of Mexico's most iconic dishes; without it, pozole rojo and birria as we know them wouldn't exist."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 80,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Guajillo is the dried form of mirasol, so to grow your own you'll need mirasol seeds (sometimes labeled 'mirasol/guajillo'). Plants are productive and forgiving, similar to other annuum cultivars. Let pods ripen fully red on the plant, then sun-dry on racks for several days until leathery."
    },
    buying: {
      freshAvailability: "Fresh mirasol is uncommon outside Mexican farms and the largest Latin grocers in the US.",
      driedAvailability: "Dried guajillo is universally available at Latin grocers, online, and increasingly at mainstream supermarkets in the international foods section.",
      seedSources: ["Native Seeds/SEARCH", "Baker Creek", "Sandia Seed Company", "Pepper Joe's"],
      seasonality: "Year-round; the dried form has a long shelf life.",
      notes:
        "Look for guajillos with intact, glossy skins — the papery outer layer should still be smooth and flexible. Crackled, brittle pods have lost moisture and won't rehydrate as well. The best guajillos come from Mexican importers and are typically vacuum-sealed."
    },
    substitutes: [
      {
        slug: "ancho",
        ratio: "1:1",
        note: "Most common kitchen swap — they often appear together in recipes. Ancho is sweeter and milder; guajillo brings more tartness and slight heat."
      },
      {
        slug: "pasilla",
        ratio: "1:1",
        note: "Together with ancho, completes the 'holy trinity' of Mexican dried chiles. Pasilla is earthier and slightly more bitter than guajillo."
      }
    ],
    faqs: [
      {
        question: "What's the difference between guajillo and ancho?",
        answer:
          "Different peppers, different flavors. Guajillo is the dried mirasol — a long, slender, deep red chile with a tangy, berry-like flavor and mild-to-medium heat. Ancho is the dried poblano — wider, darker, with a sweet raisin-and-chocolate flavor and milder heat. They're complementary and often used together in mole and adobo."
      },
      {
        question: "How spicy is a guajillo chile?",
        answer:
          "Mild to medium — 2,500 to 5,000 Scoville Heat Units, similar to a mild jalapeño. The heat is more noticeable than ancho but well below cayenne or chile de árbol. In sauces, the heat dissipates further, making guajillo the dried chile that adds warmth without dominating."
      },
      {
        question: "How do you use dried guajillo chiles?",
        answer:
          "Toast on a dry pan briefly (about 30 seconds per side, until fragrant), then rehydrate in warm water for 15–20 minutes. Remove stems and seeds, then blend the softened chile with the soaking liquid and other aromatics into a sauce. Guajillo paste is the base for birria, pozole, and chile colorado."
      },
      {
        question: "What can I substitute for guajillo?",
        answer:
          "Ancho is the closest swap — milder and sweeter, but functionally similar in moles and sauces. New Mexico dried red chile works well too. Cascabel chiles approximate the slightly nutty character. In a pinch, a mix of paprika and a small amount of cayenne approximates the heat and color but loses the chile-specific flavor."
      }
    ]
  },
  {
    slug: "pasilla",
    name: "Pasilla",
    aliases: ["chile pasilla", "chile negro", "dried chilaca"],
    origin: "mexico",
    scovilleMin: 1000,
    scovilleMax: 2500,
    heatTier: "mild",
    color: "Very dark brown, nearly black (dried)",
    flavorProfile: "Earthy, slightly bitter, with hints of dried herbs and dark berries — the deepest-tasting of the dried Mexican chile trinity.",
    description:
      "The pasilla — also called chile negro — is the third pillar of Mexican dried chile cooking, alongside ancho and guajillo. Long, slender, and so dark it appears nearly black, the pasilla brings deep, earthy complexity to traditional moles and adobos.",
    editorialNote:
      "Pasilla is the savory counterpoint in the dried Mexican trinity. Where ancho is sweet and guajillo is tangy, pasilla is herbal, slightly bitter, and almost mushroom-like in its depth. The name comes from 'pasa,' the Spanish word for raisin — though pasilla tastes less like raisin than ancho does. Confusingly, in California and parts of the US southwest, the dried poblano (ancho) is sometimes mislabeled 'pasilla,' which causes recipe confusion. The real pasilla is the dried chilaca pepper, an entirely different plant.",
    culinaryUses: [
      "Mole negro — the dark, complex Oaxacan mole",
      "Adobo for slow-cooked meats and seafood",
      "Pasilla cream sauce for fish dishes",
      "Chile sauces for tamales and enchiladas",
      "Toasted and ground for sophisticated chile rubs"
    ],
    pairsWith: ["Mexican", "Oaxacan", "Seafood", "Lamb", "Chocolate", "Garlic", "Cumin"],
    funFact: "Mole negro from Oaxaca uses pasilla as its primary chile and can include over 30 ingredients including chocolate, sesame seeds, cinnamon, and dried herbs — it's one of the most labor-intensive sauces in Mexican cooking.",
    affiliateKeys: ["amazon-chipotle-in-adobo"],
    recipeTagMatch: ["mexican", "oaxacan", "mole"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "drying",
    flavorNotes: ["earthy", "sweet", "smoky", "bitter"],
    history: {
      region: "Central and southern Mexico, especially Oaxaca and Puebla",
      era: "Pre-Columbian; central to Oaxacan culinary tradition",
      story:
        "Pasilla is the dried form of the chilaca pepper, native to central Mexico. Long associated with Oaxacan cooking — particularly the iconic mole negro — pasilla has been part of Mexican cuisine since well before Spanish contact. The Mexican states of Zacatecas, Aguascalientes, and Guanajuato also produce significant amounts. The Pasilla de Oaxaca is a smoked variant that adds another flavor dimension and is harder to find outside specialty Oaxacan markets."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 85,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Chilaca peppers (fresh form of pasilla) grow long and slender on tall plants. Let pods ripen to dark green-black, then sun-dry until leathery and nearly black. Like other dried Mexican chiles, the drying process intensifies and transforms the flavor."
    },
    buying: {
      freshAvailability: "Fresh chilaca peppers are very rare outside Mexico. Most cooks encounter pasilla only in dried form.",
      driedAvailability: "Dried pasilla is available at Latin grocers and online. Less common than ancho or guajillo but increasingly stocked at well-supplied Mexican markets.",
      seedSources: ["Native Seeds/SEARCH", "Sandia Seed Company", "Baker Creek"],
      seasonality: "Year-round; long shelf life.",
      notes:
        "Be careful with labels: in California and parts of the US, dried poblano (true ancho) is sometimes sold as 'pasilla.' The real pasilla is longer, narrower, and significantly darker. Check the shape: pasilla is slender and elongated; ancho is wider and heart-shaped."
    },
    substitutes: [
      {
        slug: "ancho",
        ratio: "1:1",
        note: "Closest substitute in mole and adobo. Ancho is sweeter and brighter; pasilla is earthier and more complex. The blend of both is standard in traditional mole."
      },
      {
        slug: "guajillo",
        ratio: "1:1",
        note: "Different flavor character (tangy/fruity vs earthy/bitter) but similar heat level and functional role in chile sauces."
      }
    ],
    faqs: [
      {
        question: "Is pasilla the same as ancho?",
        answer:
          "No — they're completely different peppers, often confused in US grocery labeling. Pasilla is the dried chilaca; ancho is the dried poblano. The confusion comes from California, where dried poblano is sometimes mislabeled 'pasilla.' The real pasilla is longer, narrower, and much darker than ancho."
      },
      {
        question: "What does pasilla taste like?",
        answer:
          "Earthy, slightly bitter, with notes of dried herbs, mushroom, dark berries, and a hint of bittersweet chocolate. The flavor is more complex and savory than ancho or guajillo, which is why pasilla is favored in mole negro — the dark Oaxacan mole that needs deep, brooding flavor notes."
      },
      {
        question: "How spicy is pasilla?",
        answer:
          "Mild — 1,000 to 2,500 Scoville Heat Units, similar to a poblano. The flavor is what matters, not the heat. In traditional Mexican cooking, pasilla is chosen for its earthy depth, not its burn."
      },
      {
        question: "Can I use pasilla in place of ancho?",
        answer:
          "Yes, with a flavor shift. The result will be earthier and less sweet — appropriate for some sauces (mole negro, adobo for seafood) but less ideal for sweeter applications. For mole poblano or chile rellenos sauce where the sweetness of ancho matters, the swap won't taste quite right."
      }
    ]
  },
  {
    slug: "fresno",
    name: "Fresno",
    aliases: ["fresno pepper", "fresno chile"],
    origin: "north-america",
    scovilleMin: 2500,
    scovilleMax: 10000,
    heatTier: "medium",
    color: "Bright red (occasionally green when unripe)",
    flavorProfile: "Bright, slightly fruity, with a clean medium heat — like a red jalapeño with more fruit and less vegetal character.",
    description:
      "The Fresno pepper looks almost identical to a red jalapeño and is frequently confused with one. Bred in Fresno, California in 1952, it has slightly different flavor and a marginally hotter heat profile, with a smokier, fruitier character that makes it a craft hot sauce favorite.",
    editorialNote:
      "The Fresno is one of the most useful peppers most people have never heard of. At a glance it looks like a red jalapeño; in the kitchen it behaves like a slightly fruitier, slightly hotter version. Craft hot sauce makers favor it for that fruit character — Hot Ones' Yellowbird and Cholula's Hot Sauce both use Fresno or Fresno-derived peppers. Whole Foods and other higher-end grocers stock fresh Fresnos year-round; mainstream stores are catching up. Worth knowing as both a substitute and a primary ingredient.",
    culinaryUses: [
      "Quick-pickled for tacos, sandwiches, and burgers",
      "Sliced fresh into salsas and pico de gallo (a sweeter version)",
      "Roasted and blended into bright red hot sauces",
      "Stir-fried into Asian preparations where its fruit notes work well",
      "Substituted for red jalapeño in nearly any recipe"
    ],
    pairsWith: ["Mexican", "American", "Asian fusion", "Pork", "Burgers", "Quick pickles"],
    funFact: "The Fresno pepper was first developed by Clarence Brown Hamlin in 1952 at the California Department of Agriculture in Fresno. It was registered specifically as a milder, sweeter alternative to red jalapeños for the canning industry — though today it's more often used fresh.",
    affiliateKeys: ["amazon-cholula-original", "amazon-yellowbird-serrano"],
    recipeTagMatch: ["mexican", "tex-mex", "american"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["fruity", "smoky", "sweet"],
    history: {
      region: "Fresno, California, United States",
      era: "Developed commercially in 1952",
      story:
        "Clarence Brown Hamlin developed the Fresno cultivar at the California Department of Agriculture as a more uniform, slightly milder alternative to red jalapeños for industrial canning. The pepper found its commercial niche fresh rather than canned and has steadily gained popularity at upscale grocers since the 2000s. The combination of red jalapeño appearance with a slightly fruitier flavor has made it a favorite of craft chefs and sauce producers."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "7–14",
      daysToHarvest: 75,
      plantHeight: "24–30 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Easy to grow — behaves similarly to jalapeño with a slightly more upright plant habit. Plants are productive (20–30 pods per season) and start producing earlier than chinense varieties. Container-friendly with a 3-gallon pot. Harvest fully red for the characteristic Fresno flavor; green Fresnos taste closer to green jalapeño."
    },
    buying: {
      freshAvailability: "Increasingly common at upscale US grocers (Whole Foods, Sprouts, Trader Joe's); standard at Mexican markets. Year-round availability in California, seasonal elsewhere.",
      driedAvailability: "Less common dried than fresh. Some specialty pepper retailers sell dried Fresnos for use in chili blends.",
      seedSources: ["Burpee", "Bonnie Plants", "Baker Creek", "Pepper Joe's"],
      seasonality: "Peak field-grown August–October; year-round greenhouse and California production.",
      notes:
        "If your grocer stocks 'red jalapeños' and they look glossy and slightly fatter than green jalapeños, there's a decent chance they're actually Fresnos. The two are often labeled interchangeably in mainstream stores. Either works for most recipes."
    },
    substitutes: [
      {
        slug: "jalapeno",
        ratio: "1:1 (use a red jalapeño if available)",
        note: "Functionally interchangeable. A red jalapeño is the closest swap by appearance and flavor; a green jalapeño works but loses the fruit-forward character."
      },
      {
        slug: "serrano",
        ratio: "Use ⅔ as many serranos",
        note: "Hotter and less fruity; works when you need similar bright heat but more intensity."
      }
    ],
    faqs: [
      {
        question: "Is a Fresno pepper the same as a red jalapeño?",
        answer:
          "Different cultivars, but very similar. Fresno was bred separately from jalapeño in 1952. The pepper looks almost identical to a ripe red jalapeño but is slightly fruitier in flavor and a touch hotter on average. Most grocers don't distinguish, and they're often interchangeable in recipes."
      },
      {
        question: "How spicy is a Fresno?",
        answer:
          "Medium — 2,500 to 10,000 Scoville Heat Units. That's the same range as jalapeño but biased toward the high end. Most Fresnos taste hotter than typical green jalapeños but milder than serrano. Predictable heat with a noticeable fruit note."
      },
      {
        question: "Can you eat Fresno peppers raw?",
        answer:
          "Yes — that's their most common use. Sliced raw into salsas, pico de gallo, pickled toppings, and salads. The flavor is bright and fruity raw; roasting deepens it but isn't necessary. The thin walls work well for quick pickling (5 minutes in hot vinegar with sugar)."
      },
      {
        question: "What hot sauces are made with Fresno peppers?",
        answer:
          "Several craft sauces feature Fresno specifically — Hot Ones' first season sauces drew heavily from Fresno, and brands like Truff, Yellowbird's Serrano, and various small-batch producers use Fresno as the base. Many 'red jalapeño' sauces are actually Fresno-based without distinguishing in marketing."
      }
    ]
  },
  {
    slug: "aleppo",
    name: "Aleppo Pepper",
    aliases: ["halaby pepper", "halaby biber", "Syrian pepper"],
    origin: "middle-east",
    scovilleMin: 5000,
    scovilleMax: 10000,
    heatTier: "medium",
    color: "Deep red (dried and flaked)",
    flavorProfile: "Sun-dried tomato, raisin, dried-fruit smoke, and a slow-building moderate heat.",
    description:
      "The Aleppo pepper is one of the most distinctive flaked chiles in the world — a Syrian-Turkish staple that combines moderate heat with a complex flavor that lands closer to dried fruit than to standard red pepper flakes. Sun-dried, salted, deseeded, and coarsely ground.",
    editorialNote:
      "If you only ever own one specialty chile flake, Aleppo is the one to choose. The combination of sun-dried tomato, raisin sweetness, and gentle building heat works almost anywhere standard red pepper flakes would — pasta, pizza, roasted vegetables, eggs — but with significantly more flavor character. The Syrian war disrupted traditional Aleppo region production starting in 2011; much of today's supply comes from Gaziantep, Turkey, which produces a near-identical pepper that is also (confusingly) labeled 'Aleppo' in the US market. The Turkish version is excellent; purists distinguish them, but most Western buyers can use either interchangeably.",
    culinaryUses: [
      "Sprinkled on hummus, labneh, and other Mediterranean dips",
      "Mixed into spice rubs for grilled lamb, chicken, and fish",
      "Stirred into salad dressings for warm-tomato character",
      "Substituted for red pepper flakes on pasta and pizza for more flavor depth",
      "Added to muhammara, the Syrian red pepper-walnut spread"
    ],
    pairsWith: ["Middle Eastern", "Mediterranean", "Lamb", "Tomatoes", "Olive oil", "Sumac", "Pomegranate molasses"],
    funFact: "Traditional Aleppo pepper production is so labor-intensive that the price reflects it — peppers are sun-dried over weeks on rooftop terraces, then hand-deseeded, salted, and coarsely milled. Modern commercial processing speeds this up but high-quality Aleppo is still a premium product.",
    affiliateKeys: ["amazon-tajin-clasico"],
    recipeTagMatch: ["middle eastern", "mediterranean"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "drying",
    flavorNotes: ["fruity", "smoky", "earthy", "sweet"],
    history: {
      region: "Aleppo, Syria, and the surrounding Levant; now also Gaziantep, Turkey",
      era: "Cultivated in the Aleppo region since the Ottoman period",
      story:
        "The Aleppo pepper takes its name from the Syrian city where commercial production was concentrated for centuries — a center of the Levantine spice trade since Ottoman times. The Syrian civil war that began in 2011 severely disrupted production around Aleppo, and much of today's commercial 'Aleppo pepper' is grown across the border in Gaziantep, Turkey (where the same cultivar has been cultivated for nearly as long). Syrian Aleppo is slowly returning to market as regional production recovers."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 90,
      plantHeight: "24–36 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Halaby biber (the cultivar name) grows similarly to other annuum peppers. The flavor comes from the traditional processing — sun-drying, salting, partial removal of seeds — rather than from the fresh pepper itself. Growing the pepper is straightforward; producing authentic Aleppo flakes at home requires the multi-week drying process."
    },
    buying: {
      freshAvailability: "Fresh halaby biber is rare in the US — mostly available at Middle Eastern grocers or via specialty growers.",
      driedAvailability: "Aleppo pepper flakes are widely available — Middle Eastern grocers, specialty spice retailers (Penzeys, Burlap & Barrel, World Spice), and most upscale supermarkets. Both Syrian and Turkish-origin versions are sold.",
      seedSources: ["Baker Creek (heritage seed)", "specialty Middle Eastern seed importers"],
      seasonality: "Year-round dried product; the multi-week processing means continuous supply.",
      notes:
        "Quality varies. Look for Aleppo that is moist, oily, deep red, and pleasantly fragrant — dry, pale, or odorless flakes have been on the shelf too long. Burlap & Barrel sells Syrian-origin Aleppo; many Middle Eastern grocers sell Turkish-origin. Both are excellent."
    },
    substitutes: [
      {
        slug: "gochugaru",
        ratio: "1:1",
        note: "Korean gochugaru has similar flake form and moderate heat. Less fruit-and-raisin character; more straightforward sweet smoke. Works in non-Middle-Eastern applications."
      },
      {
        slug: "calabrian-chili",
        ratio: "1:1 (flakes)",
        note: "Italian Calabrian flakes have similar heat and a comparable fruit character. Closer to Aleppo than American red pepper flakes."
      }
    ],
    faqs: [
      {
        question: "What does Aleppo pepper taste like?",
        answer:
          "Sun-dried tomato, raisin, mild smoke, and a slowly-building moderate heat. The flavor is the appeal — Aleppo tastes like an ingredient, not just heat. Compared to standard American red pepper flakes (which are mostly heat with little flavor), Aleppo brings genuine fruit and depth."
      },
      {
        question: "How spicy is Aleppo pepper?",
        answer:
          "Mild to medium — about 10,000 Scoville Heat Units, similar to a hot jalapeño. The heat builds slowly rather than hitting immediately. You can use Aleppo more liberally than standard red pepper flakes because the heat is gentler and the flavor justifies the larger quantity."
      },
      {
        question: "Where can I buy real Aleppo pepper?",
        answer:
          "Middle Eastern grocers carry it most reliably; specialty spice retailers like Burlap & Barrel and Penzeys carry quality versions online. Most upscale supermarkets (Whole Foods, Wegmans) now stock it in the spice aisle. Look for moist, oily, dark red flakes — the freshest product has visible sheen."
      },
      {
        question: "Can I substitute red pepper flakes for Aleppo?",
        answer:
          "Yes, but you'll lose the flavor character — Aleppo's fruit-and-smoke notes don't come through with standard American red pepper flakes. For closer substitution: Turkish marash biber (a close cousin), Korean gochugaru (similar flake form), or a mix of paprika and a small amount of cayenne approximates the heat and color without the depth."
      }
    ]
  },
  {
    slug: "shishito",
    name: "Shishito",
    aliases: ["shishi pepper", "shishi-tougarashi"],
    origin: "east-asia",
    scovilleMin: 50,
    scovilleMax: 200,
    heatTier: "mild",
    color: "Bright green ripening to red",
    flavorProfile: "Vegetal, slightly sweet, and bright — with an unpredictable ~1-in-10 chance of significantly more heat.",
    description:
      "The shishito is a Japanese pepper that's almost entirely mild — except about one in every ten pods is unexpectedly hot. Slim, slightly wrinkled, bright green, and most famous as a blistered tapas-style appetizer, the shishito has become one of the trendiest peppers in American restaurants since the 2010s.",
    editorialNote:
      "Shishito's appeal is the lottery. The vast majority of pods taste vegetal and sweet with almost no heat — eating them blistered in oil and salt is closer to eating a green bean than a chile. But genetics being what they are, roughly one in ten pods carries serious capsaicin, and the surprise becomes part of the dining experience. The combination of accessibility and unpredictability has made shishitos one of the most successful 'crossover' peppers — they appear on menus that wouldn't otherwise touch chiles. Grocer availability has caught up: Trader Joe's, Whole Foods, and increasing numbers of mainstream supermarkets stock them year-round.",
    culinaryUses: [
      "Blistered in a hot pan with oil and finished with flaky salt — the canonical Japanese izakaya preparation",
      "Charred on a grill and squeezed with lemon",
      "Stuffed with cheese and quickly broiled",
      "Stir-fried with garlic and soy sauce",
      "Pickled for tacos and sandwiches"
    ],
    pairsWith: ["Japanese", "Tapas", "Flaky salt", "Lemon", "Soy sauce", "Sesame", "Yuzu"],
    funFact: "The name 'shishito' translates to 'lion pepper' — the slightly bulbous, wrinkled tip of the pod was thought to resemble a lion's head in Japanese folk tradition. The lottery factor (one in ten being hot) is unrelated to the name but has become part of the modern American appeal.",
    affiliateKeys: ["amazon-chili-crisp", "amazon-fly-by-jing-sichuan-gold"],
    recipeTagMatch: ["japanese", "asian"],
    featured: true,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["vegetal", "sweet", "smoky"],
    history: {
      region: "Japan, with cultivation also in Korea and parts of China",
      era: "Long established in Japanese cooking; gained Western fame in the 2010s",
      story:
        "Shishitos have been cultivated in Japan for centuries as a household pepper, eaten in summer when the pods are at peak. The variety is closely related to (and visually similar to) the Spanish padrón, suggesting both descended from a common ancestor brought via Portuguese trade. American restaurants, particularly those leaning Japanese-fusion, popularized shishitos starting in the 2010s — by the mid-2020s they had become a standard appetizer on bar menus from New York to Los Angeles. Mexican and California growers now supply much of the US market."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "7–14",
      daysToHarvest: 60,
      plantHeight: "18–24 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "One of the easiest peppers to grow in a home garden — productive, compact, and quick to fruit. A single plant can produce 50+ pods over a season. Pick them when green and slightly smaller than your finger; older pods turn red, get tougher, and develop more heat. Plants do well in containers as small as 2 gallons."
    },
    buying: {
      freshAvailability: "Year-round at Whole Foods, Trader Joe's, Sprouts, and many mainstream grocers. Standard at Japanese and Asian markets. One of the most available specialty peppers in the US.",
      driedAvailability: "Not commonly dried — shishitos are a fresh pepper.",
      seedSources: ["Kitazawa Seed", "Baker Creek", "Burpee", "Johnny's Selected Seeds"],
      seasonality: "Year-round at well-stocked grocers; peak fresh August–October.",
      notes:
        "Look for firm, glossy green pods. Wrinkled or pale shishitos are past their prime. The slightly bulbous tip is normal — that's the 'lion head' shape the name refers to."
    },
    substitutes: [
      {
        slug: "padron",
        ratio: "1:1",
        note: "The Spanish near-equivalent. Padróns are almost interchangeable with shishitos — same mild heat with the same lottery factor. Use whichever you can find."
      }
    ],
    faqs: [
      {
        question: "Why is one in ten shishitos spicy?",
        answer:
          "Genetic variation. The cultivar produces mostly mild peppers, but environmental stress (heat, drought, age) can trigger higher capsaicin in occasional pods. There's no way to tell which is which from the outside. The unpredictability is part of the appeal — Japanese cooks have eaten shishitos this way for centuries."
      },
      {
        question: "How do you cook shishito peppers?",
        answer:
          "Most commonly blistered: a hot pan with a little oil, the peppers thrown in whole, tossed until the skins blister and char in spots (about 3–4 minutes), then finished with flaky salt. Squeeze of lemon optional. Eat the whole pepper — stem, seeds, and all. They're also good grilled, charred over flame, or stuffed and broiled."
      },
      {
        question: "Are shishito peppers spicy?",
        answer:
          "Mostly not — they're rated 50–200 Scoville Heat Units, well below jalapeño. But roughly one in every ten pods is unexpectedly hot, sometimes reaching mild-jalapeño levels. The lottery factor is well-known and is part of the cultivar's charm rather than a defect."
      },
      {
        question: "What's the difference between shishito and padrón?",
        answer:
          "Very little — they're closely related cultivars from Japan and Spain respectively. Padróns are slightly larger and can carry slightly more heat on average, but both have the same vegetal flavor, the same mild baseline, and the same one-in-ten lottery factor for unexpectedly hot pods. Most American grocers and restaurants treat them interchangeably."
      }
    ]
  },
  {
    slug: "padron",
    name: "Padrón",
    aliases: ["padron pepper", "pimientos de padrón", "Galician pepper"],
    origin: "europe",
    scovilleMin: 500,
    scovilleMax: 2500,
    heatTier: "mild",
    color: "Bright green, occasionally ripening to red",
    flavorProfile: "Vegetal and slightly fruity, with a mild grass-and-green-pepper character — and the well-known one-in-ten chance of meaningful heat.",
    description:
      "The padrón is the defining tapa pepper of Spanish cooking — a small, slightly wrinkled green chile from Galicia best known for its lottery factor. Most pods are mild and vegetal; about one in ten is unexpectedly hot. Blistered in olive oil and finished with sea salt, they're one of the most iconic Spanish bar foods.",
    editorialNote:
      "Padrón peppers are to Spanish tapas what shishitos are to Japanese izakaya cooking — and the two are botanically similar enough that you can substitute either for the other. The Galician proverb 'os pementos de Padrón, uns pican e outros non' ('Padrón peppers, some are hot and some are not') captures the appeal perfectly. American restaurants have embraced them alongside shishitos, often serving the two together as a 'pepper lottery' plate. They're easier to find at Spanish-leaning restaurants and at upscale supermarkets than they used to be.",
    culinaryUses: [
      "Blistered in olive oil and finished with flaky sea salt — the iconic Galician tapa",
      "Pan-charred and served with Manchego cheese",
      "Grilled and folded into Spanish tortillas (egg-and-potato omelets)",
      "Mixed with shishitos for a 'pepper lottery' plate",
      "Pickled in sherry vinegar for tapas spreads"
    ],
    pairsWith: ["Spanish", "Tapas", "Olive oil", "Sea salt", "Manchego", "Sherry vinegar", "Jamón"],
    funFact: "Padrón peppers are grown almost exclusively in the Herbón parish of A Coruña, Galicia — production is protected by an EU 'Pemento de Herbón' designation of origin, making it one of the few EU-protected chile peppers in the world.",
    affiliateKeys: ["amazon-tajin-clasico"],
    recipeTagMatch: ["spanish", "tapas"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["vegetal", "fruity", "sweet"],
    history: {
      region: "Herbón, Galicia, northwestern Spain",
      era: "Cultivated in Galicia since the 16th century",
      story:
        "Padrón peppers were brought to Galicia by Franciscan monks returning from Mexico in the 16th century. They were planted in the parish of Herbón, near the town of Padrón, where the climate and soil produced a specific small, mild cultivar that became culturally distinct from other Spanish peppers. The EU's Protected Designation of Origin status (granted in 2010) restricts the 'Padrón pepper' name to peppers grown in this specific area, though similar peppers are now produced elsewhere in Spain and sold under broader names."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–18",
      daysToHarvest: 65,
      plantHeight: "24–30 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Easy and productive — similar growing requirements to shishito. Plants tolerate the Galician cool, damp summers better than many chiles, which is part of why they thrive on the Atlantic coast. In US gardens, picks are best when small (1–2 inches); larger pods get progressively hotter. Container-friendly with a 3-gallon pot."
    },
    buying: {
      freshAvailability: "Increasingly common at upscale US grocers (Whole Foods, Sprouts) during summer; year-round at Spanish specialty importers. Less universally stocked than shishito but trending up.",
      driedAvailability: "Not commonly dried — padróns are a fresh pepper.",
      seedSources: ["Baker Creek", "Renee's Garden", "Spanish heirloom seed importers"],
      seasonality: "Peak fresh July–September; year-round availability where greenhouse production exists.",
      notes:
        "Look for small, firm, dark-green pods with slight wrinkling. Padróns sold in Spain are typically smaller than US-grown versions. Larger pods are still good but more likely to carry heat — Spanish cooks generally pick them young to keep the lottery favorable."
    },
    substitutes: [
      {
        slug: "shishito",
        ratio: "1:1",
        note: "The Japanese near-equivalent. Padrón and shishito are functionally interchangeable in blistering and grilling applications — same mild profile, same lottery factor."
      }
    ],
    faqs: [
      {
        question: "What's the famous Galician saying about padrón peppers?",
        answer:
          "'Os pementos de Padrón, uns pican e outros non' — 'Padrón peppers, some are hot and some are not.' It's a centuries-old reference to the cultivar's unpredictable heat: most pods are mild, but a small percentage are unexpectedly fiery. The saying is so well-known in Spain that 'padrón' has become shorthand for unpredictability."
      },
      {
        question: "How spicy are padrón peppers?",
        answer:
          "Mostly mild — 500–2,500 Scoville Heat Units, similar to a poblano on the low end. About one in ten pods will be hotter, sometimes reaching jalapeño territory. There's no visible way to tell which is which. Larger, older pods are more likely to be hot than small young ones, but it's still a lottery."
      },
      {
        question: "How do you cook padrón peppers?",
        answer:
          "Blistered: heat olive oil in a pan until shimmering, throw in whole padróns, toss until skins blister and char in spots (3–4 minutes), finish with flaky sea salt. Eat them whole, stem and all (or use the stem as a handle). The classic Galician preparation. They're also good grilled, fried in olive oil with garlic, or charred and folded into tortilla."
      },
      {
        question: "Are padrón peppers the same as shishitos?",
        answer:
          "Closely related cousins, not identical. Both are mild peppers with the same lottery factor (~1 in 10 hot). Padróns are typically slightly larger and can carry slightly more heat on average. They originated separately — padrón in Spain via Mexican monk imports, shishito in Japan — but the cultivars are similar enough to be functionally interchangeable in most recipes."
      }
    ]
  },
  {
    slug: "chile-de-arbol",
    name: "Chile de Árbol",
    aliases: ["chile de arbol", "bird's beak chile", "rat's tail chile"],
    origin: "mexico",
    scovilleMin: 15000,
    scovilleMax: 30000,
    heatTier: "medium",
    color: "Bright red (dried)",
    flavorProfile: "Clean, sharp heat with a slightly grassy, nutty backbone — direct and uncomplicated.",
    description:
      "The chile de árbol is one of the most useful dried Mexican chiles in the medium-heat tier. Slender, bright red, and direct in its heat, it brings clean fire without much fruity or smoky distraction. A staple in Mexican salsas, soups, and pickled condiments.",
    editorialNote:
      "Where ancho and pasilla bring depth and guajillo brings tang, chile de árbol brings straight heat. It's the dried Mexican chile you reach for when you want to dial up the burn of a sauce without changing its overall flavor profile. Salsa de árbol — toasted árbol blended with tomato, garlic, and salt — is one of the most direct hot sauces in the Mexican repertoire, often appearing on taco stand tables in 16-ounce squirt bottles. Despite the 'medium' tier label, individual árbols can hit serrano-level intensity.",
    culinaryUses: [
      "Salsa de árbol — bright, hot red salsa for tacos and eggs",
      "Toasted and crumbled over pozole, menudo, and birria",
      "Pickled in vinegar with carrots and onion (en escabeche)",
      "Infused into oils for chili oil applications",
      "Ground into chile flakes for spice blends"
    ],
    pairsWith: ["Mexican", "Tacos", "Eggs", "Soups", "Pickled vegetables", "Lime"],
    funFact: "The name 'chile de árbol' translates literally to 'tree chile' — the plant grows taller and more woody than most chile cultivars, sometimes reaching four feet with a small-tree-like form rather than a typical pepper bush shape.",
    affiliateKeys: ["amazon-cholula-original", "amazon-tajin-clasico"],
    recipeTagMatch: ["mexican", "salsa"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "drying",
    flavorNotes: ["vegetal", "smoky", "sweet"],
    history: {
      region: "Central and northern Mexico, especially Jalisco and Nayarit",
      era: "Pre-Columbian Mexican cultivation",
      story:
        "Chile de árbol is descended from the pequin pepper family, native to the wild brushlands of central Mexico. Cultivation became commercial in the 20th century, with Jalisco and Nayarit emerging as primary growing regions. The cultivar is exported widely now, and significant production also happens in California, Arizona, and New Mexico. The tall, tree-like plant habit distinguishes it visually from most other Mexican chiles."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "10–21",
      daysToHarvest: 85,
      plantHeight: "36–48 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "Distinctive growth habit: taller and more woody than most chile plants, sometimes requiring staking. Highly productive — a single plant can yield hundreds of small pods over a season. Let pods ripen fully red on the plant, then dry on racks or strings until brittle. Storage life is excellent when properly dried."
    },
    buying: {
      freshAvailability: "Fresh árbols are rare outside Mexican farms and large Latin grocers. Most cooks encounter them dried.",
      driedAvailability: "Universally available at Latin grocers and online; increasingly stocked at mainstream supermarkets in the international section.",
      seedSources: ["Native Seeds/SEARCH", "Baker Creek", "Sandia Seed Company", "Pepper Joe's"],
      seasonality: "Year-round; long shelf life when dried.",
      notes:
        "Look for whole, intact dried pods with bright red color — fading to pale orange or brown indicates age and lost flavor. The thin walls are normal; brittle is fine, crumbling is past prime."
    },
    substitutes: [
      {
        slug: "cayenne",
        ratio: "1:1",
        note: "Similar heat range and similar clean, direct character when dried. Cayenne is slightly hotter on average and has very similar applications."
      },
      {
        slug: "thai-birds-eye",
        ratio: "Use ½ as many",
        note: "About twice the heat of chile de árbol. Use less for similar burn; thai birds eye is more bright/citrus than the earthy árbol character."
      }
    ],
    faqs: [
      {
        question: "How hot is chile de árbol?",
        answer:
          "Medium-hot — 15,000 to 30,000 Scoville Heat Units, which puts it at about three to four times the heat of a hot jalapeño. Less intense than thai bird's eye or cayenne but well above guajillo or ancho. The heat is direct and clean rather than building."
      },
      {
        question: "What does chile de árbol taste like?",
        answer:
          "Clean, sharp, slightly nutty heat with a grassy backbone. Less fruity than habanero, less smoky than chipotle, less tangy than guajillo. The flavor is the chile equivalent of a clean note — straightforward heat without much distraction, which is exactly what makes it useful as a dialing-up ingredient."
      },
      {
        question: "How do you use chile de árbol?",
        answer:
          "Toast briefly on a dry pan until fragrant (about 30 seconds per side), then blend into salsas with tomato or tomatillo, vinegar, garlic, and salt for salsa de árbol. Alternatively, crumble whole toasted árbols over finished dishes (pozole, menudo, eggs) for a textural heat hit. Can also be infused into hot oil for quick chili oil."
      },
      {
        question: "What can I substitute for chile de árbol?",
        answer:
          "Cayenne pepper (whole or ground) is the closest swap — same heat tier, similar dry-heat character. Thai bird's eye chiles work but are hotter (use about half). For ground applications, half cayenne plus half paprika approximates árbol's color and heat without exact flavor match."
      }
    ]
  },
  {
    slug: "banana-pepper",
    name: "Banana Pepper",
    aliases: ["yellow wax pepper", "Hungarian banana", "sweet banana"],
    origin: "europe",
    scovilleMin: 0,
    scovilleMax: 500,
    heatTier: "mild",
    color: "Pale yellow ripening through orange to red",
    flavorProfile: "Tangy, slightly sweet, mild with almost no perceptible heat — closer to a sweet pepper than a chile.",
    description:
      "The banana pepper is a long, curved yellow pepper that's almost always sold pickled or fresh as a mild, tangy ingredient. Common on sandwiches, salads, and pizzas across the American Midwest, it's one of the most widely consumed mild peppers in the US.",
    editorialNote:
      "The banana pepper occupies an interesting space — it's a chile by botany but functionally a sweet pepper by usage. Pickled rings are the format most Americans encounter, sold by the jar at every supermarket and standard at sub shops and pizzerias from coast to coast. The pepper has almost no heat (less than a green bell pepper in many cases) and instead delivers tang, slight sweetness, and crunch. The Hungarian wax pepper is a closely related cultivar with more heat — important to distinguish when shopping for seeds. For most cooking contexts, 'banana pepper' refers to the mild version.",
    culinaryUses: [
      "Pickled in rings for sandwiches, subs, and pizza toppings",
      "Sliced fresh into salads and Greek-style preparations",
      "Stuffed with cheese and breadcrumbs for an oven-baked appetizer",
      "Added to relishes and pickle blends",
      "Used in Hungarian and Eastern European cooking as a mild stuffed pepper"
    ],
    pairsWith: ["Italian-American", "American sandwiches", "Pizza", "Greek salad", "Pickled vegetables", "Eastern European"],
    funFact: "The banana pepper's status as a 'standard pizzeria topping' across the American Midwest is a 20th-century Italian-American invention — banana peppers themselves are originally from Hungary and Central Europe, not Italy.",
    affiliateKeys: ["amazon-cholula-original"],
    recipeTagMatch: ["italian", "american", "eastern european"],
    featured: false,
    source: "editorial",
    species: "annuum",
    pepperType: "fresh-pod",
    flavorNotes: ["vegetal", "sweet", "citrus"],
    history: {
      region: "Hungary and Central Europe; cultivated commercially in the US since the early 1900s",
      era: "Brought to the US by Hungarian and Eastern European immigrants in the 19th century",
      story:
        "Banana peppers descend from Hungarian cultivars that immigrants brought to the US in the 19th and early 20th centuries. The mild yellow form became commercially successful in the American Midwest, particularly Ohio and Pennsylvania, where Hungarian and Italian-American communities popularized it. Today commercial production is concentrated in California, Florida, and the Great Lakes states. The hotter Hungarian wax pepper is a close cultivar relative that diverged through separate selection."
    },
    growing: {
      usdaZones: "Perennial in 9–11, annual in 4–8",
      daysToGerminate: "7–14",
      daysToHarvest: 65,
      plantHeight: "18–30 in",
      containerFriendly: true,
      sunRequirement: "full",
      waterNeeds: "moderate",
      notes:
        "One of the most cooperative peppers for US home gardens — productive, early-fruiting, tolerant of cooler summers than habanero or chinense varieties. A single plant can produce 30–50 peppers over a season. Container-friendly with a 3-gallon pot. Harvest at yellow stage for classic banana pepper flavor; leave on the plant to ripen orange and red for a sweeter version."
    },
    buying: {
      freshAvailability: "Year-round at virtually every US grocery store. Pickled rings are standard pantry items, also year-round.",
      driedAvailability: "Not commonly dried — banana peppers are eaten fresh or pickled.",
      seedSources: ["Burpee", "Bonnie Plants", "Baker Creek", "Johnny's Selected Seeds"],
      seasonality: "Year-round; greenhouse and US field production keep fresh supply continuous.",
      notes:
        "Be careful with seed labeling: 'banana pepper' usually means the mild sweet variety, but 'Hungarian wax' or 'hot banana' refers to a hotter cultivar (5,000–15,000 SHU). Check the seed packet's heat description before planting if you specifically want the mild form."
    },
    substitutes: [
      {
        slug: "anaheim",
        ratio: "1:1",
        note: "Mild, slightly larger, similar vegetal character. Anaheim works for fresh applications; doesn't have the tangy bite that defines pickled banana peppers."
      }
    ],
    faqs: [
      {
        question: "Are banana peppers spicy?",
        answer:
          "Barely. Sweet banana peppers are 0–500 Scoville Heat Units — well below jalapeño and often imperceptibly mild. The 'heat' you taste in a pickled banana pepper is mostly the brine's vinegar and salt, not the pepper itself. Hungarian wax peppers (a related cultivar sometimes confused with banana) are significantly hotter."
      },
      {
        question: "What's the difference between banana peppers and pepperoncini?",
        answer:
          "Different peppers, often confused because both are commonly pickled, yellow-ish, and mild. Pepperoncini are smaller, slightly more wrinkled, and slightly milder; banana peppers are longer, smoother, and have a touch more sweetness. Pepperoncini originated in Greece and Italy; banana peppers in Hungary. Functionally similar but not identical."
      },
      {
        question: "Can you eat banana peppers raw?",
        answer:
          "Yes — fresh banana peppers are excellent sliced into salads, sandwiches, and Greek-style preparations. The flavor is tangy and slightly sweet, with crunch similar to a mild pepper. The yellow-pickled form is more common in the US, but the fresh form is just as useful."
      },
      {
        question: "Are Hungarian wax peppers the same as banana peppers?",
        answer:
          "Closely related but distinct cultivars. Sweet banana peppers are 0–500 SHU; Hungarian wax peppers are 5,000–15,000 SHU (similar to a jalapeño). Both are yellow and curved, which causes the confusion. If a seed packet or grocer doesn't specify, the yellow milder version is usually banana pepper; the hotter version is usually Hungarian wax."
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// Heat tier metadata
// ---------------------------------------------------------------------------

export const HEAT_TIERS: Record<HeatTier, { label: string; range: string; color: string; bgClass: string; textClass: string }> = {
  mild:      { label: "Mild",     range: "0–2,500 SHU",         color: "#4ade80", bgClass: "bg-green-400/15",  textClass: "text-green-400" },
  medium:    { label: "Medium",   range: "2,500–30,000 SHU",    color: "#facc15", bgClass: "bg-yellow-400/15", textClass: "text-yellow-400" },
  hot:       { label: "Hot",      range: "30,000–100,000 SHU",  color: "#fb923c", bgClass: "bg-orange-400/15", textClass: "text-orange-400" },
  "very-hot":{ label: "Very Hot", range: "100,000–500,000 SHU", color: "#f97316", bgClass: "bg-orange-500/15", textClass: "text-orange-500" },
  extreme:   { label: "Extreme",  range: "500,000–1.5M SHU",    color: "#ef4444", bgClass: "bg-red-500/15",    textClass: "text-red-400" },
  superhot:  { label: "Superhot", range: "1.5M+ SHU",           color: "#dc2626", bgClass: "bg-red-600/15",    textClass: "text-red-500" }
};

const TIER_ORDER: HeatTier[] = ["mild", "medium", "hot", "very-hot", "extreme", "superhot"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPepperBySlug(slug: string): Pepper | undefined {
  return PEPPERS.find((p) => p.slug === slug);
}

export function getPeppersByTier(tier: HeatTier): Pepper[] {
  return PEPPERS.filter((p) => p.heatTier === tier);
}

export function getPeppersSortedByHeat(): Pepper[] {
  return [...PEPPERS].sort((a, b) => a.scovilleMin - b.scovilleMin);
}

export function getTierOrder(): HeatTier[] {
  return TIER_ORDER;
}

export type ResolvedSubstitute = { pepper: Pepper; ratio?: string; note?: string };

export function resolveSubstitutes(pepper: Pepper): ResolvedSubstitute[] {
  if (!pepper.substitutes?.length) return [];
  const resolved: ResolvedSubstitute[] = [];
  for (const sub of pepper.substitutes) {
    const p = getPepperBySlug(sub.slug);
    if (p) resolved.push({ pepper: p, ratio: sub.ratio, note: sub.note });
  }
  return resolved;
}

export function getNeighborInScovilleScale(pepper: Pepper, direction: "hotter" | "milder"): Pepper | undefined {
  const sorted = getPeppersSortedByHeat();
  const idx = sorted.findIndex((p) => p.slug === pepper.slug);
  if (idx < 0) return undefined;
  return direction === "hotter" ? sorted[idx + 1] : sorted[idx - 1];
}

export function getPeppersByFlavorNotes(pepper: Pepper, limit = 4): Pepper[] {
  if (!pepper.flavorNotes?.length) return [];
  const targetNotes = new Set(pepper.flavorNotes);
  return PEPPERS
    .filter((p) => p.slug !== pepper.slug && p.flavorNotes?.some((n) => targetNotes.has(n)))
    .slice(0, limit);
}

// Scan arbitrary text for pepper mentions (name + aliases). Returns the
// matching peppers, ordered by first appearance in the text.
export function findPeppersInText(text: string, peppers: Pepper[] = PEPPERS): Pepper[] {
  if (!text) return [];
  const haystack = text.toLowerCase();
  const hits = peppers
    .map((p) => {
      const candidates = [p.name, ...p.aliases].map((s) => s.toLowerCase());
      let earliest = Infinity;
      for (const candidate of candidates) {
        if (!candidate) continue;
        // word-ish boundary: not preceded/followed by an alphanumeric to avoid
        // matching "carolina reaper" inside "scarolinareaper" etc.
        const re = new RegExp(`(^|[^a-z0-9])${candidate.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z0-9]|$)`);
        const match = re.exec(haystack);
        if (match && match.index < earliest) earliest = match.index;
      }
      return earliest === Infinity ? null : { pepper: p, position: earliest };
    })
    .filter((x): x is { pepper: Pepper; position: number } => x !== null)
    .sort((a, b) => a.position - b.position)
    .map((x) => x.pepper);
  return hits;
}

export function formatScoville(min: number, max: number): string {
  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` :
    n >= 1_000    ? `${Math.round(n / 1000)}K`         : String(n);
  return `${fmt(min)}–${fmt(max)} SHU`;
}

// ---------------------------------------------------------------------------
// DB layer
// ---------------------------------------------------------------------------

type PepperRow = {
  slug: string; name: string; aliases: string[]; origin: string;
  scoville_min: number; scoville_max: number; heat_tier: string;
  color: string; flavor_profile: string; description: string;
  editorial_note: string; culinary_uses: string[]; pairs_with: string[];
  fun_fact: string; affiliate_keys: string[]; recipe_tag_match: string[];
  featured: boolean;
};

function rowToPepper(row: PepperRow): Pepper {
  return {
    slug: row.slug, name: row.name, aliases: row.aliases ?? [],
    origin: row.origin as PepperOrigin,
    scovilleMin: row.scoville_min, scovilleMax: row.scoville_max,
    heatTier: row.heat_tier as HeatTier,
    color: row.color, flavorProfile: row.flavor_profile,
    description: row.description, editorialNote: row.editorial_note,
    culinaryUses: row.culinary_uses ?? [], pairsWith: row.pairs_with ?? [],
    funFact: row.fun_fact, affiliateKeys: row.affiliate_keys ?? [],
    recipeTagMatch: row.recipe_tag_match ?? [],
    featured: row.featured, source: "editorial"
  };
}

export async function getPeppersFromDb(): Promise<Pepper[]> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return PEPPERS;
    const { data, error } = await supabase
      .from("peppers").select("*").eq("status", "published").order("scoville_min");
    if (error || !data || data.length === 0) return PEPPERS;
    return (data as PepperRow[]).map(rowToPepper);
  } catch { return PEPPERS; }
}

export async function getPepperFromDb(slug: string): Promise<Pepper | undefined> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return getPepperBySlug(slug);
    const { data, error } = await supabase
      .from("peppers").select("*").eq("slug", slug).eq("status", "published").single();
    if (error || !data) return getPepperBySlug(slug);
    return rowToPepper(data as PepperRow);
  } catch { return getPepperBySlug(slug); }
}
