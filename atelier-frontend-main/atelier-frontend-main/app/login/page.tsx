"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong.");
      return;
    }
    // Send the user back to whatever page RequireAuth redirected them from
    // (?next=...), falling back to the dashboard if there isn't one.
    const next = searchParams.get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="stitched w-full max-w-sm rounded-2xl bg-plum/60 p-8">
        <h1 className="font-display text-2xl mb-1">Welcome back</h1>
        <p className="text-sm text-parchment/60 mb-6">Log in to reach your characters.</p>

        {error && (
          <p className="mb-4 text-sm text-rose bg-rose/10 border border-rose/30 rounded px-3 py-2">{error}</p>
        )}

        <label className="block text-sm mb-1 text-parchment/70">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-lg bg-plum-deep border border-parchment/20 px-3 py-2 focus-ring"
        />

        <label className="block text-sm mb-1 text-parchment/70">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded-lg bg-plum-deep border border-parchment/20 px-3 py-2 focus-ring"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-ink py-2.5 rounded-full font-medium hover:brightness-110 focus-ring disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <p className="mt-5 text-sm text-parchment/60 text-center">
          No account yet?{" "}
          <Link href="/signup" className="text-gold hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}
