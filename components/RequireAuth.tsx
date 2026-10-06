"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCachedUser, fetchAndCacheUser } from "@/lib/authCache";

/**
 * Replaces the old Next.js middleware.ts, which redirected unauthenticated
 * visitors to /login by reading the session cookie directly at the edge.
 * That only works when frontend and backend share an origin. Now that the
 * backend lives on a different domain (Render) than the frontend (Netlify),
 * the middleware can't read that cookie itself — so this component asks the
 * backend "am I signed in?" instead, and redirects if not.
 *
 * To avoid re-checking (and showing a full-page "Loading…" spinner) on
 * every single page navigation, this consults a short-lived shared cache
 * first (see lib/authCache.ts). If we verified the session within the last
 * minute, render immediately and just revalidate quietly in the
 * background — only a cold/never-checked session blocks on the network.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const cached = getCachedUser();
  const [status, setStatus] = useState<"checking" | "ok" | "error">(cached?.user ? "ok" : "checking");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Already confirmed recently — render now, just quietly revalidate.
    if (cached?.user && cached.fresh) {
      fetchAndCacheUser().then((user) => {
        if (!cancelled && !user) router.replace(`/login?next=${encodeURIComponent(pathname || "/explore")}`);
      }).catch(() => { /* Keep the confirmed page visible during a network outage. */ });
      return () => {
        cancelled = true;
      };
    }

    fetchAndCacheUser().then((user) => {
      if (cancelled) return;
      if (user) {
        setStatus("ok");
      } else {
        router.replace(`/login?next=${encodeURIComponent(pathname || "/explore")}`);
      }
    }).catch(() => {
      if (!cancelled && !cached?.user) setStatus("error");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname, retry]);

  if (status === "error") {
    return (
      <main className="min-h-screen flex flex-col gap-4 items-center justify-center px-6 text-center">
        <p className="text-parchment/70">Couldn&apos;t reach the server to check your session.</p>
        <button type="button" className="rounded-full bg-gold px-5 py-2 text-ink focus-ring" onClick={() => {
          setStatus("checking");
          setRetry((value) => value + 1);
        }}>Try again</button>
      </main>
    );
  }

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-parchment/60">Loading…</p>
      </main>
    );
  }

  return <>{children}</>;
}
