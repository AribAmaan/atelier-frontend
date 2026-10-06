"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, resolveMediaUrl } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import AppShell from "@/components/AppShell";
import { inferTags, formatRemixCount, type ExploreCardCharacter } from "@/components/ExploreCharacterCard";
import { getCharacterBackground } from "@/lib/characterBackgrounds";

type CharacterDetail = ExploreCardCharacter & {
  backgroundUrl?: string | null;
  backstory?: string;
  greeting?: string;
};

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "harassment_or_hate", label: "Harassment or hate speech" },
  { value: "impersonates_real_person", label: "Impersonates a real person" },
  { value: "sexual_content_not_marked_explicit", label: "Sexual content (not marked explicit)" },
  { value: "spam_or_scam", label: "Spam or scam" },
  { value: "other", label: "Something else" },
];

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [character, setCharacter] = useState<CharacterDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value);
  const [reportNote, setReportNote] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    // Paint instantly from the card the user just clicked, if we have it —
    // then always refresh from the server for the full description fields
    // (personality/backstory/greeting) the list view doesn't carry.
    try {
      const cached = sessionStorage.getItem(`char_preview_${id}`);
      if (cached) setCharacter(JSON.parse(cached));
    } catch {
      // ignore malformed/unavailable sessionStorage
    }

    let ignore = false;
    apiFetch(`/api/characters/${id}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!ignore) setCharacter(data.character);
      })
      .catch(() => {
        // Server fetch failed — if we don't even have a cached card to
        // fall back on, this character truly isn't available.
        if (!ignore) {
          setCharacter((prev) => {
            if (!prev) setNotFound(true);
            return prev;
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  async function onStartChat() {
    if (!character || starting) return;
    setError("");
    setStarting(true);
    try {
      const res = await apiFetch(`/api/characters/${character.id}/remix`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.character) {
        setError(data.error || "Couldn't start that chat.");
        return;
      }
      router.push(`/chat/${data.character.id}`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setStarting(false);
    }
  }

  function openReport() {
    setReportReason(REPORT_REASONS[0].value);
    setReportNote("");
    setReportStatus("idle");
    setReportError("");
    setReportOpen(true);
  }

  async function submitReport() {
    if (!character) return;
    setReportStatus("sending");
    setReportError("");
    try {
      const res = await apiFetch(`/api/characters/${character.id}/report`, {
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
        <div className="flex-1 overflow-y-auto pb-28">
          {!character && !notFound && (
            <div className="max-w-2xl mx-auto px-4 md:px-8 pt-8 animate-pulse">
              <div className="h-48 rounded-2xl shimmer mb-6" />
              <div className="h-6 w-1/3 bg-white/10 rounded mb-3" />
              <div className="h-3 w-full bg-white/5 rounded mb-2" />
              <div className="h-3 w-2/3 bg-white/5 rounded" />
            </div>
          )}

          {!character && notFound && (
            <div className="text-center py-24 text-parchment/45">
              <span className="text-5xl block mb-4 opacity-50">🔍</span>
              <p className="text-lg mb-2 font-display">Character not found</p>
              <Link href="/explore" className="text-gold hover:text-gold/80 transition-colors text-sm">
                Back to Explore
              </Link>
            </div>
          )}

          {character && (
            <div className="max-w-2xl mx-auto">
              <div className="relative h-48 md:h-64 w-full overflow-hidden">
                {character.backgroundUrl || getCharacterBackground(character.name) || character.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(character.backgroundUrl || getCharacterBackground(character.name) || character.avatarUrl || "")}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: `linear-gradient(160deg, ${character.accentColor}55, #121218)` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/40 to-black/30" />
                <button
                  type="button"
                  onClick={() => router.back()}
                  aria-label="Back"
                  className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center focus-ring hover:bg-black/70 transition-colors"
                >
                  ←
                </button>
              </div>

              <div className="px-4 md:px-8 -mt-14 relative">
                <div className="flex items-end gap-4 mb-4">
                  <span
                    className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-2xl ring-2 ring-surface-raised flex items-center justify-center text-4xl"
                    style={{ backgroundColor: `${character.accentColor}40` }}
                  >
                    <span>{character.avatarEmoji}</span>
                    {character.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(character.avatarUrl)}
                        alt={character.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                  </span>
                  <div className="flex-1 min-w-0 pb-1">
                    <h1 className="font-display text-2xl md:text-3xl truncate">{character.name}</h1>
                    {character.owner && (
                      <p className="text-xs text-parchment/50">by {character.owner.displayName}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {inferTags(character).map((t) => (
                    <span
                      key={t}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-parchment/50 border border-white/5"
                    >
                      {t}
                    </span>
                  ))}
                  {typeof character.remixCount === "number" && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 text-parchment/40 border border-white/5">
                      {formatRemixCount(character.remixCount)}
                    </span>
                  )}
                </div>

                {character.tagline && (
                  <p className="text-parchment/80 text-base leading-relaxed mb-6">{character.tagline}</p>
                )}

                {character.personality && (
                  <section className="mb-6">
                    <h2 className="text-xs uppercase tracking-widest text-parchment/40 mb-2">About</h2>
                    <p className="text-sm text-parchment/65 leading-relaxed whitespace-pre-wrap">
                      {character.personality}
                    </p>
                  </section>
                )}

                {character.backstory && (
                  <section className="mb-6">
                    <h2 className="text-xs uppercase tracking-widest text-parchment/40 mb-2">Backstory</h2>
                    <p className="text-sm text-parchment/65 leading-relaxed whitespace-pre-wrap">
                      {character.backstory}
                    </p>
                  </section>
                )}

                {character.greeting && (
                  <section className="mb-6">
                    <h2 className="text-xs uppercase tracking-widest text-parchment/40 mb-2">Opening line</h2>
                    <p className="text-sm text-parchment/55 italic leading-relaxed border-l-2 border-gold/30 pl-3">
                      "{character.greeting}"
                    </p>
                  </section>
                )}

                {error && (
                  <p className="mb-4 text-sm text-rose bg-rose/10 border border-rose/30 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={openReport}
                  className="text-[11px] text-parchment/35 hover:text-rose focus-ring transition-colors"
                >
                  Report this character
                </button>
              </div>
            </div>
          )}
        </div>

        {character && (
          <div className="fixed bottom-0 left-0 right-0 md:left-[var(--sidebar-w,0px)] px-4 md:px-8 py-4 bg-gradient-to-t from-surface-raised via-surface-raised/95 to-transparent">
            <div className="max-w-2xl mx-auto">
              <button
                type="button"
                onClick={onStartChat}
                disabled={starting}
                className="w-full py-3.5 rounded-full bg-gold text-ink text-base font-medium hover:brightness-110 focus-ring disabled:opacity-50 btn-shine transition-all shadow-lg"
              >
                {starting ? "Starting chat…" : `Chat with ${character.name}`}
              </button>
            </div>
          </div>
        )}

        {reportOpen && character && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-6 z-50 animate-fade-in"
            onClick={() => setReportOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-surface-card border border-white/10 p-6 shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {reportStatus === "sent" ? (
                <>
                  <div className="text-center">
                    <span className="text-3xl block mb-3">✓</span>
                    <h2 className="font-display text-xl mb-2">Report sent</h2>
                    <p className="text-sm text-parchment/50 mb-4">We'll review it as soon as possible.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="w-full mt-2 bg-gold text-ink py-2 rounded-full font-medium focus-ring btn-shine"
                  >
                    Done
                  </button>
                </>
              ) : (
                <>
                  <h2 className="font-display text-xl mb-4">Report "{character.name}"</h2>
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
                    <button
                      type="button"
                      onClick={() => setReportOpen(false)}
                      className="flex-1 py-2 rounded-full border border-white/15 focus-ring hover:bg-white/5 transition-colors"
                    >
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
