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

export default function CharteEngagement({ lang, clientFirstName, clientName, onComplete }: Props) {
  const [checks, setChecks] = useState({ c1: false, c2: false, c3: false });
  const [signature, setSignature] = useState(clientFirstName);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [timerDone, setTimerDone] = useState(false);

  const T = (key: { EN: string; FR: string }) => key[lang];

  // Pre-fill signature when clientFirstName changes
  useEffect(() => {
    setSignature(clientFirstName);
  }, [clientFirstName]);

  // 10-second minimum timer for charter reading
  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll detection
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const checkScrolled = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
        setScrolledToBottom(true);
      }
    };
    checkScrolled();
    el.addEventListener("scroll", checkScrolled);
    return () => el.removeEventListener("scroll", checkScrolled);
  }, []);

  const allChecked = checks.c1 && checks.c2 && checks.c3;
  const canSubmit = allChecked && scrolledToBottom && timerDone;

  const charterText = lang === "FR" ? t.charterFR : t.charterEN;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
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

      // Enregistrer aussi l'engagement Monitoring Passage (fixedDay sera défini au booking)
      await fetch("/api/client/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      onComplete();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-2xl text-brun-chaud">
          Convention & Engagement
        </h2>
      </div>

      {/* Scrollable charter text */}
      <div
        ref={scrollRef}
        className="h-72 overflow-y-auto border border-or-pale rounded-sm bg-cire-chaude p-5 text-sm font-ui text-brun-chaud space-y-4 leading-relaxed"
      >
        {charterText.split("\n\n").map((paragraph, i) => {
          const isSeparator = /^\u2501/.test(paragraph.trim());
          const isHeading = /^(\d+\.|Convention|Purpose|Objet)/.test(paragraph.trim());
          if (isSeparator) {
            return (
              <div key={i} className="border-t border-or-sacre/40 pt-4 mt-4">
                <p className="font-display text-base text-or-sacre font-semibold text-center">
                  {paragraph.replace(/\u2501/g, "").trim()}
                </p>
              </div>
            );
          }
          return (
            <p key={i} className={isHeading ? "font-display text-base text-brun-chaud" : ""}>
              {paragraph}
            </p>
          );
        })}
        <p className="text-brun-mid/60 text-xs pt-4">&mdash; Joffrey Deleplanque &middot; BeeFrequency</p>
      </div>

      {!scrolledToBottom && (
        <p className="text-xs text-brun-mid/60 font-ui text-center animate-pulse">
          &darr; {lang === "FR" ? "Fais défiler jusqu\u2019en bas pour continuer" : "Scroll to the bottom to continue"}
        </p>
      )}

      {/* Checkboxes — directly below charter */}
      <div className="space-y-3 pt-2">
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

      {/* Signature — auto-filled with first name */}
      <div className="text-center py-2">
        <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-2">
          {T(t.onboarding.charterSignedBy)}
        </p>
        <p className="font-display text-2xl text-brun-chaud italic">
          {signature || clientFirstName}
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full py-3 bg-or-sacre text-white font-ui text-xs uppercase tracking-widest rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? T(t.onboarding.charterSigning) : T(t.onboarding.charterCommitButton)}
      </button>
    </div>
  );
}
