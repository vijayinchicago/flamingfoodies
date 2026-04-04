import Link from "next/link";

import { AffiliateDisclosure } from "@/components/content/affiliate-disclosure";
import { AffiliateLink } from "@/components/content/affiliate-link";
import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  HOT_SAUCE_SPOTLIGHT_KEYS,
  KITCHEN_GEAR_KEYS,
  PANTRY_HEAT_KEYS,
  SUBSCRIPTION_KEYS,
  getAffiliateLinkEntries,
  resolveAffiliateLink
} from "@/lib/affiliates";
import { getMerchThemeClasses } from "@/lib/merch";
import { buildMetadata } from "@/lib/seo";
import { getMerchProducts } from "@/lib/services/content";
import { getShopAffiliateCollections, getShopMerchCollections } from "@/lib/shop";

export const metadata = buildMetadata({
  title: "Shop Hot Sauce, Gear, and Merch | FlamingFoodies",
  description:
    "Shop spicy merch previews, hot sauce picks, kitchen gear, pantry heat, and curated affiliate offers.",
  path: "/shop"
});

export default async function ShopPage() {
  const merchItems = await getMerchProducts();
  const merchCollections = getShopMerchCollections(merchItems);
  const hasLiveMerch = merchItems.length > 0;
  const hotSauceLinks = getAffiliateLinkEntries(HOT_SAUCE_SPOTLIGHT_KEYS);
  const gearLinks = getAffiliateLinkEntries(KITCHEN_GEAR_KEYS);
  const pantryLinks = getAffiliateLinkEntries(PANTRY_HEAT_KEYS);
  const subscriptionLinks = getAffiliateLinkEntries(SUBSCRIPTION_KEYS);
  const resolveLinks = (entries: typeof hotSauceLinks, position: string) =>
    entries
      .map((link) => ({
        link,
        resolved: resolveAffiliateLink(link.key, {
          sourcePage: "/shop",
          position
        })
      }))
      .filter((entry): entry is { link: (typeof hotSauceLinks)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved));
  const resolvedMerchSidebarLinks = resolveLinks(subscriptionLinks.slice(0, 2), "merch-sidebar");
  const resolvedHotSauceLinks = resolveLinks(hotSauceLinks, "hot-sauce-column");
  const resolvedGearLinks = resolveLinks(gearLinks, "gear-column");
  const resolvedPantryLinks = resolveLinks(pantryLinks, "pantry-column");
  const resolvedSubscriptionLinks = resolveLinks(subscriptionLinks, "subscription-grid");
  const featuredMerch = merchItems.filter((item) => item.featured).slice(0, 3);
  const curatedCollections = getShopAffiliateCollections().map((collection) => ({
    ...collection,
    items: collection.items
      .map((link) => ({
        link,
        resolved: resolveAffiliateLink(link.key, {
          sourcePage: "/shop",
          position: collection.key
        })
      }))
      .filter((entry): entry is { link: (typeof collection.items)[number]; resolved: NonNullable<ReturnType<typeof resolveAffiliateLink>> } => Boolean(entry.resolved))
  }));

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Shop"
        title="A storefront built around what people are actually trying to buy."
        copy="Shop by use case first: starter shelves, gift ideas, wearables, kitchen gear, and the hot sauce picks that deserve the clicks."
      />
      <AffiliateDisclosure className="mt-6 max-w-3xl" compact />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel p-8">
          <p className="eyebrow">Shop by intent</p>
          <h2 className="mt-3 font-display text-5xl text-cream">
            Start with starter kits, gift ideas, or the merch drop.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-cream/72">
            The strongest storefronts tell people where to go next. Build a first serious shelf,
            pick a gift that actually lands, or jump straight into the brand pieces that make the
            site feel bigger than content alone.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="#starter-kits"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Shop starter kits
            </Link>
            <Link
              href="#gift-ideas"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              Browse gift ideas
            </Link>
            <Link
              href="#merch-preview"
              className="inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              View merch drop
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-ember">Starter shelves</p>
              <p className="mt-3 font-display text-4xl text-cream">
                {curatedCollections[0]?.items.length || 0}
              </p>
              <p className="mt-2 text-sm leading-7 text-cream/68">
                Fast-buy bundles for new readers and first-time shoppers.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-ember">Merch categories</p>
              <p className="mt-3 font-display text-4xl text-cream">
                {hasLiveMerch ? merchCollections.length : "Soon"}
              </p>
              <p className="mt-2 text-sm leading-7 text-cream/68">
                Wearables, cook gear, and giftable merch grouped like a real store.
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-ember">Gift routes</p>
              <p className="mt-3 font-display text-4xl text-cream">{resolvedSubscriptionLinks.length}</p>
              <p className="mt-2 text-sm leading-7 text-cream/68">
                Curated subscriptions and gift-ready heat without guesswork.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {merchCollections.length ? (
            merchCollections.map((collection) => (
              <article key={collection.key} className="panel p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-ember">{collection.title}</p>
                <h2 className="mt-3 font-display text-3xl text-cream">
                  {collection.items.length} products
                </h2>
                <p className="mt-3 text-sm leading-7 text-cream/72">{collection.description}</p>
                <Link
                  href={`#${collection.key}`}
                  className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Open collection
                </Link>
              </article>
            ))
          ) : (
            <article className="panel p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">Merch drop in progress</p>
              <h2 className="mt-3 font-display text-3xl text-cream">The storefront is ready for the first drop.</h2>
              <p className="mt-3 text-sm leading-7 text-cream/72">
                The page structure is in place now, and the next live merch upload will populate these collections automatically.
              </p>
              <Link
                href="#merch-waitlist"
                className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
              >
                Join merch waitlist
              </Link>
            </article>
          )}
        </div>
      </div>

      <div id="merch-preview" className="mt-12 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="panel p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Featured merch</p>
              <h2 className="mt-3 font-display text-5xl text-cream">
                Make the brand wearable, giftable, and easy to spot.
              </h2>
            </div>
            <Link
              href="#merch-waitlist"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Join merch waitlist
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredMerch.length ? (
              featuredMerch.map((item) => (
                <article
                  key={item.slug}
                  className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${getMerchThemeClasses(item.themeKey)} p-5`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-ember">{item.badge}</p>
                    <span className="text-xs text-cream/55">{item.priceLabel}</span>
                  </div>
                  <h3 className="mt-3 font-display text-3xl text-cream">{item.name}</h3>
                  <p className="mt-2 text-sm text-cream/60">{item.category}</p>
                  <p className="mt-4 text-sm leading-7 text-cream/72">{item.description}</p>
                  <Link
                    href={item.href}
                    className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                  >
                    {item.ctaLabel}
                  </Link>
                </article>
              ))
            ) : (
              <article className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 md:col-span-3">
                <p className="text-xs uppercase tracking-[0.24em] text-ember">Merch preview coming next</p>
                <h3 className="mt-3 font-display text-4xl text-cream">Join the list before the first drop goes live.</h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/72">
                  The storefront layout is ready. Once the first live merch products are published, they will land here automatically.
                </p>
                <Link
                  href="#merch-waitlist"
                  className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Join merch waitlist
                </Link>
              </article>
            )}
          </div>
        </div>

        <div id="gift-ideas" className="panel p-8">
          <p className="eyebrow">Gift routes</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            The easiest “buy for someone else” paths on the site.
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-cream/72">
            <p>
              Most gift buyers do not want to guess at one perfect bottle. The better move is a
              curated set, a subscription, or a merch item that still feels tied to the culture.
            </p>
            <p>
              This keeps the shop useful for holidays, birthdays, and house gifts without turning
              the whole page into a generic marketplace.
            </p>
          </div>
          <div className="mt-8 grid gap-4">
            {resolvedMerchSidebarLinks.map(({ link, resolved }) => (
              <article
                key={link.key}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage="/shop"
                  position="merch-sidebar"
                  className="mt-5 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white"
                >
                  View on Amazon
                </AffiliateLink>
              </article>
            ))}
            <Link
              href="/hot-sauces/best-gift-sets"
              className="inline-flex justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-cream"
            >
              See the full gift guide
            </Link>
          </div>
        </div>
      </div>

      <div id="starter-kits" className="mt-12">
        <SectionHeading
          eyebrow="Starter kits"
          title="Build a better first shelf in one move."
          copy="These kits are grouped for intent, not just category. That makes them easier to buy and easier to merchandise."
        />
        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          {curatedCollections.map((collection) => (
            <article key={collection.key} className="panel p-6">
              <p className="eyebrow">{collection.title}</p>
              <h3 className="mt-3 font-display text-4xl text-cream">{collection.ctaLabel}</h3>
              <p className="mt-3 text-sm leading-7 text-cream/72">{collection.description}</p>
              <div className="mt-6 space-y-4">
                {collection.items.map(({ link, resolved }) => (
                  <div
                    key={link.key}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-ember">{link.badge}</p>
                      {link.priceLabel ? (
                        <span className="text-xs text-cream/55">{link.priceLabel}</span>
                      ) : null}
                    </div>
                    <h4 className="mt-3 font-display text-3xl text-cream">{link.product}</h4>
                    <p className="mt-3 text-sm leading-7 text-cream/72">{link.bestFor}</p>
                    <AffiliateLink
                      href={resolved.href}
                      partnerKey={resolved.key}
                      trackingMode={resolved.trackingMode}
                      sourcePage="/shop"
                      position={collection.key}
                      className="mt-4 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                    >
                      View on Amazon
                    </AffiliateLink>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      {merchCollections.length ? (
        <div className="mt-12 space-y-12">
          {merchCollections.map((collection) => (
            <div id={collection.key} key={collection.key}>
              <SectionHeading
                eyebrow={collection.title}
                title={collection.title}
                copy={collection.description}
              />
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {collection.items.map((item) => (
                  <article
                    key={item.slug}
                    className={`rounded-[1.75rem] border border-white/10 bg-gradient-to-br ${getMerchThemeClasses(item.themeKey)} p-5`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-ember">{item.badge}</p>
                      <span className="text-xs text-cream/55">{item.priceLabel}</span>
                    </div>
                    <h3 className="mt-3 font-display text-3xl text-cream">{item.name}</h3>
                    <p className="mt-2 text-sm text-cream/60">{item.category}</p>
                    <p className="mt-4 text-sm leading-7 text-cream/72">{item.description}</p>
                    <Link
                      href={item.href}
                      className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                    >
                      {item.ctaLabel}
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-12 grid gap-6 xl:grid-cols-4">
        <div className="panel p-8">
          <p className="eyebrow">Hot sauce picks</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Everyday bottles and shelf builders.</h2>
          <div className="mt-6 space-y-4">
            {resolvedHotSauceLinks.map(({ link, resolved }) => (
              <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                  {link.priceLabel ? <span className="text-xs text-cream/55">{link.priceLabel}</span> : null}
                </div>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage="/shop"
                  position="hot-sauce-column"
                  className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  View on Amazon
                </AffiliateLink>
              </article>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Kitchen gear</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Tools worth keeping near the stove.</h2>
          <div className="mt-6 space-y-4">
            {resolvedGearLinks.map(({ link, resolved }) => (
              <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                  {link.priceLabel ? <span className="text-xs text-cream/55">{link.priceLabel}</span> : null}
                </div>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage="/shop"
                  position="gear-column"
                  className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  View on Amazon
                </AffiliateLink>
              </article>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Pantry heat</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Flavor builders that earn repeat use.</h2>
          <div className="mt-6 space-y-4">
            {resolvedPantryLinks.map(({ link, resolved }) => (
              <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                  {link.priceLabel ? <span className="text-xs text-cream/55">{link.priceLabel}</span> : null}
                </div>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <AffiliateLink
                  href={resolved.href}
                  partnerKey={resolved.key}
                  trackingMode={resolved.trackingMode}
                  sourcePage="/shop"
                  position="pantry-column"
                  className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  View on Amazon
                </AffiliateLink>
              </article>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Subscriptions and gift plays</p>
          <h2 className="mt-3 font-display text-4xl text-cream">Recurring heat and better gifts.</h2>
          <div className="mt-6 space-y-4">
          {resolvedSubscriptionLinks.map(({ link, resolved }) => (
            <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
              <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
              <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
              <AffiliateLink
                href={resolved.href}
                partnerKey={resolved.key}
                trackingMode={resolved.trackingMode}
                sourcePage="/shop"
                position="subscription-grid"
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-4 py-2 text-sm font-semibold text-white"
              >
                View on Amazon
              </AffiliateLink>
            </article>
          ))}
          </div>
        </div>
      </div>

      <div id="merch-waitlist" className="mt-10 grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="panel p-8">
          <p className="eyebrow">Waitlist</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Get the first merch drop and best gear picks by email.
          </h2>
          <p className="mt-4 text-sm leading-7 text-cream/75">
            This list feeds the same newsletter engine as the rest of the site, so shop intent
            becomes a real audience signal instead of disappearing after the click.
          </p>
        </div>
        <div>
          <div className="mt-1">
            <EmailCapture source="shop" tag="shop-interest" />
          </div>
        </div>
      </div>
    </section>
  );
}
