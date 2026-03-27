"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import VideoRecorder from "@/components/video/VideoRecorder";
import CharteEngagement from "@/components/onboarding/CharteEngagement";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  postalAddress: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  birthPlace: string;
  birthCountry: string;
  intention: string;
}

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  postalAddress: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "France",
  birthDate: "",
  birthTime: "",
  birthTimeUnknown: false,
  birthPlace: "",
  birthCountry: "",
  intention: "",
};

// Step -1 = language selection (only if language is null/default)
// Step 0 = Welcome
// Steps 1-5 = existing flow

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number | null>(null); // null = loading
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<"EN" | "FR" | null>(null);
  const [savingLang, setSavingLang] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/client/profile").then((r) => r.ok ? r.json() : null),
    ]).then(([authData, profileData]) => {
      if (authData.user?.email) {
        setForm((prev) => ({ ...prev, email: authData.user.email }));
      }
      // If language is the default "FR" from schema, treat as "not yet chosen" → show selector
      // If the client explicitly chose (via this step), it will have been set
      // We use a simple heuristic: show language step for all new onboardings
      // The onboarding guard already ensures this page is only shown to new clients
      const lang = profileData?.language;
      if (!lang || lang === "FR") {
        // Show language selection first
        setStep(-1);
      } else {
        setStep(0);
      }
    }).catch(() => {
      setStep(0);
    });
  }, []);

  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function isStep1Valid() {
    return (
      form.firstName.trim() !== "" &&
      form.lastName.trim() !== "" &&
      form.postalAddress.trim() !== "" &&
      form.city.trim() !== "" &&
      form.postalCode.trim() !== "" &&
      form.country.trim() !== ""
    );
  }

  function isStep2Valid() {
    return (
      form.birthDate !== "" &&
      form.birthPlace.trim() !== "" &&
      form.birthCountry.trim() !== ""
    );
  }

  async function handleLanguageSave() {
    if (!selectedLang) return;
    setSavingLang(true);
    try {
      await fetch("/api/client/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: selectedLang }),
      });
      setStep(0);
    } catch {
      // Continue anyway
      setStep(0);
    } finally {
      setSavingLang(false);
    }
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
          birthCountry: form.birthCountry.trim(),
          postalAddress: form.postalAddress.trim(),
          addressLine2: form.addressLine2.trim() || null,
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
          intention: form.intention.trim(),
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

  // Loading state
  if (step === null) {
    return (
      <div className="min-h-screen bg-creme-sacree flex items-center justify-center">
        <p className="font-ui text-sm text-brun-mid/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme-sacree flex flex-col">
      {/* Step -1 — Language Selection */}
      {step === -1 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-3xl sm:text-4xl text-brun-chaud mb-3">
            Hive
          </h1>
          <p className="font-caps text-xs tracking-widest text-brun-mid uppercase mb-12">
            BeeFrequency
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-8">
            <button
              onClick={() => setSelectedLang("EN")}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                selectedLang === "EN"
                  ? "bg-or-sacre border-or-sacre text-white"
                  : "bg-cire-chaude border-or-pale text-brun-chaud hover:border-or-sacre/50"
              }`}
            >
              <p className="font-ui text-lg font-normal">EN</p>
              <p className="font-ui text-xs mt-1 opacity-70">English</p>
            </button>
            <button
              onClick={() => setSelectedLang("FR")}
              className={`p-6 rounded-lg border-2 transition-all duration-200 ${
                selectedLang === "FR"
                  ? "bg-or-sacre border-or-sacre text-white"
                  : "bg-cire-chaude border-or-pale text-brun-chaud hover:border-or-sacre/50"
              }`}
            >
              <p className="font-ui text-lg font-normal">FR</p>
              <p className="font-ui text-xs mt-1 opacity-70">Fran&ccedil;ais</p>
            </button>
          </div>

          <button
            onClick={handleLanguageSave}
            disabled={!selectedLang || savingLang}
            className="px-8 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingLang ? "..." : "Continue"}
          </button>
        </div>
      )}

      {/* Step 0 — Welcome */}
      {step === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-brun-chaud mb-6">
            Welcome.
          </h1>
          <p className="font-display text-lg sm:text-xl text-brun-mid/80 italic mb-4">
            This space is yours.
          </p>
          <p className="font-ui text-sm sm:text-base text-brun-mid max-w-md leading-relaxed mb-8">
            Before we begin, I need to know you a little.
            This information remains confidential and allows me
            to walk beside you with precision.
          </p>
          <p className="font-display text-sm text-brun-mid/70 italic mb-10">
            — Joffrey Deleplanque
          </p>
          <button
            onClick={() => setStep(1)}
            className="px-8 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors"
          >
            Begin
          </button>
        </div>
      )}

      {/* Steps 1-5 */}
      {step >= 1 && (
        <>
      <header className="flex flex-col items-center pt-8 pb-4">
        <h1 className="font-display text-2xl text-or-sacre">Hive</h1>
        <p className="font-caps text-xs tracking-widest text-brun-mid uppercase">
          BeeFrequency
        </p>
      </header>

      <div className="flex items-center justify-center gap-0 mb-8">
        {[1, 2, 3, 4, 5].map((s, i) => (
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
              {s}
            </div>
            {i < 4 && (
              <div className={`w-8 h-0.5 ${s < step ? "bg-foret" : "bg-or-pale"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Step 1 — Who are you? */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="font-display text-xl text-brun-chaud">Who are you?</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="First name"
                  value={form.firstName}
                  onChange={(v) => update("firstName", v)}
                  required
                />
                <Field
                  label="Last name"
                  value={form.lastName}
                  onChange={(v) => update("lastName", v)}
                  required
                />
              </div>

              <Field
                label="Email"
                value={form.email}
                onChange={() => {}}
                disabled
              />

              {/* Delivery address */}
              <div className="pt-4">
                <p className="font-ui text-sm text-brun-chaud mb-1">Delivery address</p>
                <p className="font-ui text-xs text-brun-mid/60 mb-3">For elixirs and physical products</p>
              </div>

              <Field
                label="Address line 1"
                value={form.postalAddress}
                onChange={(v) => update("postalAddress", v)}
                required
              />

              <Field
                label="Address line 2 (optional)"
                value={form.addressLine2}
                onChange={(v) => update("addressLine2", v)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Postal code"
                  value={form.postalCode}
                  onChange={(v) => update("postalCode", v)}
                  required
                />
                <Field
                  label="City"
                  value={form.city}
                  onChange={(v) => update("city", v)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-ui text-brun-chaud mb-1">
                  Country <span className="text-or-sacre">*</span>
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

              <div className="pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid()}
                  className="w-full py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — When were you born? */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="font-display text-xl text-brun-chaud">When were you born?</h2>
              </div>

              <div>
                <label className="block text-sm font-ui text-brun-chaud mb-1">
                  Date of birth <span className="text-or-sacre">*</span>
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
                  Time of birth
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
                    I don&apos;t know my time of birth
                  </span>
                </label>
              </div>

              <Field label="City of birth" value={form.birthPlace} onChange={(v) => update("birthPlace", v)} required />
              <Field label="Country of birth" value={form.birthCountry} onChange={(v) => update("birthCountry", v)} required />

              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(1)} className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider hover:text-brun-chaud transition-colors">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!isStep2Valid()}
                  className="flex-1 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Intention */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl text-brun-chaud">
                  What brings you here — right now?
                </h2>
                <p className="font-ui text-sm text-brun-mid mt-1">
                  No obligation. A few words are enough if you wish.
                </p>
              </div>
              <div>
                <textarea
                  value={form.intention}
                  onChange={(e) => update("intention", e.target.value)}
                  rows={6}
                  placeholder="No obligation. A few words are enough if you wish."
                  className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-none"
                />
                <p className="text-xs text-brun-mid/50 text-right mt-1">
                  {form.intention.trim().length} characters
                </p>
              </div>
              {error && <p className="text-sm text-red-600 font-ui">{error}</p>}
              <div className="flex gap-4 pt-4">
                <button onClick={() => setStep(2)} className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider hover:text-brun-chaud transition-colors">
                  Back
                </button>
                <button onClick={() => setStep(4)} disabled={submitting} className="flex-1 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Video */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl text-brun-chaud">Your starting point.</h2>
                <p className="font-ui text-sm text-brun-mid mt-1">60 seconds to set down where you are right now.</p>
              </div>
              <VideoRecorder seuil="1" onComplete={() => setStep(5)} />
              <button onClick={() => setStep(3)} className="w-full py-2 text-brun-mid font-ui text-xs uppercase tracking-wider hover:text-brun-chaud transition-colors">Back</button>
            </div>
          )}

          {/* Step 5 — Charter */}
          {step === 5 && (
            <CharteEngagement clientFirstName={form.firstName} clientName={form.firstName + " " + form.lastName} onComplete={handleSubmit} />
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
