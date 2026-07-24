"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

/**
 * Replaces the old Next.js middleware.ts, which redirected unauthenticated
 * visitors to /login by reading the session cookie directly at the edge.
 * That only works when frontend and backend share an origin. Now that the
 * backend lives on a different domain (Render) than the frontend (Netlify),
 * the middleware can't read that cookie itself — so this component asks the
 * backend "am I signed in?" on mount instead, and redirects if not.
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.user) {
          setStatus("ok");
        } else {
          router.replace(`/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
        }
      })
      .catch(() => {
        if (!cancelled) router.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (status === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-parchment/60">Loading…</p>
      </main>
    );
  }

  return <>{children}</>;
}
