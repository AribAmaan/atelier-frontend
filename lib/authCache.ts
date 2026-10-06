import { apiFetch } from "@/lib/api";
import { clearAuthToken, getAuthToken } from "@/lib/authToken";

/**
 * Module-scope cache for "am I signed in?" (see components/RequireAuth.tsx).
 *
 * Previously every page re-mounted RequireAuth, which re-fetched
 * /api/auth/me and blocked the whole page behind a "Loading…" screen on
 * every navigation — even seconds after the previous page had already
 * confirmed the session. Across a Netlify (frontend) <-> Render (backend)
 * cross-origin hop, that round trip is slow enough to make the whole app
 * feel sluggish just from clicking between pages.
 *
 * This cache lives for the lifetime of the tab (reset on full reload) and
 * lets RequireAuth render children immediately if we checked recently,
 * while still revalidating in the background so an expired/logged-out
 * session is still caught quickly.
 */

type AuthUser = { id: string; email: string; displayName: string } | null;

let cachedUser: AuthUser | undefined; // undefined = never checked yet this session
let cachedAt = 0;
let inFlight: Promise<AuthUser> | null = null;
let generation = 0;

const FRESH_MS = 60_000; // treat a check younger than this as still valid, no refetch needed

async function fetchUser(): Promise<AuthUser> {
  const token = getAuthToken();
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw new Error("Couldn't verify your session. Please try again.");
  const data = await res.json();
  if (data.user) return data.user;
  if (token && getAuthToken() === token) {
    // /me returns 200 with user:null for an invalid token, so a protected
    // route's 401 handler cannot catch this case. Retry this safe GET once
    // using a cookie after discarding the bearer that now takes priority.
    clearAuthToken();
    const retry = await apiFetch("/api/auth/me");
    if (!retry.ok) throw new Error("Couldn't verify your session. Please try again.");
    const recovered = await retry.json();
    return recovered.user ?? null;
  }
  return null;
}

/** Returns the cached user (if fresh) without hitting the network. */
export function getCachedUser(): { user: AuthUser; fresh: boolean } | null {
  if (cachedUser === undefined) return null;
  return { user: cachedUser, fresh: Date.now() - cachedAt < FRESH_MS };
}

/** Fetches (or reuses an in-flight fetch of) the current user, and updates the cache. */
export async function fetchAndCacheUser(): Promise<AuthUser> {
  if (inFlight) return inFlight;
  const currentGeneration = generation;
  const pending = fetchUser().then((user) => {
    if (generation === currentGeneration) {
      cachedUser = user;
      cachedAt = Date.now();
    }
    return user;
  }).finally(() => {
    if (inFlight === pending) inFlight = null;
  });
  inFlight = pending;
  return pending;
}

/** Called on login/logout so the very next page navigation reflects it immediately. */
export function setCachedUser(user: AuthUser) {
  generation++;
  inFlight = null;
  cachedUser = user;
  cachedAt = Date.now();
}

export function clearAuthCache() {
  generation++;
  inFlight = null;
  cachedUser = undefined;
  cachedAt = 0;
}
