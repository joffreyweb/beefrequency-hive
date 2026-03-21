"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Données du formulaire d'onboarding
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  postalAddress: string;
  city: string;
  postalCode: string;
  country: string;
  birthDate: string;
  birthTime: string;
  birthTimeUnknown: boolean;
  birthPlace: string;
  birthCountry: string;
  hdType: string;
  intention: string;
}

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  postalAddress: "",
  city: "",
  postalCode: "",
  country: "",
  birthDate: "",
  birthTime: "",
  birthTimeUnknown: false,
  birthPlace: "",
  birthCountry: "",
  hdType: "",
  intention: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = écran de bienvenue
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupère l'email de l'utilisateur connecté au montage
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.email) {
          setForm((prev) => ({ ...prev, email: data.user.email }));
        }
      })
      .catch(() => {});
  }, []);

  // Mise à jour générique d'un champ
  function update(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  // Validation par étape
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

  function isStep3Valid() {
    return true; // Intention optionnelle
  }

  // Soumission finale
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
          city: form.city.trim(),
          postalCode: form.postalCode.trim(),
          country: form.country.trim(),
          hdType: form.hdType || null,
          intention: form.intention.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
        return;
      }

      router.push("/client/home");
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-creme-sacree flex flex-col">
      {/* Écran de bienvenue */}
      {step === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-4xl sm:text-5xl text-brun-chaud mb-6">
            Bienvenue.
          </h1>
          <p className="font-ui text-sm sm:text-base text-brun-mid max-w-md leading-relaxed mb-8">
            Avant que nous commencions, j&apos;ai besoin de vous connaître un peu.
            Ces informations resteront confidentielles et me permettront de vous
            accompagner avec précision.
          </p>
          <p className="font-display text-sm text-brun-mid/70 italic mb-10">
            — Joffrey Deleplanque
          </p>
          <button
            onClick={() => setStep(1)}
            className="px-8 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors"
          >
            Commencer
          </button>
        </div>
      )}

      {/* Formulaire (étapes 1-3) */}
      {step >= 1 && (
        <>
      {/* Header avec logo */}
      <header className="flex flex-col items-center pt-8 pb-4">
        <h1 className="font-display text-2xl text-or-sacre">Hive</h1>
        <p className="font-caps text-xs tracking-widest text-brun-mid uppercase">
          BeeFrequency
        </p>
      </header>

      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {[1, 2, 3].map((s, i) => (
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
            {i < 2 && (
              <div
                className={`w-12 h-0.5 ${
                  s < step ? "bg-foret" : "bg-or-pale"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Contenu du formulaire */}
      <div className="flex-1 flex items-start justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Étape 1 — Identité */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Prénom"
                  value={form.firstName}
                  onChange={(v) => update("firstName", v)}
                  required
                />
                <Field
                  label="Nom"
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

              <Field
                label="Adresse postale"
                value={form.postalAddress}
                onChange={(v) => update("postalAddress", v)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Ville"
                  value={form.city}
                  onChange={(v) => update("city", v)}
                  required
                />
                <Field
                  label="Code postal"
                  value={form.postalCode}
                  onChange={(v) => update("postalCode", v)}
                  required
                />
              </div>

              <Field
                label="Pays"
                value={form.country}
                onChange={(v) => update("country", v)}
                required
              />

              <div className="pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid()}
                  className="w-full py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 — Naissance */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-ui text-brun-chaud mb-1">
                  Date de naissance <span className="text-or-sacre">*</span>
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
                  Heure de naissance
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
                    onChange={(e) =>
                      update("birthTimeUnknown", e.target.checked)
                    }
                    className="accent-or-sacre"
                  />
                  <span className="text-sm font-ui text-brun-mid">
                    Je ne connais pas mon heure de naissance
                  </span>
                </label>
              </div>

              <Field
                label="Ville de naissance"
                value={form.birthPlace}
                onChange={(v) => update("birthPlace", v)}
                required
              />

              <Field
                label="Pays de naissance"
                value={form.birthCountry}
                onChange={(v) => update("birthCountry", v)}
                required
              />

              {/* Type Human Design */}
              <div>
                <label className="block font-caps text-xs text-brun-chaud mb-1 uppercase tracking-wider">
                  Connaissez-vous votre type Human Design ?
                </label>
                <select
                  value={form.hdType}
                  onChange={(e) => update("hdType", e.target.value)}
                  className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors"
                >
                  <option value="">Je ne sais pas</option>
                  <option value="GENERATOR">Générateur</option>
                  <option value="MANIFESTING_GENERATOR">Générateur Manifestant</option>
                  <option value="MANIFESTOR">Manifesteur</option>
                  <option value="PROJECTOR">Projecteur</option>
                  <option value="REFLECTOR">Réflecteur</option>
                </select>
                <p className="text-xs text-brun-mid/60 mt-1">
                  Si vous ne connaissez pas votre type, Joffrey le déterminera pour vous.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider hover:text-brun-chaud transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!isStep2Valid()}
                  className="flex-1 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 — Intention */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-xl text-brun-chaud">
                  Qu&apos;est-ce qui vous amène ici ?
                </h2>
                <p className="font-ui text-sm text-brun-mid mt-1">
                  Pas d&apos;obligation. Quelques mots suffisent si vous le souhaitez.
                </p>
              </div>

              <div>
                <textarea
                  value={form.intention}
                  onChange={(e) => update("intention", e.target.value)}
                  rows={6}
                  placeholder="Pas d'obligation. Quelques mots suffisent si vous le souhaitez."
                  className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre transition-colors resize-none"
                />
                <p className="text-xs text-brun-mid/50 text-right mt-1">
                  {form.intention.trim().length} caractères
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 font-ui">{error}</p>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 text-brun-mid font-caps text-sm uppercase tracking-wider hover:text-brun-chaud transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Envoi en cours..." : "Envoyer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

// Composant champ de saisie réutilisable
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
