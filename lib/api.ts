// The backend (Express, deployed on Render) lives on a different origin
// than this frontend (Next.js, deployed on Netlify), so every request needs
// an absolute URL plus credentials: "include" so the cross-site session
// cookie is sent/received (see the backend's lib/auth.ts for the matching
// SameSite=None; Secure cookie config). Some mobile browsers (iOS Safari's
// tracking prevention, many in-app browsers) silently drop that cookie
// entirely, so we also attach the token from lib/authToken.ts as a Bearer
// header on every request. The backend uses the bearer token first, so an
// expired token must be removed even when a valid cookie may still exist.
import { clearAuthToken, getAuthToken } from "@/lib/authToken";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

/**
 * fetch wrapper for JSON API calls. Prefixes API_URL, always sends cookies
 * cross-site, and attaches the stored session token (if any) as a Bearer
 * header. Pass a FormData body (e.g. avatar upload) as-is — this won't set
 * a Content-Type header for you in that case, which is correct (the
 * browser sets the multipart boundary itself).
 */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (!isFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  // This makes browser fetches preflight through the backend origin allowlist.
  // It is a transport convention; the backend does not require this header.
  headers.set("X-Requested-With", "atelier-frontend");

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  });
  // Login/Google/reset routes can return 401 for a bad credential while a
  // separate session remains valid. Only protected-route 401s revoke the
  // stale bearer, and never clear a newer token set by a racing sign-in.
  const staleBearer = response.status === 401 && token &&
      headers.get("Authorization") === `Bearer ${token}` && getAuthToken() === token &&
      !/^\/api\/auth\/(?:login|register|google(?:\/complete)?|forgot-password|reset-password|verify-email)\b/.test(path);
  if (staleBearer) {
    clearAuthToken();
    // A safe GET can transparently fall back to a working cookie. Never
    // replay a POST/PUT/DELETE because it may already have taken effect.
    if ((init.method ?? "GET").toUpperCase() === "GET") {
      const cookieHeaders = new Headers(headers);
      cookieHeaders.delete("Authorization");
      return fetch(`${API_URL}${path}`, {
        ...init,
        credentials: "include",
        cache: "no-store",
        headers: cookieHeaders,
      });
    }
  }
  return response;
}

/**
 * Character avatarUrl / backgroundUrl values come back from the backend as
 * absolute B2 proxy URLs like "https://<backend-host>/api/images/rolichat/avatars/xyz.png"
 * (the bucket stays private; the backend streams objects itself via GET /api/images/:key).
 * Resolve any relative path against API_URL so <img> tags load correctly regardless
 * of whether the value is absolute or relative.
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/assets/")) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
