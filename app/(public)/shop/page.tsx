import Image from "next/image";
import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  HOT_SAUCE_SPOTLIGHT_KEYS,
  WING_SAUCE_KEYS,
  PREMIUM_HOT_SAUCE_KEYS,
  KITCHEN_GEAR_KEYS,
  PANTRY_HEAT_KEYS,
  SUBSCRIPTION_KEYS,
  getAffiliateLinkEntries,
  resolveAffiliateLink,
  type AffiliateLinkEntry
} from "@/lib/affiliates";
import { getMerchThemeClasses } from "@/lib/merch";
import { buildMetadata } from "@/lib/seo";
import { getFreshMerchProducts } from "@/lib/services/content";
import { getShopAffiliateCollections } from "@/lib/shop";

export const metadata = buildMetadata({
  title: "Shop Hot Sauce, Gear, and Gifts | FlamingFoodies",
  description:
    "Shop hot sauce, kitchen gear, pantry heat, subscriptions, and gift-ready spicy picks.",
  path: "/shop"
});

type ResolvedShopLink = {
  link: AffiliateLinkEntry;
  resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>>;
};

type ResolvedBundle = {
  key: "starter-kit" | "taco-night" | "under-15" | "gift-guide" | "wing-night" | "heat-ladder" | "world-tour" | "premium-flex";
  title: string;
  description: string;
  ctaLabel: string;
  items: ResolvedShopLink[];
};

const SHOP_GUIDE_LINKS: Record<
  ResolvedBundle["key"],
  { href: string; label: string }
> = {
  "starter-kit": {
    href: "/hot-sauces/best",
    label: "Read the best-bottles guide"
  },
  "taco-night": {
    href: "/hot-sauces/best-for-tacos",
    label: "Open the taco-night guide"
  },
  "wing-night": {
    href: "/hot-sauces/best-for-wings",
    label: "See more wing sauce picks"
  },
  "under-15": {
    href: "/hot-sauces/under-15",
    label: "See more under-$15 picks"
  },
  "heat-ladder": {
    href: "/hot-sauces/best",
    label: "Explore all heat levels"
  },
  "world-tour": {
    href: "/hot-sauces/best",
    label: "Browse global sauces"
  },
  "premium-flex": {
    href: "/hot-sauces/best-gift-sets",
    label: "See more premium picks"
  },
  "gift-guide": {
    href: "/hot-sauces/best-gift-sets",
    label: "Open the gift guide"
  }
};

function resolveShopLinks(entries: AffiliateLinkEntry[], position: string) {
  return entries
    .map((link) => ({
      link,
      resolved: resolveAffiliateLink(link.key, {
        sourcePage: "/shop",
        position
      })
    }))
    .filter(
      (
        entry
      ): entry is {
        link: AffiliateLinkEntry;
        resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>>;
      } => Boolean(entry.resolved)
    );
}

function buildShopPickHref(href: string, position: string) {
  return href.startsWith("/go/")
    ? `${href}?source=/shop&position=${position}`
    : href;
}

function BundleLaneCard({ collection }: { collection: ResolvedBundle }) {
  const guide = SHOP_GUIDE_LINKS[collection.key];

  return (
    <article
      id={collection.key}
      className="panel relative scroll-mt-24 overflow-hidden p-6 sm:p-7"
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-ember/60 to-transparent" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Buying Path</p>
          <h3 className="mt-3 font-display text-4xl text-cream">{collection.ctaLabel}</h3>
        </div>
        <span className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-2 text-xs uppercase tracking-[0.22em] text-cream/62">
          {collection.items.length} picks
        </span>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/72">{collection.description}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {collection.items.map(({ link, resolved }, index) => (
          <article
            key={`${collection.key}-${link.key}`}
            className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">
                Step {index + 1}
              </p>
              <span className="text-xs text-cream/55">{link.priceLabel}</span>
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-cream/55">
              {link.badge}
            </p>
            <h4 className="mt-2 font-display text-2xl text-cream">{link.product}</h4>
            <p className="mt-3 text-sm leading-6 text-cream/70">{link.bestFor}</p>
            <AffiliateLink
              href={resolved.href}
              partnerKey={resolved.key}
              trackingMode={resolved.trackingMode}
              sourcePage="/shop"
              position={`${collection.key}-bundle-${index + 1}`}
              className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal"
            >
              Shop this pick
            </AffiliateLink>
          </article>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
        <p className="text-sm text-cream/58">
          Shop by craving, budget, or occasion instead of digging through one long list.
        </p>
        <Link
          href={guide.href}
          className="inline-flex rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-cream"
        >
          {guide.label}
        </Link>
      </div>
    </article>
  );
}

function CategorySpotlight({
  id,
  eyebrow,
  title,
  copy,
  lead,
  supporting,
  guideHref,
  guideLabel
}: {
  id: string;
  eyebrow: string;
  title: string;
  copy: string;
  lead?: ResolvedShopLink;
  supporting: ResolvedShopLink[];
  guideHref: string;
  guideLabel: string;
}) {
  if (!lead) {
    return null;
  }

  return (
    <article id={id} className="panel p-6 sm:p-7">
      <p className="eyebrow">{eyebrow}</p>
      <h3 className="mt-3 font-display text-4xl text-cream">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-cream/72">{copy}</p>

      <div className="mt-6 rounded-[1.8rem] border border-white/12 bg-white/[0.06] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.24em] text-ember">{lead.link.badge}</p>
          <span className="text-xs text-cream/55">{lead.link.priceLabel}</span>
        </div>
        <h4 className="mt-3 font-display text-3xl text-cream">{lead.link.product}</h4>
        <p className="mt-3 text-sm leading-7 text-cream/72">{lead.link.description}</p>
        <p className="mt-3 text-sm text-cream/55">
          Best for {lead.link.bestFor.toLowerCase()}.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <AffiliateLink
            href={lead.resolved.href}
            partnerKey={lead.resolved.key}
            trackingMode={lead.resolved.trackingMode}
            sourcePage="/shop"
            position={`${id}-lead`}
            className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
          >
            Shop this pick
          </AffiliateLink>
          <Link
            href={guideHref}
            className="inline-flex rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-cream"
          >
            {guideLabel}
          </Link>
        </div>
      </div>

      {supporting.length ? (
        <div className="mt-5 space-y-3">
          {supporting.map(({ link, resolved }, index) => (
            <div
              key={`${id}-${link.key}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-4"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-ember">
                  Backup Pick {index + 1}
                </p>
                <h5 className="mt-1 text-lg font-semibold text-cream">{link.product}</h5>
                <p className="mt-1 text-sm text-cream/60">{link.bestFor}</p>
              </div>
              <AffiliateLink
                href={resolved.href}
                partnerKey={resolved.key}
                trackingMode={resolved.trackingMode}
                sourcePage="/shop"
                position={`${id}-backup-${index + 1}`}
                className="inline-flex rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-cream"
              >
                View
              </AffiliateLink>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default async function ShopPage() {
  const dailyShopPicks = await getFreshMerchProducts(4);
  const hotSauceLinks = getAffiliateLinkEntries(HOT_SAUCE_SPOTLIGHT_KEYS);
  const wingLinks = getAffiliateLinkEntries(WING_SAUCE_KEYS);
  const premiumLinks = getAffiliateLinkEntries(PREMIUM_HOT_SAUCE_KEYS);
  const gearLinks = getAffiliateLinkEntries(KITCHEN_GEAR_KEYS);
  const pantryLinks = getAffiliateLinkEntries(PANTRY_HEAT_KEYS);
  const subscriptionLinks = getAffiliateLinkEntries(SUBSCRIPTION_KEYS);

  const resolvedHotSauceLinks = resolveShopLinks(hotSauceLinks, "hot-sauce");
  const resolvedWingLinks = resolveShopLinks(wingLinks, "wing");
  const resolvedPremiumLinks = resolveShopLinks(premiumLinks, "premium");
  const resolvedGearLinks = resolveShopLinks(gearLinks, "gear");
  const resolvedPantryLinks = resolveShopLinks(pantryLinks, "pantry");
  const resolvedSubscriptionLinks = resolveShopLinks(subscriptionLinks, "subscription");

  const buyingPaths = getShopAffiliateCollections()
    .map((collection) => ({
      ...collection,
      items: collection.items
        .map((link, index) => ({
          link,
          resolved: resolveAffiliateLink(link.key, {
            sourcePage: "/shop",
            position: `${collection.key}-lane-${index + 1}`
          })
        }))
        .filter(
          (
            entry
          ): entry is {
            link: AffiliateLinkEntry;
            resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>>;
          } => Boolean(entry.resolved)
        )
    }))
    .filter((collection): collection is ResolvedBundle => Boolean(collection.items.length));

  const heroBundle =
    buyingPaths.find((collection) => collection.key === "starter-kit") ?? buyingPaths[0];
  const giftBundle =
    buyingPaths.find((collection) => collection.key === "gift-guide") ?? buyingPaths[0];

  const conversionStats = [
    { label: "Buying paths", value: String(buyingPaths.length || 8) },
    { label: "Hot sauce SKUs", value: "37+" },
    { label: "Gift-ready lane", value: "Live" },
    { label: "Budget route", value: "Under $15" }
  ];

  const quickJumpLinks = [
    { href: "#hot-right-now", label: "Today’s winners" },
    { href: "#buying-paths", label: "Buying paths" },
    { href: "#category-picks", label: "Best picks" },
    { href: "#gift-mode", label: "Gift mode" }
  ];

  return (
    <section className="container-shell py-12 sm:py-16">
      <div className="mb-6 max-w-4xl">
        <AffiliateDisclosure compact />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,199,79,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(230,57,70,0.18),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 sm:p-10 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ember/70 to-transparent" />
          <p className="eyebrow">Shop Smarter</p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[0.92] text-cream sm:text-6xl xl:text-7xl">
            Buy the bottle, tool, or gift that actually changes dinner.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-cream/78">
            Shop hot sauces, pantry staples, kitchen gear, and gift-ready picks chosen to make
            cooking easier and more fun. Start with a best seller, an under-$15 favorite, a great
            gift, or one reliable tool you will use every week.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#buying-paths"
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-charcoal"
            >
              Start with a buying path
            </Link>
            <Link
              href="#hot-right-now"
              className="inline-flex rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-cream"
            >
              See today&apos;s winners
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {conversionStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-4"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-ember">{stat.label}</p>
                <p className="mt-2 font-display text-3xl text-cream">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {quickJumpLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-cream/82"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <aside className="panel relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-ember/60 to-transparent" />
          <p className="eyebrow">Start Here</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            {heroBundle?.ctaLabel || "Build the first serious shelf"}
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/72">
            {heroBundle?.description ||
              "One useful bottle, one pantry builder, and one tool upgrade."}
          </p>

          <div className="mt-6 space-y-3">
            {(heroBundle?.items ?? []).map(({ link, resolved }, index) => (
              <div
                key={`hero-${link.key}`}
                className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-ember">
                    Step {index + 1}
                  </p>
                  <span className="text-xs text-cream/55">{link.priceLabel}</span>
                </div>
                <h3 className="mt-2 font-display text-2xl text-cream">{link.product}</h3>
                <p className="mt-2 text-sm text-cream/65">{link.bestFor}</p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage="/shop"
                  position={`hero-bundle-${index + 1}`}
                  className="mt-4 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-4 py-2 text-sm font-semibold text-white"
                >
                  Shop now
                </AffiliateLink>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-ember">Start Here</p>
            <p className="mt-3 text-sm leading-7 text-cream/70">
              Begin with one dependable bottle, one flavor booster, and one useful tool. You will
              get more out of every recipe without overthinking what to buy first.
            </p>
          </div>
        </aside>
      </div>

      {dailyShopPicks.length ? (
        <div id="hot-right-now" className="mt-14">
          <SectionHeading
            eyebrow="Hot Right Now"
            title="Fresh favorites worth checking first."
            copy="A rotating mix of hot sauces, pantry picks, gear, and gifts that are easy to buy and easy to use."
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {dailyShopPicks.map((item, index) => (
              <article
                key={item.slug}
                className={`panel relative overflow-hidden border-white/10 bg-gradient-to-br ${getMerchThemeClasses(item.themeKey)}`}
              >
                {/* Product image if available, else gradient header */}
                {item.imageUrl ? (
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt || item.name}
                      fill
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                    <div className="absolute right-4 top-4 rounded-full border border-white/12 bg-charcoal/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cream/90 backdrop-blur-sm">
                      #{index + 1}
                    </div>
                  </div>
                ) : (
                  <div className="relative h-20">
                    <div className="absolute right-5 top-5 rounded-full border border-white/12 bg-charcoal/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cream/80">
                      #{index + 1}
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{item.badge}</p>
                  <h2 className="mt-3 font-display text-3xl text-cream">{item.name}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-cream/55">
                    <span>{item.category}</span>
                    <span>{item.priceLabel}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-cream/74">{item.description}</p>
                  <Link
                    href={buildShopPickHref(item.href, `hot-right-now-${index + 1}`)}
                    className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
                  >
                    Shop this pick
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div id="buying-paths" className="mt-14">
        <SectionHeading
          eyebrow="Buying Paths"
          title="Shop by what you need right now."
          copy="Choose a starter kit, budget favorite, gift idea, or dinner-night lane and jump straight to the right picks."
        />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {buyingPaths.map((collection) => (
            <BundleLaneCard key={collection.key} collection={collection} />
          ))}
        </div>
      </div>

      <div id="category-picks" className="mt-14">
        <SectionHeading
          eyebrow="Best Picks"
          title="Our favorite picks in each category."
          copy="Each section starts with a standout option, then gives you a few solid alternatives."
        />
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <CategorySpotlight
            id="best-bottle"
            eyebrow="Best Everyday Bottle"
            title="Start with a bottle you will actually finish."
            copy="Start with a versatile bottle first, then try brighter or hotter options if you want something more specific."
            lead={resolvedHotSauceLinks[0]}
            supporting={resolvedHotSauceLinks.slice(1, 3)}
            guideHref="/hot-sauces/best"
            guideLabel="See all bottle picks"
          />
          <CategorySpotlight
            id="best-wing-sauce"
            eyebrow="Best Wing Sauce"
            title="The bottles that make wing night worth doing."
            copy="Classic cayenne base, a ready-to-toss buffalo sauce, and a habanero option for people who want real heat — covers every palate at the table."
            lead={resolvedWingLinks[0]}
            supporting={resolvedWingLinks.slice(1, 3)}
            guideHref="/hot-sauces/best-for-wings"
            guideLabel="See more wing picks"
          />
          <CategorySpotlight
            id="best-premium"
            eyebrow="Premium Shelf"
            title="Bottles worth spending more on."
            copy="These are the picks that start conversations — the truffle sauce non-heat-lovers can enjoy, the superhot with actual flavor, and the Sichuan oil sauce that changes how you cook."
            lead={resolvedPremiumLinks[0]}
            supporting={resolvedPremiumLinks.slice(1, 3)}
            guideHref="/hot-sauces/best-gift-sets"
            guideLabel="See gift-worthy picks"
          />
          <CategorySpotlight
            id="best-gear"
            eyebrow="Best Gear"
            title="Upgrade the tool that improves the most meals."
            copy="Choose the tool you will reach for often, not something that will sit in a drawer."
            lead={resolvedGearLinks[0]}
            supporting={resolvedGearLinks.slice(1, 3)}
            guideHref="#buying-paths"
            guideLabel="Back to buying paths"
          />
          <CategorySpotlight
            id="best-pantry"
            eyebrow="Best Pantry Move"
            title="Add one flavor builder that keeps paying off."
            copy="A good pantry pick makes eggs, noodles, tacos, bowls, and leftovers taste better in minutes."
            lead={resolvedPantryLinks[0]}
            supporting={resolvedPantryLinks.slice(1, 3)}
            guideHref="/hot-sauces/under-15"
            guideLabel="See more affordable favorites"
          />
          <CategorySpotlight
            id="best-gift"
            eyebrow="Best Gift"
            title="Buying for someone else? Skip one-bottle roulette."
            copy="Curated sets and subscriptions make easy gifts when you want something fun, useful, and easy to enjoy."
            lead={resolvedSubscriptionLinks[0]}
            supporting={resolvedSubscriptionLinks.slice(1, 3)}
            guideHref="/hot-sauces/best-gift-sets"
            guideLabel="Open the gift guide"
          />
        </div>
      </div>

      <div id="gift-mode" className="mt-14 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel relative overflow-hidden p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,199,79,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(230,57,70,0.14),transparent_32%)]" />
          <div className="relative">
            <p className="eyebrow">Gift Mode</p>
            <h2 className="mt-3 font-display text-5xl text-cream">
              Make the gift feel smart, not random.
            </h2>
            <p className="mt-4 text-sm leading-7 text-cream/74">
              If you are shopping for someone else, the highest-confidence path is still a curated
              set or a recurring discovery box.
            </p>

            <div className="mt-6 space-y-3">
              {(giftBundle?.items ?? resolvedSubscriptionLinks.slice(0, 2)).slice(0, 2).map(
                ({ link, resolved }, index) => (
                  <div
                    key={`gift-${link.key}`}
                    className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-ember">
                        Gift pick {index + 1}
                      </p>
                      <span className="text-xs text-cream/55">{link.priceLabel}</span>
                    </div>
                    <h3 className="mt-2 font-display text-2xl text-cream">{link.product}</h3>
                    <p className="mt-2 text-sm text-cream/65">{link.bestFor}</p>
                    <AffiliateLink
                      href={resolved.href}
                      partnerKey={resolved.key}
                      trackingMode={resolved.trackingMode}
                      sourcePage="/shop"
                      position={`gift-mode-${index + 1}`}
                      className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-charcoal"
                    >
                      Shop gift pick
                    </AffiliateLink>
                  </div>
                )
              )}
            </div>

            <Link
              href="/hot-sauces/best-gift-sets"
              className="mt-6 inline-flex rounded-full border border-white/12 px-5 py-3 text-sm font-semibold text-cream"
            >
              See the full gift guide
            </Link>
          </div>
        </div>

        <EmailCapture
          source="shop"
          tag="shop-interest"
          heading="Get our favorite shop picks in your inbox."
          description="We send useful bottles, gear, and gift ideas so you can find something good quickly."
          buttonLabel="Join the shop list"
          defaultSegments={["cook-shop", "hot-sauce-shelf"]}
        />
      </div>
    </section>
  );
}
