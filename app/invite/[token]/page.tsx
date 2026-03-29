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

  // Language selection — FIRST GESTURE
  const [lang, setLang] = useState<Lang | null>(null);

  // Form
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/invite/${token}`, {
          credentials: "same-origin",
          cache: "no-store",
        });
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
  }, [token]);

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
        credentials: "same-origin",
        cache: "no-store",
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-creme-sacree flex items-center justify-center">
        <meta name="supported-color-schemes" content="light" />
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
        <meta name="supported-color-schemes" content="light" />
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
      <meta name="supported-color-schemes" content="light" />
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
