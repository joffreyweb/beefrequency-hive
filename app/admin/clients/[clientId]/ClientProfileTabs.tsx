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
}

export default function ClientProfileTabs({
  client,
  messages,
  unreadDocCount,
  dayNumber,
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
        <OverviewTab client={client} dayNumber={dayNumber} />
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
function OverviewTab({ client, dayNumber }: { client: any; dayNumber: number }) {
  // Prescriptions avec stock critique
  const criticalPrescriptions = client.elixirPrescriptions.filter((rx: any) => {
    const stock = computeStockInfo(rx);
    return stock.isLow;
  });

  return (
    <div className="grid grid-cols-[1.2fr_1fr] gap-6">
      {/* Colonne gauche — Infos client + Notes */}
      <div className="space-y-6">
        {/* Infos client */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
            Informations
          </h2>
          <div className="space-y-3">
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
                Prochaine session
              </p>
              <p className="text-sm font-ui text-brun-chaud">
                {client.nextSessionDate
                  ? new Date(client.nextSessionDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Non planifiee"}
              </p>
            </div>
            <div>
              <p className="font-caps text-xs text-brun-mid/60 uppercase tracking-wider mb-0.5">
                Langue
              </p>
              <p className="text-sm font-ui text-brun-chaud">
                {client.language === "EN" ? "English" : "Francais"}
              </p>
            </div>
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

      {/* Colonne droite — Alertes stock */}
      <div className="space-y-6">
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

/** Sous-onglet Elixirs — table prescriptions */
function ElixirsSubTab({ client }: { client: any }) {
  if (client.elixirPrescriptions.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
        <p className="text-sm text-brun-mid/60 font-ui">
          Aucune prescription.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-or-pale/50">
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Elixir
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Dosage
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Quantite
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Dose/jour
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Stock
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Debut
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Fin
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Lien commande
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {client.elixirPrescriptions.map((rx: any) => {
            const stock = computeStockInfo(rx);
            return (
              <tr
                key={rx.id}
                className="border-b border-or-pale/20 last:border-b-0"
              >
                <td className="px-4 py-3 text-sm font-ui text-brun-chaud">
                  {rx.elixir.name}
                </td>
                <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                  {rx.dosage || "\u2014"}
                </td>
                <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                  {rx.quantity ?? "\u2014"}
                </td>
                <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                  {rx.dailyDose ?? "\u2014"}
                </td>
                <td className="px-4 py-3">
                  {stock.percentRemaining !== null ? (
                    <div>
                      <div className="h-2 bg-or-pale/30 rounded-full w-24">
                        <div
                          className={`h-full rounded-full ${stockColor(stock.percentRemaining)}`}
                          style={{
                            width: `${stock.percentRemaining}%`,
                          }}
                        />
                      </div>
                      <p
                        className={`text-xs font-ui mt-1 ${stockTextColor(stock.percentRemaining)}`}
                      >
                        {stock.daysRemaining} jours
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm font-ui text-brun-mid/60">
                      \u2014
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-ui text-brun-mid/70">
                  {new Date(rx.startDate).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-xs font-ui text-brun-mid/70">
                  {rx.endDate
                    ? new Date(rx.endDate).toLocaleDateString("fr-FR")
                    : "En cours"}
                </td>
                <td className="px-4 py-3 text-xs font-ui">
                  {rx.reorderUrl ? (
                    <a
                      href={rx.reorderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-or-sacre hover:text-ambre-vif transition-colors duration-150 underline"
                    >
                      Commander
                    </a>
                  ) : (
                    <span className="text-brun-mid/60">\u2014</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-ui text-brun-mid/60">
                  {rx.notes || "\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Sous-onglet Protocoles */
function ProtocolsSubTab({ client }: { client: any }) {
  if (client.protocols.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
        <p className="text-sm text-brun-mid/60 font-ui">Aucun protocole.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {client.protocols.map((protocol: any) => (
        <div
          key={protocol.id}
          className="bg-cire-chaude border border-or-pale rounded-[10px] p-5"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-ui text-brun-chaud font-normal">
              {protocol.title}
            </h3>
            <span
              className={`text-xs font-ui px-2 py-0.5 rounded-sharp ${
                protocol.status === "ACTIVE"
                  ? "bg-foret/10 text-foret"
                  : protocol.status === "PAUSED"
                    ? "bg-or-sacre/10 text-or-sacre"
                    : "bg-brun-mid/10 text-brun-mid"
              }`}
            >
              {protocol.status === "ACTIVE"
                ? "Actif"
                : protocol.status === "PAUSED"
                  ? "Pause"
                  : "Termine"}
            </span>
          </div>
          {protocol.description && (
            <p className="text-sm font-ui text-brun-mid/70">
              {protocol.description}
            </p>
          )}
          <div className="flex gap-4 mt-2 text-xs font-ui text-brun-mid/50">
            {protocol.frequency && <span>Frequence : {protocol.frequency}</span>}
            {protocol.duration && <span>Duree : {protocol.duration}</span>}
          </div>
        </div>
      ))}
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
    setStatus("Generating...");
    try {
      const res = await fetch("/api/admin/generate-cartes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      if (res.ok) {
        setStatus("Generation started. Refresh in a few moments.");
      } else {
        setStatus("Error starting generation.");
      }
    } catch {
      setStatus("Error.");
    } finally {
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
