"use client";

import { useState, useEffect, useCallback } from "react";
import BreathingPlayer from "@/components/client/BreathingPlayer";
import VideoPlayer from "@/components/client/VideoPlayer";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

type TabKey = "practices" | "supports" | "recommendations";

interface Practice {
  id: string;
  title: string;
  description: string;
  type: "BREATHING" | "VIDEO" | "MEDITATION";
  content: string;
  category: string;
  dayTrigger: number | null;
}

interface ClientPractice {
  id: string;
  practiceId: string;
  practice: Practice;
  assignedAt: string;
  completedCount: number;
  lastCompletedAt: string | null;
  isActive: boolean;
  note: string | null;
}

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

const TYPE_BADGES: Record<string, { emoji: string; label: string }> = {
  BREATHING: { emoji: "\uD83E\uDEC1", label: "Breathing" },
  VIDEO: { emoji: "\uD83C\uDFAC", label: "Video" },
  MEDITATION: { emoji: "\uD83E\uDDD8", label: "Meditation" },
};

const SUPPORT_ICONS: Record<string, string> = {
  MUSIC: "\uD83C\uDFB5",
  VIDEO: "\uD83C\uDFAC",
  PDF: "\uD83D\uDCC4",
  LINK: "\uD83D\uDD17",
};

const SUPPORT_LABELS: Record<string, string> = {
  MUSIC: "Music",
  VIDEO: "Video",
  PDF: "PDF",
  LINK: "Link",
};

const CATEGORY_LABELS: Record<string, string> = {
  EAU: "Water",
  COMPLEMENTS: "Supplements",
  OUTILS: "Tools",
  SOINS: "Care",
  APITHERAPIE: "Apitherapy",
  AUTRE: "Other",
};

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function MesModulesPage() {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
  const [activeTab, setActiveTab] = useState<TabKey>("practices");
  const [practices, setPractices] = useState<ClientPractice[]>([]);
  const [supports, setSupports] = useState<Support[]>([]);
  const [personalRecos, setPersonalRecos] = useState<ClientRecommendation[]>([]);
  const [globalRecos, setGlobalRecos] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePractice, setActivePractice] = useState<ClientPractice | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [practicesRes, supportsRes, recosRes] = await Promise.all([
        fetch("/api/client-practices"),
        fetch("/api/supports"),
        fetch("/api/recommendations/client"),
      ]);

      if (practicesRes.ok) {
        const data = await practicesRes.json();
        setPractices(data.clientPractices ?? data);
      }
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

  const handleComplete = useCallback(
    async (clientPracticeId: string) => {
      try {
        const res = await fetch(
          `/api/client-practices/${clientPracticeId}/complete`,
          { method: "POST" }
        );
        if (res.ok) await loadData();
      } catch {
        // Silent
      }
    },
    [loadData]
  );

  const tabs: { key: TabKey; label: string }[] = [
    { key: "practices", label: "Practices" },
    { key: "supports", label: "From Joffrey" },
    { key: "recommendations", label: "Recommendations" },
  ];

  const activePractices = practices.filter((cp) => cp.isActive);

  return (
    <>
      {/* Players */}
      {activePractice && (activePractice.practice.type === "BREATHING" || activePractice.practice.type === "MEDITATION") && (
        <BreathingPlayer
          practice={activePractice.practice}
          onComplete={() => handleComplete(activePractice.id)}
          onClose={() => setActivePractice(null)}
        />
      )}
      {activePractice && activePractice.practice.type === "VIDEO" && (
        <VideoPlayer
          practice={activePractice.practice}
          onComplete={() => handleComplete(activePractice.id)}
          onClose={() => setActivePractice(null)}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl text-brun-chaud">Mes Modules</h1>
          <p className="font-ui text-sm text-brun-mid mt-1">{T(t.modules.subtitle)}</p>
        </div>

        {/* Placeholder bibliothèque modules — remplacé par la UI cartes en V3b */}
        <div className="bg-cire-chaude/60 border border-dashed border-or-pale rounded-sm p-5 text-center">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-1">Modules</p>
          <p className="font-ui text-sm text-brun-mid/70">
            La bibliothèque arrivera bientôt.
          </p>
        </div>

        {/* Tab bar — line style */}
        <div className="flex border-b border-or-pale">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 pb-3 text-sm font-ui transition-colors ${
                activeTab === tab.key
                  ? "text-brun-chaud font-normal border-b-2 border-or-sacre"
                  : "text-brun-mid font-light hover:text-brun-chaud"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm font-ui text-brun-mid/60">Loading...</p>
          </div>
        ) : (
          <>
            {/* Practices tab */}
            {activeTab === "practices" && (
              <div className="space-y-10">
                {/* Assigned practices */}
                <section>
                  <h2 className="font-display text-lg text-brun-chaud mb-4">{T(t.modules.today)}</h2>
                  {activePractices.length === 0 ? (
                    <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
                      <p className="text-sm font-ui text-brun-mid/60">{T(t.modules.noPracticesAssigned)}</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {activePractices
                        .sort((a, b) => {
                          const aD = isToday(a.lastCompletedAt);
                          const bD = isToday(b.lastCompletedAt);
                          if (aD && !bD) return 1;
                          if (!aD && bD) return -1;
                          return 0;
                        })
                        .map((cp) => {
                          const badge = TYPE_BADGES[cp.practice.type] ?? { emoji: "", label: cp.practice.type };
                          const completedToday = isToday(cp.lastCompletedAt);
                          return (
                            <div key={cp.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="font-caps text-xs text-or-sacre tracking-wider uppercase">
                                  {badge.emoji} {badge.label}
                                </span>
                                {completedToday && (
                                  <span className="text-foret font-ui text-sm font-semibold">✓</span>
                                )}
                              </div>
                              <h3 className="font-display text-lg text-brun-chaud leading-snug">{cp.practice.title}</h3>
                              <p className="font-ui text-sm text-brun-mid line-clamp-2">{cp.practice.description}</p>
                              <div className="font-ui text-xs text-brun-mid/70">
                                Completed {cp.completedCount} time{cp.completedCount !== 1 ? "s" : ""}
                              </div>
                              {cp.note && (
                                <p className="font-ui text-xs text-or-sacre/80 italic border-l-2 border-or-pale pl-3">{cp.note}</p>
                              )}
                              <button
                                onClick={() => setActivePractice(cp)}
                                className="mt-auto px-4 py-2 bg-or-sacre text-white rounded-sharp font-ui text-sm hover:opacity-90 transition-opacity self-start"
                              >
                                {completedToday ? "Redo" : "Start"}
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </section>

                {/* Library */}
                <LibrarySection />
              </div>
            )}

            {/* From Joffrey tab (supports) */}
            {activeTab === "supports" && (
              <div>
                {supports.length === 0 ? (
                  <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
                    <p className="text-sm font-ui text-brun-mid/60">No resources shared yet.</p>
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
                          Access
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* From Joffrey tab */}
            {activeTab === "recommendations" && (
              <div className="space-y-8">
                {personalRecos.length > 0 && (
                  <section className="space-y-4">
                    <h2 className="font-display text-lg text-brun-chaud">Selected for you</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {personalRecos.map((cr) => {
                        const reco = cr.recommendation;
                        return (
                          <div key={cr.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col">
                            <span className="inline-block self-start text-xs font-caps uppercase tracking-wider px-2 py-0.5 rounded-sharp mb-3 bg-or-sacre/10 text-or-sacre">
                              {CATEGORY_LABELS[reco.category] || reco.category}
                            </span>
                            <h3 className="font-display text-lg text-brun-chaud mb-2">{reco.title}</h3>
                            {cr.note && (
                              <p className="italic text-sm text-brun-mid mb-2">{cr.note}</p>
                            )}
                            {reco.description && (
                              <p className="font-ui text-sm text-brun-mid mb-4 flex-1">{reco.description}</p>
                            )}
                            {reco.url && (
                              <a
                                href={reco.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto inline-flex items-center gap-1 text-sm text-or-sacre hover:text-ambre-vif transition-colors font-ui"
                              >
                                Discover &rarr;
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
                    <h2 className="font-display text-lg text-brun-chaud">General catalogue</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {globalRecos.map((reco) => (
                        <div key={reco.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col">
                          <span className="inline-block self-start text-xs font-caps uppercase tracking-wider px-2 py-0.5 rounded-sharp mb-3 bg-or-sacre/10 text-or-sacre">
                            {CATEGORY_LABELS[reco.category] || reco.category}
                          </span>
                          <h3 className="font-display text-lg text-brun-chaud mb-2">{reco.title}</h3>
                          {reco.description && (
                            <p className="font-ui text-sm text-brun-mid mb-4 flex-1">{reco.description}</p>
                          )}
                          {reco.url && (
                            <a
                              href={reco.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-auto inline-flex items-center gap-1 text-sm text-or-sacre hover:text-ambre-vif transition-colors font-ui"
                            >
                              Discover &rarr;
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {personalRecos.length === 0 && globalRecos.length === 0 && (
                  <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
                    <p className="text-sm font-ui text-brun-mid/60">No recommendations yet.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ─── Library section (practice categories) ─── */

const LIBRARY_CATEGORIES = [
  { key: "RESPIRATION", emoji: "\uD83E\uDEC1", label: "Breathwork" },
  { key: "SOMMEIL", emoji: "\uD83D\uDE34", label: "Sleep" },
  { key: "MOUVEMENT", emoji: "\uD83C\uDF2A\uFE0F", label: "Anxiety" },
  { key: "RITUAL", emoji: "\uD83D\uDE2E\u200D\uD83D\uDCA8", label: "Stress" },
  { key: "MEDITATION", emoji: "\uD83C\uDF3F", label: "Reset" },
];

interface LibPractice {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
}

function LibrarySection() {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [libPractices, setLibPractices] = useState<LibPractice[]>([]);
  const [libLoading, setLibLoading] = useState(false);

  async function openCategory(cat: string) {
    if (selectedCat === cat) {
      setSelectedCat(null);
      return;
    }
    setSelectedCat(cat);
    setLibLoading(true);
    try {
      const res = await fetch(`/api/practices?category=${cat}`);
      if (res.ok) {
        const data = await res.json();
        setLibPractices(data.practices ?? []);
      }
    } catch {
      setLibPractices([]);
    } finally {
      setLibLoading(false);
    }
  }

  return (
    <section>
      <h2 className="font-display text-lg text-brun-chaud mb-4">{T(t.modules.library)}</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {LIBRARY_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => openCategory(cat.key)}
            className={`flex items-center gap-2 p-4 rounded-sm border transition-colors text-left ${
              selectedCat === cat.key
                ? "bg-or-sacre/10 border-or-sacre"
                : "bg-cire-chaude border-or-pale hover:border-or-sacre/50"
            }`}
          >
            <span className="text-xl">{cat.emoji}</span>
            <span className="font-ui text-sm text-brun-chaud">{cat.label}</span>
          </button>
        ))}
      </div>
      {selectedCat && (
        <div className="mt-2">
          {libLoading ? (
            <p className="text-sm font-ui text-brun-mid/60 text-center py-4">Loading...</p>
          ) : libPractices.length === 0 ? (
            <p className="text-sm font-ui text-brun-mid/60 text-center py-4">Nothing here yet.</p>
          ) : (
            <div className="space-y-3">
              {libPractices.map((p) => (
                <div key={p.id} className="bg-cire-chaude border border-or-pale rounded-sm p-4">
                  <p className="font-display text-base text-brun-chaud">{p.title}</p>
                  <p className="font-ui text-sm text-brun-mid mt-1">{p.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
