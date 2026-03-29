"use client";

import { useState, useRef, useEffect } from "react";
import type { Lang } from "@/lib/translations";
import { t } from "@/lib/translations";

interface Props {
  lang: Lang;
  clientFirstName: string;
  clientName: string;
  onComplete: () => void;
}

type SubStep = "intro" | "scroll" | "sign";

export default function CharteEngagement({ lang, clientFirstName, clientName, onComplete }: Props) {
  const [subStep, setSubStep] = useState<SubStep>("intro");
  const [checks, setChecks] = useState({ c1: false, c2: false, c3: false });
  const [signature, setSignature] = useState(clientFirstName);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [timerDone, setTimerDone] = useState(false);

  const T = (key: { EN: string; FR: string }) => key[lang];

  // Pre-fill signature when clientFirstName changes
  useEffect(() => {
    setSignature(clientFirstName);
  }, [clientFirstName]);

  // 10-second minimum timer for charter reading
  useEffect(() => {
    if (subStep === "scroll") {
      const timer = setTimeout(() => setTimerDone(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [subStep]);

  // Scroll detection
  useEffect(() => {
    if (subStep !== "scroll") return;
    const el = scrollRef.current;
    if (!el) return;
    const checkScrolled = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
        setScrolled(true);
      }
    };
    checkScrolled();
    el.addEventListener("scroll", checkScrolled);
    return () => el.removeEventListener("scroll", checkScrolled);
  }, [subStep]);

  const allChecked = checks.c1 && checks.c2 && checks.c3;
  const canShowButton = scrolled && timerDone;

  const charterText = lang === "FR" ? t.charterFR : t.charterEN;

  async function handleSubmit() {
    if (!allChecked || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/onboarding/charte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature: signature || clientName,
          signedAt: new Date().toISOString(),
        }),
      });
      onComplete();
    } catch {
      setSubmitting(false);
    }
  }

  // Sub-step A — Intro
  if (subStep === "intro") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 space-y-8">
        <p className="font-display text-xl text-brun-chaud leading-relaxed whitespace-pre-line max-w-sm">
          {T(t.onboarding.charterIntroText)}
        </p>
        <button
          onClick={() => setSubStep("scroll")}
          className="px-8 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors"
        >
          {T(t.onboarding.continueButton)}
        </button>
      </div>
    );
  }

  // Sub-step B — Scroll charter
  if (subStep === "scroll") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="font-display text-2xl text-brun-chaud">
            Convention & Engagement
          </h2>
        </div>

        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto border border-or-pale rounded-sm bg-cire-chaude p-5 text-sm font-ui text-brun-chaud space-y-4 leading-relaxed"
        >
          {charterText.split("\n\n").map((paragraph, i) => {
            // Check if paragraph looks like a heading (numbered or title)
            const isHeading = /^(\d+\.|Convention|Purpose|Objet)/.test(paragraph.trim());
            return (
              <p key={i} className={isHeading ? "font-display text-base text-brun-chaud" : ""}>
                {paragraph}
              </p>
            );
          })}
          <p className="text-brun-mid/60 text-xs pt-4">&mdash; Joffrey Deleplanque &middot; BeeFrequency</p>
        </div>

        {!canShowButton && (
          <p className="text-xs text-brun-mid/60 font-ui text-center animate-pulse">
            &darr; {lang === "FR" ? "Fais d\u00e9filer jusqu\u2019en bas pour continuer" : "Scroll to the bottom to continue"}
          </p>
        )}

        <button
          onClick={() => setSubStep("sign")}
          disabled={!canShowButton}
          className={`w-full py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-all duration-300 ${
            canShowButton ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {T(t.onboarding.charterScrollButton)}
        </button>
      </div>
    );
  }

  // Sub-step C — Checkboxes + signature
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {[
          { key: "c1", text: T(t.onboarding.charterCheck1) },
          { key: "c2", text: T(t.onboarding.charterCheck2) },
          { key: "c3", text: T(t.onboarding.charterCheck3) },
        ].map(({ key, text }) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checks[key as keyof typeof checks]}
              onChange={(e) => setChecks(prev => ({ ...prev, [key]: e.target.checked }))}
              className="mt-0.5 accent-or-sacre w-4 h-4 flex-shrink-0"
            />
            <span className="font-ui text-sm text-brun-chaud leading-relaxed">{text}</span>
          </label>
        ))}
      </div>

      {/* Signature */}
      <div className="text-center py-2">
        <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-2">
          {T(t.onboarding.charterSignedBy)}
        </p>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          className="text-center font-display text-2xl text-brun-chaud italic bg-transparent border-b border-or-pale focus:border-or-sacre focus:outline-none w-full max-w-xs mx-auto"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allChecked || submitting}
        className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? T(t.onboarding.charterSigning) : T(t.onboarding.charterCommitButton)}
      </button>
    </div>
  );
}
