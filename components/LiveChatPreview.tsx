"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const SCRIPT: { from: "user" | "char"; text: string }[] = [
  { from: "user", text: "what do you love most about the stars?" },
  { from: "char", text: "Their patience. They've burned for a billion years just so we'd have something to wish on tonight." },
  { from: "user", text: "that's beautifully put" },
  { from: "char", text: "I remember you saying that last time, too. You always come back after the long nights." },
];

/**
 * A looping, scripted demo conversation — not a real model call. It exists
 * purely so a logged-out visitor can see what talking to a character
 * actually feels like before they sign up, since the real discover/chat
 * endpoints require a session (see the FEATURED_CHARACTERS note in page.tsx).
 */
export default function LiveChatPreview({
  name = "Luna Voss",
  emoji = "✨",
  color = "#c9a227",
}: {
  name?: string;
  emoji?: string;
  color?: string;
}) {
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const schedule = (fn: () => void, ms: number) => {
      timeouts.push(setTimeout(() => { if (!cancelled) fn(); }, ms));
    };

    function playFrom(i: number, delay: number) {
      if (i >= SCRIPT.length) {
        schedule(() => { setStep(0); setTyping(false); playFrom(0, 700); }, 3400);
        return;
      }
      const isChar = SCRIPT[i].from === "char";
      if (isChar) {
        schedule(() => setTyping(true), delay);
        schedule(() => { setTyping(false); setStep(i + 1); playFrom(i + 1, 1100); }, delay + 1200);
      } else {
        schedule(() => { setStep(i + 1); playFrom(i + 1, 900); }, delay);
      }
    }

    if (reduceMotion) {
      setStep(SCRIPT.length);
    } else {
      playFrom(0, 500);
    }

    return () => { cancelled = true; timeouts.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [step, typing]);

  return (
    <div className="glass-strong rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden max-w-sm w-full mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg avatar-ring-animated"
          style={{ background: `${color}25`, "--ring-color": `${color}80` } as CSSProperties}
        >
          {emoji}
        </div>
        <div>
          <p className="text-sm font-medium text-parchment">{name}</p>
          <p className="text-[11px] text-parchment/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> online now
          </p>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto scrollbar-thin px-4 py-4 flex flex-col gap-3"
      >
        {SCRIPT.slice(0, step).map((m, i) => (
          <div
            key={i}
            className={`message-slide-in max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              m.from === "user"
                ? "self-end bg-gold/90 text-ink rounded-br-sm"
                : "self-start bg-white/5 text-parchment rounded-bl-sm"
            }`}
          >
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="self-start flex items-center gap-1 bg-white/5 px-3.5 py-3 rounded-2xl rounded-bl-sm">
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-parchment/50 inline-block" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-parchment/50 inline-block" />
            <span className="typing-dot w-1.5 h-1.5 rounded-full bg-parchment/50 inline-block" />
          </div>
        )}
      </div>
    </div>
  );
}
