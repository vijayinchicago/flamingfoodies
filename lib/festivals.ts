export type FestivalRegion =
  | "northeast"
  | "southeast"
  | "south"
  | "midwest"
  | "southwest"
  | "west";

export interface Festival {
  slug: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  stateCode: string;
  region: FestivalRegion;
  /** Primary month, 1-indexed */
  month: number;
  /** Human-readable date range, e.g. "April 25–26" */
  dateRange: string;
  annual: boolean;
  website: string;
  description: string;
  tagline: string;
  /** Longer editorial paragraph shown on detail page */
  editorialNote: string;
  /** Bullet-point list of what to expect */
  whatToExpect: string[];
  /** Short paragraph for "best for" sidebar */
  bestFor: string;
  /** Paragraph for "what to pack" section — intro text */
  packIntro: string;
  /** Affiliate catalog keys to feature as "pack these" picks */
  packAffiliate: string[];
  /** Flavor/cuisine tags for recipe cross-linking */
  cuisineTags: string[];
  /** Display tags */
  tags: string[];
  featured: boolean;
}

export const FESTIVALS: Festival[] = [
  {
    slug: "zestfest-irving-tx",
    name: "ZestFest",
    shortName: "ZestFest",
    city: "Irving",
    state: "Texas",
    stateCode: "TX",
    region: "south",
    month: 1,
    dateRange: "Late January",
    annual: true,
    website: "https://zestfest.net",
    description:
      "One of the longest-running spicy food shows in the US, ZestFest packs Irving's Convention Center with hundreds of fiery vendors, live competitions, and a Fiery Food Challenge that draws heat-seekers from across the country.",
    tagline: "Where Texas heat culture starts every year.",
    editorialNote:
      "ZestFest has been kicking off the hot sauce calendar for over two decades. The vendor floor is a masterclass in what's new, weird, and wickedly hot — independent sauce makers share booths with national brands and everything is available for direct purchase. The Fiery Food Challenge is legitimately competitive, with entries judged across multiple categories. If you only do one Texas festival, this is the one to build a road trip around.",
    whatToExpect: [
      "200+ vendor booths with sauces, salsas, rubs, and hot food",
      "Fiery Food Challenge competition with tasting and judging",
      "Live cooking demonstrations from regional pitmasters",
      "Direct-buy access to small-batch indie labels",
      "Heat tolerance wall of fame — bring your ego and leave it at the door"
    ],
    bestFor:
      "Serious collectors looking to stock up on small-batch labels, and anyone who wants to kick off the year with a proper deep-dive into the US indie hot sauce scene.",
    packIntro:
      "Texas festivals reward preparation. Bring a tote for bottles, have a neutral palate reset plan (milk, bread), and come knowing your heat range so you can shop smart instead of buying everything and regretting half of it at the airport.",
    packAffiliate: [
      "amazon-cholula-original",
      "amazon-tabasco-chipotle",
      "amazon-chipotle-in-adobo",
      "amazon-digital-meat-thermometer",
      "heatonist-gift-set"
    ],
    cuisineTags: ["american", "tex-mex", "bbq"],
    tags: ["competition", "vendor market", "indoor", "family friendly"],
    featured: true
  },
  {
    slug: "national-fiery-foods-bbq-show-albuquerque",
    name: "National Fiery Foods & BBQ Show",
    shortName: "Fiery Foods Show",
    city: "Albuquerque",
    state: "New Mexico",
    stateCode: "NM",
    region: "southwest",
    month: 2,
    dateRange: "Late February – Early March",
    annual: true,
    website: "https://www.fieryfoodsshow.com",
    description:
      "The granddaddy of US spicy food events, held annually at the Sandia Resort & Casino in Albuquerque. Three days, 300+ exhibitors, and the Scovie Awards — the Oscars of the hot sauce world.",
    tagline: "The Scovie Awards stage. The biggest name in fiery food.",
    editorialNote:
      "If the hot sauce world has a capital city, it's Albuquerque in late February. The Fiery Foods Show is where the industry gathers — sauce makers, grill masters, chile farmers, and thousands of food-obsessed attendees who make the pilgrimage specifically for this. The Scovie Awards ceremony is a genuine highlight: watching indie sauce makers win alongside established brands is the kind of thing that reminds you this scene is alive and growing. New Mexico's own chile culture wraps the whole event in local context — don't leave without something Hatch-adjacent.",
    whatToExpect: [
      "300+ exhibitors spanning hot sauces, BBQ, chiles, and spicy snacks",
      "Scovie Awards ceremony — the most prestigious prizes in spicy food",
      "Sampling-first culture: everything on the floor is open for tasting",
      "Cooking competitions and live pitmaster demonstrations",
      "New Mexico chile products unavailable anywhere else nationally"
    ],
    bestFor:
      "Industry insiders, serious collectors, and anyone who wants to understand the full breadth of the US spicy food market in a single weekend.",
    packIntro:
      "Three days on a show floor is a workout. Comfortable shoes, a cooler for purchases, and a strategy for the Scovie winners table will serve you better than arriving unprepared and overwhelmed.",
    packAffiliate: [
      "amazon-chipotle-in-adobo",
      "amazon-tajin-clasico",
      "amazon-cholula-original",
      "amazon-digital-meat-thermometer",
      "heatonist-hot-ones-season-22"
    ],
    cuisineTags: ["southwest", "american", "mexican", "bbq"],
    tags: ["industry event", "competition", "scovie awards", "vendor market"],
    featured: true
  },
  {
    slug: "nyc-hot-sauce-expo-brooklyn",
    name: "NYC Hot Sauce Expo",
    shortName: "NYC Hot Sauce Expo",
    city: "Brooklyn",
    state: "New York",
    stateCode: "NY",
    region: "northeast",
    month: 4,
    dateRange: "Late April",
    annual: true,
    website: "https://www.nychotsauceexpo.com",
    description:
      "Brooklyn's biggest spicy weekend draws 10,000+ visitors across two days of sauce sampling, wing eating contests, and vendor booths that span everything from classic Louisiana-styles to avant-garde fermented single-origins.",
    tagline: "New York's heat scene, distilled into one Brooklyn weekend.",
    editorialNote:
      "The NYC Hot Sauce Expo has become one of the east coast's most anticipated food events. Brooklyn's Brooklyn Expo Center fills fast — doors open and the crowd is immediately deep at every booth. What makes this one distinct is the city's influence: you'll find sauces that draw from Caribbean, Korean, West African, and Southeast Asian traditions alongside the expected American styles. The eating contests are loud, sweaty, and absolutely worth watching. The vendor floor is where you do your shopping.",
    whatToExpect: [
      "100+ sauce vendors ranging from indie startups to cult national brands",
      "Wing eating contest with heat ladder from mild to reaper-level",
      "Craft beer pairings — hop bitterness is a real heat counter",
      "Spicy food demos and chef collaborations",
      "Direct purchase from vendors — bring extra cash and a checked bag budget"
    ],
    bestFor:
      "East Coast-based heat enthusiasts, anyone building a hot sauce collection, and people who like their food festivals with a Brooklyn energy.",
    packIntro:
      "Dairy nearby is limited on the floor — pack your own strategy. A small cooler bag for glass bottles makes airport life much easier. And have a plan for the eating contest queue — it fills up.",
    packAffiliate: [
      "amazon-walkerswood-scotch-bonnet",
      "amazon-franks-redhot",
      "amazon-fly-by-jing-sichuan-gold",
      "amazon-truff-original",
      "heatonist-los-calientes-rojo"
    ],
    cuisineTags: ["american", "caribbean", "korean", "louisiana"],
    tags: ["eating contest", "vendor market", "craft beer", "urban"],
    featured: true
  },
  {
    slug: "boston-hot-sauce-festival",
    name: "Boston Hot Sauce Festival",
    shortName: "Boston Hot Sauce Fest",
    city: "Boston",
    state: "Massachusetts",
    stateCode: "MA",
    region: "northeast",
    month: 4,
    dateRange: "Late April – Early May",
    annual: true,
    website: "https://bostonjerkfest.com/bostonhotsaucefestival",
    description:
      "Part of the Boston JerkFest Caribbean Food Festival, this event brings together New England's growing spicy food community with Caribbean vendors, sauce competitions, and live music over a full weekend.",
    tagline: "Caribbean heat meets New England appetite.",
    editorialNote:
      "Boston's hot sauce festival has a Caribbean soul that sets it apart from the standard vendor-hall format. The jerk food integration means you're eating as well as sampling — proper jerk chicken, oxtail, and roti alongside sauce booths makes this one of the better eating festivals on the circuit. The New England sauce maker scene is smaller than Texas or New York but punches above its weight, and this is where those makers get their biggest annual exposure.",
    whatToExpect: [
      "Caribbean food vendors alongside hot sauce booths",
      "Jerk cooking competitions and live judging",
      "Reggae and Caribbean music throughout both days",
      "New England-based small-batch sauce makers",
      "Outdoor-friendly format weather permitting"
    ],
    bestFor:
      "Anyone who wants to eat well and heat well in the same afternoon — this is a proper food festival first, sauce expo second.",
    packIntro:
      "Caribbean heat is a different animal from pure capsaicin — it's fruity, layered, and builds. Come prepared for scotch bonnets and habaneros, and have jerk seasoning on your shopping list for the flight home.",
    packAffiliate: [
      "amazon-walkerswood-scotch-bonnet",
      "amazon-jerk-seasoning",
      "amazon-mango-habanero-sauce",
      "amazon-encona-original",
      "amazon-queen-majesty-scotch-bonnet-ginger"
    ],
    cuisineTags: ["caribbean", "jamaican", "jerk"],
    tags: ["caribbean", "music", "food festival", "outdoor"],
    featured: false
  },
  {
    slug: "philadelphia-hot-sauce-festival",
    name: "Philadelphia Hot Sauce Festival",
    shortName: "Philly Sauce Fest",
    city: "Philadelphia",
    state: "Pennsylvania",
    stateCode: "PA",
    region: "northeast",
    month: 5,
    dateRange: "Spring (May)",
    annual: true,
    website: "https://www.phillysaucefest.com",
    description:
      "Philly's growing spicy food scene gets its annual showcase — a mix of local sauce makers, national brands, and the city's characteristic directness applied to heat tolerance contests.",
    tagline: "Philly brings the same energy to hot sauce it brings to everything.",
    editorialNote:
      "The Philadelphia Hot Sauce Festival is younger than its NYC counterpart but growing fast on the strength of its local community. Philly has a genuinely good indie food scene and several local sauce makers who've built real followings — this event is where you meet them. The format is relaxed compared to the big expos: manageable crowds, genuinely good food alongside the sampling, and a heat contest that runs all day with a lively crowd.",
    whatToExpect: [
      "Local and regional sauce makers as the primary vendors",
      "Heat challenge with multiple levels — accessible to moderate heat fans",
      "Food trucks and Philly food staples alongside sauce sampling",
      "Brewery and cider tent with heat-friendly pairings",
      "Relaxed pace compared to NYC — easier to actually talk to the makers"
    ],
    bestFor:
      "Mid-Atlantic sauce fans, anyone who prefers a smaller event with a community feel over a massive convention hall.",
    packIntro:
      "Philly's sauce scene trends toward vinegar-forward and smoke-influenced styles. If you're building a collection, look for local makers you can't find anywhere else — that's the real value here.",
    packAffiliate: [
      "amazon-crystal-hot-sauce",
      "amazon-franks-redhot",
      "amazon-tabasco-original",
      "amazon-secret-aardvark-habanero",
      "heatonist-gift-set"
    ],
    cuisineTags: ["american", "louisiana", "bbq"],
    tags: ["community", "local makers", "vendor market", "outdoor"],
    featured: false
  },
  {
    slug: "pinellas-pepper-fest-florida",
    name: "Pinellas Pepper Fest",
    shortName: "Pinellas Pepper Fest",
    city: "Pinellas Park",
    state: "Florida",
    stateCode: "FL",
    region: "southeast",
    month: 5,
    dateRange: "Early May",
    annual: true,
    website: "https://www.cayennediane.com/world-calendar-of-spicy-events-2/",
    description:
      "Florida's friendliest hot sauce gathering, the Pinellas Pepper Fest is a two-day outdoor event combining sauce vendors, live music, and the state's tropical pepper culture into one warm-weather weekend.",
    tagline: "Florida sun, Florida peppers, and no shortage of heat.",
    editorialNote:
      "Florida grows genuinely excellent peppers — the climate is ideal for habaneros, scotch bonnets, and Caribbean varieties that struggle anywhere further north. Pinellas Pepper Fest channels that agricultural reality into a community event that feels more like a neighborhood block party than a trade show. The vendor mix leans tropical: mango-habanero blends, pineapple heat sauces, and Caribbean-influenced styles dominate. Come for the sauces, stay for the Florida weirdness.",
    whatToExpect: [
      "Tropical and Caribbean-influenced sauces as a key vendor theme",
      "Outdoor format with live music throughout the day",
      "Florida-grown pepper showcases — habaneros, scotch bonnets, datils",
      "Datil pepper specialties unique to Florida's food culture",
      "Family-friendly atmosphere with accessible heat options"
    ],
    bestFor:
      "Families, anyone interested in tropical heat profiles, and Florida locals who want to support regional makers.",
    packIntro:
      "Florida heat leans fruity and bright — mango, pineapple, and citrus are common carriers. The datil pepper is a Florida original you won't find many other places; buy it if you see it.",
    packAffiliate: [
      "amazon-mango-habanero-sauce",
      "amazon-el-yucateco-red-habanero",
      "amazon-tajin-clasico",
      "amazon-yellowbird-habanero",
      "heatonist-gift-set"
    ],
    cuisineTags: ["caribbean", "florida", "tropical"],
    tags: ["outdoor", "family friendly", "tropical", "music"],
    featured: false
  },
  {
    slug: "karbach-hot-sauce-festival-houston",
    name: "Karbach Hot Sauce Festival",
    shortName: "Karbach Hot Sauce Fest",
    city: "Houston",
    state: "Texas",
    stateCode: "TX",
    region: "south",
    month: 5,
    dateRange: "Early May",
    annual: true,
    website: "https://www.cayennediane.com/world-calendar-of-spicy-events-2/",
    description:
      "Hosted by Karbach Brewing, this Houston institution combines craft beer and fire in equal measure — dozens of sauce vendors, eating contests, and all the cold beer you need to survive the May Texas heat.",
    tagline: "Beer and heat, Houston-style.",
    editorialNote:
      "Karbach figured out that craft beer and hot sauce are natural partners, and built a festival around that pairing. The combination works: bitter hop profiles cut capsaicin cleanly, and the brewing campus is designed for large outdoor events. Houston's sauce scene draws heavily from its Gulf Coast and Mexican heritage — you'll find Tex-Mex-influenced sauces and Gulf seafood-forward styles that don't show up in inland Texas events. The eating contest is properly competitive with a crowd that knows how to appreciate heat culture.",
    whatToExpect: [
      "Craft beer pairings from Karbach's full catalog alongside every sauce",
      "Houston-specific Tex-Mex and Gulf Coast sauce styles",
      "Eating contest on the outdoor stage with a proper bracket format",
      "Food trucks from Houston's excellent taco and BBQ scenes",
      "Outdoor brewing campus — large open space, good for crowds"
    ],
    bestFor:
      "Craft beer drinkers who also love heat, Houston food lovers, and anyone who appreciates a festival with genuine brewing infrastructure.",
    packIntro:
      "Gulf Coast hot sauce has a brininess and depth that's specific to the region — seafood-forward styles and Louisiana-influenced blends dominate. Stock up on things you genuinely can't get in your local grocery aisle.",
    packAffiliate: [
      "amazon-tabasco-original",
      "amazon-crystal-hot-sauce",
      "amazon-cajun-seasoning",
      "amazon-pain-is-good-louisiana",
      "amazon-chipotle-in-adobo"
    ],
    cuisineTags: ["tex-mex", "louisiana", "gulf coast", "bbq"],
    tags: ["craft beer", "outdoor", "eating contest", "texas"],
    featured: false
  },
  {
    slug: "hop-sauce-fest-beach-haven-nj",
    name: "Hop Sauce Fest",
    shortName: "Hop Sauce Fest",
    city: "Beach Haven",
    state: "New Jersey",
    stateCode: "NJ",
    region: "northeast",
    month: 6,
    dateRange: "Mid June",
    annual: true,
    website: "https://www.cayennediane.com/world-calendar-of-spicy-events-2/",
    description:
      "A beach town hot sauce festival that leans hard into the craft beer pairing angle — Hop Sauce Fest brings together Jersey Shore summer energy with a genuine sauce-tasting format at Long Beach Island.",
    tagline: "Hops, heat, and a Jersey Shore summer.",
    editorialNote:
      "The name is the concept: hop bitterness and hot sauce capsaicin are complementary flavors, and Hop Sauce Fest builds its entire event around that pairing. It's a smaller event than the major expos but the beachside location in Beach Haven makes it one of the most pleasant summer festival experiences on the east coast. Long Beach Island is a legitimate summer destination — plan a full weekend around it rather than treating it as a day trip.",
    whatToExpect: [
      "Craft IPA and hop-forward beer lineup curated to pair with hot sauce",
      "40+ sauce vendors with a Northeast US focus",
      "Beachside outdoor setting at Long Beach Island",
      "Relaxed weekend pace — more like a food fair than a convention",
      "Eating contest with an appreciative crowd"
    ],
    bestFor:
      "Craft beer lovers who want a summer weekend destination built around food, and northeast sauce fans who enjoy a festival with actual character.",
    packIntro:
      "Pack for a beach day with a sauce detour. The outdoor format means comfortable shoes, sun protection, and a cooler bag in the car for glass purchases.",
    packAffiliate: [
      "amazon-secret-aardvark-habanero",
      "amazon-yellowbird-serrano",
      "amazon-tabasco-green",
      "amazon-cholula-original",
      "heatonist-los-calientes-rojo"
    ],
    cuisineTags: ["american", "northeast"],
    tags: ["craft beer", "beach", "outdoor", "summer"],
    featured: false
  },
  {
    slug: "pdx-hot-sauce-expo-portland",
    name: "PDX Hot Sauce Expo",
    shortName: "PDX Hot Sauce Expo",
    city: "Portland",
    state: "Oregon",
    stateCode: "OR",
    region: "west",
    month: 8,
    dateRange: "Early August",
    annual: true,
    website: "https://www.pdxhotsauceexpo.com",
    description:
      "Portland brings its food-obsessed, craft-everything culture to hot sauce in the form of the PDX Hot Sauce Expo — a two-day celebration of Pacific Northwest sauce makers and the fermented, funky, and fiery.",
    tagline: "Portland weird, Portland hot, Portland exact.",
    editorialNote:
      "Portland's food culture is exacting in a way that benefits a hot sauce festival enormously. The makers here care deeply about fermentation processes, ingredient sourcing, and flavor complexity in a way that's less common at the bigger regional expos. You'll find sauces with unusual bases — fermented blueberry, aged miso heat, Pacific Northwest berry habanero blends — alongside excellent Oregon-chile staples. Secret Aardvark, one of the best-regarded sauces in the country, has local roots here. The expo also aligns with Portland's August outdoor festival culture.",
    whatToExpect: [
      "Pacific Northwest sauce makers heavily represented — fermented and craft-focused",
      "Two-day format with fresh vendor arrivals and restocks each day",
      "Beer garden with Oregon craft breweries",
      "Unusual flavor profiles unavailable elsewhere — foraged, fermented, fruit-forward",
      "Chef collaborations and cooking demos"
    ],
    bestFor:
      "Food nerds, fermentation enthusiasts, and anyone who's maxed out on standard vinegar-based styles and wants something genuinely different.",
    packIntro:
      "Pacific Northwest sauce makers experiment with fermentation in ways the rest of the country hasn't caught up to yet. Budget time to talk to the makers — they're the most accessible of any expo on the circuit.",
    packAffiliate: [
      "amazon-secret-aardvark-habanero",
      "amazon-truff-original",
      "amazon-fly-by-jing-sichuan-gold",
      "amazon-yellowbird-ghost-pepper",
      "amazon-fermentation-jar-kit"
    ],
    cuisineTags: ["american", "pacific northwest", "fermented"],
    tags: ["craft", "fermentation", "outdoor", "pacific northwest"],
    featured: true
  },
  {
    slug: "austin-chronicle-hot-sauce-festival",
    name: "Austin Chronicle Hot Sauce Festival",
    shortName: "Austin Hot Sauce Festival",
    city: "Austin",
    state: "Texas",
    stateCode: "TX",
    region: "south",
    month: 9,
    dateRange: "Late August – September",
    annual: true,
    website: "https://www.theflashlist.com/annual-events/08/usa/texas/central/austin/hot-sauce-festival/information-on-austin-chronicle-spicy-salsa-food-competition.html",
    description:
      "The Austin Chronicle's beloved annual fundraiser for the Central Texas Food Bank, held at Fiesta Gardens. Amateur and professional sauce makers compete in a blind judging competition that's now one of the most respected in the country.",
    tagline: "Austin's hottest fundraiser. Literally.",
    editorialNote:
      "The Austin Chronicle Hot Sauce Festival has been running for over 30 years and has become something of a civic institution. The blind judging format means that amateur home-brew sauce makers compete on equal footing with professional operations — and frequently win. That democratic energy carries through the whole event: it's a genuine community celebration rather than a commercial expo. The Fiesta Gardens setting on the Colorado River is beautiful in the early Austin fall. The charity angle means the money you spend on tickets and sauce directly supports local food access.",
    whatToExpect: [
      "Blind judging competition — amateur and professional categories",
      "Over 700 entries historically, with a massive sampling floor",
      "Live music from Austin's always-rich scene",
      "Fiesta Gardens setting on the Colorado River",
      "Full food vendor presence — eat your way through the day"
    ],
    bestFor:
      "Everyone. Genuinely. Families, seasoned heat enthusiasts, first-timers — the Austin festival is the most accessible and community-oriented event on this list.",
    packIntro:
      "Austin in September is still hot in the weather sense. Pace yourself on the sampling, have food before you start the heat wall, and budget for live music. The sauce competition line is long — get there when doors open.",
    packAffiliate: [
      "amazon-tabasco-chipotle",
      "amazon-cholula-original",
      "amazon-texas-pete",
      "amazon-tajin-clasico",
      "amazon-digital-meat-thermometer"
    ],
    cuisineTags: ["texas", "american", "tex-mex"],
    tags: ["competition", "charity", "live music", "family friendly", "blind judging"],
    featured: true
  },
  {
    slug: "hatch-chile-festival-new-mexico",
    name: "Hatch Chile Festival",
    shortName: "Hatch Chile Fest",
    city: "Hatch",
    state: "New Mexico",
    stateCode: "NM",
    region: "southwest",
    month: 9,
    dateRange: "Labor Day Weekend",
    annual: true,
    website: "https://www.hatchchilefest.com",
    description:
      "The world's most famous chile-growing town celebrates its harvest with a Labor Day weekend festival that brings hundreds of thousands of visitors to a town of 1,600 people. Fresh-roasted Hatch chiles, green chile cheeseburgers, and the full spectrum of New Mexico's chile culture.",
    tagline: "The harvest festival that defined American chile culture.",
    editorialNote:
      "Hatch is a town of about 1,600 people that produces chiles so good they've become a proper noun in American food. The festival arrives each Labor Day to celebrate the harvest — the smell of chiles roasting in massive drums over open flame is the defining sensory memory of the event. Everything here is about the fresh green chile: stacked enchiladas, green chile cheeseburgers, chile-stuffed sopapillas, raw chiles sold by the bushel for home roasting. It's agricultural tourism done right, and nothing else on this list tastes quite like a Labor Day in Hatch.",
    whatToExpect: [
      "Fresh green and red Hatch chile roasting stations — the signature smell of the festival",
      "Green chile cheeseburgers served from dozens of vendors",
      "Whole chile sales by the bushel — bring a cooler",
      "New Mexico red and green chile sauces direct from local producers",
      "Chile cookoff competition with serious local talent"
    ],
    bestFor:
      "Anyone who loves New Mexico food culture, home cooks who want to roast and freeze their own Hatch chiles, and road-trippers who want to build an itinerary around a genuinely unique American food event.",
    packIntro:
      "Bring a large cooler specifically for the roasted chiles you'll buy to take home. The fresh-roasted flavor fades fast — freeze them the same day. And order the green chile cheeseburger from at least three different vendors before you leave.",
    packAffiliate: [
      "amazon-chipotle-in-adobo",
      "amazon-tajin-clasico",
      "amazon-cholula-green-tomatillo",
      "amazon-immersion-blender",
      "amazon-fermentation-jar-kit"
    ],
    cuisineTags: ["new mexican", "southwest", "mexican"],
    tags: ["harvest festival", "agricultural", "outdoor", "family friendly", "road trip"],
    featured: true
  },
  {
    slug: "new-england-hot-sauce-fest",
    name: "New England Hot Sauce Fest",
    shortName: "New England Hot Sauce Fest",
    city: "New England",
    state: "Massachusetts",
    stateCode: "MA",
    region: "northeast",
    month: 9,
    dateRange: "Fall (September)",
    annual: true,
    website: "https://www.newenglandhotsaucefest.com",
    description:
      "New England's dedicated hot sauce gathering, celebrating the region's growing indie sauce maker community with tastings, competition, and a farmer's market feel that fits the region's food culture.",
    tagline: "Fall foliage and fire — New England's heat calendar.",
    editorialNote:
      "New England has a smaller hot sauce scene than Texas or the southeast, but what it lacks in volume it makes up in craft and originality. The New England Hot Sauce Fest reflects that: fewer booths, more maker conversations, and a genuinely collegial atmosphere where you can get the full story behind every bottle. The fall timing is ideal — foliage season, sweater weather, and a cup of something hot in your hand.",
    whatToExpect: [
      "30–50 regional vendors with strong New England representation",
      "Sauce competition with local judges and blind tasting",
      "Farmer's market crossover — local produce and specialty foods alongside sauces",
      "Fall outdoor setting — weather-dependent but typically beautiful",
      "Easy pace; good for beginners and enthusiasts equally"
    ],
    bestFor:
      "New England residents and fall foliage trip-planners who want to add a food event to their October agenda.",
    packIntro:
      "New England sauce makers trend toward apple cider vinegar bases and local pepper varieties. Look for anything fermented with local apples or using New England farm peppers — those are the distinctive regional finds.",
    packAffiliate: [
      "amazon-crystal-hot-sauce",
      "amazon-tabasco-original",
      "amazon-yellowbird-serrano",
      "amazon-secret-aardvark-habanero",
      "heatonist-gift-set"
    ],
    cuisineTags: ["american", "northeast"],
    tags: ["community", "fall", "outdoor", "regional makers"],
    featured: false
  },
  {
    slug: "nc-hot-sauce-festival-oxford",
    name: "NC Hot Sauce Festival & Contest",
    shortName: "NC Hot Sauce Festival",
    city: "Oxford",
    state: "North Carolina",
    stateCode: "NC",
    region: "southeast",
    month: 10,
    dateRange: "October",
    annual: true,
    website: "https://nchotsaucecontestandfestival.com",
    description:
      "Downtown Oxford, NC transforms into the South's most approachable hot sauce gathering — a weekend festival and competition that draws Carolinas makers alongside national brands for a genuinely great small-town food event.",
    tagline: "Small town, serious heat, Carolina soul.",
    editorialNote:
      "Oxford might be small but the NC Hot Sauce Festival draws talent from across the Carolinas and beyond. The downtown festival format — sauce booths lining the main street — creates a walkable, unhurried experience that's rare at larger events. The Carolinas sauce tradition runs deep: vinegar-forward, pepper-heavy, with a BBQ-adjacent sensibility that shows up in the entries. If you're looking for the authentically Southern face of American hot sauce culture rather than the Instagram version of it, Oxford is the trip to take.",
    whatToExpect: [
      "Downtown Oxford format — festival runs along Main Street",
      "Carolinas sauce makers representing a genuine regional tradition",
      "Hot sauce contest with amateur and professional categories",
      "Southern BBQ food vendors alongside sauce booths",
      "Approachable crowd, beginner-friendly heat options available"
    ],
    bestFor:
      "Southeast US residents, anyone interested in Southern vinegar-forward sauce traditions, and road-trippers looking for an authentic small-town fall festival experience.",
    packIntro:
      "Carolina sauce means sharp, bright, vinegar-forward heat — a world away from the fruit-forward styles you find on the coasts. Come knowing that flavor profile, and the bottles you find here will make sense in your kitchen.",
    packAffiliate: [
      "amazon-crystal-hot-sauce",
      "amazon-texas-pete",
      "amazon-franks-redhot",
      "amazon-pain-is-good-louisiana",
      "amazon-tabasco-original"
    ],
    cuisineTags: ["southern", "carolina", "bbq"],
    tags: ["small town", "outdoor", "carolinas", "competition", "family friendly"],
    featured: false
  },
  {
    slug: "peppers-at-the-beach-rehoboth",
    name: "Peppers at the Beach",
    shortName: "Peppers at the Beach",
    city: "Rehoboth Beach",
    state: "Delaware",
    stateCode: "DE",
    region: "northeast",
    month: 10,
    dateRange: "Mid October",
    annual: true,
    website: "https://www.peppersatthebeach.com",
    description:
      "One of the east coast's most beloved fall festivals, Peppers at the Beach combines Rehoboth's boardwalk resort culture with a two-day hot sauce and spicy food celebration that draws serious collectors and families alike.",
    tagline: "The east coast's best fall sauce weekend.",
    editorialNote:
      "Rehoboth Beach in October is a good place to be — summer crowds gone, beach town energy relaxed, weather crisp enough to actually enjoy spicy food properly. Peppers at the Beach has been building a loyal following for years based on a combination of great vendor curation, a well-run competition, and the pleasures of eating fire in a coastal resort town. The nearby outlet shopping and seafood restaurants make it a full weekend destination rather than just a day trip.",
    whatToExpect: [
      "100+ sauce vendors with strong mid-Atlantic and national representation",
      "Hot sauce competition — one of the better-organized on the east coast",
      "Boardwalk proximity — eat festival food with an ocean backdrop",
      "Fall beach town atmosphere — relaxed, welcoming, unhurried",
      "Craft beer and cider pairings"
    ],
    bestFor:
      "East coast sauce enthusiasts, fall travel planners, anyone who wants a full weekend destination built around good food and heat.",
    packIntro:
      "October at the Delaware shore is cool enough that capsaicin actually keeps you comfortable. The vendor floor rewards patience — take one full pass before buying anything so you can make deliberate choices.",
    packAffiliate: [
      "amazon-el-yucateco-red-habanero",
      "amazon-daves-ghost-pepper",
      "amazon-yellowbird-ghost-pepper",
      "amazon-bravado-black-garlic-reaper",
      "heatonist-hot-ones-season-22"
    ],
    cuisineTags: ["american", "northeast", "mid-atlantic"],
    tags: ["beach", "fall", "competition", "weekend destination", "family friendly"],
    featured: false
  },
  {
    slug: "galveston-island-hot-sauce-fest",
    name: "Galveston Island Hot Sauce Fest",
    shortName: "Galveston Hot Sauce Fest",
    city: "Galveston",
    state: "Texas",
    stateCode: "TX",
    region: "south",
    month: 5,
    dateRange: "Early May",
    annual: true,
    website: "https://www.cayennediane.com/world-calendar-of-spicy-events-2/",
    description:
      "Texas meets the Gulf on Galveston Island for an outdoor hot sauce festival that pairs the island's seafood culture with fierce local sauce competition and a backdrop you won't find at any inland Texas event.",
    tagline: "Gulf heat, island setting, Texas-sized flavor.",
    editorialNote:
      "Galveston is an unusual setting for a hot sauce festival — which is exactly what makes it interesting. The Gulf Coast seafood culture bleeds into every sauce booth; you'll find styles built specifically for shrimp, oysters, and Gulf fish that don't exist in Austin or Dallas. The island setting keeps the crowd manageable and the atmosphere relaxed. If you're doing a Texas sauce festival tour, Galveston is the one that fills a flavor gap the others don't cover.",
    whatToExpect: [
      "Gulf Coast-influenced sauce styles — built for seafood",
      "Outdoor Island setting with Gulf Coast atmosphere",
      "Texas-scale eating contests and competitions",
      "Seafood food vendors alongside sauce booths",
      "Manageable crowd compared to Dallas/Austin events"
    ],
    bestFor:
      "Gulf Coast residents, seafood lovers who want sauces built for fish and shellfish, and Texas sauce circuit completionists.",
    packIntro:
      "Galveston sauces are built for the coast — briny, citrus-forward, and well-matched to seafood. Look for anything designed specifically for Gulf shrimp or oysters; those are the regional signatures.",
    packAffiliate: [
      "amazon-tabasco-original",
      "amazon-crystal-hot-sauce",
      "amazon-cajun-seasoning",
      "amazon-cholula-original",
      "amazon-el-yucateco-green-habanero"
    ],
    cuisineTags: ["gulf coast", "tex-mex", "seafood"],
    tags: ["gulf coast", "outdoor", "seafood", "island setting"],
    featured: false
  }
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function getFestivalBySlug(slug: string): Festival | undefined {
  return FESTIVALS.find((f) => f.slug === slug);
}

export function getFestivalsByMonth(): Map<number, Festival[]> {
  const map = new Map<number, Festival[]>();
  for (const f of FESTIVALS) {
    const bucket = map.get(f.month) ?? [];
    bucket.push(f);
    map.set(f.month, bucket);
  }
  return map;
}

export function getFestivalsByRegion(region: FestivalRegion): Festival[] {
  return FESTIVALS.filter((f) => f.region === region);
}

export function getCurrentAndUpcomingFestivals(currentMonth: number): Festival[] {
  return FESTIVALS.filter((f) => f.month >= currentMonth && f.month <= currentMonth + 2);
}

export function getFeaturedFestivals(): Festival[] {
  return FESTIVALS.filter((f) => f.featured);
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "";
}

export function getRegionLabel(region: FestivalRegion): string {
  const labels: Record<FestivalRegion, string> = {
    northeast: "Northeast",
    southeast: "Southeast",
    south: "South",
    midwest: "Midwest",
    southwest: "Southwest",
    west: "West"
  };
  return labels[region];
}

// ---------------------------------------------------------------------------
// DB layer — reads from Supabase, falls back to static FESTIVALS array
// ---------------------------------------------------------------------------

// Shape returned by Supabase (snake_case)
type FestivalRow = {
  slug: string;
  name: string;
  short_name: string;
  city: string;
  state: string;
  state_code: string;
  region: string;
  month: number;
  date_range: string;
  annual: boolean;
  website: string;
  description: string;
  tagline: string;
  editorial_note: string;
  what_to_expect: string[];
  best_for: string;
  pack_intro: string;
  pack_affiliate: string[];
  cuisine_tags: string[];
  tags: string[];
  featured: boolean;
};

function rowToFestival(row: FestivalRow): Festival {
  return {
    slug: row.slug,
    name: row.name,
    shortName: row.short_name || row.name,
    city: row.city,
    state: row.state,
    stateCode: row.state_code,
    region: (row.region as FestivalRegion) || "south",
    month: row.month,
    dateRange: row.date_range,
    annual: row.annual,
    website: row.website,
    description: row.description,
    tagline: row.tagline,
    editorialNote: row.editorial_note,
    whatToExpect: row.what_to_expect ?? [],
    bestFor: row.best_for,
    packIntro: row.pack_intro,
    packAffiliate: row.pack_affiliate ?? [],
    cuisineTags: row.cuisine_tags ?? [],
    tags: row.tags ?? [],
    featured: row.featured
  };
}

/**
 * Load all published festivals from DB, falling back to the static array
 * if Supabase is unavailable or the table doesn't exist yet.
 */
export async function getFestivalsFromDb(): Promise<Festival[]> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return FESTIVALS;

    const { data, error } = await supabase
      .from("festivals")
      .select("*")
      .eq("status", "published")
      .order("month", { ascending: true });

    if (error || !data || data.length === 0) return FESTIVALS;

    return (data as FestivalRow[]).map(rowToFestival);
  } catch {
    return FESTIVALS;
  }
}

/**
 * Load a single festival by slug from DB, falling back to static data.
 */
export async function getFestivalFromDb(slug: string): Promise<Festival | undefined> {
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseServerClient();
    if (!supabase) return getFestivalBySlug(slug);

    const { data, error } = await supabase
      .from("festivals")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !data) return getFestivalBySlug(slug);

    return rowToFestival(data as FestivalRow);
  } catch {
    return getFestivalBySlug(slug);
  }
}

/**
 * Count AI-discovered festivals awaiting admin review.
 * Used by the admin dashboard.
 */
export async function getDraftFestivalCount(): Promise<number> {
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/server");
    const supabase = createSupabaseAdminClient();
    if (!supabase) return 0;

    const { count } = await supabase
      .from("festivals")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft")
      .eq("source", "ai_discovered");

    return count ?? 0;
  } catch {
    return 0;
  }
}
