# Frontend: only two tiers (Free and Plus)

Matches the backend's `MEMBERSHIP_TWO_TIERS.md`. Before: Free, Plus (INR 1,099), Ultra (1,699), Supreme (4,199). Ultra and Supreme only
said "Everything in Plus", because the backend gates nothing except the Hazelnut engine.

## Changes
- `lib/premium.ts`: `MembershipTierId = "free" | "plus"`. `MEMBERSHIP_TIERS` has Free and Plus only; Plus is the highlighted card.
  `accent` is now `"neutral" | "silver"`.
- `app/plus/page.tsx`: two cards, centred (`md:grid-cols-2`, `max-w-3xl`) instead of a four-column grid; the Subscribe button is always the
  silver variant; header copy says "Plus unlocks..." instead of "Paid plans unlock...".
- `app/globals.css`: removed `.tier-card-glow-gold` and `.tier-card-glow-rainbow`, which only the Ultra and Supreme cards used.
- Nothing else needed changing: the chat page's "engine needs Plus" toast looks the tier up by id, and the backend now only ever sends `plus`.
  `lib/razorpay.ts` sends `tier: "plus"`, which is the only value the backend's checkout accepts.

## Keep in sync with the backend
The Plus price is 200 (INR per month) in `lib/premium.ts` and `MEMBERSHIP_MONTHLY_PAISE` (20000 paise) in the backend `payments/razorpay.ts`.
Quarterly (x2.85) and yearly (x10) multipliers are unchanged on both sides.

## Checks
`tsc --noEmit` passes. Executed against the compiled code: tiers are exactly `free@0, plus@200`; `strawberry` and `chocolate` ids resolve to
`hazelnut`; unknown ids resolve to nothing. No `ultra`, `supreme`, `tier-card-glow` or four-tier layout remains in `app`, `components` or `lib`.
A full `next build` was not run (the sandbox blocks Google Fonts); run it on Netlify as usual.
