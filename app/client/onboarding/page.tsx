"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import VideoRecorder from "@/components/video/VideoRecorder";
import CharteEngagement from "@/components/onboarding/CharteEngagement";

interface FormData {
  firstName: string;
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

export default function OnboardingPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const T = (key: { EN: string; FR: string }) => key[lang];

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.email) {
          setForm((prev) => ({ ...prev, email: data.user.email }));
        }
      })
      .catch(() => {});
  }, []);

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function isStep2Valid() {
    return (
      form.firstName.trim() !== "" &&
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
          lastName: "",
          birthDate: form.birthDate,
          birthTime: form.birthTimeUnknown ? null : form.birthTime || null,
          birthPlace: form.birthPlace.trim(),
          birthCountry: form.birthCountry.trim(),
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

      router.push("/client/home");
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

            {/* Symbole uniquement — crop left 38% du logo paysage */}
            <div className="w-40 h-40 flex items-center justify-center overflow-hidden mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo_joffrey_transparent.png"
                alt="BeeFrequency"
                style={{
                  width: '421px',
                  maxWidth: 'none',
                  height: 'auto',
                  marginLeft: '0px',
                  objectFit: 'cover',
                  objectPosition: 'left center',
                }}
              />
            </div>

            {/* BE · hexagone · FREQUENCY */}
            <div className="flex items-center justify-center gap-2">
              <span style={{
                fontFamily: "'Cormorant SC', serif",
                fontSize: '11px',
                letterSpacing: '0.22em',
                color: '#B8821E',
                fontWeight: 400,
              }}>BE</span>

              <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
                <path d="M5.5 1L10 3.5V8.5L5.5 11L1 8.5V3.5L5.5 1Z"
                      stroke="#B8821E" strokeWidth="0.8" fill="none"/>
              </svg>

              <span style={{
                fontFamily: "'Cormorant SC', serif",
                fontSize: '11px',
                letterSpacing: '0.22em',
                color: '#B8821E',
                fontWeight: 400,
              }}>FREQUENCY</span>
            </div>

          </div>
          <h1 className="font-display text-2xl text-brun-chaud mb-4">
            {T(t.onboarding.welcomeTitle)}
          </h1>
          <p className="font-display text-lg text-brun-mid leading-relaxed mb-10 max-w-sm">
            {T(t.onboarding.welcomeBody)}
          </p>
          <button
            onClick={() => setStep(2)}
            className="px-8 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors"
          >
            {T(t.onboarding.welcomeButton)}
          </button>
        </div>
      )}

      {/* Steps 2-4 */}
      {step >= 2 && (
        <>
          <header className="flex items-center justify-center gap-2 pt-8 pb-4">
            <span className="font-ui text-base font-light lowercase text-brun-mid">be</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8D5A8" strokeWidth="1" strokeLinejoin="round"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /></svg>
            <span className="font-ui text-base font-light lowercase text-brun-mid">beefrequency</span>
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
                  <div className="mb-6">
                    <h2 className="font-display text-xl text-brun-chaud">
                      {T(t.onboarding.infoTitle)}
                    </h2>
                  </div>

                  <Field
                    label={T(t.onboarding.firstName)}
                    value={form.firstName}
                    onChange={(v) => update("firstName", v)}
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

                  <Field
                    label={T(t.onboarding.birthCity)}
                    value={form.birthPlace}
                    onChange={(v) => update("birthPlace", v)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-ui text-brun-chaud mb-1">
                      {T(t.onboarding.birthCountry)} <span className="text-or-sacre">*</span>
                    </label>
                    <select
                      value={form.birthCountry}
                      onChange={(e) => update("birthCountry", e.target.value)}
                      className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
                    >
                      <option value="">Select...</option>
                      <option value="France">France</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Luxembourg">Luxembourg</option>
                      <option value="Canada">Canada</option>
                      <option value="Spain">Spain</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Italy">Italy</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Morocco">Morocco</option>
                      <option value="Algeria">Algeria</option>
                      <option value="Tunisia">Tunisia</option>
                      <option value="United States">United States</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

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
                      <option value="France">France</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Switzerland">Switzerland</option>
                      <option value="Luxembourg">Luxembourg</option>
                      <option value="Canada">Canada</option>
                      <option value="Spain">Spain</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Italy">Italy</option>
                      <option value="Portugal">Portugal</option>
                      <option value="United States">United States</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {error && <p className="text-sm text-red-600 font-ui">{error}</p>}

                  <div className="pt-4">
                    <button
                      onClick={() => setStep(3)}
                      disabled={!isStep2Valid()}
                      className="w-full py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {T(t.onboarding.continueButton)}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Video Seuil 1 */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-display text-xl text-brun-chaud">
                      {T(t.onboarding.videoTitle)}
                    </h2>
                    <p className="font-ui text-sm text-brun-mid mt-2">
                      {T(t.onboarding.videoInstruction)}
                    </p>
                  </div>
                  <div className="bg-cire-chaude border border-or-pale rounded-sm p-4 space-y-2">
                    <p className="font-ui text-sm text-brun-chaud">
                      {T(t.onboarding.videoQ1)}
                    </p>
                    <p className="font-ui text-sm text-brun-chaud">
                      {T(t.onboarding.videoQ2)}
                    </p>
                    <p className="font-ui text-sm text-brun-chaud">
                      {T(t.onboarding.videoQ3)}
                    </p>
                  </div>
                  <VideoRecorder seuil="1" onComplete={() => setStep(4)} />
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 py-2 text-brun-mid font-ui text-xs uppercase tracking-wider hover:text-brun-chaud transition-colors"
                    >
                      {T(t.onboarding.backButton)}
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="flex-1 py-2 text-or-sacre font-ui text-xs uppercase tracking-wider hover:text-ambre-vif transition-colors"
                    >
                      {T(t.onboarding.continueButton)} &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4 — Charter */}
              {step === 4 && (
                <CharteEngagement
                  lang={lang}
                  clientFirstName={form.firstName}
                  clientName={form.firstName}
                  onComplete={handleSubmit}
                />
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
