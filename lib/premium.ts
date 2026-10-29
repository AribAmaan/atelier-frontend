/**
 * Premium / wallet infrastructure — UI is built now; payments stay OFF until
 * PREMIUM_PAYMENTS_ENABLED is flipped later.
 */
export const PREMIUM_PAYMENTS_ENABLED = false;

/** In-app currency name (not copied from any other product). */
export const SPARK_CURRENCY = "Sparks";

export type BillingCycle = "monthly" | "quarterly" | "yearly";

/**
 * Only two tiers exist: "free" and "plus" (the single paid plan). Ultra and
 * Supreme were retired; the backend still treats old accounts stored as
 * ultra/supreme as paid (see normalizeMembershipTier in providers/engines.ts),
 * so nothing here needs to know about them.
 */
export type MembershipTierId = "free" | "plus";

export type MembershipTier = {
  id: MembershipTierId;
  name: string;
  tagline: string;
  /** Display price in INR, matching the backend's membershipAmountInPaise. */
  monthlyPriceInr: number;
  accent: "neutral" | "silver";
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
    tagline: "The premium Hazelnut engine for deeper roleplay.",
    // Keep equal to MEMBERSHIP_MONTHLY_PAISE in the backend's payments/razorpay.ts (20000 paise).
    monthlyPriceInr: 200,
    accent: "silver",
    highlight: true,
    features: [
      "Hazelnut roleplay engine",
      "Longer memory: more recent messages kept in context, with summaries of older ones",
      "Stronger character consistency and initiative",
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
