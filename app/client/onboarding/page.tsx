"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import CharteEngagement from "@/components/onboarding/CharteEngagement";
import SeuilOneFlow from "@/components/onboarding/SeuilOneFlow";
import { COUNTRIES, getCountryName, getSortedCountries } from "@/lib/countries";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  postalAddress: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  phoneNumber: string;
  country: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  birthPlace: string;
  birthCountry: string;
}

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  postalAddress: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  phoneNumber: "",
  country: "France",
  birthDate: "",
  birthTime: "",
  birthTimeUnknown: false,
  birthPlace: "",
  birthCountry: "",
};

// Step 1 = Welcome
// Step 2 = Personal info
// Step 3 = Video Seuil 1
// Step 4 = Charter (3 sub-steps managed by CharteEngagement)

const STORAGE_KEY = "hive_onboarding_state";

export default function OnboardingPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const T = (key: { EN: string; FR: string }) => key[lang];

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm((prev) => ({ ...prev, ...parsed.form }));
        if (parsed.step && typeof parsed.step === "number") setStep(parsed.step);
      }
    } catch {
      // Ignore
    }
    setRestored(true);
  }, []);

  // Persist state to localStorage on every change
  useEffect(() => {
    if (!restored) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, step }));
    } catch {
      // Ignore
    }
  }, [form, step, restored]);

  // Sync browser history with step navigation (browser back = previous step)
  useEffect(() => {
    if (!restored) return;
    const handlePopState = (e: PopStateEvent) => {
      const newStep = e.state?.step;
      if (typeof newStep === "number" && newStep >= 1) {
        setStep(newStep);
      } else if (step > 1) {
        // No state — go back one step instead of leaving the page
        setStep((prev) => Math.max(1, prev - 1));
        window.history.pushState({ step: Math.max(1, step - 1) }, "");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [restored, step]);

  // Push history entry when step changes forward
  useEffect(() => {
    if (!restored) return;
    if (typeof window !== "undefined") {
      window.history.replaceState({ step }, "");
    }
  }, [step, restored]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const updates: Partial<FormData> = {};
          if (data.user.email) updates.email = data.user.email;
          // Pré-remplir prénom et nom depuis le nom saisi par l'admin
          if (data.user.name) {
            const parts = data.user.name.trim().split(/\s+/);
            if (parts[0]) updates.firstName = parts[0];
            if (parts.length > 1) updates.lastName = parts.slice(1).join(" ");
          }
          setForm((prev) => ({ ...prev, ...updates }));
        }
      })
      .catch(() => {});
  }, []);

  // Helper to navigate to a step (forward = pushState)
  function goToStep(newStep: number) {
    setStep(newStep);
    if (typeof window !== "undefined") {
      window.history.pushState({ step: newStep }, "");
    }
  }

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function isStep2Valid() {
    return (
      form.firstName.trim() !== "" &&
      form.lastName.trim() !== "" &&
      form.phoneNumber.trim() !== "" &&
      form.birthDate !== "" &&
      form.birthPlace.trim() !== "" &&
      form.birthCountry.trim() !== "" &&
      form.postalAddress.trim() !== "" &&
      form.city.trim() !== "" &&
      form.postalCode.trim() !== "" &&
      form.country.trim() !== ""
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          birthDate: form.birthDate,
          birthTime: form.birthTimeUnknown ? null : form.birthTime || null,
          birthPlace: form.birthPlace.trim(),
          birthCountry: getCountryName(COUNTRIES.find((c) => c.code === form.birthCountry) || COUNTRIES[0], lang),
          postalAddress: form.postalAddress.trim(),
          addressLine2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          phoneNumber: form.phoneNumber.trim() || null,
          country: form.country.trim(),
          intention: "",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      // Onboarding complete — clear saved state
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      router.push("/client/questionnaire-entry");
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-creme-sacree flex flex-col">
      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {/* Logo block — Welcome Screen */}
          <div className="flex flex-col items-center w-full mb-9 mt-4">

            {/* Logo BeeFrequency */}
            <div className="w-40 h-40 flex items-center justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_joffrey_transparent.png"
                alt="BeeFrequency"
                className="w-full h-full object-contain"
              />
            </div>

            {/* BEE ⬡ FREQUENCY — même taille que Bienvenue, espacement serré */}
            <div className="flex items-center justify-center gap-1.5">
              <span
                style={{
                  fontFamily: "'Cormorant SC', serif",
                  letterSpacing: "0.12em",
                  color: "#B8821E",
                  fontWeight: 400,
                }}
                className="text-3xl"
              >
                BEE
              </span>

              <svg width="28" height="32" viewBox="0 0 11 13" fill="none">
                <path
                  d="M5.5 1L10 3.5V8.5L5.5 11L1 8.5V3.5L5.5 1Z"
                  stroke="#B8821E"
                  strokeWidth="0.8"
                  fill="none"
                />
              </svg>

              <span
                style={{
                  fontFamily: "'Cormorant SC', serif",
                  letterSpacing: "0.12em",
                  color: "#B8821E",
                  fontWeight: 400,
                }}
                className="text-3xl"
              >
                FREQUENCY
              </span>
            </div>

          </div>
          <h1 className="font-display text-3xl text-brun-chaud mb-4">
            {T(t.onboarding.welcomeTitle)}
          </h1>
          <p className="font-display text-base text-brun-mid leading-relaxed mb-10 max-w-sm">
            {T(t.onboarding.welcomeBody)}
          </p>
          <button
            onClick={() => goToStep(2)}
            className="px-8 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors"
          >
            {T(t.onboarding.welcomeButton)}
          </button>
        </div>
      )}

      {/* Steps 2-4 */}
      {step >= 2 && (
        <>
          <header className="flex flex-col items-center pt-8 pb-4 leading-none">
            <span
              style={{
                fontFamily: "'Cormorant SC', serif",
                letterSpacing: "0.12em",
                color: "#B8821E",
                fontWeight: 400,
              }}
              className="text-base"
            >
              BEEFREQUENCY
            </span>
            <span className="font-ui text-[10px] text-brun-mid/70 tracking-wide mt-0.5">
              by Joffrey Deleplanque
            </span>
          </header>

          {/* Progress: steps 2, 3, 4 shown as 1, 2, 3 */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {[2, 3, 4].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-ui transition-colors ${
                    s === step
                      ? "bg-or-sacre text-white"
                      : s < step
                        ? "bg-foret text-white"
                        : "bg-or-pale text-brun-mid"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className={`w-8 h-0.5 ${s < step ? "bg-foret" : "bg-or-pale"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 flex items-start justify-center px-4">
            <div className="w-full max-w-lg">
              {/* Step 2 — Personal info */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label={T(t.onboarding.firstName)}
                      value={form.firstName}
                      onChange={(v) => update("firstName", v)}
                      required
                    />
                    <Field
                      label={T({ EN: "Last name", FR: "Nom" })}
                      value={form.lastName}
                      onChange={(v) => update("lastName", v)}
                      required
                    />
                  </div>

                  <Field
                    label={T(t.onboarding.phoneNumber)}
                    value={form.phoneNumber}
                    onChange={(v) => update("phoneNumber", v)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-ui text-brun-chaud mb-1">
                      {T(t.onboarding.birthDate)} <span className="text-or-sacre">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => update("birthDate", e.target.value)}
                      className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-ui text-brun-chaud mb-1">
                      {T(t.onboarding.birthTime)}
                    </label>
                    <input
                      type="time"
                      value={form.birthTimeUnknown ? "" : form.birthTime}
                      onChange={(e) => update("birthTime", e.target.value)}
                      disabled={form.birthTimeUnknown}
                      className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors disabled:opacity-40 disabled:bg-cire-chaude"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.birthTimeUnknown}
                        onChange={(e) => update("birthTimeUnknown", e.target.checked)}
                        className="accent-or-sacre"
                      />
                      <span className="text-sm font-ui text-brun-mid">
                        {T(t.onboarding.birthTimeUnknown)}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-ui text-brun-chaud mb-1">
                      {T(t.onboarding.birthCountry)} <span className="text-or-sacre">*</span>
                    </label>
                    <select
                      value={form.birthCountry}
                      onChange={(e) => update("birthCountry", e.target.value)}
                      className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
                    >
                      <option value="">{T({ EN: "Select a country…", FR: "Sélectionner un pays…" })}</option>
                      {getSortedCountries(lang).map((c) => (
                        <option key={c.code} value={c.code}>
                          {getCountryName(c, lang)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Field
                    label={T(t.onboarding.birthCity)}
                    value={form.birthPlace}
                    onChange={(v) => update("birthPlace", v)}
                    required
                  />

                  {/* Delivery address */}
                  <div className="pt-4">
                    <p className="font-ui text-sm text-brun-chaud mb-3">
                      {T(t.onboarding.deliveryAddress)}
                    </p>
                  </div>

                  <Field
                    label={T(t.onboarding.addressLine1)}
                    value={form.postalAddress}
                    onChange={(v) => update("postalAddress", v)}
                    required
                  />

                  <Field
                    label={T(t.onboarding.addressLine2)}
                    value={form.addressLine2}
                    onChange={(v) => update("addressLine2", v)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label={T(t.onboarding.postalCode)}
                      value={form.postalCode}
                      onChange={(v) => update("postalCode", v)}
                      required
                    />
                    <Field
                      label={T(t.onboarding.city)}
                      value={form.city}
                      onChange={(v) => update("city", v)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-ui text-brun-chaud mb-1">
                      {T(t.onboarding.country)} <span className="text-or-sacre">*</span>
                    </label>
                    <select
                      value={form.country}
                      onChange={(e) => update("country", e.target.value)}
                      className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
                    >
                      {getSortedCountries(lang).map((c) => (
                        <option key={c.code} value={getCountryName(c, lang)}>
                          {getCountryName(c, lang)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && <p className="text-sm text-red-600 font-ui">{error}</p>}

                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => goToStep(1)}
                      className="flex-1 py-3 border border-brun-mid text-brun-mid rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-brun-mid hover:text-creme-sacree transition-colors"
                    >
                      {T(t.onboarding.backButton)}
                    </button>
                    <button
                      onClick={() => goToStep(3)}
                      disabled={!isStep2Valid()}
                      className="flex-[2] py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {T(t.onboarding.continueButton)}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Convention (AVANT vidéo) */}
              {step === 3 && (
                <div className="space-y-4">
                  <CharteEngagement
                    lang={lang}
                    clientFirstName={form.firstName}
                    clientName={[form.firstName, form.lastName].filter(Boolean).join(" ")}
                    onComplete={() => goToStep(4)}
                  />
                  <button
                    onClick={() => goToStep(2)}
                    className="w-full py-2 border border-brun-mid text-brun-mid rounded-sharp uppercase font-caps text-xs tracking-wider hover:bg-brun-mid hover:text-creme-sacree transition-colors"
                  >
                    {T(t.onboarding.backButton)}
                  </button>
                </div>
              )}

              {/* Step 4 — Video Seuil 1 (après Convention) */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-xl text-brun-chaud">
                      {T(t.onboarding.videoTitle)}
                    </h2>
                    <p className="font-ui text-sm text-brun-mid mt-2">
                      {T(t.onboarding.videoInstruction)}
                    </p>
                  </div>
                  <div className="bg-cire-chaude border border-or-pale rounded-sm p-4">
                    <p className="font-display text-sm text-brun-chaud leading-relaxed italic">
                      {T(t.onboarding.videoDescription)}
                    </p>
                  </div>
                  <SeuilOneFlow lang={lang} onComplete={handleSubmit} />
                  <button
                    onClick={() => goToStep(3)}
                    className="w-full py-2 border border-brun-mid text-brun-mid rounded-sharp uppercase font-caps text-xs tracking-wider hover:bg-brun-mid hover:text-creme-sacree transition-colors"
                  >
                    {T(t.onboarding.backButton)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-ui text-brun-chaud mb-1">
        {label} {required && <span className="text-or-sacre">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors disabled:opacity-40 disabled:bg-cire-chaude"
      />
    </div>
  );
}

