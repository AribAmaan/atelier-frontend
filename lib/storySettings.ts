export type StorySettings = {
  personaName: string;
  persona: string;
  scene: string;
  boundaries: string;
  tone: "character" | "cinematic" | "dialogue" | "gentle";
};
export const DEFAULT_STORY: StorySettings = { personaName: "", persona: "", scene: "", boundaries: "", tone: "character" };

export const STORY_STARTERS = [
  { label: "Midnight mystery", icon: "☾", scene: "A quiet train station at midnight. A stranger has left an envelope with both our names on it.", opener: "*I turn the envelope over in my hands.* Do you recognize this handwriting?" },
  { label: "A little everyday magic", icon: "✧", scene: "A cozy bookshop during a rainstorm. One book on the counter has started writing itself.", opener: "*I point to the page as another line appears.* Please tell me you saw that too." },
  { label: "An unlikely alliance", icon: "⚔", scene: "Two rivals must work together to recover a stolen map before sunrise. Trust is in short supply.", opener: "*I set my bag down between us.* One night. One truce. Where do we start?" },
  { label: "The last starship", icon: "✦", scene: "Our ship receives a message from a planet thought abandoned. The voice on the recording knows us.", opener: "*I replay the transmission, quieter this time.* How could they possibly know our names?" },
] as const;

export function readLocal<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
  catch { return fallback; }
}
export function writeLocal(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
export function loadStory(key: string): StorySettings {
  const raw = readLocal<Partial<StorySettings> | null>(key, null);
  const text = (value: unknown, max: number) => typeof value === "string" ? value.slice(0, max) : "";
  return {
    personaName: text(raw?.personaName, 60), persona: text(raw?.persona, 800),
    scene: text(raw?.scene, 1200), boundaries: text(raw?.boundaries, 500),
    tone: ["cinematic", "dialogue", "gentle"].includes(raw?.tone || "") ? raw!.tone! : "character",
  };
}
