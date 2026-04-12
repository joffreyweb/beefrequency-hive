"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
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

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-foret/10 flex items-center justify-center mx-auto">
              <span className="text-foret text-xl">&#x2713;</span>
            </div>
            <h2 className="font-display text-xl text-brun-chaud">
              Email envoy&eacute;
            </h2>
            <p className="font-ui text-sm text-brun-mid leading-relaxed">
              Si un compte existe avec cette adresse, tu recevras un lien pour r&eacute;initialiser ton mot de passe.
            </p>
            <Link
              href="/login"
              className="inline-block mt-4 font-ui text-sm text-or-sacre hover:text-ambre-vif transition-colors"
            >
              &larr; Retour &agrave; la connexion
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl text-brun-chaud text-center mb-2">
              Mot de passe oubli&eacute; ?
            </h2>
            <p className="font-ui text-sm text-brun-mid text-center mb-6">
              Entre ton adresse email pour recevoir un lien de r&eacute;initialisation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
                >
                  Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-[0.06em] rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
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
