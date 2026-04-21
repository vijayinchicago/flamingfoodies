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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
    source: "editorial"
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
