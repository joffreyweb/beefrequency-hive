"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

type TabKey = "supports" | "recommendations";

interface Support {
  id: string;
  title: string;
  type: string;
  url: string;
  description: string | null;
}

interface Recommendation {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  category: string;
}

interface ClientRecommendation {
  id: string;
  note: string | null;
  recommendation: Recommendation;
}

const SUPPORT_ICONS: Record<string, string> = {
  MUSIC: "\uD83C\uDFB5",
  VIDEO: "\uD83C\uDFAC",
  PDF: "\uD83D\uDCC4",
  LINK: "\uD83D\uDD17",
};

export default function FromJoffreyPage() {
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const SUPPORT_LABELS: Record<string, string> = {
    MUSIC: lang === "FR" ? "Musique" : "Music",
    VIDEO: lang === "FR" ? "Vid\u00e9o" : "Video",
    PDF: "PDF",
    LINK: lang === "FR" ? "Lien" : "Link",
  };

  const CATEGORY_LABELS: Record<string, string> = {
    EAU: T(t.fromJoffrey.categoryWater),
    COMPLEMENTS: T(t.fromJoffrey.categorySupplements),
    OUTILS: T(t.fromJoffrey.categoryTools),
    SOINS: T(t.fromJoffrey.categoryCare),
    APITHERAPIE: T(t.fromJoffrey.categoryApitherapy),
    AUTRE: T(t.fromJoffrey.categoryOther),
  };

  const [activeTab, setActiveTab] = useState<TabKey>("supports");
  const [supports, setSupports] = useState<Support[]>([]);
  const [personalRecos, setPersonalRecos] = useState<ClientRecommendation[]>([]);
  const [globalRecos, setGlobalRecos] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [supportsRes, recosRes] = await Promise.all([
        fetch("/api/supports"),
        fetch("/api/recommendations/client"),
      ]);

      if (supportsRes.ok) {
        const data = await supportsRes.json();
        setSupports(data.supports ?? data);
      }
      if (recosRes.ok) {
        const data = await recosRes.json();
        setPersonalRecos(data.personal ?? []);
        setGlobalRecos(data.global ?? []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "supports", label: T(t.fromJoffrey.resources) },
    { key: "recommendations", label: T(t.fromJoffrey.recommendations) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-brun-chaud">{T(t.fromJoffrey.title)}</h1>

      <div className="flex gap-1 bg-cire-chaude rounded-full p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-full text-xs font-ui uppercase tracking-wider transition-all duration-150 ${
              activeTab === tab.key
                ? "bg-or-sacre text-white"
                : "text-brun-mid hover:text-brun-chaud"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm font-ui text-brun-mid/60">{T(t.common.loading)}</p>
        </div>
      ) : (
        <>
          {activeTab === "supports" && (
            <div>
              {supports.length === 0 ? (
                <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
                  <p className="text-sm font-ui text-brun-mid/60">{T(t.fromJoffrey.noResources)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {supports.map((support) => (
                    <div key={support.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl leading-none" aria-hidden="true">
                          {SUPPORT_ICONS[support.type] || "\uD83D\uDD17"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-ui text-brun-chaud font-normal truncate">{support.title}</h3>
                          <p className="text-xs font-ui text-brun-mid/60 mt-0.5">{SUPPORT_LABELS[support.type] || support.type}</p>
                        </div>
                      </div>
                      {support.description && (
                        <p className="text-sm font-ui text-brun-mid/70 mb-4 flex-1">{support.description}</p>
                      )}
                      <a
                        href={support.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center gap-1.5 px-3 py-2 bg-or-sacre text-creme-sacree rounded-sharp text-sm font-ui hover:bg-ambre-vif transition-colors text-center justify-center"
                      >
                        {T(t.fromJoffrey.access)}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "recommendations" && (
            <div className="space-y-8">
              {personalRecos.length > 0 && (
                <section className="space-y-4">
                  <h2 className="font-display text-lg text-brun-chaud">{T(t.fromJoffrey.selectedForYou)}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {personalRecos.map((cr) => {
                      const reco = cr.recommendation;
                      return (
                        <div key={cr.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col">
                          <span className="inline-block self-start text-xs font-caps uppercase tracking-wider px-2 py-0.5 rounded-sharp mb-3 bg-or-sacre/10 text-or-sacre">
                            {CATEGORY_LABELS[reco.category] || reco.category}
                          </span>
                          <h3 className="font-display text-lg text-brun-chaud mb-2">{reco.title}</h3>
                          {cr.note && <p className="italic text-sm text-brun-mid mb-2">{cr.note}</p>}
                          {reco.description && <p className="font-ui text-sm text-brun-mid mb-4 flex-1">{reco.description}</p>}
                          {reco.url && (
                            <a href={reco.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 text-sm text-or-sacre hover:text-ambre-vif transition-colors font-ui">
                              {T(t.fromJoffrey.discover)} &rarr;
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {globalRecos.length > 0 && (
                <section className="space-y-4">
                  <h2 className="font-display text-lg text-brun-chaud">{T(t.fromJoffrey.generalCatalogue)}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {globalRecos.map((reco) => (
                      <div key={reco.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col">
                        <span className="inline-block self-start text-xs font-caps uppercase tracking-wider px-2 py-0.5 rounded-sharp mb-3 bg-or-sacre/10 text-or-sacre">
                          {CATEGORY_LABELS[reco.category] || reco.category}
                        </span>
                        <h3 className="font-display text-lg text-brun-chaud mb-2">{reco.title}</h3>
                        {reco.description && <p className="font-ui text-sm text-brun-mid mb-4 flex-1">{reco.description}</p>}
                        {reco.url && (
                          <a href={reco.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 text-sm text-or-sacre hover:text-ambre-vif transition-colors font-ui">
                            {T(t.fromJoffrey.discover)} &rarr;
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {personalRecos.length === 0 && globalRecos.length === 0 && (
                <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
                  <p className="text-sm font-ui text-brun-mid/60">{T(t.fromJoffrey.noRecommendations)}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
