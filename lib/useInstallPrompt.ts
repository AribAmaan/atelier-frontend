"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag — not covered by the media query above.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Chrome/Edge/Android fire `beforeinstallprompt` when the manifest + service
 * worker make the page installable; we stash that event and replay it on a
 * user tap via `promptInstall()` (browsers require install to originate
 * from a real click, so it can't be triggered automatically).
 *
 * iOS Safari never fires this event — there's no programmatic install
 * there, only manual "Add to Home Screen" from the share sheet — so we
 * surface `isIos` separately and the button shows instructions instead.
 *
 * Already-installed (standalone) sessions get `canInstall: false` on both
 * paths so the button just doesn't render.
 */
export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIos());

    // Pick up an event that already fired before this component mounted —
    // stashed by the early inline script in layout.tsx. On fast mobile
    // loads `beforeinstallprompt` can fire before React hydrates, and the
    // browser only fires it once per page load, so without this check
    // we'd miss it permanently and canInstall would stay false forever
    // even though Chrome considers the site installable.
    const existing = (window as unknown as { __deferredInstallPrompt?: BeforeInstallPromptEvent | null })
      .__deferredInstallPrompt;
    if (existing) setDeferredEvent(existing);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };
    const onReady = () => {
      const stashed = (window as unknown as { __deferredInstallPrompt?: BeforeInstallPromptEvent | null })
        .__deferredInstallPrompt;
      if (stashed) setDeferredEvent(stashed);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("deferredInstallPromptReady", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("deferredInstallPromptReady", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredEvent(null);
  };

  return {
    // Chrome/Edge/Android path: only true once the browser has actually
    // handed us a real prompt to replay.
    canInstall: !installed && !!deferredEvent,
    // iOS path: no event exists to wait for, so show the button whenever
    // we're not already installed and let it explain the manual steps.
    showIosInstructions: !installed && ios && !deferredEvent,
    installed,
    promptInstall,
  };
}
