> **Names superseded.** The engines are now Strawberry (free) and Choco Hazelnut (premium); see `FRONTEND_ENGINE_RENAME.md`. Where this note says Vanilla or Hazelnut, read Strawberry or Choco Hazelnut. Its claim that replies are sized to the user's message applies to a different backend; this backend fixes each engine's length.

# Frontend upgrade: two engines, context-sized replies, guest speakers

Pairs with `atelier-backend-context-length.zip`. Deploy the backend first (it still accepts the old engine ids), then this frontend.
No new packages, environment variables or database changes.

## What changed
- **Two engines** (`lib/roleplayEngines.ts`): Vanilla (free) and Hazelnut (premium, `minTier: plus`), matching the backend.
  Strawberry and Chocolate are gone from the picker.
- **Saved settings migrate**: browsers that stored `strawberry` or `chocolate` now resolve to Hazelnut (the same alias the backend uses)
  instead of silently dropping to Vanilla. New mature characters default to Hazelnut (the old default was Strawberry).
- **Picker** (`RoleplayModelPicker.tsx`): a Free section and a Premium section. The old Plus / Ultra / Supreme sections and the
  "recommended for you" block are removed. Copy now says replies are sized to the moment; no engine description promises a length.
- **Plans copy** (`lib/premium.ts`, `/plus`, `/wallet`): Plus lists the Hazelnut engine and longer memory. No page mentions Strawberry,
  Chocolate or "four engines" any more.
- **Guest speakers** (`lib/speaker.ts`, chat page): when the backend lets another of your characters answer ("Amy: ..."), the message shows
  Amy's name, an initial avatar and a "guest" tag, and the "Amy: " prefix is hidden in the bubble. Stored text is unchanged; chat export
  uses the speaker's name. A prefix only counts when your latest message names that character or the previous reply was already theirs, so
  an ordinary "Listen: ..." is never treated as a speaker.

## Decisions for you
1. ~~Ultra and Supreme buy nothing extra~~ — resolved: both are removed, see `FRONTEND_TWO_TIERS.md`.
2. **The Heat and Writing-style sliders do nothing while an engine is selected.** The backend uses the engine's own heat and style and ignores
   the values the app sends. This was already true before this update; I left the sliders in place.

## Checks
- `tsc --noEmit` passes. A full `next build` could not run in the sandbox (Google Fonts is blocked there); run it on Netlify as usual.
- Logic checks (engine ids, saved-preference migration, plan copy, speaker detection incl. whole-word and non-Latin names) pass.
- The old `REPLY_LENGTH_FIX.md` describes the previous four-engine word ranges and is superseded.
