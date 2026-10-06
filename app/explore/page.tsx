"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchAndCacheUser } from "@/lib/authCache";
import { readLocal, writeLocal } from "@/lib/storySettings";
import { loadExploreNsfwPreference, saveExploreNsfwPreference } from "@/lib/explorePreferences";
import { resolveMediaUrl } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import AppShell from "@/components/AppShell";
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import ExploreCharacterCard, {
  ExploreCharacterCardSkeleton,
  inferTags,
  explicitTags,
  type ExploreCardCharacter,
} from "@/components/ExploreCharacterCard";

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "harassment_or_hate", label: "Harassment or hate speech" },
  { value: "impersonates_real_person", label: "Impersonates a real person" },
  { value: "sexual_content_not_marked_explicit", label: "Sexual content (not marked explicit)" },
  { value: "spam_or_scam", label: "Spam or scam" },
  { value: "other", label: "Something else" },
];

const TABS = [
  { id: "all", label: "Explore" },
  { id: "trending", label: "Trending" },
  { id: "saved", label: "♡ Saved" },
  { id: "fantasy", label: "Fantasy" },
  { id: "premium", label: "Premium" },
  { id: "anime", label: "Anime" },
  { id: "romance", label: "Romance" },
  { id: "drama", label: "Drama" },
  { id: "slice", label: "Slice of life" },
  { id: "adventure", label: "Adventure" },
  { id: "comedy", label: "Comedy" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function matchesTab(c: ExploreCardCharacter, tab: TabId): boolean {
  if (tab === "all" || tab === "saved") return true;
  if (tab === "fantasy") return inferTags(c, false).some(t => t.toLowerCase() === "fantasy");
  const tags = inferTags(c, false).map((t) => t.toLowerCase());
  if (tab === "trending") return true;
  // Authoritative only — a creator explicitly tagging their character
  // "premium", not a guess from romance/drama keywords in the tagline.
  if (tab === "premium") return explicitTags(c).includes("premium");
  if (tab === "anime") return tags.includes("anime");
  if (tab === "romance") return tags.includes("romance");
  if (tab === "drama") return tags.includes("drama");
  if (tab === "slice") return tags.includes("slice of life");
  if (tab === "adventure") return tags.includes("adventure");
  if (tab === "comedy") return tags.includes("comedy");
  return true;
}

export default function ExplorePage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<ExploreCardCharacter[] | null>(null);
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [reportTarget, setReportTarget] = useState<ExploreCardCharacter | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [reportNote, setReportNote] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [reportError, setReportError] = useState("");
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [nsfwReady, setNsfwReady] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [recent, setRecent] = useState<(ExploreCardCharacter & { lastMessagePreview?: string })[]>([]);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [visibleCount, setVisibleCount] = useState(20);
  useEffect(() => {
    let live = true;
    fetchAndCacheUser().then(user => {
      if (!live) return;
      if (!user) {
        setNsfwReady(true);
        return;
      }
      setUserId(user.id);
      const ids = readLocal<unknown>(`rolichat:saved:${user.id}`, []);
      setSaved(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []);
      setNsfwEnabled(loadExploreNsfwPreference(user.id));
      setNsfwReady(true);
    }).catch(() => {
      if (live) setNsfwReady(true);
    });
    apiFetch("/api/characters").then(r => r.ok ? r.json() : null).then(d => { if (live) setRecent((d?.characters || []).filter((c: { lastMessagePreview?: string }) => c.lastMessagePreview).slice(0, 3)); }).catch(() => {});
    return () => { live = false; };
  }, []);
  useEffect(() => { setVisibleCount(20); }, [tab, query, nsfwEnabled]);
  function toggleSaved(id: string) {
    if (!userId) return;
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
    setSaved(next);
    if (!writeLocal(`rolichat:saved:${userId}`, next)) setError("Saved for this visit. Browser storage is unavailable.");
  }

  function toggleNsfw() {
    if (!nsfwReady || !userId) return;
    if (!nsfwEnabled) {
      const confirmed = window.confirm(
        "This will show explicit (18+) characters. Continue only if you're an adult and want to see mature content."
      );
      if (!confirmed) return;
    }
    const next = !nsfwEnabled;
    setNsfwEnabled(next);
    if (!saveExploreNsfwPreference(userId, next)) {
      setError("18+ mode changed for this page, but your browser blocked session storage, so it may reset after navigation.");
    }
  }

  useEffect(() => {
    if (!nsfwReady) return;
    let ignore = false;
    setCharacters(null);
    setLoadError("");
    apiFetch(`/api/characters/discover${nsfwEnabled ? "?nsfw=1" : ""}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!ignore) setCharacters(Array.isArray(data.characters) ? data.characters : []);
      })
      .catch(() => {
        if (!ignore) { setCharacters([]); setLoadError("Couldn't load the cast. Please check your connection and try again."); }
      });
    return () => {
      ignore = true;
    };
  }, [nsfwEnabled, nsfwReady, reload]);

  const filtered = useMemo(() => {
    if (!characters) return null;
    const q = query.trim().toLowerCase();
    let list = characters.filter((c) => matchesTab(c, tab) && (tab !== "saved" || saved.includes(c.id)));
    if (tab === "trending") {
      // trendScore comes from the backend: recent (7-day) message activity
      // weighted highest, remix count next, mild recency decay. See
      // GET /api/characters/discover.
      list = [...list].sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0));
    }
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          (c.personality || "").toLowerCase().includes(q) ||
          (() => {
            try {
              const tags = JSON.parse(c.tags || "[]");
              return Array.isArray(tags) && tags.some((t: unknown) => typeof t === "string" && t.toLowerCase().includes(q));
            } catch {
              return false;
            }
          })()
      );
    }
    return list;
  }, [characters, tab, query, saved]);

  async function onRemix(id: string) {
    if (remixingId) return;
    setError("");
    setRemixingId(id);
    try {
      const res = await apiFetch(`/api/characters/${id}/remix`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.character) {
        setError(data.error || "Couldn't add that character.");
        return;
      }
      router.push(`/chat/${data.character.id}`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setRemixingId(null);
    }
  }

  async function submitReport() {
    if (!reportTarget) return;
    setReportStatus("sending");
    setReportError("");
    try {
      const res = await apiFetch(`/api/characters/${reportTarget.id}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: reportReason, note: reportNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReportError(data.error || "Couldn't submit the report.");
        setReportStatus("idle");
        return;
      }
      setReportStatus("sent");
    } catch {
      setReportError("Couldn't reach the server.");
      setReportStatus("idle");
    }
  }

  return (
    <RequireAuth>
      <AppShell>
        <WelcomeOnboarding />
        <div className="rp-discover flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 pt-6 pb-4">
            <div className="rp-discover-heading"><div><p className="rp-eyebrow">THE NEXT CHAPTER IS YOURS</p><h1>Where will you <em>go today?</em></h1><p>A familiar face. An unexpected world. A story waiting for you.</p></div><Link href="/dashboard" className="rp-button">＋ Create a character</Link></div>
            {recent.length > 0 && <section className="rp-recent-section"><div className="rp-row-title"><h2>Pick up where you left off</h2><Link href="/me/chats">All conversations ↗</Link></div><div className="rp-recent-grid">{recent.map(c => <Link className="rp-recent-card" href={`/chat/${c.id}`} key={c.id}><span className="rp-recent-avatar">{c.avatarUrl ? <img src={resolveMediaUrl(c.avatarUrl)} alt="" loading="lazy" /> : c.avatarEmoji}</span><div><strong>{c.name}</strong><p>{c.lastMessagePreview}</p></div><span>↗</span></Link>)}</div></section>}
            <section className="rp-discover-banner"><div><span className="rp-eyebrow">A LITTLE SERENDIPITY</span><h2>Your next favorite character<br />might surprise you.</h2><button className="rp-text-button" disabled={!filtered?.length || !!remixingId} onClick={() => { if (filtered?.length) onRemix(filtered[Math.floor(Math.random() * filtered.length)].id); }}>Surprise me ↗</button></div><div aria-hidden="true" className="rp-banner-art">✦<span>✧</span></div></section>

            <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
              <div className="min-w-0 lg:flex-1 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm focus-ring border transition-all duration-200 ${
                      tab === id
                        ? "bg-gradient-to-r from-gold/20 to-gold/10 border-gold/30 text-parchment shadow-sm"
                        : "border-transparent text-parchment/45 hover:text-parchment/70 hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="w-full lg:w-80 shrink-0 ml-auto flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment/30 text-sm">⌕</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search characters"
                    placeholder="Search names, worlds, personalities…"
                    className="w-full rounded-full bg-surface-card border border-white/10 pl-8 pr-4 py-2.5 text-sm focus-ring placeholder:text-parchment/25 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleNsfw}
                  disabled={!nsfwReady || !userId}
                  aria-pressed={nsfwEnabled}
                  title={!nsfwReady ? "Loading 18+ preference…" : nsfwEnabled ? "Showing 18+ characters — tap to hide" : "Showing SFW only — tap to show 18+ characters"}
                  className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 focus-ring disabled:opacity-60 disabled:cursor-not-allowed ${
                    nsfwEnabled
                      ? "bg-rose/20 border-rose/40 text-rose shadow-sm shadow-rose/10"
                      : "bg-surface-card border-white/10 text-parchment/50 hover:text-parchment/80"
                  }`}
                >
                  {nsfwEnabled ? "18+ On" : "18+ Off"}
                </button>
              </div>
            </div>

            {error && (
              <p className="mb-4 text-sm text-rose bg-rose/10 border border-rose/30 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="rp-row-title"><h2>{tab === "saved" ? "Your saved cast" : query ? "Search results" : "Find your kind of story"}</h2><span>{filtered ? `${filtered.length} characters` : "Loading characters…"}</span></div>
            {tab === "saved" && <p className="rp-muted mb-4">Saved on this browser. Mature characters appear only when 18+ is enabled.</p>}
            {loadError && <div className="rp-note" role="alert">{loadError} <button onClick={() => setReload(n => n + 1)} className="underline ml-2">Try again</button></div>}
            {filtered === null && (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <ExploreCharacterCardSkeleton key={i} />
                ))}
              </div>
            )}

            {!loadError && filtered?.length === 0 && (
              <div className="text-center py-20 text-parchment/45">
                <span className="text-5xl block mb-4 opacity-50">🔍</span>
                <p className="text-lg mb-2 font-display">{tab === "saved" ? "Keep your favorites close" : "No characters found"}</p>
                <p className="text-sm max-w-md mx-auto text-parchment/40">
                  {tab === "saved" ? "Tap the heart on a character to save it, or create one in " : "Try another search or genre, or create a character in "}{" "}
                  <Link href="/dashboard" className="text-gold hover:text-gold/80 transition-colors">
                    Studio
                  </Link>{" "}
                  or try another category.
                </p>
              </div>
            )}

            {filtered && filtered.length > 0 && (
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.slice(0, visibleCount).map((c) => (
                  <ExploreCharacterCard
                    key={c.id}
                    character={c}
                    onRemix={() => onRemix(c.id)}
                    remixing={remixingId === c.id}
                    disabled={Boolean(remixingId)}
                    saved={saved.includes(c.id)}
                    onSave={() => toggleSaved(c.id)}
                    onReport={() => {
                      setReportTarget(c);
                      setReportReason(REPORT_REASONS[0].value);
                      setReportNote("");
                      setReportStatus("idle");
                      setReportError("");
                    }}
                  />
                ))}
              </div>
            )}
            {filtered && visibleCount < filtered.length && <div className="text-center py-8"><button className="rp-button" onClick={() => setVisibleCount(n => n + 20)}>Show more characters ↓</button></div>}
          </div>
        </div>

        {reportTarget && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-6 z-50 animate-fade-in" onClick={() => setReportTarget(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-surface-card border border-white/10 p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
              {reportStatus === "sent" ? (
                <>
                  <div className="text-center">
                    <span className="text-3xl block mb-3">✓</span>
                    <h2 className="font-display text-xl mb-2">Report sent</h2>
                    <p className="text-sm text-parchment/50 mb-4">We'll review it as soon as possible.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportTarget(null)}
                    className="w-full mt-2 bg-gold text-ink py-2 rounded-full font-medium focus-ring btn-shine"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl mb-4">Report "{reportTarget.name}"</h2>
                  {reportError && <p className="mb-3 text-sm text-rose">{reportError}</p>}
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full mb-3 rounded-xl bg-surface-raised border border-white/10 px-3 py-2.5 text-sm focus-ring"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    rows={3}
                    className="w-full mb-4 rounded-xl bg-surface-raised border border-white/10 px-3 py-2.5 text-sm focus-ring resize-none placeholder:text-parchment/25"
                    placeholder="Optional details"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setReportTarget(null)} className="flex-1 py-2 rounded-full border border-white/15 focus-ring hover:bg-white/5 transition-colors">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitReport}
                      disabled={reportStatus === "sending"}
                      className="flex-1 py-2 rounded-full bg-rose text-ink font-medium focus-ring disabled:opacity-50 btn-shine"
                    >
                      {reportStatus === "sending" ? "Sending…" : "Submit"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}