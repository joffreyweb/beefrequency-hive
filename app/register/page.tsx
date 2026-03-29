"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
          <p className="font-ui font-light text-brun-mid text-sm">Chargement...</p>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Line\//i.test(ua);
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [inAppDetected, setInAppDetected] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect in-app browser before any fetch
  useEffect(() => {
    if (isInAppBrowser()) {
      setInAppDetected(true);
      setVerifying(false);
      return;
    }
  }, []);

  // Vérification du token au chargement — skip if in-app browser
  useEffect(() => {
    if (inAppDetected) return;

    if (!token) {
      setTokenError("Lien d'invitation invalide — aucun token fourni.");
      setVerifying(false);
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setTokenError(data.error || "Invitation invalide");
          return;
        }

        setEmail(data.email);
      } catch {
        setTokenError("Erreur de connexion au serveur");
      } finally {
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token, inAppDetected]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Prénom et nom requis");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName.trim()} ${lastName.trim()}`,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'inscription");
        return;
      }

      router.push("/client/onboarding");
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  // In-app browser detected — show "open in Safari" message
  if (inAppDetected) {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const isEN = typeof navigator !== "undefined" && navigator.language?.startsWith("en");

    function handleCopy() {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {
        // Fallback: select a hidden input
      });
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div>
            <h1 className="font-display text-4xl font-light text-brun-chaud tracking-wide">
              Hive
            </h1>
            <p className="font-caps text-sm text-or-sacre tracking-widest mt-2 uppercase">
              BeeFrequency
            </p>
          </div>

          <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 space-y-4">
            <p className="font-display text-lg text-brun-chaud leading-relaxed">
              {isEN
                ? "To continue, please open this link in Safari"
                : "Pour continuer, ouvre ce lien dans Safari"}
            </p>

            <p className="font-ui text-xs text-brun-mid/60 leading-relaxed">
              {isEN
                ? "This browser doesn\u2019t support account creation. Copy the link below and paste it in Safari."
                : "Ce navigateur ne permet pas la cr\u00e9ation de compte. Copie le lien ci-dessous et colle-le dans Safari."}
            </p>

            {/* Copy link button */}
            <button
              onClick={handleCopy}
              className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-[0.06em] rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
            >
              {copied
                ? (isEN ? "Link copied!" : "Lien copi\u00e9 !")
                : (isEN ? "Copy link" : "Copier le lien")}
            </button>

            {/* Visual instruction */}
            <div className="pt-2 space-y-2">
              <p className="font-ui text-xs text-brun-mid">
                {isEN ? "Then:" : "Ensuite :"}
              </p>
              <div className="flex items-center gap-3 justify-center">
                <span className="w-6 h-6 rounded-full bg-or-sacre text-white text-xs flex items-center justify-center font-ui">1</span>
                <span className="font-ui text-sm text-brun-chaud">
                  {isEN ? "Open Safari" : "Ouvre Safari"}
                </span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <span className="w-6 h-6 rounded-full bg-or-sacre text-white text-xs flex items-center justify-center font-ui">2</span>
                <span className="font-ui text-sm text-brun-chaud">
                  {isEN ? "Paste the link in the address bar" : "Colle le lien dans la barre d\u2019adresse"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // État de chargement
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
        <p className="font-ui font-light text-brun-mid text-sm">
          Vérification de votre invitation...
        </p>
      </div>
    );
  }

  // Token invalide ou absent
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-10">
            <h1 className="font-display text-4xl font-light text-brun-chaud tracking-wide">
              Hive
            </h1>
            <p className="font-caps text-sm text-or-sacre tracking-widest mt-2 uppercase">
              BeeFrequency
            </p>
          </div>
          <div className="text-red-600 text-sm bg-red-50 py-3 px-4 rounded-sm">
            {tokenError}
          </div>
          <a
            href="/login"
            className="inline-block mt-6 font-ui text-xs text-or-sacre uppercase tracking-wider hover:text-ambre-vif transition-colors"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Identité */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-light text-brun-chaud tracking-wide">
            Hive
          </h1>
          <p className="font-caps text-sm text-or-sacre tracking-widest mt-2 uppercase">
            BeeFrequency
          </p>
          <p className="font-display text-brun-mid text-sm italic mt-3">
            Créez votre compte
          </p>
        </div>

        {/* Email (lecture seule) */}
        <p className="text-center font-ui font-light text-brun-mid text-sm mb-6">
          {email}
        </p>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 py-2 px-3 rounded-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="firstName"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200"
              placeholder="Votre prénom"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200"
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              Mot de passe
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
  );
}
