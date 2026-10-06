"use client";

import Link from "next/link";
import { useState } from "react";
import { resolveMediaUrl } from "@/lib/api";

export type ExploreCardCharacter = {
  id: string;
  name: string;
  tagline: string;
  personality: string;
  avatarEmoji: string;
  avatarUrl: string | null;
  accentColor: string;
  owner?: { displayName: string } | null;
  tags?: string;
  remixCount?: number;
  trendScore?: number;
};

function slugifyAvatar(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `/assets/characters/${slug}.png`;
}

const TAG_RULES: { tag: string; re: RegExp }[] = [
  { tag: "Anime", re: /anime|manga|otaku|seinen|shonen|isekai/i },
  { tag: "Romance", re: /romance|love|girlfriend|boyfriend|wife|husband|dating/i },
  { tag: "Drama", re: /drama|conflict|secret|betray/i },
  { tag: "Slice of life", re: /family|everyday|roommate|neighbor|slice/i },
  { tag: "Adventure", re: /adventure|quest|travel|apocalypse|survival/i },
  { tag: "Comedy", re: /funny|comedy|wit|humor|playful/i },
  { tag: "Fantasy", re: /magic|dragon|fantasy|realm|witch/i },
];

export function inferTags(c: ExploreCardCharacter, limit = true): string[] {
  const text = `${c.tagline} ${c.personality} ${c.name}`;
  const inferred = TAG_RULES.filter(({ re }) => re.test(text)).map(({ tag }) => tag);

  let explicit: string[] = [];
  if (c.tags) {
    try {
      const parsed = JSON.parse(c.tags);
      if (Array.isArray(parsed)) {
        explicit = parsed.filter((t: any) => typeof t === "string").map((t: string) => t.trim()).filter(Boolean);
      }
    } catch {
      // ignore malformed tags
    }
  }

  const combined = [...new Set([...explicit, ...inferred])];
  return combined.length ? (limit ? combined.slice(0, 3) : combined) : ["Roleplay"];
}

// Only the creator-supplied tags, no regex inference — used where "premium"
// or other authoritative filtering needs to trust the tag, not guess it
// from the tagline/personality text (that guessing is fine for inferTags'
// display purposes, but not for gating a tab's contents).
export function explicitTags(c: ExploreCardCharacter): string[] {
  if (!c.tags) return [];
  try {
    const parsed = JSON.parse(c.tags);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t: any) => typeof t === "string").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
}

export function formatRemixCount(n: number | undefined): string {
  const count = n ?? 0;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M remixes`;
  if (count >= 1_000) return `${(count / 1000).toFixed(1)}K remixes`;
  if (count === 1) return "1 remix";
  return `${count} remixes`;
}

type Props = {
  character: ExploreCardCharacter;
  onRemix: () => void;
  remixing: boolean;
  onReport: () => void;
  saved?: boolean;
  onSave?: () => void;
  disabled?: boolean;
};

export default function ExploreCharacterCard({ character: c, onRemix, remixing, onReport, saved, onSave, disabled }: Props) {
  const tags = inferTags(c);
  const [imageFailed, setImageFailed] = useState(false);
  const blurb = c.tagline || c.personality;

  function cachePreview() {
    // Instant paint on the detail page — it re-fetches the full record
    // (personality/backstory/greeting) right after, so this is just a
    // stopgap so the click doesn't land on an empty screen.
    try {
      sessionStorage.setItem(`char_preview_${c.id}`, JSON.stringify(c));
    } catch {
      // sessionStorage unavailable (private mode, etc.) — detail page
      // just waits for the server fetch instead.
    }
  }

  return (
    <article className="rp-explore-card group rounded-2xl overflow-hidden bg-gradient-to-b from-surface-card to-surface-raised border border-white/5 hover:border-gold/30 transition-all duration-300 flex flex-col card-hover">
      <Link href={`/characters/${c.id}`} onClick={cachePreview} className="contents focus-ring">
      <div className="relative aspect-[3/4] bg-surface-raised overflow-hidden">
        {!imageFailed ? <img src={resolveMediaUrl(c.avatarUrl) || slugifyAvatar(c.name)} alt={c.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" onError={() => setImageFailed(true)} /> : <div className="w-full h-full flex items-center justify-center text-6xl" style={{ background: `linear-gradient(160deg, ${c.accentColor}44, #121218)` }}>{c.avatarEmoji}</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5">
          <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/5">
            {formatRemixCount(c.remixCount)}
          </span>
          {c.owner && (
            <span className="min-w-0 truncate text-[10px] px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-parchment/60 border border-white/5">
              by {c.owner.displayName}
            </span>
          )}
        </div>
      </div>
      </Link>
      <div className="p-3 flex flex-col flex-1 relative">
        {onSave && <button className="rp-save-button" type="button" aria-label={`${saved ? "Unsave" : "Save"} ${c.name}`} aria-pressed={saved} onClick={onSave}>{saved ? "♥" : "♡"}</button>}
        <Link href={`/characters/${c.id}`} onClick={cachePreview} className="focus-ring">
          <h3 className="font-semibold text-parchment truncate pr-8 group-hover:text-gold transition-colors">{c.name}</h3>
          <p className="text-xs text-parchment/50 line-clamp-2 mt-1 min-h-[2.5rem] leading-relaxed">{blurb}</p>
          <div className="flex flex-wrap gap-1 mt-2 mb-3">
            {tags.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-parchment/45 border border-white/5">
                {t}
              </span>
            ))}
          </div>
        </Link>
        <button
          type="button"
          onClick={onRemix}
          disabled={remixing || disabled}
          className="mt-auto w-full py-2 rounded-full bg-gold text-ink text-sm font-medium hover:brightness-110 focus-ring disabled:opacity-50 btn-shine transition-all"
        >
          {remixing ? "Creating your version…" : "Start a story ↗"}
        </button>
        <button type="button" onClick={onReport} className="mt-2 text-[10px] text-parchment/35 hover:text-rose focus-ring transition-colors">
          Report
        </button>
      </div>
    </article>
  );
}

export function ExploreCharacterCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-surface-card border border-white/5 animate-pulse">
      <div className="aspect-[3/4] shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-2/3 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/5 rounded" />
        <div className="h-8 w-full bg-white/10 rounded-full mt-4" />
      </div>
    </div>
  );
}