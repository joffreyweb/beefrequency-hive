"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/translations";
import { t } from "@/lib/translations";

interface InviteData {
  email: string;
  offerType: string;
  language?: string;
}

function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Line\//i.test(ua);
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
  const [inApp, setInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Language selection — FIRST GESTURE
  const [lang, setLang] = useState<Lang | null>(null);

  // Form
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detect in-app browser
  useEffect(() => {
    if (isInAppBrowser()) {
      setInApp(true);
      setLoading(false);
    }
  }, []);

  // Verify token on mount — skip if in-app browser
  useEffect(() => {
    if (inApp) return;
    async function verifyToken() {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Invitation invalide");
          return;
        }

        setInviteData(data);
        // Pre-select language from invite token if available
        if (data.language === "EN" || data.language === "FR") {
          setLang(data.language);
        }
      } catch {
        setError("Server connection error");
      } finally {
        setLoading(false);
      }
    }

    verifyToken();
  }, [token, inApp]);

  const T = (key: { EN: string; FR: string }) => key[lang || "FR"];

  // Form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const L = lang || "FR";

    if (password.length < 8) {
      setError(t.invite.errorPasswordMin[L]);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.invite.errorPasswordMatch[L]);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, language: L }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.invite.errorCreate[L]);
        setSubmitting(false);
        return;
      }

      router.push("/client/onboarding");
    } catch {
      setError(t.invite.errorServer[lang || "FR"]);
      setSubmitting(false);
    }
  }

  // In-app browser detected
  if (inApp) {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const isEN = typeof navigator !== "undefined" && navigator.language?.startsWith("en");

    function handleCopy() {
      navigator.clipboard.writeText(currentUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }).catch(() => {});
    }

    return (
      <div className="min-h-screen bg-creme-sacree flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div>
            <h1 className="font-display text-4xl font-light text-brun-chaud tracking-wide">Hive</h1>
            <p className="font-caps text-sm text-or-sacre tracking-widest mt-2 uppercase">BeeFrequency</p>
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
            <button
              onClick={handleCopy}
              className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-[0.06em] rounded-sharp hover:bg-ambre-vif transition-colors"
            >
              {copied
                ? (isEN ? "Link copied!" : "Lien copi\u00e9 !")
                : (isEN ? "Copy link" : "Copier le lien")}
            </button>
            <div className="pt-2 space-y-2">
              <p className="font-ui text-xs text-brun-mid">{isEN ? "Then:" : "Ensuite :"}</p>
              <div className="flex items-center gap-3 justify-center">
                <span className="w-6 h-6 rounded-full bg-or-sacre text-white text-xs flex items-center justify-center font-ui">1</span>
                <span className="font-ui text-sm text-brun-chaud">{isEN ? "Open Safari" : "Ouvre Safari"}</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <span className="w-6 h-6 rounded-full bg-or-sacre text-white text-xs flex items-center justify-center font-ui">2</span>
                <span className="font-ui text-sm text-brun-chaud">{isEN ? "Paste the link in the address bar" : "Colle le lien dans la barre d\u2019adresse"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-creme-sacree flex items-center justify-center">
        <p className="text-brun-mid font-ui">
          {lang ? T(t.invite.verifying) : "Verifying..."}
        </p>
      </div>
    );
  }

  // Invalid token
  if (!inviteData) {
    return (
      <div className="min-h-screen bg-creme-sacree flex items-center justify-center px-4">
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 max-w-md w-full text-center">
          <h1 className="font-display text-2xl text-brun-chaud mb-3">
            {T(t.invite.errorInvalid)}
          </h1>
          <p className="text-brun-mid font-ui text-sm">
            {error || T(t.invite.errorExpired)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme-sacree flex items-center justify-center px-4">
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 max-w-md w-full">
        {/* Language toggle — FIRST GESTURE */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => setLang("EN")}
            className={`px-5 py-2.5 rounded-lg border-2 transition-all duration-200 ${
              lang === "EN"
                ? "bg-or-sacre border-or-sacre text-white"
                : "bg-creme-sacree border-or-pale text-brun-chaud hover:border-or-sacre/50"
            }`}
          >
            <span className="font-ui text-sm font-normal">EN</span>
            <span className="font-ui text-[10px] block mt-0.5 opacity-70">English</span>
          </button>
          <button
            onClick={() => setLang("FR")}
            className={`px-5 py-2.5 rounded-lg border-2 transition-all duration-200 ${
              lang === "FR"
                ? "bg-or-sacre border-or-sacre text-white"
                : "bg-creme-sacree border-or-pale text-brun-chaud hover:border-or-sacre/50"
            }`}
          >
            <span className="font-ui text-sm font-normal">FR</span>
            <span className="font-ui text-[10px] block mt-0.5 opacity-70">Fran&ccedil;ais</span>
          </button>
        </div>

        {/* Title + subtitle */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-brun-chaud">
            {T(t.invite.title)}
          </h1>
          <p className="text-brun-mid font-ui text-sm mt-2">
            {T(t.invite.subtitle)}
          </p>
          <p className="text-or-sacre font-ui text-sm mt-1">
            {inviteData.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-ui text-brun-mid mb-1"
            >
              {T(t.invite.passwordLabel)}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
              placeholder="••••••••"
              minLength={8}
              required
              disabled={!lang}
            />
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-ui text-brun-mid mb-1"
            >
              {T(t.invite.confirmPassword)}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-sharp border border-or-pale bg-creme-sacree text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
              placeholder="••••••••"
              minLength={8}
              required
              disabled={!lang}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 font-ui">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !lang}
            className="w-full py-2.5 rounded-sm bg-or-sacre text-creme-sacree font-ui text-sm font-medium hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {submitting ? T(t.invite.activating) : T(t.invite.button)}
          </button>
        </form>
      </div>
    </div>
  );
}
