# Frontend and backend sync (September 2026)

This frontend was checked against the RoliChat backend delivered as
`RoliChat-Model-Enhanced-Debugged.zip`.

## Fixes

- A stale local bearer token no longer wins over a valid cookie forever. The
  session check retries with the cookie after `/api/auth/me` returns no user;
  protected GETs also retry once after a 401. Mutating requests are never
  automatically replayed.
- Network failures while checking a session now show a retry option instead
  of redirecting a signed-in user to login. Concurrent session checks cannot
  overwrite a newer login/logout cache result. Background shell checks no
  longer leave unhandled promise rejections.
- Successful password reset clears the invalidated local session. Logout now
  reports a server/network failure instead of silently leaving a cookie active.
- Membership descriptions reflect the implemented engines and context
  behavior. The screens no longer promise monthly Sparks, priority provider
  routing, ad removal, or creator placement. Prices are hidden while billing
  is disabled. If billing is later enabled, displayed INR catalog values
  match the backend's current placeholder Razorpay catalog; review prices
  before enabling both payment flags.
- The wallet no longer claims five premium engines or an infinite Spark
  balance. When billing is enabled it reads the actual balance from
  `/api/billing/me`.

## Deploy

Run `npm ci && npm run build` on Netlify. Set `NEXT_PUBLIC_API_URL` to the
deployed backend origin at build time. Deploy the backend ZIP separately on
Render. No database migration or new environment variable is required.

The ZIP contains source and static assets, excluding `node_modules`, `.next`,
and the local `tests` directory. The existing chat prompts, token budgets,
and reply-length limits were not changed in this frontend update.

## Validation

TypeScript and nine local tests passed. The production build passed with a
temporary local Google Fonts fixture because this execution environment
cannot fetch Google Fonts. The fixture and generated build are not shipped;
a normal Netlify build needs access to Google Fonts. Live chat and checkout
against a deployed backend were not exercised here.
