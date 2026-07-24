"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, resolveMediaUrl } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import { CharacterCardSkeleton } from "@/components/Skeleton";

type PublicCharacter = {
  id: string;
  name: string;
  tagline: string;
  personality: string;
  avatarEmoji: string;
  avatarUrl: string | null;
  accentColor: string;
  owner?: { displayName: string } | null;
  remixCount?: number;
};

export default function DiscoverPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<PublicCharacter[] | null>(null);
  const [remixingId, setRemixingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/characters/discover")
      .then(async (r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setCharacters(data.characters))
      .catch(() => setCharacters([]));
  }, []);

  async function onRemix(id: string) {
    if (remixingId) return;
    setError("");
    setRemixingId(id);
    try {
      const res = await apiFetch(`/api/characters/${id}/remix`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.character) {
        setError(data.error || "Couldn't remix that character.");
        return;
      }
      router.push(`/chat/${data.character.id}`);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setRemixingId(null);
    }
  }

  return (
    <RequireAuth>
    <main className="min-h-screen px-6 py-8 md:px-12">
      <header className="flex items-center justify-between mb-10">
        <div>
          <p className="text-sm text-parchment/60">
            <Link href="/dashboard" className="hover:text-gold">
              ← Your characters
            </Link>
          </p>
          <h1 className="font-display text-3xl">Discover</h1>
          <p className="text-sm text-parchment/60 mt-1">Characters shared by the community. Remix any of them into your own.</p>
        </div>
      </header>

      {error && (
        <p className="mb-6 max-w-2xl text-sm text-rose bg-rose/10 border border-rose/30 rounded px-3 py-2">{error}</p>
      )}

      {characters === null && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CharacterCardSkeleton key={i} />
          ))}
        </div>
      )}

      {characters?.length === 0 && (
        <p className="text-parchment/60">
          Nothing shared yet — be the first! Open a character's edit page and turn on "Share to the Discover
          gallery."
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {characters?.map((c) => (
          <div key={c.id} className="stitched rounded-2xl bg-plum/60 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-2xl w-12 h-12 flex items-center justify-center rounded-full overflow-hidden shrink-0"
                style={{ backgroundColor: `${c.accentColor}30` }}
              >
                {c.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveMediaUrl(c.avatarUrl)} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  c.avatarEmoji
                )}
              </span>
              <div className="min-w-0">
                <p className="font-display text-lg truncate">{c.name}</p>
                {c.owner?.displayName && (
                  <p className="text-[11px] text-parchment/40 truncate">by {c.owner.displayName}</p>
                )}
              </div>
              {!!c.remixCount && (
                <span className="ml-auto shrink-0 text-[10px] text-gold/80 border border-gold/30 rounded-full px-2 py-0.5 flex items-center gap-1">
                  🔁 {c.remixCount}
                </span>
              )}
            </div>
            {c.tagline && <p className="text-xs text-parchment/60 mb-2">{c.tagline}</p>}
            <p className="text-xs text-parchment/40 line-clamp-2 mb-4">{c.personality}</p>
            <button
              onClick={() => onRemix(c.id)}
              disabled={remixingId === c.id}
              className="mt-auto bg-gold text-ink py-2 rounded-full font-medium hover:brightness-110 focus-ring disabled:opacity-60"
            >
              {remixingId === c.id ? "Remixing…" : "Remix into my characters"}
            </button>
          </div>
        ))}
      </div>
    </main>
    </RequireAuth>
  );
}
