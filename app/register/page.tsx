"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  }
}

const t = {
  FR: {
    loading: "Chargement...",
    verifying: "Vérification de votre invitation...",
    invalidLink: "Lien d'invitation invalide — aucun token fourni.",
    backToLogin: "Retour à la connexion",
    createAccount: "Créez votre compte",
    setPassword: "Définir votre mot de passe",
    firstName: "Prénom",
    firstNamePlaceholder: "Votre prénom",
    lastName: "Nom",
    lastNamePlaceholder: "Votre nom",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    submit: "Créer mon compte",
    submitActivate: "Activer mon compte",
    submitting: "Création du compte...",
    submittingActivate: "Activation...",
    errFirstLastRequired: "Prénom et nom requis",
    errPasswordMin: "Le mot de passe doit contenir au moins 8 caractères",
    errPasswordMismatch: "Les mots de passe ne correspondent pas",
    errDefault: "Erreur lors de l'inscription",
    errConnection: "Erreur de connexion au serveur",
  },
  EN: {
    loading: "Loading...",
    verifying: "Verifying your invitation...",
    invalidLink: "Invalid invitation link — no token provided.",
    backToLogin: "Back to login",
    createAccount: "Create your account",
    setPassword: "Set your password",
    firstName: "First name",
    firstNamePlaceholder: "Your first name",
    lastName: "Last name",
    lastNamePlaceholder: "Your last name",
    password: "Password",
    confirmPassword: "Confirm password",
    submit: "Create my account",
    submitActivate: "Activate my account",
    submitting: "Creating account...",
    submittingActivate: "Activating...",
    errFirstLastRequired: "First and last name required",
    errPasswordMin: "Password must be at least 8 characters",
    errPasswordMismatch: "Passwords do not match",
    errDefault: "Error during registration",
    errConnection: "Connection error",
  },
} as const;

type Lang = keyof typeof t;

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

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [lang, setLang] = useState<Lang>("FR");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);

  const renderTurnstile = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.turnstile &&
      turnstileRef.current &&
      turnstileRef.current.childElementCount === 0
    ) {
      window.turnstile.render(turnstileRef.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
      });
    }
  }, []);

  const i = t[lang];

  // Vérification du token au chargement
  useEffect(() => {
    if (!token) {
      setTokenError(t.FR.invalidLink);
      setVerifying(false);
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/invite/${token}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          setTokenError(data.error || "Invitation invalide");
          return;
        }

        setEmail(data.email);
        if (data.language === "EN" || data.language === "FR") {
          setLang(data.language);
        }
        // Si l'utilisateur existe déjà (pré-créé par admin), pré-remplir le nom
        if (data.existingUser?.name) {
          setIsExistingUser(true);
          const parts = data.existingUser.name.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
      } catch (err) {
        console.error("[register] verifyToken failed:", err);
        setTokenError(t.FR.errConnection);
      } finally {
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError(i.errFirstLastRequired);
      return;
    }

    if (password.length < 8) {
      setError(i.errPasswordMin);
      return;
    }

    if (password !== confirmPassword) {
      setError(i.errPasswordMismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({
          name: `${firstName.trim()} ${lastName.trim()}`,
          password,
          turnstileToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || i.errDefault);
        return;
      }

      router.push("/client/onboarding");
    } catch (err) {
      console.error("[register] handleSubmit failed:", err);
      setError(i.errConnection);
    } finally {
      setLoading(false);
    }
  }

  // État de chargement
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
        <meta name="supported-color-schemes" content="light" />
        <p className="font-ui font-light text-brun-mid text-sm">
          {i.verifying}
        </p>
      </div>
    );
  }

  // Token invalide ou absent
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
        <meta name="supported-color-schemes" content="light" />
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
            {i.backToLogin}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-creme-sacree px-4">
      <meta name="supported-color-schemes" content="light" />
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
            {isExistingUser ? i.setPassword : i.createAccount}
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
              {i.firstName}
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              readOnly={isExistingUser}
              className={`w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200 ${isExistingUser ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder={i.firstNamePlaceholder}
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              {i.lastName}
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              readOnly={isExistingUser}
              className={`w-full px-3 py-2.5 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui font-light text-sm focus:outline-none focus:border-or-sacre transition-colors duration-200 ${isExistingUser ? "opacity-60 cursor-not-allowed" : ""}`}
              placeholder={i.lastNamePlaceholder}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-ui font-light text-brun-mid uppercase tracking-wider mb-1.5"
            >
              {i.password}
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
              {i.confirmPassword}
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

          {/* Cloudflare Turnstile */}
          <div ref={turnstileRef} className="flex justify-center" />

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-[0.06em] rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
          >
            {loading
              ? (isExistingUser ? i.submittingActivate : i.submitting)
              : (isExistingUser ? i.submitActivate : i.submit)}
          </button>
        </form>

        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
          strategy="afterInteractive"
          onReady={renderTurnstile}
        />
      </div>
    </div>
  );
}
