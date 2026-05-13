"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ───

interface ElixirLib {
  id: string;
  name: string;
  description: string;
  dosage: string;
  unit: string;
  category: string;
  timing: string;
}

interface PhaseElixir {
  id: string;
  elixirLibraryId: string;
  elixirLibrary: ElixirLib;
  dose: string | null;
  frequency: string;
  timing: string;
  notes: string | null;
}

interface PhasePractice {
  id: string;
  type: string;
  title: string;
  description: string | null;
  duration: number | null;
  frequency: string;
}

interface ClientPhase {
  id: string;
  clientId: string;
  phaseType: "DETOX" | "CYCLE" | "BREAK";
  phaseNumber: number;
  startDate: string;
  endDate: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED";
  customName: string | null;
  instructions: string | null;
  morningCheckinEnabled: boolean;
  eveningCheckinEnabled: boolean;
  checkinMode: string;
  phaseElixirs: PhaseElixir[];
  phasePractices: PhasePractice[];
}

type PhaseTab = "general" | "elixirs" | "pratiques" | "checkins" | "jours";

// ─── Labels ───

const PHASE_LABELS: Record<string, string> = {
  DETOX: "Detox",
  CYCLE: "Cycle",
  BREAK: "Intégration",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "border-or-sacre bg-or-sacre/5",
  COMPLETED: "border-foret/30 bg-foret/5",
  UPCOMING: "border-or-pale bg-cire-chaude",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "En cours",
  COMPLETED: "Terminé",
  UPCOMING: "À venir",
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-or-sacre",
  COMPLETED: "bg-foret",
  UPCOMING: "bg-brun-mid/30",
};

const FREQ_LABELS: Record<string, string> = {
  DAILY: "Quotidien",
  MON_JEU: "Lun & Jeu",
  MAR_VEN: "Mar & Ven",
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

const TIMING_LABELS: Record<string, string> = {
  MATIN: "Matin",
  SOIR: "Soir",
  JOURNEE: "Journée",
  FLEXIBLE: "Flexible",
};

const PRACTICE_TYPE_LABELS: Record<string, string> = {
  BREATHING: "Respiration",
  MEDITATION: "Méditation",
  WRITING: "Écriture",
  MOVEMENT: "Mouvement",
};

// ─── Main Component ───

export default function ParcoursSection({ clientId }: { clientId: string }) {
  const [phases, setPhases] = useState<ClientPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newStartDate, setNewStartDate] = useState("");
  const [changingDate, setChangingDate] = useState(false);

  const loadPhases = useCallback(async () => {
    try {
      const res = await fetch(`/api/client-phases?clientId=${clientId}`);
      const data = await res.json();
      setPhases(data.phases ?? []);
      // Auto-select active phase
      const active = (data.phases ?? []).find((p: ClientPhase) => p.status === "ACTIVE");
      if (active) setSelectedPhaseId(active.id);
      else if (data.phases?.length > 0) setSelectedPhaseId(data.phases[0].id);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadPhases();
  }, [loadPhases]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/client-phases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) await loadPhases();
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  }

  async function handleReset() {
    if (!confirm("Réinitialiser le parcours ? Les élixirs et pratiques assignés seront supprimés.")) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/client-phases?clientId=${clientId}`, { method: "DELETE" });
      if (res.ok) {
        setPhases([]);
        setSelectedPhaseId(null);
      }
    } catch {
      // silent
    } finally {
      setResetting(false);
    }
  }

  async function handleChangeStartDate() {
    if (!newStartDate) return;
    setChangingDate(true);
    try {
      const res = await fetch("/api/client-phases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, startDate: newStartDate }),
      });
      if (res.ok) {
        setShowDatePicker(false);
        setNewStartDate("");
        await loadPhases();
      }
    } catch {
      // silent
    } finally {
      setChangingDate(false);
    }
  }

  if (loading) {
    return <p className="text-sm font-ui text-brun-mid/60 py-8">Chargement du parcours...</p>;
  }

  // Pas de phases encore → bouton générer
  if (phases.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
        <p className="text-sm text-brun-mid/60 font-ui mb-4">
          Aucun parcours généré pour ce client.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-5 py-2 text-sm font-ui uppercase tracking-[0.06em] bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {generating ? "Génération..." : "Générer le parcours 103 jours"}
        </button>
      </div>
    );
  }

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId);

  return (
    <div className="space-y-6">
      {/* Header + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs font-ui text-brun-mid/60">
          {phases.length} phases · 103 jours
          {phases.length > 0 && ` · Début ${formatDateShort(phases[0].startDate)}`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-3 py-1.5 text-xs font-ui text-or-sacre border border-or-pale rounded-sharp hover:bg-or-sacre/10 transition-colors"
          >
            {showDatePicker ? "Annuler" : "Modifier date départ"}
          </button>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-3 py-1.5 text-xs font-ui text-red-600 border border-red-200 rounded-sharp hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {resetting ? "Réinitialisation..." : "Réinitialiser"}
          </button>
        </div>
      </div>

      {/* Date picker */}
      {showDatePicker && (
        <div className="bg-creme-sacree border border-or-pale rounded-[8px] p-4 flex items-end gap-3">
          <div>
            <label className="block text-xs font-ui text-brun-mid mb-1">Nouvelle date de départ</label>
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              className="px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
            />
          </div>
          <button
            onClick={handleChangeStartDate}
            disabled={changingDate || !newStartDate}
            className="px-4 py-2 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {changingDate ? "..." : "Recalculer les phases"}
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {phases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setSelectedPhaseId(phase.id)}
            className={`flex-shrink-0 px-4 py-3 rounded-[10px] border-2 transition-all duration-150 text-left min-w-[140px] ${
              selectedPhaseId === phase.id ? "ring-2 ring-or-sacre/30" : ""
            } ${STATUS_COLORS[phase.status]}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[phase.status]}`} />
              <span className="text-xs font-caps uppercase tracking-wider text-brun-mid">
                {STATUS_LABELS[phase.status]}
              </span>
            </div>
            <p className="text-sm font-ui text-brun-chaud">
              {phase.customName || `${PHASE_LABELS[phase.phaseType]}${phase.phaseType !== "DETOX" ? ` ${phase.phaseNumber}` : ""}`}
            </p>
            <p className="text-xs font-ui text-brun-mid/50 mt-0.5">
              {formatDateShort(phase.startDate)} → {formatDateShort(phase.endDate)}
            </p>
          </button>
        ))}
      </div>

      {/* Phase detail */}
      {selectedPhase && (
        <PhaseDetail phase={selectedPhase} allPhases={phases} onUpdate={loadPhases} />
      )}
    </div>
  );
}

// ─── Phase Detail (Tabbed) ───

const TAB_LABELS: Record<PhaseTab, string> = {
  general: "Général",
  elixirs: "Élixirs",
  pratiques: "Pratiques",
  checkins: "Check-ins",
  jours: "Jours",
};

function PhaseDetail({ phase, allPhases, onUpdate }: { phase: ClientPhase; allPhases: ClientPhase[]; onUpdate: () => void }) {
  const [activeTab, setActiveTab] = useState<PhaseTab>("general");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg text-brun-chaud">
            {phase.customName || `${PHASE_LABELS[phase.phaseType]}${phase.phaseType !== "DETOX" ? ` ${phase.phaseNumber}` : ""}`}
          </h3>
          <span className={`text-xs font-ui px-2 py-0.5 rounded-sharp ${
            phase.status === "ACTIVE" ? "bg-or-sacre/10 text-or-sacre" :
            phase.status === "COMPLETED" ? "bg-foret/10 text-foret" :
            "bg-brun-mid/10 text-brun-mid"
          }`}>
            {STATUS_LABELS[phase.status]}
          </span>
        </div>
        <p className="text-xs font-ui text-brun-mid/60">
          {formatDate(phase.startDate)} → {formatDate(phase.endDate)}
          {" · "}
          {phase.phaseType === "CYCLE" ? "21 jours" : "10 jours"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-or-pale/30 pb-0">
        {(Object.keys(TAB_LABELS) as PhaseTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-caps uppercase tracking-wider transition-colors rounded-t-[8px] ${
              activeTab === tab
                ? "bg-cire-chaude border border-b-0 border-or-pale text-brun-chaud"
                : "text-brun-mid/50 hover:text-brun-mid"
            }`}
          >
            {TAB_LABELS[tab]}
            {tab === "elixirs" && phase.phaseElixirs.length > 0 && ` (${phase.phaseElixirs.length})`}
            {tab === "pratiques" && phase.phasePractices.length > 0 && ` (${phase.phasePractices.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "general" && <GeneralTab phase={phase} onUpdate={onUpdate} />}
      {activeTab === "elixirs" && (
        <>
          <ElixirsBlock phase={phase} allPhases={allPhases} onUpdate={onUpdate} />
          <WeekView phase={phase} />
        </>
      )}
      {activeTab === "pratiques" && <PracticesBlock phase={phase} onUpdate={onUpdate} />}
      {activeTab === "checkins" && <CheckinsTab phase={phase} allPhases={allPhases} onUpdate={onUpdate} />}
      {activeTab === "jours" && <JoursTab phase={phase} />}
    </div>
  );
}

// ─── General Tab ───

function GeneralTab({ phase, onUpdate }: { phase: ClientPhase; onUpdate: () => void }) {
  const [customName, setCustomName] = useState(phase.customName || "");
  const [instructions, setInstructions] = useState(phase.instructions || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCustomName(phase.customName || "");
    setInstructions(phase.instructions || "");
    setSaved(false);
  }, [phase.id, phase.customName, phase.instructions]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/client-phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customName, instructions }),
      });
      if (res.ok) {
        setSaved(true);
        onUpdate();
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const defaultLabel = `${PHASE_LABELS[phase.phaseType]}${phase.phaseType !== "DETOX" ? ` ${phase.phaseNumber}` : ""}`;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 space-y-4">
      <div>
        <label className="block text-xs font-ui text-brun-mid mb-1">Nom affiché</label>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder={defaultLabel}
          className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
        />
        <p className="text-xs text-brun-mid/40 mt-1">Laisser vide = &quot;{defaultLabel}&quot;</p>
      </div>

      <div>
        <label className="block text-xs font-ui text-brun-mid mb-1">Instructions pour le client</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          placeholder="Instructions personnalisées visibles par le client durant cette phase..."
          className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {saving ? "..." : "Sauvegarder"}
        </button>
        {saved && <span className="text-xs font-ui text-foret">Sauvegardé</span>}
      </div>
    </div>
  );
}

// ─── Check-ins Tab ───

interface CkQ { text: string; type: "scale" | "yesno" | "text"; enabled: boolean; order: number }
const DEF_MORNING: CkQ[] = [
  { text: "Comment te sens-tu ce matin ?", type: "scale", enabled: true, order: 1 },
  { text: "Qualité de ton sommeil ?", type: "scale", enabled: true, order: 2 },
  { text: "Niveau d'énergie ?", type: "scale", enabled: true, order: 3 },
  { text: "As-tu pris tes élixirs ?", type: "yesno", enabled: true, order: 4 },
  { text: "Intention pour la journée ?", type: "text", enabled: true, order: 5 },
];
const DEF_EVENING: CkQ[] = [
  { text: "Comment s'est passée ta journée ?", type: "scale", enabled: true, order: 1 },
  { text: "As-tu suivi ton protocole ?", type: "yesno", enabled: true, order: 2 },
  { text: "As-tu fait ta pratique ?", type: "yesno", enabled: true, order: 3 },
  { text: "Qu'est-ce qui reste avec toi ce soir ?", type: "text", enabled: true, order: 4 },
  { text: "Gratitude du jour ?", type: "text", enabled: true, order: 5 },
];
const QT: Record<string, string> = { scale: "Échelle 1-5", yesno: "Oui/Non", text: "Texte libre" };

function CheckinsTab({ phase, allPhases, onUpdate }: { phase: ClientPhase; allPhases: ClientPhase[]; onUpdate: () => void }) {
  const [morningEnabled, setMorningEnabled] = useState(phase.morningCheckinEnabled);
  const [eveningEnabled, setEveningEnabled] = useState(phase.eveningCheckinEnabled);
  const [checkinMode, setCheckinMode] = useState(phase.checkinMode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mQs, setMQs] = useState<CkQ[]>(DEF_MORNING);
  const [eQs, setEQs] = useState<CkQ[]>(DEF_EVENING);
  const [mCustom, setMCustom] = useState(false);
  const [eCustom, setECustom] = useState(false);
  const [modal, setModal] = useState<"morning" | "evening" | null>(null);
  const [modalQs, setModalQs] = useState<CkQ[]>([]);
  const [newT, setNewT] = useState("");
  const [newTy, setNewTy] = useState<"scale" | "yesno" | "text">("text");
  const [mSaving, setMSaving] = useState(false);

  useEffect(() => {
    setMorningEnabled(phase.morningCheckinEnabled);
    setEveningEnabled(phase.eveningCheckinEnabled);
    setCheckinMode(phase.checkinMode);
    setSaved(false);
    fetch(`/api/client-phases/${phase.id}/checkin-config`).then((r) => r.ok ? r.json() : { morning: null, evening: null }).then((d: { morning?: { questions?: CkQ[] } | null; evening?: { questions?: CkQ[] } | null }) => {
      if (d.morning?.questions) { setMQs(d.morning.questions); setMCustom(true); } else { setMQs(DEF_MORNING); setMCustom(false); }
      if (d.evening?.questions) { setEQs(d.evening.questions); setECustom(true); } else { setEQs(DEF_EVENING); setECustom(false); }
    }).catch(() => {});
  }, [phase.id, phase.morningCheckinEnabled, phase.eveningCheckinEnabled, phase.checkinMode]);

  async function handleSave() {
    setSaving(true);
    try {
      const r = await fetch(`/api/client-phases/${phase.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ morningCheckinEnabled: morningEnabled, eveningCheckinEnabled: eveningEnabled, checkinMode }) });
      if (r.ok) { setSaved(true); onUpdate(); setTimeout(() => setSaved(false), 2000); }
    } catch {} finally { setSaving(false); }
  }
  function openModal(t: "morning" | "evening") { setModal(t); setModalQs(JSON.parse(JSON.stringify(t === "morning" ? mQs : eQs))); setNewT(""); }
  async function saveModal() {
    if (!modal) return; setMSaving(true);
    try {
      await fetch(`/api/client-phases/${phase.id}/checkin-config`, { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: modal, questions: modalQs }) });
      if (modal === "morning") { setMQs(modalQs); setMCustom(true); } else { setEQs(modalQs); setECustom(true); }
      setModal(null);
    } catch {} finally { setMSaving(false); }
  }
  async function resetDef() {
    if (!modal || !confirm("Réinitialiser aux questions par défaut ?")) return;
    await fetch(`/api/client-phases/${phase.id}/checkin-config?type=${modal}`, { method: "DELETE" });
    if (modal === "morning") { setMQs(DEF_MORNING); setMCustom(false); } else { setEQs(DEF_EVENING); setECustom(false); }
    setModal(null);
  }
  async function applyToAll() {
    if (!modal || !confirm("Appliquer cette configuration à toutes les phases ?")) return;
    setMSaving(true);
    try {
      await Promise.all(allPhases.map((p) =>
        fetch(`/api/client-phases/${p.id}/checkin-config`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: modal, questions: modalQs }),
        })
      ));
      if (modal === "morning") { setMQs(modalQs); setMCustom(true); } else { setEQs(modalQs); setECustom(true); }
      setModal(null); onUpdate();
    } catch {} finally { setMSaving(false); }
  }

  function renderSection(type: "morning" | "evening", enabled: boolean, setEnabled: (v: boolean) => void, qs: CkQ[], custom: boolean) {
    return (
      <div className="border border-or-pale/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4 accent-or-sacre" />
            <span className="text-sm font-ui text-brun-chaud font-medium">Check-in {type === "morning" ? "matin" : "soir"}</span>
          </label>
          <button onClick={() => openModal(type)}
            className="flex items-center gap-1.5 bg-or-sacre/10 text-or-sacre hover:bg-or-sacre/20 px-3 py-1.5 rounded font-ui text-xs transition-colors">
            ✏️ Personnaliser
          </button>
        </div>
        {custom && <p className="text-[10px] font-ui text-foret mb-1">✓ Questions personnalisées</p>}
        <div className="pl-7 space-y-1">
          {qs.filter((q) => q.enabled).map((q, i) => (
            <p key={i} className="text-xs font-ui text-brun-mid/60">· {q.text} <span className="text-brun-mid/30">({QT[q.type]})</span></p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 space-y-5">
        {renderSection("morning", morningEnabled, setMorningEnabled, mQs, mCustom)}
        {renderSection("evening", eveningEnabled, setEveningEnabled, eQs, eCustom)}
        <div>
          <label className="block text-xs font-ui text-brun-mid mb-1">Mode</label>
          <select value={checkinMode} onChange={(e) => setCheckinMode(e.target.value)}
            className="w-full max-w-xs px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
            <option value="full">Complet</option><option value="light">Allégé</option><option value="minimal">Minimal</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50">
            {saving ? "..." : "Sauvegarder"}</button>
          {saved && <span className="text-xs font-ui text-foret">Sauvegardé</span>}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => setModal(null)} />
          <div className="fixed inset-0 z-[90] flex items-start justify-center pt-10 px-4 overflow-y-auto">
            <div className="bg-creme-sacree border border-or-pale rounded-[10px] w-full max-w-lg shadow-xl mb-10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg text-brun-chaud">Check-in {modal === "morning" ? "matin" : "soir"}</h3>
                <button onClick={() => setModal(null)} className="text-brun-mid hover:text-brun-chaud text-xl">×</button>
              </div>
              <div className="space-y-2 mb-4">
                {modalQs.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 bg-cire-chaude border border-or-pale/50 rounded p-3">
                    <input type="checkbox" checked={q.enabled} onChange={() => { const n = [...modalQs]; n[i] = { ...n[i], enabled: !n[i].enabled }; setModalQs(n); }} className="mt-1 w-4 h-4 accent-or-sacre" />
                    <div className="flex-1 space-y-1">
                      <input type="text" value={q.text} onChange={(e) => { const n = [...modalQs]; n[i] = { ...n[i], text: e.target.value }; setModalQs(n); }}
                        className="w-full px-2 py-1 text-sm font-ui bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre" />
                      <div className="flex items-center gap-3">
                        <select value={q.type} onChange={(e) => { const n = [...modalQs]; n[i] = { ...n[i], type: e.target.value as CkQ["type"] }; setModalQs(n); }}
                          className="text-xs border border-or-pale rounded px-1.5 py-1 font-ui">
                          <option value="scale">Échelle 1-5</option><option value="yesno">Oui/Non</option><option value="text">Texte libre</option>
                        </select>
                        <button onClick={() => setModalQs(modalQs.filter((_, j) => j !== i))} className="text-xs font-ui text-red-500 hover:text-red-700">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-or-pale/50 pt-3 mb-4">
                <div className="flex gap-2">
                  <input type="text" value={newT} onChange={(e) => setNewT(e.target.value)} placeholder="Nouvelle question..."
                    className="flex-1 px-2 py-1.5 text-sm font-ui bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre" />
                  <select value={newTy} onChange={(e) => setNewTy(e.target.value as CkQ["type"])} className="text-xs border border-or-pale rounded px-1.5 py-1 font-ui">
                    <option value="scale">Échelle</option><option value="yesno">Oui/Non</option><option value="text">Texte</option>
                  </select>
                  <button onClick={() => { if (!newT.trim()) return; setModalQs([...modalQs, { text: newT.trim(), type: newTy, enabled: true, order: modalQs.length + 1 }]); setNewT(""); }}
                    className="px-3 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-or-pale/50 pt-3">
                <div className="flex gap-3">
                  <button onClick={resetDef} className="text-xs font-ui text-brun-mid/60 hover:text-brun-mid">↩️ Par défaut</button>
                  <button onClick={applyToAll} disabled={mSaving} className="text-xs font-ui text-or-sacre hover:text-ambre-vif disabled:opacity-50">📋 Toutes les phases</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="px-3 py-1.5 text-xs font-ui border border-brun-mid text-brun-mid rounded-sharp hover:bg-brun-mid hover:text-creme-sacree transition-colors">Annuler</button>
                  <button onClick={saveModal} disabled={mSaving} className="px-3 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif disabled:opacity-50">{mSaving ? "..." : "Sauvegarder"}</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Elixirs Block ───

function ElixirsBlock({ phase, allPhases, onUpdate }: { phase: ClientPhase; allPhases: ClientPhase[]; onUpdate: () => void }) {
  const [showAssign, setShowAssign] = useState(false);
  const [library, setLibrary] = useState<ElixirLib[]>([]);
  const [selectedElixirId, setSelectedElixirId] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("DAILY");
  const [timing, setTiming] = useState("FLEXIBLE");
  const [applyTo, setApplyTo] = useState("this"); // this | detox | all_cycles | all_breaks | all
  const [saving, setSaving] = useState(false);

  async function loadLibrary() {
    const res = await fetch("/api/elixir-library");
    const data = await res.json();
    setLibrary(data.elixirs ?? []);
  }

  useEffect(() => {
    if (showAssign && library.length === 0) loadLibrary();
  }, [showAssign]);

  async function handleAssign() {
    if (!selectedElixirId) return;
    setSaving(true);
    try {
      // Determine which phases to assign to
      let targetPhaseIds: string[] = [phase.id];
      if (applyTo === "detox") {
        targetPhaseIds = allPhases.filter((p) => p.phaseType === "DETOX").map((p) => p.id);
      } else if (applyTo === "all_cycles") {
        targetPhaseIds = allPhases.filter((p) => p.phaseType === "CYCLE").map((p) => p.id);
      } else if (applyTo === "all_breaks") {
        targetPhaseIds = allPhases.filter((p) => p.phaseType === "BREAK").map((p) => p.id);
      } else if (applyTo === "all") {
        targetPhaseIds = allPhases.map((p) => p.id);
      }

      if (applyTo !== "this" && !confirm(`Assigner cet élixir à ${targetPhaseIds.length} phases ?`)) {
        return;
      }

      // Assign to all target phases
      await Promise.all(
        targetPhaseIds.map((phaseId) =>
          fetch(`/api/client-phases/${phaseId}/elixirs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              elixirLibraryId: selectedElixirId,
              dose: dose || null,
              frequency,
              timing,
            }),
          })
        )
      );

      setShowAssign(false);
      setSelectedElixirId("");
      setDose("");
      setFrequency("DAILY");
      setTiming("FLEXIBLE");
      setApplyTo("this");
      onUpdate();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDose, setEditDose] = useState("");
  const [editFrequency, setEditFrequency] = useState("DAILY");
  const [editTiming, setEditTiming] = useState("FLEXIBLE");

  function startEdit(pe: ClientPhase["phaseElixirs"][0]) {
    setEditingId(pe.id);
    setEditDose(pe.dose || "");
    setEditFrequency(pe.frequency);
    setEditTiming(pe.timing);
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      await fetch(`/api/client-phases/${phase.id}/elixirs?phaseElixirId=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dose: editDose || null,
          frequency: editFrequency,
          timing: editTiming,
        }),
      });
      setEditingId(null);
      onUpdate();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(phaseElixirId: string) {
    if (!confirm("Retirer cet élixir ?")) return;
    try {
      await fetch(`/api/client-phases/${phase.id}/elixirs?phaseElixirId=${phaseElixirId}`, { method: "DELETE" });
      onUpdate();
    } catch {
      // silent
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Élixirs ({phase.phaseElixirs.length})
        </h4>
        <button
          onClick={() => setShowAssign(!showAssign)}
          className="px-3 py-1.5 text-xs font-ui text-or-sacre border border-or-pale rounded-sharp hover:bg-or-sacre/10 transition-colors"
        >
          {showAssign ? "Annuler" : "Assigner"}
        </button>
      </div>

      {/* Assign form */}
      {showAssign && (
        <div className="border border-or-pale/50 rounded-[8px] p-4 mb-4 bg-creme-sacree">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Élixir</label>
              <select value={selectedElixirId} onChange={(e) => setSelectedElixirId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
                <option value="">Choisir...</option>
                {library.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} · {e.dosage}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Dose (override)</label>
              <input type="text" value={dose} onChange={(e) => setDose(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                placeholder="Laisser vide = dose par défaut" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Fréquence</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
                {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Timing</label>
              <select value={timing} onChange={(e) => setTiming(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
                {Object.entries(TIMING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {/* Apply to */}
          <div className="mb-3">
            <label className="block text-xs font-ui text-brun-mid mb-1">Appliquer à</label>
            <select value={applyTo} onChange={(e) => setApplyTo(e.target.value)}
              className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
              <option value="this">Cette phase uniquement</option>
              <option value="detox">Détox</option>
              <option value="all_cycles">Tous les Cycles (1, 2, 3)</option>
              <option value="all_breaks">Toutes les Intégrations (1, 2, 3)</option>
              <option value="all">Toutes les phases</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAssign} disabled={saving || !selectedElixirId}
              className="px-4 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50">
              {saving ? "..." : applyTo === "this" ? "Assigner" : `Assigner (${
                applyTo === "detox" ? "détox" :
                applyTo === "all_cycles" ? "3 cycles" :
                applyTo === "all_breaks" ? "3 intégrations" :
                "toutes les phases"
              })`}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {phase.phaseElixirs.length === 0 ? (
        <p className="text-sm text-brun-mid/50 font-ui">Aucun élixir assigné.</p>
      ) : (
        <div className="space-y-2">
          {phase.phaseElixirs.map((pe) => (
            <div key={pe.id} className="border-b border-or-pale/30 last:border-0 py-2">
              {editingId === pe.id ? (
                <div className="bg-creme-sacree border border-or-pale/50 rounded p-3 space-y-2">
                  <p className="text-sm font-ui text-brun-chaud font-medium">{pe.elixirLibrary.name}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={editDose} onChange={(e) => setEditDose(e.target.value)}
                      placeholder={pe.elixirLibrary.dosage}
                      className="px-2 py-1.5 text-xs font-ui bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre" />
                    <select value={editFrequency} onChange={(e) => setEditFrequency(e.target.value)}
                      className="px-2 py-1.5 text-xs font-ui bg-white border border-or-pale rounded-sharp">
                      {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={editTiming} onChange={(e) => setEditTiming(e.target.value)}
                      className="px-2 py-1.5 text-xs font-ui bg-white border border-or-pale rounded-sharp">
                      {Object.entries(TIMING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="text-xs font-ui text-brun-mid hover:text-brun-chaud">Annuler</button>
                    <button onClick={handleSaveEdit} disabled={saving}
                      className="text-xs font-ui text-or-sacre hover:text-ambre-vif disabled:opacity-50">
                      {saving ? "..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-ui text-brun-chaud">{pe.elixirLibrary.name}</span>
                    <span className="text-xs font-ui text-brun-mid/60 ml-2">
                      {pe.dose || pe.elixirLibrary.dosage} · {TIMING_LABELS[pe.timing]} · {FREQ_LABELS[pe.frequency]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(pe)}
                      className="text-xs font-ui text-or-sacre hover:text-ambre-vif">✏️</button>
                    <button onClick={() => handleRemove(pe.id)}
                      className="text-xs font-ui text-red-500 hover:text-red-700">🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Practices Block ───

function PracticesBlock({ phase, onUpdate }: { phase: ClientPhase; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("BREATHING");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [frequency, setFrequency] = useState("DAILY");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/client-phases/${phase.id}/practices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || null,
          duration: duration ? parseInt(duration) : null,
          frequency,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setTitle("");
        setDescription("");
        setDuration("");
        onUpdate();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(practiceId: string) {
    if (!confirm("Retirer cette pratique ?")) return;
    try {
      await fetch(`/api/client-phases/${phase.id}/practices?phasePracticeId=${practiceId}`, { method: "DELETE" });
      onUpdate();
    } catch {
      // silent
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Pratiques ({phase.phasePractices.length})
        </h4>
        <button onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-xs font-ui text-or-sacre border border-or-pale rounded-sharp hover:bg-or-sacre/10 transition-colors">
          {showForm ? "Annuler" : "Ajouter"}
        </button>
      </div>

      {showForm && (
        <div className="border border-or-pale/50 rounded-[8px] p-4 mb-4 bg-creme-sacree">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
                {Object.entries(PRACTICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Titre</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                placeholder="Ex: Relaxing Breath 4-8" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Durée (min)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
                placeholder="10" min={1} />
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Fréquence</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre">
                <option value="DAILY">Quotidien</option>
                <option value="SPECIFIC_DAYS">Jours spécifiques</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={saving || !title.trim()}
              className="px-4 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50">
              {saving ? "..." : "Ajouter"}
            </button>
          </div>
        </div>
      )}

      {phase.phasePractices.length === 0 ? (
        <p className="text-sm text-brun-mid/50 font-ui">Aucune pratique assignée.</p>
      ) : (
        <div className="space-y-2">
          {phase.phasePractices.map((pp) => (
            <div key={pp.id} className="flex items-center justify-between py-2 border-b border-or-pale/30 last:border-0">
              <div>
                <span className="text-sm font-ui text-brun-chaud">{pp.title}</span>
                <span className="text-xs font-ui text-brun-mid/60 ml-2">
                  {PRACTICE_TYPE_LABELS[pp.type]}
                  {pp.duration ? ` · ${pp.duration} min` : ""}
                  {" · "}{pp.frequency === "DAILY" ? "Quotidien" : "Jours spécifiques"}
                </span>
              </div>
              <button onClick={() => handleRemove(pp.id)}
                className="text-xs font-ui text-red-500 hover:text-red-700 transition-colors">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Week View ───

function WeekView({ phase }: { phase: ClientPhase }) {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const FREQ_DAY_MAP: Record<string, number[]> = {
    DAILY: [1, 2, 3, 4, 5, 6, 0],
    MON_JEU: [1, 4],
    MAR_VEN: [2, 5],
    LUNDI: [1],
    MARDI: [2],
    MERCREDI: [3],
    JEUDI: [4],
    VENDREDI: [5],
    SAMEDI: [6],
    DIMANCHE: [0],
  };

  // Map day index: Lun=1, Mar=2, ..., Dim=0
  const dayIndexes = [1, 2, 3, 4, 5, 6, 0];

  if (phase.phaseElixirs.length === 0) return null;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <h4 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
        Vue semaine
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-caps text-brun-mid uppercase tracking-wider px-2 py-1.5">Élixir</th>
              {days.map((d) => (
                <th key={d} className="text-center text-xs font-caps text-brun-mid uppercase tracking-wider px-2 py-1.5 w-12">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phase.phaseElixirs.map((pe) => {
              const activeDays = FREQ_DAY_MAP[pe.frequency] ?? dayIndexes;
              return (
                <tr key={pe.id} className="border-t border-or-pale/20">
                  <td className="text-sm font-ui text-brun-chaud px-2 py-2">{pe.elixirLibrary.name}</td>
                  {dayIndexes.map((di) => (
                    <td key={di} className="text-center px-2 py-2">
                      {activeDays.includes(di) ? (
                        <span className="inline-block w-5 h-5 rounded-full bg-or-sacre/20 border border-or-sacre/40 text-or-sacre text-xs leading-5">✓</span>
                      ) : (
                        <span className="inline-block w-5 h-5 rounded-full bg-brun-mid/5 text-brun-mid/20 text-xs leading-5">–</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Helpers ───

// ─── Jours Tab ───

interface DayInfo {
  dayNumber: number;
  date: Date;
  isPast: boolean;
  isToday: boolean;
  hasMorning: boolean;
  hasEvening: boolean;
}

function JoursTab({ phase }: { phase: ClientPhase }) {
  const [checkins, setCheckins] = useState<Record<string, { morning: boolean; evening: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/daily-checkins?clientId=${phase.clientId}&from=${phase.startDate}&to=${phase.endDate}`)
      .then((r) => (r.ok ? r.json() : { checkins: [] }))
      .then((data) => {
        const map: Record<string, { morning: boolean; evening: boolean }> = {};
        for (const c of data.checkins || []) {
          const dateKey = new Date(c.date).toISOString().split("T")[0];
          map[dateKey] = {
            morning: c.energyLevel != null,
            evening: c.gratitudeMoment != null || c.freeFeeling != null,
          };
        }
        setCheckins(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [phase.clientId, phase.startDate, phase.endDate]);

  // Build days list for this phase
  const start = new Date(phase.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(phase.endDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  now.setHours(12, 0, 0, 0);

  const duration = phase.phaseType === "DETOX" ? 10 : phase.phaseType === "CYCLE" ? 21 : 10;
  const days: DayInfo[] = [];
  for (let i = 0; i < duration; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateKey = date.toISOString().split("T")[0];
    const checkin = checkins[dateKey];
    days.push({
      dayNumber: i + 1,
      date,
      isPast: date < now,
      isToday: date.toDateString() === now.toDateString(),
      hasMorning: !!checkin?.morning,
      hasEvening: !!checkin?.evening,
    });
  }

  const completedDays = days.filter((d) => d.isPast && (d.hasMorning || d.hasEvening)).length;

  if (loading) return <p className="text-sm font-ui text-brun-mid/60">Chargement...</p>;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Suivi quotidien
        </h4>
        <span className="text-xs font-ui text-brun-mid/60">
          {completedDays}/{days.filter((d) => d.isPast).length} jours avec check-in
        </span>
      </div>

      <div className="space-y-1">
        {days.map((day) => {
          const dateStr = day.date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
          return (
            <div
              key={day.dayNumber}
              className={`flex items-center gap-3 py-2 px-3 rounded transition-colors ${
                day.isToday
                  ? "bg-or-sacre/10 border border-or-sacre/30"
                  : day.isPast
                  ? ""
                  : "opacity-40"
              }`}
            >
              <span className="font-ui text-xs text-brun-mid/60 w-8 shrink-0">J{day.dayNumber}</span>
              <span className="font-ui text-xs text-brun-chaud w-28 shrink-0">{dateStr}</span>
              {day.isPast || day.isToday ? (
                <div className="flex gap-4 text-xs font-ui">
                  <span className={day.hasMorning ? "text-foret" : "text-brun-mid/30"}>
                    ☀️ {day.hasMorning ? "✓" : "—"}
                  </span>
                  <span className={day.hasEvening ? "text-foret" : "text-brun-mid/30"}>
                    🌙 {day.hasEvening ? "✓" : "—"}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-ui text-brun-mid/30">À venir</span>
              )}
              {day.isToday && (
                <span className="text-[9px] font-ui text-or-sacre bg-or-sacre/10 px-2 py-0.5 rounded-full ml-auto">
                  Aujourd&apos;hui
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ───

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
