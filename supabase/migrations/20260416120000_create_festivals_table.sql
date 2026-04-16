-- Festivals table: seeded from static data, grown nightly by the discovery agent
CREATE TABLE IF NOT EXISTS festivals (
  id            BIGSERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  short_name    TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  state         TEXT NOT NULL DEFAULT '',
  state_code    TEXT NOT NULL DEFAULT '',
  region        TEXT NOT NULL DEFAULT 'south',
  month         INTEGER NOT NULL DEFAULT 1,
  date_range    TEXT NOT NULL DEFAULT '',
  annual        BOOLEAN NOT NULL DEFAULT true,
  website       TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  tagline       TEXT NOT NULL DEFAULT '',
  editorial_note TEXT NOT NULL DEFAULT '',
  what_to_expect TEXT[] NOT NULL DEFAULT '{}',
  best_for      TEXT NOT NULL DEFAULT '',
  pack_intro    TEXT NOT NULL DEFAULT '',
  pack_affiliate TEXT[] NOT NULL DEFAULT '{}',
  cuisine_tags  TEXT[] NOT NULL DEFAULT '{}',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  featured      BOOLEAN NOT NULL DEFAULT false,
  -- provenance
  source        TEXT NOT NULL DEFAULT 'editorial', -- 'editorial' | 'ai_discovered'
  status        TEXT NOT NULL DEFAULT 'published', -- 'draft' | 'published'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automatically bump updated_at on row change
CREATE OR REPLACE FUNCTION set_festivals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER festivals_updated_at
  BEFORE UPDATE ON festivals
  FOR EACH ROW EXECUTE FUNCTION set_festivals_updated_at();

-- Public read, no public writes
ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "festivals_public_read" ON festivals FOR SELECT USING (status = 'published');

-- Seed: the 15 editorial festivals from lib/festivals.ts
INSERT INTO festivals (slug, name, short_name, city, state, state_code, region, month, date_range, annual, website, description, tagline, editorial_note, what_to_expect, best_for, pack_intro, pack_affiliate, cuisine_tags, tags, featured, source) VALUES

('zestfest-irving-tx', 'ZestFest', 'ZestFest', 'Irving', 'Texas', 'TX', 'south', 1, 'Late January', true, 'https://zestfest.net',
'One of the longest-running spicy food shows in the US, ZestFest packs Irving''s Convention Center with hundreds of fiery vendors, live competitions, and a Fiery Food Challenge that draws heat-seekers from across the country.',
'Where Texas heat culture starts every year.',
'ZestFest has been kicking off the hot sauce calendar for over two decades. The vendor floor is a masterclass in what''s new, weird, and wickedly hot — independent sauce makers share booths with national brands and everything is available for direct purchase.',
ARRAY['200+ vendor booths with sauces, salsas, rubs, and hot food','Fiery Food Challenge competition with tasting and judging','Live cooking demonstrations from regional pitmasters','Direct-buy access to small-batch indie labels','Heat tolerance wall of fame — bring your ego and leave it at the door'],
'Serious collectors looking to stock up on small-batch labels, and anyone who wants to kick off the year with a proper deep-dive into the US indie hot sauce scene.',
'Texas festivals reward preparation. Bring a tote for bottles, have a neutral palate reset plan (milk, bread), and come knowing your heat range so you can shop smart.',
ARRAY['amazon-cholula-original','amazon-tabasco-chipotle','amazon-chipotle-in-adobo','amazon-digital-meat-thermometer','heatonist-gift-set'],
ARRAY['american','tex-mex','bbq'], ARRAY['competition','vendor market','indoor','family friendly'], true, 'editorial'),

('national-fiery-foods-bbq-show-albuquerque', 'National Fiery Foods & BBQ Show', 'Fiery Foods Show', 'Albuquerque', 'New Mexico', 'NM', 'southwest', 2, 'Late February – Early March', true, 'https://www.fieryfoodsshow.com',
'The granddaddy of US spicy food events, held annually at the Sandia Resort & Casino in Albuquerque. Three days, 300+ exhibitors, and the Scovie Awards — the Oscars of the hot sauce world.',
'The Scovie Awards stage. The biggest name in fiery food.',
'If the hot sauce world has a capital city, it''s Albuquerque in late February. The Fiery Foods Show is where the industry gathers — sauce makers, grill masters, chile farmers, and thousands of food-obsessed attendees who make the pilgrimage specifically for this.',
ARRAY['300+ exhibitors spanning hot sauces, BBQ, chiles, and spicy snacks','Scovie Awards ceremony — the most prestigious prizes in spicy food','Sampling-first culture: everything on the floor is open for tasting','Cooking competitions and live pitmaster demonstrations','New Mexico chile products unavailable anywhere else nationally'],
'Industry insiders, serious collectors, and anyone who wants to understand the full breadth of the US spicy food market in a single weekend.',
'Three days on a show floor is a workout. Comfortable shoes, a cooler for purchases, and a strategy for the Scovie winners table will serve you better than arriving unprepared.',
ARRAY['amazon-chipotle-in-adobo','amazon-tajin-clasico','amazon-cholula-original','amazon-digital-meat-thermometer','heatonist-hot-ones-season-22'],
ARRAY['southwest','american','mexican','bbq'], ARRAY['industry event','competition','scovie awards','vendor market'], true, 'editorial'),

('nyc-hot-sauce-expo-brooklyn', 'NYC Hot Sauce Expo', 'NYC Hot Sauce Expo', 'Brooklyn', 'New York', 'NY', 'northeast', 4, 'Late April', true, 'https://www.nychotsauceexpo.com',
'Brooklyn''s biggest spicy weekend draws 10,000+ visitors across two days of sauce sampling, wing eating contests, and vendor booths that span everything from classic Louisiana-styles to avant-garde fermented single-origins.',
'New York''s heat scene, distilled into one Brooklyn weekend.',
'The NYC Hot Sauce Expo has become one of the east coast''s most anticipated food events. What makes this one distinct is the city''s influence: you''ll find sauces that draw from Caribbean, Korean, West African, and Southeast Asian traditions alongside the expected American styles.',
ARRAY['100+ sauce vendors ranging from indie startups to cult national brands','Wing eating contest with heat ladder from mild to reaper-level','Craft beer pairings — hop bitterness is a real heat counter','Spicy food demos and chef collaborations','Direct purchase from vendors — bring extra cash and a checked bag budget'],
'East Coast-based heat enthusiasts, anyone building a hot sauce collection, and people who like their food festivals with a Brooklyn energy.',
'Dairy nearby is limited on the floor — pack your own strategy. A small cooler bag for glass bottles makes airport life much easier.',
ARRAY['amazon-walkerswood-scotch-bonnet','amazon-franks-redhot','amazon-fly-by-jing-sichuan-gold','amazon-truff-original','heatonist-los-calientes-rojo'],
ARRAY['american','caribbean','korean','louisiana'], ARRAY['eating contest','vendor market','craft beer','urban'], true, 'editorial'),

('boston-hot-sauce-festival', 'Boston Hot Sauce Festival', 'Boston Hot Sauce Fest', 'Boston', 'Massachusetts', 'MA', 'northeast', 4, 'Late April – Early May', true, 'https://bostonjerkfest.com/bostonhotsaucefestival',
'Part of the Boston JerkFest Caribbean Food Festival, this event brings together New England''s growing spicy food community with Caribbean vendors, sauce competitions, and live music over a full weekend.',
'Caribbean heat meets New England appetite.',
'Boston''s hot sauce festival has a Caribbean soul that sets it apart from the standard vendor-hall format. The jerk food integration means you''re eating as well as sampling.',
ARRAY['Caribbean food vendors alongside hot sauce booths','Jerk cooking competitions and live judging','Reggae and Caribbean music throughout both days','New England-based small-batch sauce makers','Outdoor-friendly format weather permitting'],
'Anyone who wants to eat well and heat well in the same afternoon — this is a proper food festival first, sauce expo second.',
'Caribbean heat is a different animal from pure capsaicin — it''s fruity, layered, and builds. Come prepared for scotch bonnets and habaneros.',
ARRAY['amazon-walkerswood-scotch-bonnet','amazon-jerk-seasoning','amazon-mango-habanero-sauce','amazon-encona-original','amazon-queen-majesty-scotch-bonnet-ginger'],
ARRAY['caribbean','jamaican','jerk'], ARRAY['caribbean','music','food festival','outdoor'], false, 'editorial'),

('philadelphia-hot-sauce-festival', 'Philadelphia Hot Sauce Festival', 'Philly Sauce Fest', 'Philadelphia', 'Pennsylvania', 'PA', 'northeast', 5, 'Spring (May)', true, 'https://www.phillysaucefest.com',
'Philly''s growing spicy food scene gets its annual showcase — a mix of local sauce makers, national brands, and the city''s characteristic directness applied to heat tolerance contests.',
'Philly brings the same energy to hot sauce it brings to everything.',
'The Philadelphia Hot Sauce Festival is younger than its NYC counterpart but growing fast on the strength of its local community. Philly has a genuinely good indie food scene and several local sauce makers who''ve built real followings.',
ARRAY['Local and regional sauce makers as the primary vendors','Heat challenge with multiple levels — accessible to moderate heat fans','Food trucks and Philly food staples alongside sauce sampling','Brewery and cider tent with heat-friendly pairings','Relaxed pace compared to NYC — easier to actually talk to the makers'],
'Mid-Atlantic sauce fans, anyone who prefers a smaller event with a community feel over a massive convention hall.',
'Philly''s sauce scene trends toward vinegar-forward and smoke-influenced styles. Look for local makers you can''t find anywhere else.',
ARRAY['amazon-crystal-hot-sauce','amazon-franks-redhot','amazon-tabasco-original','amazon-secret-aardvark-habanero','heatonist-gift-set'],
ARRAY['american','louisiana','bbq'], ARRAY['community','local makers','vendor market','outdoor'], false, 'editorial'),

('pinellas-pepper-fest-florida', 'Pinellas Pepper Fest', 'Pinellas Pepper Fest', 'Pinellas Park', 'Florida', 'FL', 'southeast', 5, 'Early May', true, 'https://www.cayennediane.com/world-calendar-of-spicy-events-2/',
'Florida''s friendliest hot sauce gathering, the Pinellas Pepper Fest is a two-day outdoor event combining sauce vendors, live music, and the state''s tropical pepper culture into one warm-weather weekend.',
'Florida sun, Florida peppers, and no shortage of heat.',
'Florida grows genuinely excellent peppers — the climate is ideal for habaneros, scotch bonnets, and Caribbean varieties. Pinellas Pepper Fest channels that agricultural reality into a community event that feels more like a neighborhood block party than a trade show.',
ARRAY['Tropical and Caribbean-influenced sauces as a key vendor theme','Outdoor format with live music throughout the day','Florida-grown pepper showcases — habaneros, scotch bonnets, datils','Datil pepper specialties unique to Florida''s food culture','Family-friendly atmosphere with accessible heat options'],
'Families, anyone interested in tropical heat profiles, and Florida locals who want to support regional makers.',
'Florida heat leans fruity and bright — mango, pineapple, and citrus are common carriers. The datil pepper is a Florida original you won''t find many other places; buy it if you see it.',
ARRAY['amazon-mango-habanero-sauce','amazon-el-yucateco-red-habanero','amazon-tajin-clasico','amazon-yellowbird-habanero','heatonist-gift-set'],
ARRAY['caribbean','florida','tropical'], ARRAY['outdoor','family friendly','tropical','music'], false, 'editorial'),

('karbach-hot-sauce-festival-houston', 'Karbach Hot Sauce Festival', 'Karbach Hot Sauce Fest', 'Houston', 'Texas', 'TX', 'south', 5, 'Early May', true, 'https://www.cayennediane.com/world-calendar-of-spicy-events-2/',
'Hosted by Karbach Brewing, this Houston institution combines craft beer and fire in equal measure — dozens of sauce vendors, eating contests, and all the cold beer you need to survive the May Texas heat.',
'Beer and heat, Houston-style.',
'Karbach figured out that craft beer and hot sauce are natural partners, and built a festival around that pairing. Houston''s sauce scene draws heavily from its Gulf Coast and Mexican heritage.',
ARRAY['Craft beer pairings from Karbach''s full catalog alongside every sauce','Houston-specific Tex-Mex and Gulf Coast sauce styles','Eating contest on the outdoor stage with a proper bracket format','Food trucks from Houston''s excellent taco and BBQ scenes','Outdoor brewing campus — large open space, good for crowds'],
'Craft beer drinkers who also love heat, Houston food lovers, and anyone who appreciates a festival with genuine brewing infrastructure.',
'Gulf Coast hot sauce has a brininess and depth that''s specific to the region. Stock up on things you genuinely can''t get in your local grocery aisle.',
ARRAY['amazon-tabasco-original','amazon-crystal-hot-sauce','amazon-cajun-seasoning','amazon-pain-is-good-louisiana','amazon-chipotle-in-adobo'],
ARRAY['tex-mex','louisiana','gulf coast','bbq'], ARRAY['craft beer','outdoor','eating contest','texas'], false, 'editorial'),

('hop-sauce-fest-beach-haven-nj', 'Hop Sauce Fest', 'Hop Sauce Fest', 'Beach Haven', 'New Jersey', 'NJ', 'northeast', 6, 'Mid June', true, 'https://www.cayennediane.com/world-calendar-of-spicy-events-2/',
'A beach town hot sauce festival that leans hard into the craft beer pairing angle — Hop Sauce Fest brings together Jersey Shore summer energy with a genuine sauce-tasting format at Long Beach Island.',
'Hops, heat, and a Jersey Shore summer.',
'The name is the concept: hop bitterness and hot sauce capsaicin are complementary flavors, and Hop Sauce Fest builds its entire event around that pairing. It''s a smaller event but the beachside location in Beach Haven makes it one of the most pleasant summer festival experiences on the east coast.',
ARRAY['Craft IPA and hop-forward beer lineup curated to pair with hot sauce','40+ sauce vendors with a Northeast US focus','Beachside outdoor setting at Long Beach Island','Relaxed weekend pace — more like a food fair than a convention','Eating contest with an appreciative crowd'],
'Craft beer lovers who want a summer weekend destination built around food, and northeast sauce fans who enjoy a festival with actual character.',
'Pack for a beach day with a sauce detour. The outdoor format means comfortable shoes, sun protection, and a cooler bag in the car for glass purchases.',
ARRAY['amazon-secret-aardvark-habanero','amazon-yellowbird-serrano','amazon-tabasco-green','amazon-cholula-original','heatonist-los-calientes-rojo'],
ARRAY['american','northeast'], ARRAY['craft beer','beach','outdoor','summer'], false, 'editorial'),

('pdx-hot-sauce-expo-portland', 'PDX Hot Sauce Expo', 'PDX Hot Sauce Expo', 'Portland', 'Oregon', 'OR', 'west', 8, 'Early August', true, 'https://www.pdxhotsauceexpo.com',
'Portland brings its food-obsessed, craft-everything culture to hot sauce in the form of the PDX Hot Sauce Expo — a two-day celebration of Pacific Northwest sauce makers and the fermented, funky, and fiery.',
'Portland weird, Portland hot, Portland exact.',
'Portland''s food culture is exacting in a way that benefits a hot sauce festival enormously. The makers here care deeply about fermentation processes, ingredient sourcing, and flavor complexity. You''ll find sauces with unusual bases — fermented blueberry, aged miso heat, Pacific Northwest berry habanero blends.',
ARRAY['Pacific Northwest sauce makers heavily represented — fermented and craft-focused','Two-day format with fresh vendor arrivals and restocks each day','Beer garden with Oregon craft breweries','Unusual flavor profiles unavailable elsewhere — foraged, fermented, fruit-forward','Chef collaborations and cooking demos'],
'Food nerds, fermentation enthusiasts, and anyone who''s maxed out on standard vinegar-based styles and wants something genuinely different.',
'Pacific Northwest sauce makers experiment with fermentation in ways the rest of the country hasn''t caught up to yet. Budget time to talk to the makers — they''re the most accessible of any expo on the circuit.',
ARRAY['amazon-secret-aardvark-habanero','amazon-truff-original','amazon-fly-by-jing-sichuan-gold','amazon-yellowbird-ghost-pepper','amazon-fermentation-jar-kit'],
ARRAY['american','pacific northwest','fermented'], ARRAY['craft','fermentation','outdoor','pacific northwest'], true, 'editorial'),

('austin-chronicle-hot-sauce-festival', 'Austin Chronicle Hot Sauce Festival', 'Austin Hot Sauce Festival', 'Austin', 'Texas', 'TX', 'south', 9, 'Late August – September', true, 'https://www.theflashlist.com/annual-events/08/usa/texas/central/austin/hot-sauce-festival/information-on-austin-chronicle-spicy-salsa-food-competition.html',
'The Austin Chronicle''s beloved annual fundraiser for the Central Texas Food Bank, held at Fiesta Gardens. Amateur and professional sauce makers compete in a blind judging competition that''s now one of the most respected in the country.',
'Austin''s hottest fundraiser. Literally.',
'The Austin Chronicle Hot Sauce Festival has been running for over 30 years and has become something of a civic institution. The blind judging format means that amateur home-brew sauce makers compete on equal footing with professional operations — and frequently win.',
ARRAY['Blind judging competition — amateur and professional categories','Over 700 entries historically, with a massive sampling floor','Live music from Austin''s always-rich scene','Fiesta Gardens setting on the Colorado River','Full food vendor presence — eat your way through the day'],
'Everyone. Genuinely. Families, seasoned heat enthusiasts, first-timers — the Austin festival is the most accessible and community-oriented event on this list.',
'Austin in September is still hot in the weather sense. Pace yourself on the sampling, have food before you start the heat wall, and budget for live music.',
ARRAY['amazon-tabasco-chipotle','amazon-cholula-original','amazon-texas-pete','amazon-tajin-clasico','amazon-digital-meat-thermometer'],
ARRAY['texas','american','tex-mex'], ARRAY['competition','charity','live music','family friendly','blind judging'], true, 'editorial'),

('hatch-chile-festival-new-mexico', 'Hatch Chile Festival', 'Hatch Chile Fest', 'Hatch', 'New Mexico', 'NM', 'southwest', 9, 'Labor Day Weekend', true, 'https://www.hatchchilefest.com',
'The world''s most famous chile-growing town celebrates its harvest with a Labor Day weekend festival. Fresh-roasted Hatch chiles, green chile cheeseburgers, and the full spectrum of New Mexico''s chile culture.',
'The harvest festival that defined American chile culture.',
'Hatch is a town of about 1,600 people that produces chiles so good they''ve become a proper noun in American food. The festival arrives each Labor Day to celebrate the harvest — the smell of chiles roasting in massive drums over open flame is the defining sensory memory of the event.',
ARRAY['Fresh green and red Hatch chile roasting stations — the signature smell of the festival','Green chile cheeseburgers served from dozens of vendors','Whole chile sales by the bushel — bring a cooler','New Mexico red and green chile sauces direct from local producers','Chile cookoff competition with serious local talent'],
'Anyone who loves New Mexico food culture, home cooks who want to roast and freeze their own Hatch chiles, and road-trippers who want to build an itinerary around a genuinely unique American food event.',
'Bring a large cooler specifically for the roasted chiles you''ll buy to take home. The fresh-roasted flavor fades fast — freeze them the same day.',
ARRAY['amazon-chipotle-in-adobo','amazon-tajin-clasico','amazon-cholula-green-tomatillo','amazon-immersion-blender','amazon-fermentation-jar-kit'],
ARRAY['new mexican','southwest','mexican'], ARRAY['harvest festival','agricultural','outdoor','family friendly','road trip'], true, 'editorial'),

('new-england-hot-sauce-fest', 'New England Hot Sauce Fest', 'New England Hot Sauce Fest', 'New England', 'Massachusetts', 'MA', 'northeast', 9, 'Fall (September)', true, 'https://www.newenglandhotsaucefest.com',
'New England''s dedicated hot sauce gathering, celebrating the region''s growing indie sauce maker community with tastings, competition, and a farmer''s market feel that fits the region''s food culture.',
'Fall foliage and fire — New England''s heat calendar.',
'New England has a smaller hot sauce scene than Texas or the southeast, but what it lacks in volume it makes up in craft and originality. The fall timing is ideal — foliage season, sweater weather, and a cup of something hot in your hand.',
ARRAY['30–50 regional vendors with strong New England representation','Sauce competition with local judges and blind tasting','Farmer''s market crossover — local produce and specialty foods alongside sauces','Fall outdoor setting — weather-dependent but typically beautiful','Easy pace; good for beginners and enthusiasts equally'],
'New England residents and fall foliage trip-planners who want to add a food event to their October agenda.',
'New England sauce makers trend toward apple cider vinegar bases and local pepper varieties. Look for anything fermented with local apples or using New England farm peppers.',
ARRAY['amazon-crystal-hot-sauce','amazon-tabasco-original','amazon-yellowbird-serrano','amazon-secret-aardvark-habanero','heatonist-gift-set'],
ARRAY['american','northeast'], ARRAY['community','fall','outdoor','regional makers'], false, 'editorial'),

('nc-hot-sauce-festival-oxford', 'NC Hot Sauce Festival & Contest', 'NC Hot Sauce Festival', 'Oxford', 'North Carolina', 'NC', 'southeast', 10, 'October', true, 'https://nchotsaucecontestandfestival.com',
'Downtown Oxford, NC transforms into the South''s most approachable hot sauce gathering — a weekend festival and competition that draws Carolinas makers alongside national brands for a genuinely great small-town food event.',
'Small town, serious heat, Carolina soul.',
'Oxford might be small but the NC Hot Sauce Festival draws talent from across the Carolinas and beyond. The downtown festival format creates a walkable, unhurried experience that''s rare at larger events. The Carolinas sauce tradition runs deep: vinegar-forward, pepper-heavy, with a BBQ-adjacent sensibility.',
ARRAY['Downtown Oxford format — festival runs along Main Street','Carolinas sauce makers representing a genuine regional tradition','Hot sauce contest with amateur and professional categories','Southern BBQ food vendors alongside sauce booths','Approachable crowd, beginner-friendly heat options available'],
'Southeast US residents, anyone interested in Southern vinegar-forward sauce traditions, and road-trippers looking for an authentic small-town fall festival experience.',
'Carolina sauce means sharp, bright, vinegar-forward heat — a world away from the fruit-forward styles you find on the coasts.',
ARRAY['amazon-crystal-hot-sauce','amazon-texas-pete','amazon-franks-redhot','amazon-pain-is-good-louisiana','amazon-tabasco-original'],
ARRAY['southern','carolina','bbq'], ARRAY['small town','outdoor','carolinas','competition','family friendly'], false, 'editorial'),

('peppers-at-the-beach-rehoboth', 'Peppers at the Beach', 'Peppers at the Beach', 'Rehoboth Beach', 'Delaware', 'DE', 'northeast', 10, 'Mid October', true, 'https://www.peppersatthebeach.com',
'One of the east coast''s most beloved fall festivals, Peppers at the Beach combines Rehoboth''s boardwalk resort culture with a two-day hot sauce and spicy food celebration that draws serious collectors and families alike.',
'The east coast''s best fall sauce weekend.',
'Rehoboth Beach in October is a good place to be — summer crowds gone, beach town energy relaxed, weather crisp enough to actually enjoy spicy food properly. Peppers at the Beach has been building a loyal following for years based on great vendor curation and a well-run competition.',
ARRAY['100+ sauce vendors with strong mid-Atlantic and national representation','Hot sauce competition — one of the better-organized on the east coast','Boardwalk proximity — eat festival food with an ocean backdrop','Fall beach town atmosphere — relaxed, welcoming, unhurried','Craft beer and cider pairings'],
'East coast sauce enthusiasts, fall travel planners, anyone who wants a full weekend destination built around good food and heat.',
'October at the Delaware shore is cool enough that capsaicin actually keeps you comfortable. The vendor floor rewards patience — take one full pass before buying anything.',
ARRAY['amazon-el-yucateco-red-habanero','amazon-daves-ghost-pepper','amazon-yellowbird-ghost-pepper','amazon-bravado-black-garlic-reaper','heatonist-hot-ones-season-22'],
ARRAY['american','northeast','mid-atlantic'], ARRAY['beach','fall','competition','weekend destination','family friendly'], false, 'editorial'),

('galveston-island-hot-sauce-fest', 'Galveston Island Hot Sauce Fest', 'Galveston Hot Sauce Fest', 'Galveston', 'Texas', 'TX', 'south', 5, 'Early May', true, 'https://www.cayennediane.com/world-calendar-of-spicy-events-2/',
'Texas meets the Gulf on Galveston Island for an outdoor hot sauce festival that pairs the island''s seafood culture with fierce local sauce competition and a backdrop you won''t find at any inland Texas event.',
'Gulf heat, island setting, Texas-sized flavor.',
'Galveston is an unusual setting for a hot sauce festival — which is exactly what makes it interesting. The Gulf Coast seafood culture bleeds into every sauce booth; you''ll find styles built specifically for shrimp, oysters, and Gulf fish.',
ARRAY['Gulf Coast-influenced sauce styles — built for seafood','Outdoor Island setting with Gulf Coast atmosphere','Texas-scale eating contests and competitions','Seafood food vendors alongside sauce booths','Manageable crowd compared to Dallas/Austin events'],
'Gulf Coast residents, seafood lovers who want sauces built for fish and shellfish, and Texas sauce circuit completionists.',
'Galveston sauces are built for the coast — briny, citrus-forward, and well-matched to seafood. Look for anything designed specifically for Gulf shrimp or oysters.',
ARRAY['amazon-tabasco-original','amazon-crystal-hot-sauce','amazon-cajun-seasoning','amazon-cholula-original','amazon-el-yucateco-green-habanero'],
ARRAY['gulf coast','tex-mex','seafood'], ARRAY['gulf coast','outdoor','seafood','island setting'], false, 'editorial')

ON CONFLICT (slug) DO NOTHING;
