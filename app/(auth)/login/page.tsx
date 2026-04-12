"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/translations";
import type { Lang } from "@/lib/translations";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Detect language from browser or default FR
  const browserLang =
    typeof navigator !== "undefined" && navigator.language?.startsWith("en")
      ? "EN"
      : "FR";
  const lang: Lang = browserLang;
  const T = (key: { EN: string; FR: string }) => key[lang];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || T(t.login.error));
        return;
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/client/home");
      }
    } catch {
      setError(T(t.login.errorServer));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Identity */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-light text-brun-chaud tracking-wide">
            Hive
          </h1>
          <p className="font-caps text-sm text-or-sacre tracking-widest mt-2 uppercase">
            BeeFrequency
          </p>
          <p className="font-display text-brun-chaud text-lg mt-3">
            {T(t.login.tagline)}
          </p>
          <p className="font-ui text-brun-mid text-sm font-light mt-1">
            {T(t.login.subtitle)}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              {T(t.login.email)}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              {T(t.login.password)}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-[0.06em] rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
          >
            {loading ? T(t.login.loading) : T(t.login.button)}
          </button>
        </form>

        <div className="text-center mt-4">
          <a
            href="/forgot-password"
            className="font-ui text-xs text-brun-mid/60 hover:text-or-sacre transition-colors"
          >
            {T({ EN: "Forgot password?", FR: "Mot de passe oubli\u00e9 ?" })}
          </a>
        </div>
      </div>
    </div>
  );
}
