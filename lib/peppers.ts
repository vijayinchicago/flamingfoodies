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
