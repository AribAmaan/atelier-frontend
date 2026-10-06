# Rolichat logo update

Replace the frontend source with this project and redeploy using your existing Netlify build settings. Keep environment variables. No backend update or database changes are needed. The previous mobile fixes are included.

## Changes

- Replaced the raster logo in the UI with a transparent SVG: a warm gold chat outline with a soft purple heart. The web mark has no background rectangle, outer ring, glow, or looping wobble.
- Fixed a CSS selector that applied tagline margins and borders to the logo wrapper and hid the logo at mobile widths. The tagline now has its own class.
- Preserved explicit logo dimensions across landing, navigation, login, signup, and footer. Paired wordmarks use a decorative image to avoid repeated screen-reader labels.
- Exported matching PNG favicon and installable-app icons from the SVG master. Web logos are transparent; launcher icons intentionally use the app background. Maskable exports keep the mark inside the safe area.
- Updated the static service-worker cache version so existing browsers can receive the new assets.

Vector master: `public/brand/rolichat-mark.svg`.

## Verification

Production build passed, including type validation. Browser checks passed at 320, 360, 390, 430, 768, 1100, and 1440px. Verified visible, correctly sized header/footer marks, no horizontal overflow, login/signup logos, reduced-motion behavior, and successful responses for all ten manifest icons. Inspected mobile, desktop, and login screenshots. API responses were mocked; live authentication was not exercised. No uncaught browser errors occurred in these checks.

After redeployment, reload the site to activate the updated static assets. Installed home-screen icons may refresh on the operating system's own schedule.
