import type { RoleplayPreferences, RoleplayStyle, SpiceLevel } from "./roleplayPreferences";
import type { MembershipTierId } from "./premium";

/**
 * Mirrors the backend's ROLEPLAY_ENGINES (src/lib/providers/engines.ts) —
 * two engines: Vanilla (free) and Hazelnut (paid), down from four (and
 * originally nine). Keep id / minTier / spiceLevel / roleplayStyle in
 * lockstep with the backend; everything else here (name, emoji, description,
 * badge) is frontend-only display dressing.
 *
 * Neither engine has a reply-length setting. Reply length follows the
 * conversation (the backend sizes each reply to the user's message), so the
 * descriptions below describe voice and memory, not length.
 *
 * NOTE: engineId is the quality tier sent to the backend. Retired ids
 * ("strawberry", "chocolate") still appear in saved browser preferences from
 * older versions; they are migrated to "hazelnut", exactly like the backend's
 * own alias, so nobody silently drops back to the free engine.
 */
export type RoleplayEngineId = "vanilla" | "hazelnut" | "custom";

/** Engine ids retired in the two-engine redesign, mapped to their replacement. */
const LEGACY_ENGINE_IDS: Record<string, Exclude<RoleplayEngineId, "custom">> = {
  strawberry: "hazelnut",
  chocolate: "hazelnut",
};

/** Turns any stored/received engine id into a current one (or undefined if unknown). */
export function normalizeEngineId(id: unknown): RoleplayEngineId | undefined {
  if (typeof id !== "string") return undefined;
  if (Object.prototype.hasOwnProperty.call(LEGACY_ENGINE_IDS, id)) return LEGACY_ENGINE_IDS[id];
  return id === "vanilla" || id === "hazelnut" || id === "custom" ? id : undefined;
}

export type RoleplayEngine = {
  id: Exclude<RoleplayEngineId, "custom">;
  name: string;
  emoji: string;
  /** Intensity / depth hint (1–10), matches the backend's intelligence score.
   * Not shown directly to users anymore — see outcomeLabel below — but kept
   * for internal comparisons (e.g. sorting engines by depth). */
  badge: number;
  /** Short, plain-language answer to "what do I actually get" — shown in the
   * picker instead of the raw badge number, which users had no way to
   * interpret (is 6 fast? deep? more explicit?) on its own. */
  outcomeLabel: string;
  tag?: string;
  description: string;
  /** Lowest membership tier that can select this engine — matches the backend's minTier. */
  minTier: MembershipTierId;
  spiceLevel: SpiceLevel;
  roleplayStyle: RoleplayStyle;
};

export const ROLEPLAY_ENGINES: RoleplayEngine[] = [
  {
    id: "vanilla",
    name: "Vanilla",
    emoji: "🙂",
    badge: 4,
    outcomeLabel: "Natural & quick",
    description: "Warm and natural, like believable early texts. It answers what you actually said, makes small character-consistent choices, and replies as briefly or as fully as the moment needs.",
    minTier: "free",
    spiceLevel: "explicit",
    roleplayStyle: "balanced",
  },
  {
    id: "hazelnut",
    name: "Hazelnut",
    emoji: "🌰",
    badge: 10,
    outcomeLabel: "Deep & alive",
    tag: "Premium",
    description: "Specific, emotionally coherent, and independent. It remembers further back, holds history, subtext, and boundaries together, and takes initiative without forcing drama. Replies grow only when the scene calls for it.",
    minTier: "plus",
    spiceLevel: "explicit",
    roleplayStyle: "intense",
  },
];

export function engineById(id: RoleplayEngineId | string): RoleplayEngine | null {
  const normalized = normalizeEngineId(id);
  if (!normalized || normalized === "custom") return null;
  return ROLEPLAY_ENGINES.find((e) => e.id === normalized) ?? null;
}

export function prefsMatchEngine(prefs: RoleplayPreferences, engine: RoleplayEngine): boolean {
  // engineId alone selects the engine. spiceLevel/roleplayStyle are sent as
  // per-request fine-tune values, but they must never force a "custom"
  // (manual, intelligence 5) downgrade here. Note: with an engine selected the
  // backend currently uses the engine's own heat/style.
  void prefs;
  void engine;
  return true;
}

export function resolveEngineId(prefs: RoleplayPreferences, storedId?: RoleplayEngineId | string): RoleplayEngineId {
  // Stored engineId is the source of truth for the engine. Retired ids
  // (strawberry, chocolate) migrate to hazelnut; prefs without a usable one
  // default to vanilla (the free baseline).
  const eng = engineById(storedId ?? "");
  if (eng) return eng.id;
  void prefs;
  return "vanilla";
}

export function applyEngine(engine: RoleplayEngine, prefs: RoleplayPreferences): RoleplayPreferences {
  // Selecting an engine resets heat/style to that engine's defaults (the
  // user can fine-tune after, which layers as an override without changing
  // the stored engineId/intelligence). explicitMode is the user's toggle.
  return {
    ...prefs,
    explicitMode: prefs.explicitMode,
    spiceLevel: engine.spiceLevel,
    roleplayStyle: engine.roleplayStyle,
  };
}

export function activeEngineLabel(prefs: RoleplayPreferences, engineId: RoleplayEngineId): string {
  if (engineId !== "custom") {
    const eng = engineById(engineId);
    if (eng) return eng.name;
  }
  if (prefs.explicitMode) return "Custom spice";
  return "Custom";
}

export function activeEngineEmoji(engineId: RoleplayEngineId): string {
  if (engineId === "custom") return "✦";
  return engineById(engineId)?.emoji ?? "✦";
}
