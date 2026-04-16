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
  const [consent, setConsent] = useState({ d1: false, d2: false, d3: false });
  // Signature = Prénom + Nom (clientName complet), fallback sur prénom seul
  const initialSig = (clientName && clientName.trim()) || clientFirstName || "";
  const [signature, setSignature] = useState(initialSig);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [timerDone, setTimerDone] = useState(false);

  const T = (key: { EN: string; FR: string }) => key[lang];

  // Pre-fill signature when full name changes (firstName + lastName)
  useEffect(() => {
    const full = (clientName && clientName.trim()) || clientFirstName || "";
    setSignature(full);
  }, [clientFirstName, clientName]);

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
  const allConsent = consent.d1 && consent.d2 && consent.d3;
  const canSubmit = allChecked && allConsent && scrolledToBottom && timerDone;

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
          consent: {
            d1_conditions_generales: consent.d1,
            d2_nature_non_medicale: consent.d2,
            d3_pleine_conscience: consent.d3,
          },
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

      {/* Déclaration & Consentement */}
      <div className="border-t border-or-sacre/30 pt-6 mt-2">
        <h3 className="font-display text-lg text-brun-chaud mb-4 text-center">
          {T({
            EN: "Participant Declaration & Consent",
            FR: "Déclaration & Consentement du participant",
          })}
        </h3>

        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 text-sm font-ui text-brun-chaud leading-relaxed space-y-4 mb-5">
          <p>
            {T({
              EN: "I acknowledge having read and understood the framework of this accompaniment, its non-medical nature, as well as the conditions of engagement, cancellation and responsibility associated with it.",
              FR: "Je reconnais avoir pris connaissance du cadre de cet accompagnement, de sa nature non médicale, ainsi que des conditions d'engagement, d'annulation et de responsabilité qui y sont liées.",
            })}
          </p>
          <p>
            {T({
              EN: "I understand that no guarantee of absence of risk can be given and that in case of doubt about the compatibility of this accompaniment with my personal, physical, psychological or medical situation, it is my responsibility to consult my doctor or a competent health professional.",
              FR: "Je comprends qu'aucune garantie d'absence de risque ne peut être donnée et qu'en cas de doute sur la compatibilité de cet accompagnement avec ma situation personnelle, physique, psychique ou médicale, il m'appartient de consulter mon médecin ou un professionnel de santé compétent.",
            })}
          </p>
          <p>
            {T({
              EN: "I declare that I freely engage in the proposed practices, in full awareness, without external pressure, and under my sole responsibility.",
              FR: "Je déclare m'engager librement dans les pratiques proposées, en pleine conscience, sans pression extérieure, et sous ma seule responsabilité.",
            })}
          </p>
          <p>
            {T({
              EN: "I acknowledge that the meditations, breathwork, elixirs and tools offered may influence my feelings, perceptions or inner state, without constituting a medical act, diagnosis or treatment.",
              FR: "Je reconnais que les méditations, respirations, élixirs et outils proposés peuvent influencer mon ressenti, mes perceptions ou mon état intérieur, sans constituer un acte médical, un diagnostic ou un traitement.",
            })}
          </p>
          <p>
            {T({
              EN: "I remain at all times fully responsible for myself, my choices, my rhythm, and how I use the proposed tools.",
              FR: "Je demeure à tout moment pleinement responsable de moi-même, de mes choix, de mon rythme, ainsi que de la manière dont j'utilise les outils proposés.",
            })}
          </p>
          <p>
            {T({
              EN: "In case of doubt, discomfort or need for clarification, I commit to opening dialogue and requesting the necessary clarifications before continuing.",
              FR: "En cas de doute, d'inconfort ou de besoin de clarification, je m'engage à ouvrir le dialogue et à demander les éclaircissements nécessaires avant de poursuivre.",
            })}
          </p>
        </div>

        {/* Consent checkboxes */}
        <div className="space-y-3">
          {[
            {
              key: "d1",
              text: T({
                EN: "Read and approved — I have read and understood the general conditions of accompaniment",
                FR: "Lu et approuvé — J'ai lu et compris les conditions générales d'accompagnement",
              }),
            },
            {
              key: "d2",
              text: T({
                EN: "Read and approved — I accept the non-medical nature of this accompaniment",
                FR: "Lu et approuvé — J'accepte la nature non médicale de cet accompagnement",
              }),
            },
            {
              key: "d3",
              text: T({
                EN: "Read and approved — I commit in full awareness and under my responsibility",
                FR: "Lu et approuvé — Je m'engage en pleine conscience et sous ma responsabilité",
              }),
            },
          ].map(({ key, text }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent[key as keyof typeof consent]}
                onChange={(e) => setConsent(prev => ({ ...prev, [key]: e.target.checked }))}
                className="mt-0.5 accent-or-sacre w-4 h-4 flex-shrink-0"
              />
              <span className="font-ui text-sm text-brun-chaud leading-relaxed">{text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Signature — auto-filled with first name */}
      <div className="text-center py-2">
        <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-2">
          {T(t.onboarding.charterSignedBy)}
        </p>
        <p className="font-display text-2xl text-brun-chaud italic">
          {signature || clientName || clientFirstName}
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
