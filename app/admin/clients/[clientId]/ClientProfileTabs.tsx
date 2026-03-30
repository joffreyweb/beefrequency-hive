"use client";

import { useState } from "react";
import ClientNotes from "@/components/admin/ClientNotes";
import SupportSection from "@/components/admin/SupportSection";
import RecommendationSection from "@/components/admin/RecommendationSection";
import DailyFocusSection from "@/components/admin/DailyFocusSection";
import ClientRecommendationsSection from "@/components/admin/ClientRecommendationsSection";
import { computeStockInfo, stockColor, stockTextColor } from "@/lib/stock-utils";
import DocumentsSection from "@/components/admin/DocumentsSection";
import AnalysisSection from "@/components/admin/AnalysisSection";
import HdTypeSelector from "@/components/admin/HdTypeSelector";
import TimezoneSelector from "@/components/admin/TimezoneSelector";
import JourneyMessagesLog from "@/components/admin/JourneyMessagesLog";
import ClientPracticesSection from "@/components/admin/ClientPracticesSection";
import ParcoursSection from "@/components/admin/ParcoursSection";

// Labels lisibles pour les offres
const OFFER_LABELS: Record<string, string> = {
  HIVE_EXPERIENCE: "Hive Experience",
  THE_PASSAGE: "The Passage",
  SOUVERAINETE: "Souverainete",
};

// Labels lisibles pour les types HD
const HD_TYPE_LABELS: Record<string, string> = {
  GENERATOR: "Generateur",
  MANIFESTING_GENERATOR: "Generateur Manifestant",
  MANIFESTOR: "Manifesteur",
  PROJECTOR: "Projecteur",
  REFLECTOR: "Reflecteur",
};

// Types des onglets
type TabKey =
  | "overview"
  | "journal"
  | "program"
  | "parcours"
  | "sessions"
  | "analysis"
  | "documents"
  | "messages"
  | "recommendations"
  | "cartes";

// Sous-onglets du programme
type ProgramSubTab = "elixirs" | "protocols" | "practices";

interface ClientProfileTabsProps {
  client: any;
  messages: any[];
  unreadDocCount: number;
  dayNumber: number;
  recentCheckins?: any[];
  nextSession?: any;
}

export default function ClientProfileTabs({
  client,
  messages,
  unreadDocCount,
  dayNumber,
  recentCheckins = [],
  nextSession,
}: ClientProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [programSubTab, setProgramSubTab] = useState<ProgramSubTab>("elixirs");

  // Nombre de messages non lus (recus par l'admin, non lus)
  const unreadMsgCount = messages.filter(
    (m) => !m.readAt && m.receiverId !== client.userId
  ).length;

  // Definition des onglets avec badges
  const tabs: { key: TabKey; label: string; badge: number }[] = [
    { key: "overview", label: "Vue generale", badge: 0 },
    { key: "journal", label: "Journal", badge: 0 },
    { key: "program", label: "Programme", badge: 0 },
    { key: "parcours", label: "Parcours", badge: 0 },
    { key: "sessions", label: "Sessions", badge: 0 },
    { key: "analysis", label: "Analyse", badge: 0 },
    { key: "documents", label: "Documents", badge: unreadDocCount },
    { key: "messages", label: "Messages", badge: unreadMsgCount },
    { key: "recommendations", label: "Recommandations", badge: 0 },
    { key: "cartes", label: "Cartes", badge: client.cartesGeneratedAt ? 0 : -1 },
  ];

  return (
    <div>
      {/* Barre d'onglets */}
      <div className="mb-6" style={{ borderBottom: "0.5px solid #E8D5A8" }}>
        <div className="flex gap-1 bg-cire-chaude rounded-full p-1 inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-ui uppercase tracking-[0.06em] transition-all duration-150 ${
                activeTab === tab.key
                  ? "bg-or-sacre text-white"
                  : "text-brun-mid hover:text-brun-chaud"
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-1.5 bg-white/25 text-[9px] px-1 rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "overview" && (
        <OverviewTab client={client} dayNumber={dayNumber} recentCheckins={recentCheckins} nextSession={nextSession} />
      )}
      {activeTab === "journal" && <JournalTab client={client} />}
      {activeTab === "program" && (
        <ProgramTab
          client={client}
          subTab={programSubTab}
          setSubTab={setProgramSubTab}
        />
      )}
      {activeTab === "parcours" && <ParcoursTab client={client} />}
      {activeTab === "sessions" && <SessionsTab client={client} />}
      {activeTab === "analysis" && <AnalysisTab client={client} />}
      {activeTab === "documents" && (
        <DocumentsTab client={client} unreadDocCount={unreadDocCount} />
      )}
      {activeTab === "messages" && (
        <MessagesTab client={client} messages={messages} />
      )}
      {activeTab === "recommendations" && (
        <RecommendationsTab client={client} />
      )}
      {activeTab === "cartes" && (
        <CartesTab client={client} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 1 — Vue generale
   ───────────────────────────────────────────── */
function OverviewTab({ client, dayNumber, recentCheckins = [], nextSession }: { client: any; dayNumber: number; recentCheckins?: any[]; nextSession?: any }) {
  // Prescriptions avec stock critique
  const criticalPrescriptions = client.elixirPrescriptions.filter((rx: any) => {
    const stock = computeStockInfo(rx);
    return stock.isLow;
  });

  // Badge prochain RDV — dans moins de 48h ?
  const nextSessionDate = nextSession ? new Date(nextSession.scheduledAt) : null;
  const hoursUntilSession = nextSessionDate
    ? (nextSessionDate.getTime() - Date.now()) / (1000 * 60 * 60)
    : null;
  const sessionUrgent = hoursUntilSession !== null && hoursUntilSession <= 48;

  return (
    <div className="grid grid-cols-[1.2fr_1fr] gap-6">
      {/* Colonne gauche — Infos client + Notes */}
      <div className="space-y-6">
        {/* Prochain RDV — en évidence */}
        <div className={`border rounded-[10px] p-5 ${sessionUrgent ? "bg-or-sacre/10 border-or-sacre" : "bg-cire-chaude border-or-pale"}`}>
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
            Prochain RDV
          </h2>
          {nextSession ? (
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-ui text-brun-chaud font-medium">
                  {new Date(nextSession.scheduledAt).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  {" · "}
                  {new Date(nextSession.scheduledAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
                  {nextSession.type === "ONLINE" ? "En ligne" : nextSession.type === "PRESENTIAL" ? "Presentiel" : "Ceremonie"}
                  {" · "}{nextSession.duration} min
                </p>
              </div>
              {sessionUrgent && (
                <span className="px-2 py-0.5 rounded-full bg-or-sacre text-white text-xs font-ui">
                  {hoursUntilSession! < 1 ? "Imminent" : `Dans ${Math.round(hoursUntilSession!)}h`}
                </span>
              )}
              {nextSession.zoomLink && (
                <a href={nextSession.zoomLink} target="_blank" rel="noopener noreferrer" className="text-xs font-ui text-or-sacre hover:text-ambre-vif underline ml-auto">
                  Zoom
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-brun-mid/60 font-ui">Aucun RDV planifie</p>
          )}
        </div>

        {/* Infos client */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
            Informations
          </h2>
          <div className="space-y-3">
            {/* Dernière connexion */}
            <div>
              <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-0.5">
                Derniere connexion
              </p>
              <p className="text-sm font-ui text-brun-chaud">
                {client.user.lastLoginAt
                  ? new Date(client.user.lastLoginAt).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    }) + " · " + new Date(client.user.lastLoginAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Jamais connecte"}
              </p>
            </div>
            <div>
              <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-0.5">
                Offre
              </p>
              <p className="text-sm font-ui text-brun-chaud">
                {OFFER_LABELS[client.offerType]}
              </p>
            </div>
            <div>
              <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-0.5">
                Date de debut
              </p>
              <p className="text-sm font-ui text-brun-chaud">
                {new Date(client.startDate).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-0.5">
                Langue
              </p>
              <LanguageSelector clientId={client.id} currentLanguage={client.language} />
            </div>
            {/* Delivery address */}
            {client.intake?.postalAddress && (
              <div>
                <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-0.5">
                  Delivery address
                </p>
                <div className="text-sm font-ui text-brun-chaud space-y-0.5">
                  <p>{client.intake.postalAddress}</p>
                  {client.intake.addressLine2 && <p>{client.intake.addressLine2}</p>}
                  <p>{client.intake.postalCode} {client.intake.city}</p>
                  <p>{client.intake.country}</p>
                </div>
              </div>
            )}
            <div>
              <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-0.5">
                Type Human Design
              </p>
              <HdTypeSelector
                clientId={client.id}
                currentHdType={client.hdType ?? null}
              />
              <p className="text-xs font-ui text-brun-mid/60 mt-4 mb-1">Fuseau horaire</p>
              <TimezoneSelector
                clientId={client.id}
                currentTimezone={client.timezone ?? null}
              />
            </div>
          </div>
        </div>

        {/* Notes internes */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
            Notes internes
          </h2>
          <ClientNotes clientId={client.id} initialNotes={client.notes || ""} />
        </div>
      </div>

      {/* Colonne droite — Check-ins + Alertes stock */}
      <div className="space-y-6">
        {/* Derniers check-ins */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
            Derniers check-ins
          </h2>
          {recentCheckins.length === 0 ? (
            <p className="text-sm text-brun-mid/60 font-ui text-center py-4">
              Aucun check-in enregistre.
            </p>
          ) : (
            <div className="space-y-2">
              {recentCheckins.map((ci: any) => {
                const hasMorning = ci.energyLevel != null;
                const hasEvening = ci.gratitudeMoment != null;
                return (
                  <div key={ci.id} className="flex items-center justify-between p-2.5 border border-or-pale/30 rounded-lg">
                    <div>
                      <p className="text-sm font-ui text-brun-chaud">
                        {new Date(ci.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        <span className={`text-xs font-ui ${hasMorning ? "text-foret" : "text-brun-mid/30"}`}>
                          {hasMorning ? "\u2600\uFE0F Matin" : "\u2600\uFE0F --"}
                        </span>
                        <span className={`text-xs font-ui ${hasEvening ? "text-foret" : "text-brun-mid/30"}`}>
                          {hasEvening ? "\uD83C\uDF19 Soir" : "\uD83C\uDF19 --"}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs font-ui px-2 py-0.5 rounded-full ${ci.elixirTaken ? "bg-foret/10 text-foret" : "bg-brun-mid/10 text-brun-mid/50"}`}>
                      {ci.elixirTaken ? "Elixirs pris" : "Elixirs non"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alertes stock */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
            Alertes stock
          </h2>
          {criticalPrescriptions.length === 0 ? (
            <p className="text-sm text-brun-mid/60 font-ui text-center py-4">
              Aucune alerte de stock.
            </p>
          ) : (
            <div className="space-y-3">
              {criticalPrescriptions.map((rx: any) => {
                const stock = computeStockInfo(rx);
                return (
                  <div
                    key={rx.id}
                    className="flex items-center justify-between p-3 border border-or-pale/50 rounded-[10px]"
                  >
                    <div>
                      <p className="text-sm font-ui text-brun-chaud">
                        {rx.elixir.name}
                      </p>
                      <p
                        className={`text-xs font-ui mt-0.5 ${stockTextColor(stock.percentRemaining ?? 0)}`}
                      >
                        {stock.daysRemaining} jours restants
                      </p>
                    </div>
                    <div className="w-20">
                      <div className="h-2 bg-or-pale/30 rounded-full">
                        <div
                          className={`h-full rounded-full ${stockColor(stock.percentRemaining ?? 0)}`}
                          style={{
                            width: `${stock.percentRemaining ?? 0}%`,
                          }}
                        />
                      </div>
                    </div>
                    {rx.reorderUrl && (
                      <a
                        href={rx.reorderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-ui text-or-sacre hover:text-ambre-vif underline ml-3"
                      >
                        Commander
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 2 — Journal
   ───────────────────────────────────────────── */
function JournalTab({ client }: { client: any }) {
  if (client.journalEntries.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
        <p className="text-sm text-brun-mid/60 font-ui">
          Aucune entree de journal visible.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
        Journal ({client.journalEntries.length} entrees)
      </h2>
      <div className="space-y-3">
        {client.journalEntries.map((entry: any) => (
          <div
            key={entry.id}
            className="bg-cire-chaude border border-or-pale rounded-[10px] p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-ui text-brun-mid/60">
                {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {entry.mood && (
                <span className="text-xs font-ui text-or-sacre">
                  {entry.mood}
                </span>
              )}
            </div>
            <p className="text-sm font-ui text-brun-chaud whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 3 — Programme (sous-onglets)
   ───────────────────────────────────────────── */
function ProgramTab({
  client,
  subTab,
  setSubTab,
}: {
  client: any;
  subTab: ProgramSubTab;
  setSubTab: (t: ProgramSubTab) => void;
}) {
  const subTabs: { key: ProgramSubTab; label: string }[] = [
    { key: "elixirs", label: "Elixirs" },
    { key: "protocols", label: "Protocoles" },
    { key: "practices", label: "Pratiques" },
  ];

  return (
    <div>
      {/* Sous-onglets pill */}
      <div className="flex gap-1 mb-4">
        {subTabs.map((st) => (
          <button
            key={st.key}
            onClick={() => setSubTab(st.key)}
            className={
              subTab === st.key
                ? "bg-brun-chaud text-cire-chaude px-2.5 py-1 rounded-full text-[10px] font-ui uppercase"
                : "text-brun-mid text-[10px] px-2.5 py-1 font-ui uppercase hover:text-brun-chaud transition-colors"
            }
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Contenu du sous-onglet */}
      {subTab === "elixirs" && <ElixirsSubTab client={client} />}
      {subTab === "protocols" && <ProtocolsSubTab client={client} />}
      {subTab === "practices" && (
        <ClientPracticesSection
          clientId={client.id}
          initialPractices={client.clientPractices}
        />
      )}
    </div>
  );
}

/** Sous-onglet Elixirs — table prescriptions + formulaire ajout */
function ElixirsSubTab({ client }: { client: any }) {
  const [showForm, setShowForm] = useState(false);
  const [elixirs, setElixirs] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>(client.elixirPrescriptions);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    elixirId: "",
    dosage: "",
    quantity: "",
    dailyDose: "",
    notes: "",
    reorderUrl: "",
  });

  async function loadElixirs() {
    if (elixirs.length > 0) return;
    const res = await fetch("/api/elixirs");
    if (res.ok) {
      const data = await res.json();
      setElixirs(data.elixirs || []);
    }
  }

  async function handleAdd() {
    if (!form.elixirId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          elixirId: form.elixirId,
          dosage: form.dosage || null,
          quantity: form.quantity ? Number(form.quantity) : null,
          dailyDose: form.dailyDose ? Number(form.dailyDose) : null,
          notes: form.notes || null,
          reorderUrl: form.reorderUrl || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions((prev) => [data.prescription, ...prev]);
        setForm({ elixirId: "", dosage: "", quantity: "", dailyDose: "", notes: "", reorderUrl: "" });
        setShowForm(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Bouton ajouter */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(!showForm); loadElixirs(); }}
          className="px-3 py-1.5 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors"
        >
          {showForm ? "Annuler" : "Prescrire un elixir"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-cire-chaude border border-or-sacre rounded-[10px] p-5 space-y-3">
          <h3 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Nouvelle prescription</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Elixir</label>
              <select
                value={form.elixirId}
                onChange={(e) => setForm({ ...form, elixirId: e.target.value })}
                className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud"
              >
                <option value="">Choisir un elixir...</option>
                {elixirs.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.name} — {e.dosage}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Dosage (override)</label>
              <input type="text" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Ex: 20 gouttes 2x/jour" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Quantite totale</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="Ex: 60" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Dose/jour</label>
              <input type="number" step="0.5" value={form.dailyDose} onChange={(e) => setForm({ ...form, dailyDose: e.target.value })} placeholder="Ex: 2" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Lien commande</label>
              <input type="url" value={form.reorderUrl} onChange={(e) => setForm({ ...form, reorderUrl: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes internes..." className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={loading || !form.elixirId}
            className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Ajouter la prescription"}
          </button>
        </div>
      )}

      {/* Table */}
      {prescriptions.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
          <p className="text-sm text-brun-mid/60 font-ui">Aucune prescription.</p>
        </div>
      ) : (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-or-pale/50">
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Elixir</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Dosage</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Quantite</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Dose/jour</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Stock</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Debut</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Fin</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Commande</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.map((rx: any) => {
                const stock = computeStockInfo(rx);
                return (
                  <tr key={rx.id} className="border-b border-or-pale/20 last:border-b-0">
                    <td className="px-4 py-3 text-sm font-ui text-brun-chaud">{rx.elixir?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm font-ui text-brun-mid">{rx.dosage || "—"}</td>
                    <td className="px-4 py-3 text-sm font-ui text-brun-mid">{rx.quantity ?? "—"}</td>
                    <td className="px-4 py-3 text-sm font-ui text-brun-mid">{rx.dailyDose ?? "—"}</td>
                    <td className="px-4 py-3">
                      {stock.percentRemaining !== null ? (
                        <div>
                          <div className="h-2 bg-or-pale/30 rounded-full w-24">
                            <div className={`h-full rounded-full ${stockColor(stock.percentRemaining)}`} style={{ width: `${stock.percentRemaining}%` }} />
                          </div>
                          <p className={`text-xs font-ui mt-1 ${stockTextColor(stock.percentRemaining)}`}>{stock.daysRemaining} jours</p>
                        </div>
                      ) : (
                        <span className="text-sm font-ui text-brun-mid/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-ui text-brun-mid/70">{new Date(rx.startDate).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3 text-xs font-ui text-brun-mid/70">{rx.endDate ? new Date(rx.endDate).toLocaleDateString("fr-FR") : "En cours"}</td>
                    <td className="px-4 py-3 text-xs font-ui">
                      {rx.reorderUrl ? (
                        <a href={rx.reorderUrl} target="_blank" rel="noopener noreferrer" className="text-or-sacre hover:text-ambre-vif underline">Commander</a>
                      ) : <span className="text-brun-mid/60">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs font-ui text-brun-mid/60">{rx.notes || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Sous-onglet Protocoles + formulaire ajout */
function ProtocolsSubTab({ client }: { client: any }) {
  const [showForm, setShowForm] = useState(false);
  const [protocols, setProtocols] = useState<any[]>(client.protocols);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", frequency: "", duration: "" });

  async function handleAdd() {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          title: form.title,
          description: form.description || null,
          frequency: form.frequency || null,
          duration: form.duration || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProtocols((prev) => [data.protocol, ...prev]);
        setForm({ title: "", description: "", frequency: "", duration: "" });
        setShowForm(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Bouton ajouter */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors"
        >
          {showForm ? "Annuler" : "Ajouter un protocole"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-cire-chaude border border-or-sacre rounded-[10px] p-5 space-y-3">
          <h3 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Nouveau protocole</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Titre</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nom du protocole" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Instructions, details..." className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud resize-none" />
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Frequence</label>
              <input type="text" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="Ex: 2x/semaine" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid/60 mb-1">Duree</label>
              <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Ex: 4 semaines" className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud" />
            </div>
          </div>
          <button
            onClick={handleAdd}
            disabled={loading || !form.title.trim()}
            className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Ajouter le protocole"}
          </button>
        </div>
      )}

      {/* Liste */}
      {protocols.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
          <p className="text-sm text-brun-mid/60 font-ui">Aucun protocole.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {protocols.map((protocol: any) => (
            <div key={protocol.id} className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-ui text-brun-chaud font-normal">{protocol.title}</h3>
                <span className={`text-xs font-ui px-2 py-0.5 rounded-sharp ${
                  protocol.status === "ACTIVE" ? "bg-foret/10 text-foret" : protocol.status === "PAUSED" ? "bg-or-sacre/10 text-or-sacre" : "bg-brun-mid/10 text-brun-mid"
                }`}>
                  {protocol.status === "ACTIVE" ? "Actif" : protocol.status === "PAUSED" ? "Pause" : "Termine"}
                </span>
              </div>
              {protocol.description && <p className="text-sm font-ui text-brun-mid/70">{protocol.description}</p>}
              <div className="flex gap-4 mt-2 text-xs font-ui text-brun-mid/50">
                {protocol.frequency && <span>Frequence : {protocol.frequency}</span>}
                {protocol.duration && <span>Duree : {protocol.duration}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB — Parcours
   ───────────────────────────────────────────── */
function ParcoursTab({ client }: { client: any }) {
  return (
    <div>
      <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
        Parcours 3 mois
      </h2>
      <ParcoursSection clientId={client.id} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 4 — Sessions
   ───────────────────────────────────────────── */
function SessionsTab({ client }: { client: any }) {
  if (client.sessions.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
        <p className="text-sm text-brun-mid/60 font-ui">Aucune session.</p>
      </div>
    );
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-or-pale/50">
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Date
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Type
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Duree
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Statut
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {client.sessions.map((session: any) => (
            <tr
              key={session.id}
              className="border-b border-or-pale/20 last:border-b-0"
            >
              <td className="px-4 py-3 text-sm font-ui text-brun-chaud">
                {new Date(session.scheduledAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                {session.type === "ONLINE"
                  ? "En ligne"
                  : session.type === "PRESENTIAL"
                    ? "Presentiel"
                    : "Ceremonie"}
              </td>
              <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                {session.duration} min
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-ui px-2 py-0.5 rounded-sharp ${
                    session.status === "SCHEDULED"
                      ? "bg-or-sacre/10 text-or-sacre"
                      : session.status === "COMPLETED"
                        ? "bg-foret/10 text-foret"
                        : "bg-red-100 text-red-600"
                  }`}
                >
                  {session.status === "SCHEDULED"
                    ? "Planifiee"
                    : session.status === "COMPLETED"
                      ? "Terminee"
                      : "Annulee"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs font-ui text-brun-mid/60 max-w-xs truncate">
                {session.notes || "\u2014"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 5 — Analyse
   ───────────────────────────────────────────── */
function AnalysisTab({ client }: { client: any }) {
  return (
    <div>
      <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
        Analyse
      </h2>
      <AnalysisSection
        clientId={client.id}
        analysis={client.analysis ?? null}
        intake={client.intake ?? null}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 6 — Documents
   ───────────────────────────────────────────── */
function DocumentsTab({
  client,
  unreadDocCount,
}: {
  client: any;
  unreadDocCount: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Documents ({client.documents.length})
        </h2>
        {unreadDocCount > 0 && (
          <span className="text-xs font-ui px-2 py-0.5 rounded-sharp bg-or-sacre/10 text-or-sacre">
            {unreadDocCount} nouveau{unreadDocCount > 1 ? "x" : ""}
          </span>
        )}
      </div>
      {client.documents.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
          <p className="text-sm text-brun-mid/60 font-ui">Aucun document.</p>
        </div>
      ) : (
        <DocumentsSection
          documents={client.documents}
          clientId={client.id}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 7 — Messages
   ───────────────────────────────────────────── */
function MessagesTab({
  client,
  messages,
}: {
  client: any;
  messages: any[];
}) {
  return (
    <div>
      {/* Messages directs */}
      <section className="mb-8">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
          Messages ({messages.length})
        </h2>
        {messages.length === 0 ? (
          <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
            <p className="text-sm text-brun-mid/60 font-ui">Aucun message.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg: any) => (
              <div
                key={msg.id}
                className={`bg-cire-chaude border rounded-[10px] p-4 ${
                  !msg.readAt && msg.receiverId !== client.userId
                    ? "border-or-sacre"
                    : "border-or-pale"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-ui text-brun-mid/70">
                    {msg.sender.name} &rarr; {msg.receiver.name}
                  </span>
                  <span className="text-xs font-ui text-brun-mid/50">
                    {new Date(msg.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm font-ui text-brun-chaud whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Messages parcours */}
      <section>
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
          Messages parcours
        </h2>
        <JourneyMessagesLog clientId={client.id} />
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 8 — Recommandations
   ───────────────────────────────────────────── */
function RecommendationsTab({ client }: { client: any }) {
  return (
    <div className="space-y-8">
      {/* Supports */}
      <section>
        <SupportSection
          clientId={client.id}
          initialSupports={client.supports}
        />
      </section>

      {/* Recommandations quotidiennes */}
      <section>
        <RecommendationSection
          clientId={client.id}
          initialRecommendations={client.dailyRecommendations}
        />
      </section>

      {/* Focus du jour */}
      <section>
        <DailyFocusSection
          clientId={client.id}
          initialFocuses={client.dailyFocuses}
        />
      </section>

      {/* Recommandations personnalisees (catalogue) */}
      <section>
        <ClientRecommendationsSection
          clientId={client.id}
          initialRecommendations={client.clientRecommendations}
        />
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TAB 9 — Cartes (HD · Astro · BaZi · Numerology)
   ───────────────────────────────────────────── */
function CartesTab({ client }: { client: any }) {
  const [regenerating, setRegenerating] = useState(false);
  const [status, setStatus] = useState("");

  async function handleRegenerate() {
    setRegenerating(true);
    setStatus("Generation en cours...");
    try {
      const res = await fetch("/api/admin/generate-cartes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      if (res.ok) {
        setStatus("Generation lancee — actualisation auto dans 30s...");
        // Poll pour rafraichir quand la generation est terminee
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const check = await fetch(`/api/admin/clients/${client.id}/cartes-status`);
            if (check.ok) {
              const data = await check.json();
              if (data.generated) {
                clearInterval(poll);
                setStatus("Cartes generees — rechargement...");
                window.location.reload();
              } else if (data.error) {
                clearInterval(poll);
                setRegenerating(false);
                setStatus("Erreur : " + data.error);
              }
            }
          } catch { /* ignore poll errors */ }
          if (attempts >= 12) { // 60s max
            clearInterval(poll);
            setRegenerating(false);
            setStatus("Generation en cours... Rafraichir manuellement.");
          }
        }, 5000);
      } else {
        setStatus("Erreur au lancement.");
        setRegenerating(false);
      }
    } catch {
      setStatus("Erreur de connexion.");
      setRegenerating(false);
    }
  }

  const hd = client.hdFullData;
  const astro = client.astroData;
  const bazi = client.baziData;
  const num = client.numerologyData;
  const generated = client.cartesGeneratedAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-ui text-brun-chaud font-medium">Client Cards</h3>
          {generated && (
            <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
              Generated {new Date(generated).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {status && <span className="text-xs font-ui text-or-sacre">{status}</span>}
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="px-4 py-2 bg-or-sacre text-white rounded-sharp text-xs font-ui hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {regenerating ? "..." : "Regenerate"}
          </button>
        </div>
      </div>

      {!generated && !status && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
          <p className="font-ui text-sm text-brun-mid">No cards generated yet. Click Regenerate to start.</p>
        </div>
      )}

      {/* Human Design */}
      {hd && (
        <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-3">
          <h4 className="font-caps text-xs text-or-sacre uppercase tracking-wider">Human Design</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Type" value={hd.type} />
            <Stat label="Authority" value={hd.authority} />
            <Stat label="Profile" value={hd.profile} />
            <Stat label="Cross" value={hd.cross} />
          </div>
          {hd.definedCenters && (
            <div>
              <p className="text-xs font-ui text-brun-mid/60 mb-1">Defined Centers</p>
              <div className="flex flex-wrap gap-1">
                {hd.definedCenters.map((c: string) => (
                  <span key={c} className="text-xs bg-or-sacre/10 text-or-sacre px-2 py-0.5 rounded-sharp">{c}</span>
                ))}
              </div>
            </div>
          )}
          {hd.definedChannels && (
            <div>
              <p className="text-xs font-ui text-brun-mid/60 mb-1">Channels</p>
              <p className="text-xs font-ui text-brun-chaud">{hd.definedChannels.join(" · ")}</p>
            </div>
          )}
          {hd.synthesis && (
            <div className="border-t border-or-pale pt-3 mt-3">
              <p className="text-xs font-ui text-brun-mid/60 mb-1">Synthesis</p>
              <p className="text-sm font-ui text-brun-chaud whitespace-pre-wrap leading-relaxed">{hd.synthesis}</p>
            </div>
          )}
        </section>
      )}

      {/* Astrology */}
      {astro && (
        <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-3">
          <h4 className="font-caps text-xs text-or-sacre uppercase tracking-wider">Evolutionary Astrology — Kaypacha</h4>
          {astro.natalChart?.ascendant && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Ascendant" value={astro.natalChart.ascendant.sign} />
              <Stat label="Sun" value={astro.natalChart.positions?.Sun?.sign} />
              <Stat label="Moon" value={astro.natalChart.positions?.Moon?.sign} />
              <Stat label="Pluto" value={astro.natalChart.evolutionarySoul?.pluto?.sign} />
              <Stat label="North Node" value={astro.natalChart.evolutionarySoul?.northNode?.sign} />
              <Stat label="South Node" value={astro.natalChart.evolutionarySoul?.southNode?.sign} />
            </div>
          )}
          {astro.synthesis && (
            <div className="border-t border-or-pale pt-3 mt-3">
              <p className="text-xs font-ui text-brun-mid/60 mb-1">Synthesis</p>
              <p className="text-sm font-ui text-brun-chaud whitespace-pre-wrap leading-relaxed">{astro.synthesis}</p>
            </div>
          )}
        </section>
      )}

      {/* BaZi */}
      {bazi && (
        <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-3">
          <h4 className="font-caps text-xs text-or-sacre uppercase tracking-wider">BaZi — Four Pillars</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bazi.pillars && Object.entries(bazi.pillars).map(([key, pillar]: [string, any]) => (
              <div key={key} className="text-center">
                <p className="text-xs font-ui text-brun-mid/60 capitalize">{key}</p>
                <p className="text-sm font-ui text-brun-chaud">{pillar.stem} {pillar.branch}</p>
                <p className="text-xs font-ui text-or-sacre">{pillar.animal}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Day Master" value={bazi.dayMaster} />
            <Stat label="Dominant" value={bazi.dominantElement} />
          </div>
          {bazi.synthesis && (
            <div className="border-t border-or-pale pt-3 mt-3">
              <p className="text-xs font-ui text-brun-mid/60 mb-1">Synthesis</p>
              <p className="text-sm font-ui text-brun-chaud whitespace-pre-wrap leading-relaxed">{bazi.synthesis}</p>
            </div>
          )}
        </section>
      )}

      {/* Numerology */}
      {num && (
        <section className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-3">
          <h4 className="font-caps text-xs text-or-sacre uppercase tracking-wider">Numerology</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Life Path" value={num.lifePath} />
            <Stat label="Expression" value={num.expression} />
            <Stat label="Soul" value={num.soul} />
            <Stat label="Personality" value={num.personality} />
            <Stat label="Birthday" value={num.birthday} />
            <Stat label="Maturity" value={num.maturity} />
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs font-ui text-brun-mid/60">{label}</p>
      <p className="text-sm font-ui text-brun-chaud">{value ?? "—"}</p>
    </div>
  );
}

function LanguageSelector({ clientId, currentLanguage }: { clientId: string; currentLanguage: string }) {
  const [lang, setLang] = useState(currentLanguage);
  const [saving, setSaving] = useState(false);

  async function handleChange(newLang: string) {
    setLang(newLang);
    setSaving(true);
    try {
      await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: newLang }),
      });
    } catch {
      setLang(currentLanguage);
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={lang}
      onChange={(e) => handleChange(e.target.value)}
      disabled={saving}
      className="text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp px-2 py-1 focus:outline-none focus:border-or-sacre disabled:opacity-50"
    >
      <option value="EN">English</option>
      <option value="FR">Français</option>
    </select>
  );
}
