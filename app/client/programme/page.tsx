"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import BreathingPlayer from "@/components/client/BreathingPlayer";
import VideoPlayer from "@/components/client/VideoPlayer";
import {
  computeStockInfo,
  stockColor,
  stockTextColor,
  type StockInfo,
} from "@/lib/stock-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "pratiques" | "elixirs" | "protocoles" | "recommandations";

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: TabDef[] = [
  { key: "pratiques", label: "Pratiques" },
  { key: "elixirs", label: "\u00c9lixirs" },
  { key: "protocoles", label: "Protocoles" },
  { key: "recommandations", label: "Recommandations" },
];

// --- Pratiques ---

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

// --- Elixirs ---

interface Prescription {
  id: string;
  dosage: string | null;
  quantity: number | null;
  dailyDose: number | null;
  startDate: string;
  endDate: string | null;
  reorderUrl: string | null;
  stockAlertDays: number;
  notes: string | null;
  createdAt: string;
  elixir: {
    name: string;
    description: string;
    dosage: string;
    duration: string;
  };
}

// --- Protocoles ---

interface Protocol {
  id: string;
  title: string;
  description: string | null;
  frequency: string | null;
  duration: string | null;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  createdAt: string;
}

// --- Recommandations ---

interface Recommendation {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string | null;
  isGlobal: boolean;
}

interface ClientRecommendation {
  id: string;
  recommendationId: string;
  recommendation: Recommendation;
  note: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_BADGES: Record<string, { emoji: string; label: string }> = {
  BREATHING: { emoji: "\ud83e\udec1", label: "Respiration" },
  VIDEO: { emoji: "\ud83c\udfac", label: "Vid\u00e9o" },
  MEDITATION: { emoji: "\ud83e\uddd8", label: "M\u00e9ditation" },
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  COMPLETED: "Termin\u00e9",
  PAUSED: "En pause",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-foret/10 text-foret",
  COMPLETED: "bg-brun-mid/10 text-brun-mid",
  PAUSED: "bg-ambre-vif/10 text-ambre-vif",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProgrammePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("pratiques");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          Mon programme
        </h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          Pratiques, \u00e9lixirs, protocoles et recommandations
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-or-pale mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-ui transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "text-or-sacre border-b-2 border-or-sacre"
                : "text-brun-mid border-transparent hover:text-brun-chaud"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "pratiques" && <PratiquesTab />}
      {activeTab === "elixirs" && <ElixirsTab />}
      {activeTab === "protocoles" && <ProtocolesTab />}
      {activeTab === "recommandations" && <RecommandationsTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Pratiques
// ---------------------------------------------------------------------------

function PratiquesTab() {
  const [practices, setPractices] = useState<ClientPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePractice, setActivePractice] = useState<ClientPractice | null>(
    null
  );

  const loadPractices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/client-practices");
      if (!res.ok) throw new Error("Impossible de charger les pratiques");
      const data = await res.json();
      setPractices(data.clientPractices ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPractices();
  }, [loadPractices]);

  const handleComplete = useCallback(
    async (clientPracticeId: string) => {
      try {
        const res = await fetch(
          `/api/client-practices/${clientPracticeId}/complete`,
          { method: "POST" }
        );
        if (res.ok) await loadPractices();
      } catch {
        // Erreur silencieuse
      }
    },
    [loadPractices]
  );

  const handleClosePlayer = useCallback(() => {
    setActivePractice(null);
  }, []);

  if (loading) {
    return (
      <p className="text-sm font-ui text-brun-mid/60 py-8">
        Chargement de vos pratiques...
      </p>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <p className="text-sm font-ui text-brun-mid">{error}</p>
        <button
          onClick={loadPractices}
          className="px-4 py-2 bg-or-sacre text-white rounded-sharp font-ui text-sm hover:bg-ambre-vif transition-colors"
        >
          R\u00e9essayer
        </button>
      </div>
    );
  }

  const activePractices = practices.filter((cp) => cp.isActive);

  const sortedPractices = [...activePractices].sort((a, b) => {
    const aCompleted = isToday(a.lastCompletedAt);
    const bCompleted = isToday(b.lastCompletedAt);
    if (aCompleted && !bCompleted) return 1;
    if (!aCompleted && bCompleted) return -1;
    return 0;
  });

  return (
    <>
      {/* Players */}
      {activePractice &&
        (activePractice.practice.type === "BREATHING" ||
          activePractice.practice.type === "MEDITATION") && (
          <BreathingPlayer
            practice={activePractice.practice}
            onComplete={() => handleComplete(activePractice.id)}
            onClose={handleClosePlayer}
          />
        )}
      {activePractice && activePractice.practice.type === "VIDEO" && (
        <VideoPlayer
          practice={activePractice.practice}
          onComplete={() => handleComplete(activePractice.id)}
          onClose={handleClosePlayer}
        />
      )}

      {sortedPractices.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
          <p className="text-sm font-ui text-brun-mid/60">
            Aucune pratique assign\u00e9e pour le moment
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPractices.map((cp) => {
            const { practice, completedCount, lastCompletedAt } = cp;
            const badge = TYPE_BADGES[practice.type] ?? {
              emoji: "\ud83d\udccb",
              label: practice.type,
            };
            const completedToday = isToday(lastCompletedAt);

            return (
              <div
                key={cp.id}
                className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-caps text-xs text-or-sacre tracking-wider uppercase">
                    {badge.emoji} {badge.label}
                  </span>
                  {completedToday && (
                    <span className="text-foret font-ui text-sm font-semibold">
                      \u2713
                    </span>
                  )}
                </div>

                <h3 className="font-display text-lg text-brun-chaud leading-snug">
                  {practice.title}
                </h3>

                <p className="font-ui text-sm text-brun-mid line-clamp-2">
                  {practice.description}
                </p>

                <div className="font-ui text-xs text-brun-mid/70 flex items-center gap-2 flex-wrap">
                  <span>Compl\u00e9t\u00e9 {completedCount} fois</span>
                  {lastCompletedAt && (
                    <>
                      <span>\u00b7</span>
                      <span>Derni\u00e8re : {formatDate(lastCompletedAt)}</span>
                    </>
                  )}
                </div>

                {cp.note && (
                  <p className="font-ui text-xs text-or-sacre/80 italic border-l-2 border-or-pale pl-3">
                    {cp.note}
                  </p>
                )}

                <button
                  onClick={() => setActivePractice(cp)}
                  className="mt-auto px-4 py-2 bg-or-sacre text-white rounded-sharp font-ui text-sm hover:bg-ambre-vif transition-colors self-start"
                >
                  {completedToday ? "Recommencer" : "Commencer"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Elixirs
// ---------------------------------------------------------------------------

function ElixirsTab() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const loadPrescriptions = useCallback(async () => {
    try {
      const res = await fetch("/api/prescriptions");
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  async function handleOrder(prescription: Prescription) {
    setOrdering(prescription.id);
    setOrderSuccess(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Bonjour Joffrey, je souhaite commander \u00e0 nouveau l\u2019\u00e9lixir "${prescription.elixir.name}". Merci !`,
        }),
      });

      if (res.ok) {
        setOrderSuccess(prescription.id);
        setTimeout(() => setOrderSuccess(null), 3000);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setOrdering(null);
    }
  }

  function isActive(prescription: Prescription): boolean {
    if (!prescription.endDate) return true;
    return new Date(prescription.endDate) > new Date();
  }

  const stockMap = useMemo(() => {
    const map = new Map<string, StockInfo>();
    for (const rx of prescriptions) {
      map.set(
        rx.id,
        computeStockInfo({
          quantity: rx.quantity,
          dailyDose: rx.dailyDose,
          startDate: rx.startDate,
          endDate: rx.endDate,
          stockAlertDays: rx.stockAlertDays,
        })
      );
    }
    return map;
  }, [prescriptions]);

  if (loading) {
    return (
      <p className="text-sm font-ui text-brun-mid/60 py-8">
        Chargement de vos \u00e9lixirs...
      </p>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
        <p className="text-sm font-ui text-brun-mid/60">
          Aucun \u00e9lixir prescrit pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => {
        const active = isActive(prescription);
        const stockInfo = stockMap.get(prescription.id)!;

        return (
          <div
            key={prescription.id}
            className={`bg-cire-chaude border border-or-pale rounded-sm p-5 ${
              active ? "" : "opacity-70"
            }`}
          >
            {/* En-tete */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display text-lg text-brun-chaud">
                  {prescription.elixir.name}
                </h3>
                <p className="text-xs font-ui text-brun-mid/70 mt-0.5">
                  {prescription.elixir.description}
                </p>
              </div>
              <span
                className={`text-xs font-ui px-2 py-0.5 rounded-sharp shrink-0 ${
                  active
                    ? "bg-foret/10 text-foret"
                    : "bg-brun-mid/10 text-brun-mid"
                }`}
              >
                {active ? "Actif" : "Termin\u00e9"}
              </span>
            </div>

            {/* Barre de stock */}
            {stockInfo.percentRemaining !== null && (
              <div className="mb-3">
                <div className="h-3 bg-or-pale/30 rounded-full w-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${stockColor(stockInfo.percentRemaining)}`}
                    style={{
                      width: `${stockInfo.percentRemaining}%`,
                    }}
                  />
                </div>
                <p
                  className={`font-ui text-sm mt-1 ${stockTextColor(stockInfo.percentRemaining)}`}
                >
                  {stockInfo.daysRemaining} jour
                  {stockInfo.daysRemaining !== 1 ? "s" : ""} restant
                  {stockInfo.daysRemaining !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Alerte stock bas */}
            {stockInfo.isLow && active && (
              <div className="bg-red-50 border border-red-200 rounded-sharp p-3 mt-3 mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-red-600">
                  Il te reste {stockInfo.daysRemaining} jour
                  {stockInfo.daysRemaining !== 1 ? "s" : ""} \u2014 penser \u00e0
                  commander
                </p>
                {prescription.reorderUrl && (
                  <a
                    href={prescription.reorderUrl}
                    target="_blank"
                    rel="noopener"
                    className="shrink-0 px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
                  >
                    Commander
                  </a>
                )}
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                  Dosage
                </p>
                <p className="text-sm font-ui text-brun-chaud mt-0.5">
                  {prescription.dosage || prescription.elixir.dosage}
                </p>
              </div>
              <div>
                <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                  Quantit\u00e9
                </p>
                <p className="text-sm font-ui text-brun-chaud mt-0.5">
                  {prescription.quantity ?? "\u2014"}
                </p>
              </div>
              <div>
                <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                  Dose / jour
                </p>
                <p className="text-sm font-ui text-brun-chaud mt-0.5">
                  {prescription.dailyDose ?? "\u2014"}
                </p>
              </div>
              <div>
                <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                  D\u00e9but
                </p>
                <p className="text-sm font-ui text-brun-chaud mt-0.5">
                  {new Date(prescription.startDate).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                  Fin estim\u00e9e
                </p>
                <p className="text-sm font-ui text-brun-chaud mt-0.5">
                  {stockInfo.endDate
                    ? stockInfo.endDate.toLocaleDateString("fr-FR")
                    : "Non d\u00e9finie"}
                </p>
              </div>
            </div>

            {/* Notes */}
            {prescription.notes && (
              <p className="text-xs font-ui text-brun-mid/60 italic mb-3">
                {prescription.notes}
              </p>
            )}

            {/* Bouton commander */}
            <div className="flex items-center justify-end gap-2">
              {orderSuccess === prescription.id && (
                <span className="text-xs font-ui text-foret">
                  Message envoy\u00e9 !
                </span>
              )}
              {prescription.reorderUrl ? (
                <a
                  href={prescription.reorderUrl}
                  target="_blank"
                  rel="noopener"
                  className="px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
                >
                  Commander
                </a>
              ) : (
                <button
                  onClick={() => handleOrder(prescription)}
                  disabled={ordering === prescription.id}
                  className="px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
                >
                  {ordering === prescription.id ? "Envoi..." : "Commander"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Protocoles
// ---------------------------------------------------------------------------

function ProtocolesTab() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProtocols() {
      try {
        const res = await fetch("/api/protocols");
        if (res.ok) {
          const data = await res.json();
          setProtocols(data.protocols);
        }
      } catch {
        // Erreur silencieuse
      } finally {
        setLoading(false);
      }
    }
    loadProtocols();
  }, []);

  if (loading) {
    return (
      <p className="text-sm font-ui text-brun-mid/60 py-8">
        Chargement de vos protocoles...
      </p>
    );
  }

  if (protocols.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
        <p className="text-sm font-ui text-brun-mid/60">
          Aucun protocole pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {protocols.map((protocol) => (
        <div
          key={protocol.id}
          className="bg-cire-chaude border border-or-pale rounded-sm p-5"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-display text-lg text-brun-chaud">
              {protocol.title}
            </h3>
            <span
              className={`text-xs font-ui px-2 py-0.5 rounded-sharp shrink-0 ${
                STATUS_COLORS[protocol.status] ?? "bg-brun-mid/10 text-brun-mid"
              }`}
            >
              {STATUS_LABELS[protocol.status] ?? protocol.status}
            </span>
          </div>

          {protocol.description && (
            <p className="font-ui text-sm text-brun-mid mb-3">
              {protocol.description}
            </p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            {protocol.frequency && (
              <div>
                <span className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                  Fr\u00e9quence
                </span>
                <p className="text-sm font-ui text-brun-chaud">
                  {protocol.frequency}
                </p>
              </div>
            )}
            {protocol.duration && (
              <div>
                <span className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                  Dur\u00e9e
                </span>
                <p className="text-sm font-ui text-brun-chaud">
                  {protocol.duration}
                </p>
              </div>
            )}
            <div>
              <span className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                Cr\u00e9\u00e9 le
              </span>
              <p className="text-sm font-ui text-brun-chaud">
                {formatDate(protocol.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Recommandations
// ---------------------------------------------------------------------------

function RecommandationsTab() {
  const [personal, setPersonal] = useState<ClientRecommendation[]>([]);
  const [global, setGlobal] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      try {
        const res = await fetch("/api/recommendations/client");
        if (res.ok) {
          const data = await res.json();
          setPersonal(data.personal ?? []);
          setGlobal(data.global ?? []);
        }
      } catch {
        // Erreur silencieuse
      } finally {
        setLoading(false);
      }
    }
    loadRecommendations();
  }, []);

  if (loading) {
    return (
      <p className="text-sm font-ui text-brun-mid/60 py-8">
        Chargement des recommandations...
      </p>
    );
  }

  if (personal.length === 0 && global.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
        <p className="text-sm font-ui text-brun-mid/60">
          Aucune recommandation pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section personnelle */}
      {personal.length > 0 && (
        <section>
          <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-4">
            S\u00e9lectionn\u00e9es pour vous
          </h3>
          <div className="space-y-3">
            {personal.map((cr) => (
              <RecommendationCard
                key={cr.id}
                recommendation={cr.recommendation}
                note={cr.note}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section globale */}
      {global.length > 0 && (
        <section>
          <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-4">
            Catalogue g\u00e9n\u00e9ral
          </h3>
          <div className="space-y-3">
            {global.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  note,
}: {
  recommendation: Recommendation;
  note?: string | null;
}) {
  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-caps text-or-sacre uppercase tracking-wider">
              {recommendation.category}
            </span>
          </div>
          <h4 className="font-display text-base text-brun-chaud mb-1">
            {recommendation.title}
          </h4>
          {recommendation.description && (
            <p className="font-ui text-sm text-brun-mid line-clamp-2">
              {recommendation.description}
            </p>
          )}
          {note && (
            <p className="font-ui text-xs text-or-sacre/80 italic mt-2 border-l-2 border-or-pale pl-3">
              {note}
            </p>
          )}
        </div>

        {recommendation.url && (
          <a
            href={recommendation.url}
            target="_blank"
            rel="noopener"
            className="shrink-0 text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors"
          >
            D\u00e9couvrir \u2192
          </a>
        )}
      </div>
    </div>
  );
}
