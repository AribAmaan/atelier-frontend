# Atelier — frontend (Next.js, deploy to Netlify)

[![CI](https://github.com/chandiwalaamaan-droid/atelier-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/chandiwalaamaan-droid/atelier-frontend/actions/workflows/ci.yml)

This is the UI half of Atelier, split out from the original combined
Next.js app so it can be deployed on Netlify while the API lives on Render
(see the separate `backend` project). All the character-crafting and chat
pages are unchanged visually — what changed is *where* they get their data.

## What changed from the combined app

- Every `fetch("/api/...")` call now goes through `lib/api.ts`'s `apiFetch()`,
  which prefixes the backend's URL (`NEXT_PUBLIC_API_URL`) and always sends
  `credentials: "include"` so the cross-site session cookie is attached.
- Avatar images (`character.avatarUrl`, e.g. `/uploads/avatars/x.png`) are
  resolved against the backend origin via `resolveMediaUrl()`, since those
  files are served by the Express app now, not this one.
- The old `middleware.ts` (which redirected signed-out visitors at the edge
  by reading the session cookie directly) is gone — that only works when
  frontend and backend share an origin. It's replaced by
  `components/RequireAuth.tsx`, a client component that asks the backend
  "am I signed in?" via `/api/auth/me` and redirects to `/login` if not.
  It wraps the three protected pages: `/dashboard`, `/chat/[characterId]`,
  and `/characters/[id]/edit`.
- `package.json` no longer has Prisma, bcrypt, or `jose` — none of that lives
  here anymore, it's all in the backend.

Everything else — every component, every bit of styling, the Tailwind
config, the fonts — is untouched.

## Local setup

1. `npm install`
2. `cp .env.example .env.local` and set `NEXT_PUBLIC_API_URL` to wherever the
   backend is running (`http://localhost:4000` if running it locally per its
   own README).
3. `npm run dev` — opens on `http://localhost:3000`

Run the backend locally too (see its README) — this app has no data of its
own to serve without it.

## Deploying to Netlify

1. Push this folder to its own GitHub repo (or point Netlify at it as a
   subfolder with a custom base directory).
2. Deploy the **backend** to Render first (see its README) and note the
   resulting URL, e.g. `https://atelier-backend.onrender.com`.
3. In Netlify: **Add new site → Import an existing project**, point it at
   this repo. Netlify auto-detects Next.js and applies the official
   `@netlify/plugin-nextjs` runtime (also declared in `netlify.toml` here) —
   no static export, dynamic routes like `/chat/[characterId]` work as-is.
4. In Netlify's site settings → **Environment variables**, add:
   ```
   NEXT_PUBLIC_API_URL = https://atelier-backend.onrender.com
   ```
   (Rebuild after adding this — `NEXT_PUBLIC_*` vars are baked in at build
   time, not read at runtime.)
5. Deploy. Note your Netlify site's URL, e.g. `https://your-site.netlify.app`.
6. Go back to the Render dashboard and set the backend's `FRONTEND_URL` env
   var to that Netlify URL (comma-separated if you also want to allow Netlify
   deploy-preview URLs), then redeploy the backend so CORS allows it.

Once both sides know about each other's URLs, sign-up/login/chat/avatar
upload should all work exactly as they did in the combined app.

## How it fits together

- `lib/api.ts` — `apiFetch()` wrapper + `resolveMediaUrl()` for avatar images
- `components/RequireAuth.tsx` — client-side auth guard (replaces middleware.ts)
- `app/page.tsx` — marketing/landing page
- `app/login`, `app/signup` — auth forms
- `app/dashboard` — character list + creation (wrapped in `RequireAuth`)
- `app/characters/[id]/edit` — character editing + avatar upload (wrapped in `RequireAuth`)
- `app/chat/[characterId]` — the chat UI, streaming replies (wrapped in `RequireAuth`)
