export const categories = {
  electronics: {
    audio: [
      "wireless_earbuds",
      "earbud_case",
      "headphones",
    ],
    mobile_accessories: [
      "phone_case",
      "charger",
      "power_bank",
    ],
    computers: [
      "laptop",
      "laptop_bag",
    ],
  },
  bags: {
    carrying_bags: [
      "backpack",
      "handbag",
      "laptop_bag",
    ],
  },
  personal_items: {
    accessories: [
      "wallet",
      "keys",
      "id_card",
    ],
  },
} as const;

export type CategoryKey = keyof typeof categories;

// Related categories mapping for cross-category compatibility (40% match)
export const relatedCategories: Record<string, string[]> = {
  // Bags and laptop bags / cases
  backpack: ["laptop_bag", "handbag"],
  laptop_bag: ["backpack", "handbag", "laptop"],
  handbag: ["backpack", "laptop_bag"],
  // Mobile accessories and electronics
  wireless_earbuds: ["earbud_case", "headphones"],
  earbud_case: ["wireless_earbuds", "headphones"],
  headphones: ["wireless_earbuds", "earbud_case"],
  phone_case: ["charger", "power_bank"],
  charger: ["power_bank", "phone_case"],
  power_bank: ["charger", "phone_case"],
  // Personal items
  wallet: ["id_card", "keys"],
  id_card: ["wallet"],
  keys: ["wallet"],
};
