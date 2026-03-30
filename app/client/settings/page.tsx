"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import type { Lang } from "@/lib/translations";
import MySessionsSection from "@/components/client/MySessionsSection";

export default function ClientSettingsPage() {
  const { lang, setLang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [selectedLang, setSelectedLang] = useState<Lang>(lang);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setLang(selectedLang);
    // Small delay to show feedback
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 500);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-brun-chaud">
        {T(t.settings.title)}
      </h1>

      {/* Language toggle */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
          {T(t.settings.changeLanguage)}
        </h2>

        <div className="flex gap-3">
          <button
            onClick={() => setSelectedLang("EN")}
            className={`flex-1 py-3 rounded-lg border-2 transition-all duration-200 ${
              selectedLang === "EN"
                ? "bg-or-sacre border-or-sacre text-white"
                : "bg-creme-sacree border-or-pale text-brun-chaud hover:border-or-sacre/50"
            }`}
          >
            <span className="font-ui text-sm">EN</span>
            <span className="font-ui text-[10px] block mt-0.5 opacity-70">English</span>
          </button>
          <button
            onClick={() => setSelectedLang("FR")}
            className={`flex-1 py-3 rounded-lg border-2 transition-all duration-200 ${
              selectedLang === "FR"
                ? "bg-or-sacre border-or-sacre text-white"
                : "bg-creme-sacree border-or-pale text-brun-chaud hover:border-or-sacre/50"
            }`}
          >
            <span className="font-ui text-sm">FR</span>
            <span className="font-ui text-[10px] block mt-0.5 opacity-70">Fran&ccedil;ais</span>
          </button>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || selectedLang === lang}
        className="w-full py-3 bg-or-sacre text-white rounded-sharp font-ui text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
      >
        {saving ? T(t.settings.saving) : T(t.settings.save)}
      </button>

      {saved && (
        <p className="text-center text-sm text-foret font-ui">
          {lang === "FR" ? "Enregistr\u00e9 !" : "Saved!"}
        </p>
      )}

      {/* Mes seances */}
      <MySessionsSection lang={lang} />
    </div>
  );
}
