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

type PhaseTab = "general" | "elixirs" | "pratiques" | "checkins";

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
      {activeTab === "checkins" && <CheckinsTab phase={phase} onUpdate={onUpdate} />}
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

function CheckinsTab({ phase, onUpdate }: { phase: ClientPhase; onUpdate: () => void }) {
  const [morningEnabled, setMorningEnabled] = useState(phase.morningCheckinEnabled);
  const [eveningEnabled, setEveningEnabled] = useState(phase.eveningCheckinEnabled);
  const [checkinMode, setCheckinMode] = useState(phase.checkinMode);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMorningEnabled(phase.morningCheckinEnabled);
    setEveningEnabled(phase.eveningCheckinEnabled);
    setCheckinMode(phase.checkinMode);
    setSaved(false);
  }, [phase.id, phase.morningCheckinEnabled, phase.eveningCheckinEnabled, phase.checkinMode]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/client-phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          morningCheckinEnabled: morningEnabled,
          eveningCheckinEnabled: eveningEnabled,
          checkinMode,
        }),
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

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 space-y-5">
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={morningEnabled}
            onChange={(e) => setMorningEnabled(e.target.checked)}
            className="w-4 h-4 accent-or-sacre"
          />
          <span className="text-sm font-ui text-brun-chaud">Check-in matin activé</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={eveningEnabled}
            onChange={(e) => setEveningEnabled(e.target.checked)}
            className="w-4 h-4 accent-or-sacre"
          />
          <span className="text-sm font-ui text-brun-chaud">Check-in soir activé</span>
        </label>
      </div>

      <div>
        <label className="block text-xs font-ui text-brun-mid mb-1">Mode check-in</label>
        <select
          value={checkinMode}
          onChange={(e) => setCheckinMode(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm font-ui text-brun-chaud bg-white border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
        >
          <option value="full">Complet (toutes les questions)</option>
          <option value="light">Allégé (questions essentielles)</option>
        </select>
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

// ─── Elixirs Block ───

function ElixirsBlock({ phase, allPhases, onUpdate }: { phase: ClientPhase; allPhases: ClientPhase[]; onUpdate: () => void }) {
  const [showAssign, setShowAssign] = useState(false);
  const [library, setLibrary] = useState<ElixirLib[]>([]);
  const [selectedElixirId, setSelectedElixirId] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("DAILY");
  const [timing, setTiming] = useState("FLEXIBLE");
  const [applyTo, setApplyTo] = useState("this"); // this | all_cycles | all_breaks | all
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
      if (applyTo === "all_cycles") {
        targetPhaseIds = allPhases.filter((p) => p.phaseType === "CYCLE").map((p) => p.id);
      } else if (applyTo === "all_breaks") {
        targetPhaseIds = allPhases.filter((p) => p.phaseType === "BREAK").map((p) => p.id);
      } else if (applyTo === "all") {
        targetPhaseIds = allPhases.map((p) => p.id);
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
              <option value="all_cycles">Tous les Cycles (1, 2, 3)</option>
              <option value="all_breaks">Toutes les Intégrations (1, 2, 3)</option>
              <option value="all">Toutes les phases</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button onClick={handleAssign} disabled={saving || !selectedElixirId}
              className="px-4 py-1.5 text-xs font-ui bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50">
              {saving ? "..." : applyTo === "this" ? "Assigner" : `Assigner (${
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
            <div key={pe.id} className="flex items-center justify-between py-2 border-b border-or-pale/30 last:border-0">
              <div>
                <span className="text-sm font-ui text-brun-chaud">{pe.elixirLibrary.name}</span>
                <span className="text-xs font-ui text-brun-mid/60 ml-2">
                  {pe.dose || pe.elixirLibrary.dosage} · {TIMING_LABELS[pe.timing]} · {FREQ_LABELS[pe.frequency]}
                </span>
              </div>
              <button onClick={() => handleRemove(pe.id)}
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
