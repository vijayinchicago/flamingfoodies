import { getAffiliateLinkEntries, type AffiliateLinkEntry } from "@/lib/affiliates";
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
      title: "Starter kit for the first hot sauce lineup",
      description:
        "One useful bottle, one pantry staple, and one tool that instantly make weeknight cooking more fun.",
      ctaLabel: "Build the starter kit",
      items: getAffiliateLinkEntries([
        "amazon-secret-aardvark-habanero",
        "amazon-chipotle-in-adobo",
        "amazon-cast-iron-skillet"
      ])
    },
    {
      key: "taco-night",
      title: "Taco night lane",
      description:
        "A bright red bottle, an everyday pour, and the tool that makes taco night feel more complete.",
      ctaLabel: "Build taco night",
      items: getAffiliateLinkEntries([
        "heatonist-los-calientes-rojo",
        "amazon-el-yucateco-green-habanero",
        "amazon-tortilla-press"
      ])
    },
    {
      key: "under-15",
      title: "Under-$15 favorites",
      description:
        "Three easy buys under $15: one bottle, one pantry staple, and one finishing touch.",
      ctaLabel: "Shop under $15",
      items: getAffiliateLinkEntries([
        "amazon-crystal-hot-sauce",
        "amazon-chipotle-in-adobo",
        "mike-hot-honey-original"
      ])
    },
    {
      key: "gift-guide",
      title: "Best gifts for spice lovers",
      description:
        "A few easy gift ideas when you want something fun, useful, and simple to choose.",
      ctaLabel: "Shop gift ideas",
      items: getAffiliateLinkEntries([
        "amazon-hot-sauce-gift-box",
        "heatonist-gift-set",
        "amazon-bbq-rub-gift-set"
      ])
    }
  ];
}
