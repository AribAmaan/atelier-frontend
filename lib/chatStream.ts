/** Streaming transport: retain incomplete markers across arbitrary byte chunks. */
const MARKER = "\u0000EVT:";
export type StreamSegment = { type: "text"; value: string } | { type: "event"; value: Record<string, unknown> };

export function extractEvents(buffer: string): { segments: StreamSegment[]; rest: string } {
  const segments: StreamSegment[] = [];
  let rest = buffer;
  while (rest) {
    const start = rest.indexOf(MARKER);
    if (start < 0) {
      let held = 0;
      for (let n = Math.min(rest.length, MARKER.length - 1); n > 0; n--) {
        if (rest.endsWith(MARKER.slice(0, n))) { held = n; break; }
      }
      const text = held ? rest.slice(0, -held) : rest;
      if (text) segments.push({ type: "text", value: text });
      return { segments, rest: held ? rest.slice(-held) : "" };
    }
    if (start > 0) segments.push({ type: "text", value: rest.slice(0, start) });
    rest = rest.slice(start);
    const end = rest.indexOf("\u0000", MARKER.length);
    if (end < 0) return { segments, rest };
    try {
      const value: unknown = JSON.parse(rest.slice(MARKER.length, end));
      if (value && typeof value === "object" && !Array.isArray(value)) {
        segments.push({ type: "event", value: value as Record<string, unknown> });
      }
    } catch { /* Drop invalid transport events, never display them as dialogue. */ }
    rest = rest.slice(end + 1);
  }
  return { segments, rest };
}
