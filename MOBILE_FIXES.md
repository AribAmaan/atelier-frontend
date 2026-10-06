# Mobile frontend fixes

This ZIP contains the complete frontend with mobile fixes applied to Story Edition. Replace the contents of your existing frontend repository with this project, keep your deployment environment variables, and redeploy using `npm ci` and `npm run build`. This patch requires no backend or database changes.

## Changes

- Composer uses the full content width, starts at 80px tall on phones, and grows with typing or restored drafts. Tools and Send have their own row. Long drafts scroll within a capped input height.
- Fixed textarea height animation that prevented the input from shrinking after deleting text.
- Chat follows the visible viewport when browser chrome or an overlay keyboard changes its size. Header and composer stay outside the scrollable transcript; reading older messages no longer forces a jump on every streamed token.
- Wider phone message bubbles, wrapping for long URLs, readable editing fields, and message menus available without hover.
- Recent conversation cards cannot expand grid tracks with long previews or names. Fixed discovery headings, banner spacing, landing artwork captions, clipped genre labels, and mobile navigation clearance.
- Memory, confirmation, avatar, and model dialogs fit short viewports and have accessible touch controls. Scene director actions remain reachable while scrolling.
- Safe-area padding and 16px form fields support mobile browser behavior.

## Verification

Production `npm run build` passed including TypeScript validation. All three existing `npm test` tests passed.

Chromium browser checks against the production build passed at 320, 360, 390, 430, 768, 1024, and 1440px. Checked component bounds as well as document overflow using long names, 1,000-character unbroken previews, long replies, and unbroken URLs. At 360px, the input changed from approximately 209 × 45px to 336 × 80px, and recent cards stayed inside their 328px content track.

Interaction checks passed for draft growth/shrink/reload, long-draft scrolling, mocked message sending, touch message options, scene settings, scenario controls, memory controls, and reduced viewport height. Additional overflow checks covered conversation history, creation, profile, character detail, landing, login, and signup. No uncaught browser errors were recorded.

API responses were mocked for layout testing. Keyboard coverage used a simulated visual-viewport reduction and a short browser viewport, not a physical Android/iOS keyboard. Real authentication, AI generation, voice, and payment services were not exercised by these frontend checks. After deployment, check a chat on your phone with the keyboard open.
