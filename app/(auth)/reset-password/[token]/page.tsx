"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caract\u00e8res");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }

      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-light text-brun-chaud tracking-wide">
            Hive
          </h1>
          <p className="font-caps text-sm text-or-sacre tracking-widest mt-2 uppercase">
            BeeFrequency
          </p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-foret/10 flex items-center justify-center mx-auto">
              <span className="text-foret text-xl">&#x2713;</span>
            </div>
            <h2 className="font-display text-xl text-brun-chaud">
              Mot de passe modifi&eacute;
            </h2>
            <p className="font-ui text-sm text-brun-mid">
              Redirection vers la connexion...
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl text-brun-chaud text-center mb-6">
              Nouveau mot de passe
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200"
                  placeholder="Min. 8 caract\u00e8res"
                />
              </div>

              <div>
                <label className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5">
                  Confirmer
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200"
                  placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-[0.06em] rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
              >
                {loading ? "Modification..." : "Modifier le mot de passe"}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link
                href="/login"
                className="font-ui text-sm text-or-sacre hover:text-ambre-vif transition-colors"
              >
                &larr; Retour &agrave; la connexion
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
