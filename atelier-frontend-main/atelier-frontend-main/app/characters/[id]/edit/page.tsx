"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, resolveMediaUrl } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

type Character = {
  id: string;
  name: string;
  tagline: string;
  avatarEmoji: string;
  avatarUrl: string | null;
  accentColor: string;
  personality: string;
  backstory: string;
  greeting: string;
  isExplicit: boolean;
};

const EMOJI_CHOICES = ["🌸", "🦊", "🌙", "⚔️", "🕯️", "🐉", "☕", "🌊"];

export default function EditCharacterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [character, setCharacter] = useState<Character | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [personality, setPersonality] = useState("");
  const [backstory, setBackstory] = useState("");
  const [greeting, setGreeting] = useState("");
  const [avatarEmoji, setAvatarEmoji] = useState("🌸");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isExplicit, setIsExplicit] = useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch(`/api/characters/${params.id}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const c: Character = data.character;
        setCharacter(c);
        setName(c.name);
        setTagline(c.tagline);
        setPersonality(c.personality);
        setBackstory(c.backstory);
        setGreeting(c.greeting);
        setAvatarEmoji(c.avatarEmoji);
        setAvatarUrl(c.avatarUrl);
        setIsExplicit(c.isExplicit ?? false);
      })
      .catch(() => setNotFound(true));
  }, [params.id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);
    const res = await apiFetch(`/api/characters/${params.id}`, {
      method: "PUT",
      body: JSON.stringify({ name, tagline, personality, backstory, greeting, avatarEmoji, isExplicit }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't save changes.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const form = new FormData();
    form.append("avatar", file);
    const res = await apiFetch(`/api/characters/${params.id}/avatar`, { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Upload failed.");
      return;
    }
    const data = await res.json();
    setAvatarUrl(data.character.avatarUrl);
  }

  async function onGenerate() {
    setError("");
    setGenerating(true);
    const res = await apiFetch(`/api/characters/${params.id}/avatar/generate`, { method: "POST" });
    setGenerating(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Generation failed.");
      return;
    }
    const data = await res.json();
    setAvatarUrl(data.character.avatarUrl);
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="font-display text-xl">Couldn't find that character.</p>
        <Link href="/dashboard" className="text-gold hover:underline">
          Back to your characters
        </Link>
      </main>
    );
  }

  if (!character) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-parchment/60">Loading…</p>
      </main>
    );
  }

  return (
    <RequireAuth>
    <main className="min-h-screen px-6 py-8 md:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="text-parchment/60 hover:text-gold focus-ring rounded px-2">
            ←
          </Link>
          <h1 className="font-display text-2xl">Edit {character.name}</h1>
        </div>

        {error && (
          <p className="mb-4 text-sm text-rose bg-rose/10 border border-rose/30 rounded px-3 py-2">{error}</p>
        )}
        {saved && (
          <p className="mb-4 text-sm text-gold bg-gold/10 border border-gold/30 rounded px-3 py-2">Saved.</p>
        )}

        <div className="stitched rounded-2xl bg-plum/60 p-6 mb-6">
          <p className="text-sm text-parchment/70 mb-3">Avatar</p>
          <div className="flex items-center gap-5">
            <span
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl overflow-hidden shrink-0"
              style={{ backgroundColor: `${character.accentColor}30` }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaUrl(avatarUrl)} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                avatarEmoji
              )}
            </span>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm border border-parchment/30 px-4 py-1.5 rounded-full hover:border-gold focus-ring disabled:opacity-50"
                >
                  {uploading ? "Uploading…" : "Upload image"}
                </button>
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={generating}
                  className="text-sm border border-parchment/30 px-4 py-1.5 rounded-full hover:border-gold focus-ring disabled:opacity-50"
                >
                  {generating ? "Generating…" : "Generate with AI"}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={onUpload}
              />
              <p className="text-xs text-parchment/50">PNG, JPEG, WebP, or GIF, up to 5MB.</p>
            </div>
          </div>

          <p className="text-sm text-parchment/70 mt-5 mb-2">Or pick an emoji fallback</p>
          <div className="flex gap-2">
            {EMOJI_CHOICES.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => setAvatarEmoji(emoji)}
                className={`text-2xl rounded-lg p-2 focus-ring ${
                  avatarEmoji === emoji ? "bg-gold/20 ring-1 ring-gold" : "hover:bg-parchment/5"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={onSave} className="stitched rounded-2xl bg-plum/60 p-6">
          <label className="block text-sm mb-1 text-parchment/70">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-4 rounded-lg bg-plum-deep border border-parchment/20 px-3 py-2 focus-ring"
          />

          <label className="block text-sm mb-1 text-parchment/70">Tagline</label>
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full mb-4 rounded-lg bg-plum-deep border border-parchment/20 px-3 py-2 focus-ring"
          />

          <label className="block text-sm mb-1 text-parchment/70">Personality traits</label>
          <textarea
            required
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            rows={2}
            className="w-full mb-4 rounded-lg bg-plum-deep border border-parchment/20 px-3 py-2 focus-ring"
          />

          <label className="block text-sm mb-1 text-parchment/70">Backstory</label>
          <textarea
            required
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            rows={4}
            className="w-full mb-4 rounded-lg bg-plum-deep border border-parchment/20 px-3 py-2 focus-ring"
          />

          <label className="block text-sm mb-1 text-parchment/70">Opening greeting</label>
          <textarea
            required
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            rows={2}
            className="w-full mb-6 rounded-lg bg-plum-deep border border-parchment/20 px-3 py-2 focus-ring"
          />

          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-parchment/10">
            <input
              type="checkbox"
              id="isExplicit"
              checked={isExplicit}
              onChange={(e) => setIsExplicit(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-rose"
            />
            <label htmlFor="isExplicit" className="text-sm text-parchment/70 cursor-pointer">
              Mark as explicit/NSFW character
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-gold text-ink px-6 py-2.5 rounded-full font-medium hover:brightness-110 focus-ring disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <Link
              href={`/chat/${character.id}`}
              className="border border-parchment/30 px-6 py-2.5 rounded-full font-medium hover:border-gold focus-ring"
            >
              Go to chat
            </Link>
          </div>
        </form>
      </div>
    </main>
    </RequireAuth>
  );
}
