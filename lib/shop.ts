import {
  HOT_SAUCE_SPOTLIGHT_KEYS,
  KITCHEN_GEAR_KEYS,
  PANTRY_HEAT_KEYS,
  SUBSCRIPTION_KEYS,
  getAffiliateLinkEntries,
  type AffiliateLinkEntry
} from "@/lib/affiliates";
import type { MerchProduct } from "@/lib/types";

export interface ShopMerchCollection {
  key: "apparel" | "cookware" | "gifts";
  title: string;
  description: string;
  items: MerchProduct[];
}

export interface ShopAffiliateCollection {
  key: "starter-kit" | "taco-night" | "under-15" | "gift-guide";
  title: string;
  description: string;
  ctaLabel: string;
  items: AffiliateLinkEntry[];
}

const merchCategoryGroups: Record<ShopMerchCollection["key"], string[]> = {
  apparel: ["Apparel", "Headwear"],
  cookware: ["Kitchen gear", "Drinkware"],
  gifts: ["Drinkware", "Headwear", "Apparel", "Kitchen gear"]
};

function includesCategory(category: string, allowedCategories: string[]) {
  return allowedCategories.some(
    (allowedCategory) => allowedCategory.toLowerCase() === category.toLowerCase()
  );
}

export function getShopMerchCollections(products: MerchProduct[]): ShopMerchCollection[] {
  const apparel = products.filter((product) =>
    includesCategory(product.category, merchCategoryGroups.apparel)
  );
  const cookware = products.filter((product) =>
    includesCategory(product.category, merchCategoryGroups.cookware)
  );
  const gifts = products
    .filter((product) => includesCategory(product.category, merchCategoryGroups.gifts))
    .slice(0, 4);

  const collections: ShopMerchCollection[] = [
    {
      key: "apparel",
      title: "Wearables",
      description: "Tees, hoodies, hats, and the merch people can actually wear outside the kitchen.",
      items: apparel
    },
    {
      key: "cookware",
      title: "Kitchen gear",
      description: "Cook-ready pieces that keep the brand close to the food and the cook line.",
      items: cookware
    },
    {
      key: "gifts",
      title: "Gift ideas",
      description: "The easiest merch picks for birthdays, hosts, and spice-lover care packages.",
      items: gifts
    }
  ];

  return collections.filter((collection) => collection.items.length);
}

export function getShopAffiliateCollections(): ShopAffiliateCollection[] {
  return [
    {
      key: "starter-kit",
      title: "Starter kit for the first serious shelf",
      description:
        "One useful bottle, one pantry builder, and one tool that immediately make the rest of the site more actionable.",
      ctaLabel: "Build the starter kit",
      items: getAffiliateLinkEntries([
        HOT_SAUCE_SPOTLIGHT_KEYS[1],
        PANTRY_HEAT_KEYS[0],
        KITCHEN_GEAR_KEYS[0]
      ])
    },
    {
      key: "taco-night",
      title: "Taco night lane",
      description:
        "A bright red bottle, an everyday pour, and the tool that makes salsa and sauce work feel more intentional.",
      ctaLabel: "Build taco night",
      items: getAffiliateLinkEntries([
        "heatonist-los-calientes-rojo",
        "amazon-yellowbird-habanero",
        "amazon-molcajete"
      ])
    },
    {
      key: "under-15",
      title: "Under-$15 shelf builders",
      description:
        "Three low-friction buys that make the shop useful fast: one bottle, one pantry builder, and one finishing move.",
      ctaLabel: "Shop under $15",
      items: getAffiliateLinkEntries([
        "amazon-yellowbird-habanero",
        "amazon-gochujang-paste",
        "mike-hot-honey-original"
      ])
    },
    {
      key: "gift-guide",
      title: "Best gifts for spice lovers",
      description:
        "The safer route when you are buying for someone else and want the set to feel intentional, not random.",
      ctaLabel: "Shop gift ideas",
      items: getAffiliateLinkEntries([
        SUBSCRIPTION_KEYS[1],
        SUBSCRIPTION_KEYS[2],
        SUBSCRIPTION_KEYS[0]
      ])
    }
  ];
}
