import { getAffiliateLinkEntries, type AffiliateLinkEntry } from "@/lib/affiliates";
import type { MerchProduct } from "@/lib/types";

export interface ShopMerchCollection {
  key: "apparel" | "cookware" | "gifts";
  title: string;
  description: string;
  items: MerchProduct[];
}

export interface ShopAffiliateCollection {
  key: "starter-kit" | "taco-night" | "under-15" | "gift-guide" | "wing-night" | "heat-ladder" | "world-tour" | "premium-flex";
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
        "One useful bottle that works everywhere, one pantry staple that elevates any weeknight, and one tool upgrade that pays for itself fast.",
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
        "Three bottles that together cover every taco spread: an everyday red pour, a bright green option, and a garlic-forward finisher for the carne asada.",
      ctaLabel: "Build taco night",
      items: getAffiliateLinkEntries([
        "amazon-tapatio",
        "amazon-cholula-green-tomatillo",
        "amazon-cholula-chili-garlic"
      ])
    },
    {
      key: "wing-night",
      title: "Wing night essentials",
      description:
        "The three bottles every wing spread needs: the classic cayenne base, the ready-to-toss buffalo sauce, and a bright habanero for people who want real heat.",
      ctaLabel: "Set up wing night",
      items: getAffiliateLinkEntries([
        "amazon-franks-redhot",
        "amazon-franks-buffalo-wing",
        "amazon-yellowbird-habanero"
      ])
    },
    {
      key: "under-15",
      title: "Under-$15 favorites",
      description:
        "The best bottles money can buy without spending much — a Mexican classic, a Louisiana vinegar staple, and a pantry-friendly finishing drizzle.",
      ctaLabel: "Shop under $15",
      items: getAffiliateLinkEntries([
        "amazon-cholula-original",
        "amazon-crystal-hot-sauce",
        "mike-hot-honey-original"
      ])
    },
    {
      key: "heat-ladder",
      title: "The heat ladder",
      description:
        "Start mild and work your way up: jalapeño brightness to serrano medium to habanero to ghost pepper. One bottle at each level so you know exactly where your ceiling is.",
      ctaLabel: "Climb the heat ladder",
      items: getAffiliateLinkEntries([
        "amazon-yellowbird-serrano",
        "amazon-yellowbird-habanero",
        "amazon-daves-ghost-pepper"
      ])
    },
    {
      key: "world-tour",
      title: "Around-the-world bottle set",
      description:
        "One bottle from four different hot sauce traditions: a Jamaican scotch bonnet, a Sichuan oil-and-pepper, an African peri-peri, and a Thai garlic sriracha.",
      ctaLabel: "Shop the world tour",
      items: getAffiliateLinkEntries([
        "amazon-walkerswood-scotch-bonnet",
        "amazon-fly-by-jing-sichuan-gold",
        "amazon-nandos-peri-peri-hot"
      ])
    },
    {
      key: "premium-flex",
      title: "Premium shelf picks",
      description:
        "When you want bottles that feel like a recommendation, not a grocery run. TRUFF is the one non-hot-heads-can-still-gift it, Bravado is the serious flex, Fly By Jing is the conversation piece.",
      ctaLabel: "Upgrade the shelf",
      items: getAffiliateLinkEntries([
        "amazon-truff-original",
        "amazon-bravado-black-garlic-reaper",
        "amazon-fly-by-jing-sichuan-gold"
      ])
    },
    {
      key: "gift-guide",
      title: "Best gifts for spice lovers",
      description:
        "A premium truffle bottle that impresses even non-heat-seekers, a curated gift set, and a BBQ rub set for the backyard crowd.",
      ctaLabel: "Shop gift ideas",
      items: getAffiliateLinkEntries([
        "amazon-truff-original",
        "heatonist-gift-set",
        "amazon-bbq-rub-gift-set"
      ])
    }
  ];
}
