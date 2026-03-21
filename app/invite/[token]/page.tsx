"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface InviteData {
  email: string;
  offerType: string;
}

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Verification du token au montage
  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invitation invalide");
          return;
        }

        setInviteData(data);
      } catch {
        setError("Erreur de connexion au serveur");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  // Soumission du formulaire
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validations
    if (!name.trim()) {
      setError("Le nom est requis");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la creation du compte");
        setSubmitting(false);
        return;
      }

      // Redirection vers l'espace client
      router.push("/client/home");
    } catch {
      setError("Erreur de connexion au serveur");
      setSubmitting(false);
    }
  }

  // Etats de chargement / erreur sans formulaire
  if (loading) {
    return (
      <div className="min-h-screen bg-creme-sacree flex items-center justify-center">
        <p className="text-brun-mid font-ui">Verification de l&apos;invitation...</p>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-creme-sacree flex items-center justify-center px-4">
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 max-w-md w-full text-center">
          <h1 className="font-display text-2xl text-brun-chaud mb-3">
            Invitation invalide
          </h1>
          <p className="text-brun-mid font-ui text-sm">
            {error || "Ce lien d'invitation n'est plus valide ou a deja ete utilise."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme-sacree flex items-center justify-center px-4">
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-brun-chaud">
            Bienvenue chez BeeFrequency
          </h1>
          <p className="text-brun-mid font-ui text-sm mt-2">
            Activez votre compte pour acceder a votre espace personnel.
          </p>
          <p className="text-or-sacre font-ui text-sm mt-1">
            {inviteData.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-ui text-brun-mid mb-1"
            >
              Votre nom
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
              placeholder="Prenom Nom"
              required
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-ui text-brun-mid mb-1"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
              placeholder="Minimum 8 caracteres"
              minLength={8}
              required
            />
          </div>

          {/* Confirmation */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-ui text-brun-mid mb-1"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
              placeholder="Retapez le mot de passe"
              minLength={8}
              required
            />
          </div>

          {/* Erreur */}
          {error && (
            <p className="text-sm text-red-600 font-ui">{error}</p>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-sm bg-or-sacre text-creme-sacree font-ui text-sm font-medium hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {submitting ? "Creation du compte..." : "Activer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
