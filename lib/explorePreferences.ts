/**
 * Session-scoped Explore preferences.
 *
 * The 18+ discovery toggle should survive client-side navigation (Explore ->
 * Chat -> Explore) and refreshes in the same tab, but it intentionally resets
 * when the browser/tab session ends. The key is account-scoped so one signed-in
 * user cannot inherit another user's mature-content preference on a shared tab.
 */
function nsfwStorageKey(userId: string) {
  return `rolichat:explore:nsfw:${userId}`;
}

export function loadExploreNsfwPreference(userId: string): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return window.sessionStorage.getItem(nsfwStorageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function saveExploreNsfwPreference(userId: string, enabled: boolean): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    window.sessionStorage.setItem(nsfwStorageKey(userId), enabled ? "1" : "0");
    return true;
  } catch {
    return false;
  }
}
