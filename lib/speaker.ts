/**
 * Speaker handoff display.
 *
 * The backend lets another of the user's characters take over a reply from
 * inside a chat ("*amy comes in* come in amy"). That reply is stored in this
 * chat and opens with "Name: ". These helpers recognise such replies so the UI
 * can label the right speaker instead of always showing the chat's character.
 *
 * The stored text is never changed; this is display only. To avoid mistaking
 * an ordinary "Listen: ..." for a speaker, a prefix only counts when the user's
 * latest message mentions that name, or the previous reply already had the same
 * speaker (an ongoing handoff). This mirrors the backend's own rule.
 */

export type SpeakerMessage = { role: string; content: string };
export type SpeakerInfo = { speaker: string; text: string };

const PREFIX = /^\s*(?:\*\*)?([\p{Lu}][\p{L}\p{M}'’.\- ]{0,29}?)(?:\*\*)?:[ \t]+(?=\S)/u;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mentionsName(text: string, name: string): boolean {
  if (!name.trim()) return false;
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(name.trim())}($|[^\\p{L}\\p{N}])`, "iu").test(text);
}

/** Per-message speaker info (null for the chat's own character and for user messages). */
export function computeSpeakers(messages: SpeakerMessage[], characterName: string): (SpeakerInfo | null)[] {
  const own = characterName.trim().toLowerCase();
  let lastUserText = "";
  let ongoing = "";
  return messages.map((message) => {
    if (message.role === "user") {
      lastUserText = message.content;
      return null;
    }
    if (message.role !== "assistant") return null;
    const match = PREFIX.exec(message.content);
    const name = match?.[1]?.trim() ?? "";
    if (!match || !name || name.toLowerCase() === own) {
      ongoing = "";
      return null;
    }
    if (mentionsName(lastUserText, name) || ongoing.toLowerCase() === name.toLowerCase()) {
      ongoing = name;
      return { speaker: name, text: message.content.slice(match[0].length) };
    }
    ongoing = "";
    return null;
  });
}
