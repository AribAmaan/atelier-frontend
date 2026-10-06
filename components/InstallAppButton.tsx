"use client";

import { useState } from "react";
import { useInstallPrompt } from "@/lib/useInstallPrompt";

/**
 * Sits in the sidebar footer and mobile menu. Deliberately reuses the exact
 * classes from AppShell's NAV row buttons (px-3 py-2.5, rounded-xl, text-sm,
 * w-5 icon column, flex-1 label) instead of inventing new spacing — same
 * row height, same icon/label column split, same hover/active treatment as
 * every other row above it, so it reads as part of the nav rather than a
 * bolted-on widget.
 */
export default function InstallAppButton({ className = "" }: { className?: string }) {
  const { canInstall, showIosInstructions, installed, promptInstall } = useInstallPrompt();
  const [showIosHint, setShowIosHint] = useState(false);

  if (installed || (!canInstall && !showIosInstructions)) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (canInstall ? promptInstall() : setShowIosHint((s) => !s))}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 focus-ring border border-gold/10 bg-gradient-to-r from-gold/10 to-transparent text-parchment/85 hover:text-parchment hover:border-gold/25"
      >
        <span className="w-5 text-center text-base text-gold">⇩</span>
        <span className="flex-1 text-left">Install app</span>
      </button>

      {showIosHint && (
        <div className="mt-2 px-3 py-2.5 rounded-xl border border-white/10 bg-surface-card text-xs text-parchment/60 leading-relaxed animate-fade-in">
          Tap <span className="text-parchment/85 font-medium">Share</span> in Safari's toolbar, then{" "}
          <span className="text-parchment/85 font-medium">Add to Home Screen</span>.
        </div>
      )}
    </div>
  );
}
