"use client";

import { useEffect } from "react";

// Registers the service worker so the browser considers Rolichat
// installable (required alongside the manifest + icons). Silently
// no-ops in browsers without SW support instead of throwing.
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability just degrades gracefully if this fails.
    });
  }, []);

  return null;
}
