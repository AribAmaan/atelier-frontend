"use client";

import { useEffect, useRef } from "react";

/** Keep the chat inside the visible area on mobile browsers with overlay keyboards. */
export function useChatViewport(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    const viewport = window.visualViewport;
    let frame = 0;
    function measure() {
      // Leave pinch zoom under the browser's control.
      if (viewport && Math.abs(viewport.scale - 1) > 0.05) return;
      const height = viewport?.height ?? window.innerHeight;
      el!.style.setProperty("--chat-height", `${Math.round(height)}px`);
      el!.style.setProperty("--chat-top", `${Math.round(viewport?.offsetTop ?? 0)}px`);
      el!.dataset.compact = String(height < 520);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    measure();
    window.addEventListener("resize", schedule);
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      el.style.removeProperty("--chat-height");
      el.style.removeProperty("--chat-top");
      delete el.dataset.compact;
    };
  }, [enabled]);
  return ref;
}
