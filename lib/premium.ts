/**
 * Premium / wallet infrastructure — UI is built now; payments stay OFF until
 * PREMIUM_PAYMENTS_ENABLED is flipped later.
 */
export const PREMIUM_PAYMENTS_ENABLED = false;

/** In-app currency name (not copied from any other product). */
export const SPARK_CURRENCY = "Sparks";

export type BillingCycle = "monthly" | "quarterly" | "yearly";

export type MembershipTierId = "free" | "plus" | "ultra" | "supreme";

export type MembershipTier = {
  id: MembershipTierId;
  name: string;
  tagline: string;
  /** Display price in INR, matching the backend's membershipAmountInPaise. */
  monthlyPriceInr: number;
  accent: "neutral" | "silver" | "gold" | "rainbow";
  features: string[];
  highlight?: boolean;
};

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need to start roleplaying.",
    monthlyPriceInr: 0,
    accent: "neutral",
    features: [
      "Vanilla chat engine",
      "Unlimited private characters",
      "Community explore gallery",
      "Voice playback (when configured)",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "A more attentive engine with more conversation context.",
    monthlyPriceInr: 1099,
    accent: "silver",
    features: [
      "Strawberry roleplay engine",
      "More recent messages in context than Vanilla",
      "A distinct, attentive conversation style",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    tagline: "For daily deep roleplay and richer scenes.",
    monthlyPriceInr: 1699,
    accent: "gold",
    highlight: true,
    features: [
      "Everything in Plus",
      "Chocolate roleplay engine",
      "More recent messages in context than Strawberry",
      "Narrative-focused conversation style",
    ],
  },
  {
    id: "supreme",
    name: "Supreme",
    tagline: "Maximum control and the flagship engine.",
    monthlyPriceInr: 4199,
    accent: "rainbow",
    features: [
      "Everything in Ultra",
      "Hazelnut flagship engine",
      "Flagship character consistency and initiative",
      "Conversation summaries for older context",
    ],
  },
];

export type SparkPackId = "s200" | "s1000" | "s1500" | "s3000" | "s5000" | "s10000";

export type SparkPack = {
  id: SparkPackId;
  sparks: number;
  bonus: number;
  priceInr: number;
};

export const SPARK_PACKS: SparkPack[] = [
  { id: "s200", sparks: 200, bonus: 40, priceInr: 169 },
  { id: "s1000", sparks: 1000, bonus: 200, priceInr: 849 },
  { id: "s1500", sparks: 1500, bonus: 300, priceInr: 1249 },
  { id: "s3000", sparks: 3000, bonus: 600, priceInr: 2499 },
  { id: "s5000", sparks: 5000, bonus: 1200, priceInr: 4199 },
  { id: "s10000", sparks: 10000, bonus: 4000, priceInr: 8399 },
];

/** Shown in UI while payments are off — users get full access anyway. */
export const EARLY_ACCESS_MESSAGE =
  "Early access — everything is free right now. Premium & Sparks launch later.";

export function cycleMultiplier(cycle: BillingCycle): number {
  if (cycle === "quarterly") return 2.85;
  if (cycle === "yearly") return 10;
  return 1;
}

export function formatPrice(inr: number): string {
  return inr.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
