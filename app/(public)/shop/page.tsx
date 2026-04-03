import Link from "next/link";

import { EmailCapture } from "@/components/forms/email-capture";
import { SectionHeading } from "@/components/layout/section-heading";
import {
  HOT_SAUCE_SPOTLIGHT_KEYS,
  KITCHEN_GEAR_KEYS,
  PANTRY_HEAT_KEYS,
  SUBSCRIPTION_KEYS,
  getAffiliateLinkEntries
} from "@/lib/affiliates";
import { getMerchThemeClasses } from "@/lib/merch";
import { getMerchProducts } from "@/lib/services/content";

export default async function ShopPage() {
  const merchItems = await getMerchProducts();
  const hotSauceLinks = getAffiliateLinkEntries(HOT_SAUCE_SPOTLIGHT_KEYS);
  const gearLinks = getAffiliateLinkEntries(KITCHEN_GEAR_KEYS);
  const pantryLinks = getAffiliateLinkEntries(PANTRY_HEAT_KEYS);
  const subscriptionLinks = getAffiliateLinkEntries(SUBSCRIPTION_KEYS);

  return (
    <section className="container-shell py-16">
      <SectionHeading
        eyebrow="Shop"
        title="Merch, hot sauce, and kitchen gear all in one storefront."
        copy="This page should feel like a real commerce hub, not a placeholder: merch previews first, then the sauce, gear, and pantry links that support the editorial side of the site."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div id="merch-preview" className="panel p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Merch preview</p>
              <h2 className="mt-3 font-display text-5xl text-cream">
                Make the brand wearable, giftable, and visible.
              </h2>
            </div>
            <Link
              href="#merch-waitlist"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal"
            >
              Join merch waitlist
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {merchItems.map((item) => (
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
        <div className="panel p-8">
          <p className="eyebrow">Commerce strategy</p>
          <h2 className="mt-3 font-display text-4xl text-cream">
            Push the merch harder without losing editorial trust.
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-cream/72">
            <p>
              Recipes create discovery. Reviews earn authority. The shop page should turn that
              attention into merch demand and affiliate clicks while readers are already in buying mode.
            </p>
            <p>
              For now, merch cards collect intent and partner links monetize immediately. When the
              first Printful drop is ready, the card structure already has room for direct checkout.
            </p>
          </div>
          <div className="mt-8 grid gap-4">
            {subscriptionLinks.slice(0, 2).map((link) => (
              <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <Link
                  href={`/go/${link.key}?source=/shop&position=merch-sidebar`}
                  className="mt-5 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 text-sm font-semibold text-white"
                >
                  Open offer
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="panel p-8">
          <p className="eyebrow">Hot sauce picks</p>
          <div className="mt-6 space-y-4">
            {hotSauceLinks.map((link) => (
              <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                  {link.priceLabel ? <span className="text-xs text-cream/55">{link.priceLabel}</span> : null}
                </div>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <Link
                  href={`/go/${link.key}?source=/shop&position=hot-sauce-column`}
                  className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Shop this pick
                </Link>
              </article>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Kitchen gear</p>
          <div className="mt-6 space-y-4">
            {gearLinks.map((link) => (
              <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                  {link.priceLabel ? <span className="text-xs text-cream/55">{link.priceLabel}</span> : null}
                </div>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <Link
                  href={`/go/${link.key}?source=/shop&position=gear-column`}
                  className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Shop this pick
                </Link>
              </article>
            ))}
          </div>
        </div>
        <div className="panel p-8">
          <p className="eyebrow">Pantry heat</p>
          <div className="mt-6 space-y-4">
            {pantryLinks.map((link) => (
              <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
                  {link.priceLabel ? <span className="text-xs text-cream/55">{link.priceLabel}</span> : null}
                </div>
                <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
                <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
                <Link
                  href={`/go/${link.key}?source=/shop&position=pantry-column`}
                  className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-cream"
                >
                  Shop this pick
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 panel p-8">
        <p className="eyebrow">Subscriptions and gift plays</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          {subscriptionLinks.map((link) => (
            <article key={link.key} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-ember">{link.badge}</p>
              <h3 className="mt-3 font-display text-3xl text-cream">{link.product}</h3>
              <p className="mt-3 text-sm leading-7 text-cream/72">{link.description}</p>
              <Link
                href={`/go/${link.key}?source=/shop&position=subscription-grid`}
                className="mt-5 inline-flex rounded-full bg-gradient-to-r from-flame to-ember px-4 py-2 text-sm font-semibold text-white"
              >
                Open offer
              </Link>
            </article>
          ))}
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
