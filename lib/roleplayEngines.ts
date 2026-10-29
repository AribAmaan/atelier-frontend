import type { RoleplayPreferences, RoleplayStyle, SpiceLevel } from "./roleplayPreferences";
import type { MembershipTierId } from "./premium";

/**
 * Mirrors the backend's ROLEPLAY_ENGINES (src/lib/providers/engines.ts) —
 * two engines: Strawberry (free) and Choco Hazelnut (premium, the combined
 * best of the former Chocolate and Hazelnut), down from four (and originally
 * nine). Keep id / minTier / spiceLevel / roleplayStyle in lockstep with the
 * backend; everything else here (name, emoji, description, badge) is
 * frontend-only display dressing.
 *
 * Reply length is fixed per engine by the backend, whatever the length of the
 * user's message: about 50-70 words for Strawberry and 105-130 for Choco
 * Hazelnut. The descriptions below say so.
 *
 * NOTE: engineId is the quality tier sent to the backend. Retired ids
 * ("vanilla", "chocolate", "hazelnut") still appear in saved browser
 * preferences from older versions; they are migrated exactly like the
 * backend's own aliases, so nobody silently drops to a different engine.
 */
export type RoleplayEngineId = "strawberry" | "choco_hazelnut" | "custom";

/** Engine ids retired in the two-engine redesign, mapped to their replacement. */
const LEGACY_ENGINE_IDS: Record<string, Exclude<RoleplayEngineId, "custom">> = {
  vanilla: "strawberry",
  chocolate: "choco_hazelnut",
  hazelnut: "choco_hazelnut",
  chocohazelnut: "choco_hazelnut",
  chocolate_hazelnut: "choco_hazelnut",
};

/** Turns any stored/received engine id into a current one (or undefined if unknown). */
export function normalizeEngineId(id: unknown): RoleplayEngineId | undefined {
  if (typeof id !== "string") return undefined;
  const key = id.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (Object.prototype.hasOwnProperty.call(LEGACY_ENGINE_IDS, key)) return LEGACY_ENGINE_IDS[key];
  return key === "strawberry" || key === "choco_hazelnut" || key === "custom" ? key : undefined;
}

export type RoleplayEngine = {
  id: Exclude<RoleplayEngineId, "custom">;
  name: string;
  emoji: string;
  /** Intensity / depth hint (1–10), matches the backend's intelligence score.
   * Not shown directly to users — see outcomeLabel below — but kept
   * for internal comparisons (e.g. sorting engines by depth). */
  badge: number;
  /** Short, plain-language answer to "what do I actually get" — shown in the
   * picker instead of the raw badge number, which users had no way to
   * interpret on its own. */
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
    id: "strawberry",
    name: "Strawberry",
    emoji: "🍓",
    badge: 6,
    outcomeLabel: "Attentive & natural",
    description: "Attentive and natural, like someone who is actually listening. It carries the mood forward, notices a relevant detail, and makes small character-consistent choices. Focused replies of about 50–70 words.",
    minTier: "free",
    spiceLevel: "explicit",
    roleplayStyle: "balanced",
  },
  {
    id: "choco_hazelnut",
    name: "Choco Hazelnut",
    emoji: "🍫",
    badge: 10,
    outcomeLabel: "Deep & alive",
    tag: "Premium",
    description: "The ultimate engine: grounded in the scene, emotionally coherent, and independent. It remembers further back, holds history, subtext, and boundaries together, and takes initiative without forcing drama. Fuller replies of about 105–130 words.",
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
  // (vanilla, chocolate, hazelnut) migrate to their replacements; prefs without a usable one
  // default to strawberry (the free baseline).
  const eng = engineById(storedId ?? "");
  if (eng) return eng.id;
  void prefs;
  return "strawberry";
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
