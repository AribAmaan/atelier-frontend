import type { RoleplayPreferences, RoleplayStyle, SpiceLevel } from "./roleplayPreferences";
import type { MembershipTierId } from "./premium";

/**
 * Mirrors the backend's ROLEPLAY_ENGINES (src/lib/providers/engines.ts) —
 * four engines, one per membership tier, down from the previous nine.
 * Keep id / minTier / spiceLevel / roleplayStyle in lockstep with the
 * backend; everything else here (name, emoji, description, badge) is
 * frontend-only display dressing.
 *
 * NOTE: engineId is the intelligence/quality tier sent to the backend.
 * spiceLevel/roleplayStyle are layered as per-request overrides (the
 * backend honors them as fine-tune without dropping the engine tier),
 * so prefsMatchEngine must NOT require them to match. Requiring a match
 * is what used to flip every legacy/customized user to "custom" (manual,
 * intelligence 5) on reload.
 */
export type RoleplayEngineId = "vanilla" | "strawberry" | "chocolate" | "hazelnut" | "custom";

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
    badge: 3,
    outcomeLabel: "Fast & casual",
    description: "Warm and immediate, like believable early texts. It answers the strongest cue directly and keeps the exchange short, with an action only when it changes the moment.",
    minTier: "free",
    spiceLevel: "explicit",
    roleplayStyle: "dialogue",
  },
  {
    id: "strawberry",
    name: "Strawberry",
    emoji: "🍓",
    badge: 6,
    outcomeLabel: "Emotional & present",
    tag: "Popular",
    description: "Attentive and natural. It carries the mood forward, notices relevant hesitations or callbacks, and makes small, character-consistent choices instead of simply agreeing.",
    minTier: "plus",
    spiceLevel: "explicit",
    roleplayStyle: "balanced",
  },
  {
    id: "chocolate",
    name: "Chocolate",
    emoji: "🍫",
    badge: 8,
    outcomeLabel: "Deep & layered",
    tag: "Best Seller",
    description: "Deeply grounded in the shared scene. It tracks relationship shifts and unresolved threads, uses exact earlier details when they matter, and lets subtext or silence have room.",
    minTier: "ultra",
    spiceLevel: "explicit",
    roleplayStyle: "narrative",
  },
  {
    id: "hazelnut",
    name: "Hazelnut",
    emoji: "🌰",
    badge: 10,
    outcomeLabel: "Fully alive",
    tag: "Ultimate Experience",
    description: "Specific, emotionally coherent, and independent. It holds history, subtext, uncertainty, and boundaries together without forcing random conflict or fake misunderstandings.",
    minTier: "supreme",
    spiceLevel: "explicit",
    roleplayStyle: "intense",
  },
];

export function engineById(id: RoleplayEngineId): RoleplayEngine | null {
  if (id === "custom") return null;
  return ROLEPLAY_ENGINES.find((e) => e.id === id) ?? null;
}

export function prefsMatchEngine(prefs: RoleplayPreferences, engine: RoleplayEngine): boolean {
  // engineId alone selects the intelligence tier. spiceLevel/roleplayStyle
  // are per-request fine-tune overrides layered over that tier (the backend
  // honors them without dropping intelligence), so they must never force a
  // "custom" (manual, intelligence 5) downgrade here.
  void prefs;
  void engine;
  return true;
}

export function resolveEngineId(prefs: RoleplayPreferences, storedId?: RoleplayEngineId): RoleplayEngineId {
  // Stored engineId is the source of truth for the intelligence tier.
  // Legacy prefs without one default to vanilla (free tier baseline),
  // matching the backend's manual-fallback behavior for unknown ids.
  if (storedId && storedId !== "custom") {
    const eng = engineById(storedId);
    if (eng) return storedId;
  }
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
