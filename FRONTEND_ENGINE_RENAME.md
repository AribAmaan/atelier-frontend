# Frontend: Strawberry (free) and Choco Hazelnut (premium)

Pairs with `atelier-backend-two-engines.zip` (`TWO_ENGINES.md`). Deploy the backend first; it still accepts the old ids, so nothing breaks in between. No new packages, environment variables or database changes.

## Changes
- `lib/roleplayEngines.ts`: engine ids are now `strawberry` (free) and `choco_hazelnut` (Plus), matching the backend. Names, emoji (🍓, 🍫) and descriptions updated.
- Retired ids saved in browsers or received from the backend migrate like the backend's own aliases: `vanilla` -> Strawberry; `chocolate`, `hazelnut` -> Choco Hazelnut (case, spaces and hyphens ignored). The earlier `strawberry -> hazelnut` alias is removed, because Strawberry is the free engine again.
- Defaults (`lib/roleplayPreferences.ts`): mature characters start on Choco Hazelnut, others on Strawberry.
- Copy made accurate for this backend, which fixes each engine's reply length regardless of how long the user's message is (Strawberry about 50-70 words, Choco Hazelnut about 105-130). The picker banner and engine descriptions now say that instead of "replies are sized to the moment". The "More detail" scene steer no longer promises longer replies.
- Plans (`lib/premium.ts`, `/plus`, `/wallet`): "Strawberry chat engine" on Free, "Choco Hazelnut roleplay engine" on Plus. Price unchanged at INR 200/month and matches the backend.
- The "needs Plus" toast now names the right engines, since both ids resolve correctly.

## Known, left as is
The Heat and Writing-style fine-tune sliders in the picker have no effect while an engine is selected: the backend uses each engine's own heat and style. This was already true; say if you want them hidden.

## Checks
`tsc --noEmit` passes. Logic checks pass: engine list and tiers, every old and new id resolving correctly, unknown ids resolving to nothing, saved-preference migration, defaults, plan prices. `next build` compiles all pages with a temporary stub for Google Fonts (the sandbox cannot fetch them; the stub is not shipped). A normal Netlify build needs Google Fonts access as usual. A live chat against a deployed backend was not exercised.
