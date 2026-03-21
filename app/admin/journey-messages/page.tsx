"use client";

import { useState, useEffect, useCallback } from "react";

// --- Types ---

// Clés des variants Human Design
const HD_KEYS = [
  "GENERATOR",
  "MANIFESTOR",
  "MANIFESTING_GENERATOR",
  "PROJECTOR",
  "REFLECTOR",
  "DEFAULT",
] as const;

type HdKey = (typeof HD_KEYS)[number];

// Labels lisibles pour chaque variant
const HD_LABELS: Record<HdKey, string> = {
  GENERATOR: "Générateur",
  MANIFESTOR: "Manifesteur",
  MANIFESTING_GENERATOR: "Générateur M.",
  PROJECTOR: "Projecteur",
  REFLECTOR: "Réflecteur",
  DEFAULT: "Défaut",
};

// Un variant contient un sujet et un corps
interface HdVariant {
  subject: string;
  body: string;
}

// Type du déclencheur
type TriggerType = "JOURNEY_DAY" | "BIRTHDAY" | "CUSTOM";

// Template de message parcours
interface JourneyMessage {
  id: string;
  title: string;
  dayTrigger: number;
  triggerType: TriggerType;
  isActive: boolean;
  hdVariants: Record<HdKey, HdVariant>;
  createdAt: string;
  updatedAt: string;
}

// Client simplifié pour la liste de test
interface Client {
  id: string;
  name: string;
  email: string;
}

// Données fictives pour la prévisualisation
const PREVIEW_DATA: Record<string, string> = {
  firstName: "Marie",
  dayNumber: "7",
  offerType: "The Passage",
  nextSessionDate: "25 avril 2026",
};

// Variables disponibles dans les templates
const AVAILABLE_VARS = [
  "{{firstName}}",
  "{{dayNumber}}",
  "{{offerType}}",
  "{{nextSessionDate}}",
];

// Variants vides par défaut
function emptyVariants(): Record<HdKey, HdVariant> {
  const variants = {} as Record<HdKey, HdVariant>;
  for (const key of HD_KEYS) {
    variants[key] = { subject: "", body: "" };
  }
  return variants;
}

// Remplace les variables par des valeurs fictives
function renderPreview(text: string): string {
  let rendered = text;
  for (const [key, value] of Object.entries(PREVIEW_DATA)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}

// Compte le nombre de variants remplis (sujet ET corps non vides)
function countFilledVariants(variants: Record<HdKey, HdVariant>): number {
  return HD_KEYS.filter(
    (k) => variants[k]?.subject?.trim() && variants[k]?.body?.trim()
  ).length;
}

// --- Composant principal ---

export default function JourneyMessagesPage() {
  // État global
  const [templates, setTemplates] = useState<JourneyMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "editor" | "create">("list");

  // Template en cours d'édition
  const [editingTemplate, setEditingTemplate] =
    useState<JourneyMessage | null>(null);

  // Champs du formulaire d'édition / création
  const [formTitle, setFormTitle] = useState("");
  const [formDayTrigger, setFormDayTrigger] = useState(0);
  const [formTriggerType, setFormTriggerType] =
    useState<TriggerType>("JOURNEY_DAY");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formVariants, setFormVariants] = useState<Record<HdKey, HdVariant>>(
    emptyVariants()
  );

  // Onglet HD actif
  const [activeTab, setActiveTab] = useState<HdKey>("GENERATOR");

  // Prévisualisation
  const [previewKey, setPreviewKey] = useState<HdKey | null>(null);

  // Clients pour le test d'envoi
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Confirmation de suppression
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sauvegarde en cours
  const [saving, setSaving] = useState(false);

  // --- Chargement des templates ---
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/journey-messages");
      const data = await res.json();
      if (res.ok) {
        setTemplates(data.templates || data || []);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // --- Chargement des clients (pour la section test) ---
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (res.ok) {
        setClients(data.clients || data || []);
      }
    } catch {
      // Erreur silencieuse
    }
  }, []);

  // --- Basculer isActive sur un template ---
  async function toggleActive(template: JourneyMessage) {
    try {
      const res = await fetch(`/api/journey-messages/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !template.isActive }),
      });
      if (res.ok) {
        await fetchTemplates();
      }
    } catch {
      // Erreur silencieuse
    }
  }

  // --- Passer en vue éditeur ---
  function openEditor(template: JourneyMessage) {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormDayTrigger(template.dayTrigger);
    setFormTriggerType(template.triggerType);
    setFormIsActive(template.isActive);
    setFormVariants(template.hdVariants || emptyVariants());
    setActiveTab("GENERATOR");
    setPreviewKey(null);
    setConfirmDelete(false);
    setTestResult(null);
    setView("editor");
    fetchClients();
  }

  // --- Passer en vue création ---
  function openCreate() {
    setEditingTemplate(null);
    setFormTitle("");
    setFormDayTrigger(1);
    setFormTriggerType("JOURNEY_DAY");
    setFormIsActive(true);
    setFormVariants(emptyVariants());
    setActiveTab("GENERATOR");
    setPreviewKey(null);
    setConfirmDelete(false);
    setTestResult(null);
    setView("create");
    fetchClients();
  }

  // --- Retour à la liste ---
  function backToList() {
    setView("list");
    setEditingTemplate(null);
    setPreviewKey(null);
    setConfirmDelete(false);
    setTestResult(null);
    fetchTemplates();
  }

  // --- Mise à jour d'un variant ---
  function updateVariant(key: HdKey, field: "subject" | "body", value: string) {
    setFormVariants((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  // --- Sauvegarder (PATCH) ---
  async function handleSave() {
    if (!editingTemplate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/journey-messages/${editingTemplate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          dayTrigger: formDayTrigger,
          triggerType: formTriggerType,
          isActive: formIsActive,
          hdVariants: formVariants,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEditingTemplate(data.template || data);
        await fetchTemplates();
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setSaving(false);
    }
  }

  // --- Créer (POST) ---
  async function handleCreate() {
    setSaving(true);
    try {
      const res = await fetch("/api/journey-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          dayTrigger: formDayTrigger,
          triggerType: formTriggerType,
          isActive: formIsActive,
          hdVariants: formVariants,
        }),
      });
      if (res.ok) {
        backToList();
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setSaving(false);
    }
  }

  // --- Supprimer ---
  async function handleDelete() {
    if (!editingTemplate) return;
    try {
      const res = await fetch(`/api/journey-messages/${editingTemplate.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        backToList();
      }
    } catch {
      // Erreur silencieuse
    }
  }

  // --- Envoyer un test ---
  async function handleSendTest() {
    if (!editingTemplate || !selectedClientId) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/journey-messages/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: editingTemplate.id,
          clientId: selectedClientId,
        }),
      });
      if (res.ok) {
        setTestResult("Test envoyé avec succès");
      } else {
        setTestResult("Erreur lors de l'envoi");
      }
    } catch {
      setTestResult("Erreur lors de l'envoi");
    } finally {
      setSendingTest(false);
    }
  }

  // --- Rendu : chargement ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="font-ui text-sm text-brun-mid/60">
          Chargement des templates…
        </p>
      </div>
    );
  }

  // --- Rendu : vue liste ---
  if (view === "list") {
    // Tri par dayTrigger
    const sorted = [...templates].sort(
      (a, b) => a.dayTrigger - b.dayTrigger
    );

    return (
      <div>
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-light text-brun-chaud">
            Messages parcours
          </h1>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-or-sacre text-white text-sm font-ui rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
          >
            Nouveau template
          </button>
        </div>

        {/* Liste des templates */}
        {sorted.length === 0 ? (
          <p className="font-ui text-sm text-brun-mid/60">
            Aucun template pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((tpl) => {
              const filled = countFilledVariants(tpl.hdVariants || emptyVariants());
              return (
                <div
                  key={tpl.id}
                  className="bg-cire-chaude border border-or-pale rounded-sm p-4 flex items-center justify-between"
                >
                  {/* Informations */}
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-ui text-sm text-brun-chaud font-normal">
                          {tpl.title}
                        </span>
                        <span className="text-[10px] font-caps text-or-sacre bg-or-sacre/10 px-1.5 py-0.5 rounded-sharp uppercase tracking-wider">
                          {tpl.triggerType === "BIRTHDAY"
                            ? "Anniversaire"
                            : `J+${tpl.dayTrigger}`}
                        </span>
                      </div>
                      <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
                        {filled}/6 variants
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {/* Toggle isActive */}
                    <button
                      onClick={() => toggleActive(tpl)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                        tpl.isActive ? "bg-or-sacre" : "bg-brun-mid/20"
                      }`}
                      title={tpl.isActive ? "Actif" : "Inactif"}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                          tpl.isActive ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>

                    {/* Bouton éditer */}
                    <button
                      onClick={() => openEditor(tpl)}
                      className="px-3 py-1.5 text-xs font-ui text-or-sacre border border-or-pale rounded-sharp hover:bg-or-sacre/10 transition-colors duration-150"
                    >
                      Éditer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- Rendu : vue éditeur / création ---
  const isCreate = view === "create";

  return (
    <div>
      <div className="flex gap-6">
        {/* Colonne gauche — paramètres */}
        <div className="w-80 shrink-0 space-y-5">
          {/* Retour */}
          <button
            onClick={backToList}
            className="font-ui text-sm text-or-sacre hover:text-ambre-vif transition-colors duration-150"
          >
            ← Retour à la liste
          </button>

          {/* Formulaire paramètres */}
          <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
            {/* Titre */}
            <div>
              <label className="block font-caps text-[10px] text-brun-mid uppercase tracking-wider mb-1">
                Titre du template
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
                placeholder="Ex : Bienvenue J+1"
              />
            </div>

            {/* Jour déclencheur */}
            <div>
              <label className="block font-caps text-[10px] text-brun-mid uppercase tracking-wider mb-1">
                Jour déclencheur
              </label>
              <input
                type="number"
                value={formDayTrigger}
                onChange={(e) => setFormDayTrigger(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block font-caps text-[10px] text-brun-mid uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={formTriggerType}
                onChange={(e) =>
                  setFormTriggerType(e.target.value as TriggerType)
                }
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
              >
                <option value="JOURNEY_DAY">Jour du parcours</option>
                <option value="BIRTHDAY">Anniversaire</option>
                <option value="CUSTOM">Personnalisé</option>
              </select>
            </div>

            {/* Toggle isActive */}
            <div className="flex items-center justify-between">
              <span className="font-caps text-[10px] text-brun-mid uppercase tracking-wider">
                Actif
              </span>
              <button
                onClick={() => setFormIsActive((prev) => !prev)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
                  formIsActive ? "bg-or-sacre" : "bg-brun-mid/20"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform duration-200 ${
                    formIsActive ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-2 pt-2">
              <button
                onClick={isCreate ? handleCreate : handleSave}
                disabled={saving || !formTitle.trim()}
                className="w-full px-4 py-2 bg-or-sacre text-white text-sm font-ui rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
              >
                {saving
                  ? "Enregistrement…"
                  : isCreate
                    ? "Créer le template"
                    : "Sauvegarder"}
              </button>

              {!isCreate && (
                <>
                  {confirmDelete ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-ui rounded-sharp hover:bg-red-700 transition-colors duration-150"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 px-3 py-2 border border-or-pale text-brun-mid text-xs font-ui rounded-sharp hover:bg-creme-sacree transition-colors duration-150"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full px-4 py-2 border border-red-300 text-red-600 text-sm font-ui rounded-sharp hover:bg-red-50 transition-colors duration-150"
                    >
                      Supprimer
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Section test — uniquement en édition */}
          {!isCreate && editingTemplate && (
            <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-3">
              <h3 className="font-caps text-[10px] text-brun-mid uppercase tracking-wider">
                Envoyer un test
              </h3>

              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSendTest}
                disabled={sendingTest || !selectedClientId}
                className="w-full px-4 py-2 border border-or-pale text-or-sacre text-sm font-ui rounded-sharp hover:bg-or-sacre/10 transition-colors duration-150 disabled:opacity-50"
              >
                {sendingTest ? "Envoi en cours…" : "Envoyer à ce client"}
              </button>

              {testResult && (
                <p
                  className={`text-xs font-ui ${
                    testResult.includes("succès")
                      ? "text-foret"
                      : "text-red-600"
                  }`}
                >
                  {testResult}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Colonne droite — onglets HD et éditeur de contenu */}
        <div className="flex-1">
          {/* Onglets des variants HD */}
          <div className="flex border-b border-or-pale mb-5">
            {HD_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key);
                  setPreviewKey(null);
                }}
                className={`px-3 py-2 text-xs font-ui transition-colors duration-150 ${
                  activeTab === key
                    ? "border-b-2 border-or-sacre text-or-sacre"
                    : "text-brun-mid/60 hover:text-brun-chaud"
                }`}
              >
                {HD_LABELS[key]}
              </button>
            ))}
          </div>

          {/* Contenu de l'onglet actif */}
          <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 space-y-4">
            {/* Sujet */}
            <div>
              <label className="block font-caps text-[10px] text-brun-mid uppercase tracking-wider mb-1">
                Sujet
              </label>
              <input
                type="text"
                value={formVariants[activeTab]?.subject || ""}
                onChange={(e) =>
                  updateVariant(activeTab, "subject", e.target.value)
                }
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre"
                placeholder="Sujet du message"
              />
            </div>

            {/* Corps */}
            <div>
              <label className="block font-caps text-[10px] text-brun-mid uppercase tracking-wider mb-1">
                Corps du message
              </label>
              <textarea
                rows={10}
                value={formVariants[activeTab]?.body || ""}
                onChange={(e) =>
                  updateVariant(activeTab, "body", e.target.value)
                }
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp text-brun-chaud focus:outline-none focus:border-or-sacre resize-y"
                placeholder="Corps du message…"
              />
            </div>

            {/* Variables disponibles */}
            <div>
              <p className="font-caps text-[10px] text-brun-mid uppercase tracking-wider mb-1.5">
                Variables disponibles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARS.map((v) => (
                  <span
                    key={v}
                    className="text-[10px] font-ui text-foret bg-foret/10 px-2 py-0.5 rounded-sharp"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Bouton prévisualiser */}
            <button
              onClick={() =>
                setPreviewKey(previewKey === activeTab ? null : activeTab)
              }
              className="px-4 py-2 border border-or-pale text-or-sacre text-sm font-ui rounded-sharp hover:bg-or-sacre/10 transition-colors duration-150"
            >
              {previewKey === activeTab ? "Masquer l'aperçu" : "Prévisualiser"}
            </button>

            {/* Zone de prévisualisation */}
            {previewKey === activeTab && (
              <div className="mt-3 p-4 bg-creme-sacree border border-or-pale/50 rounded-sharp space-y-2">
                <p className="font-caps text-[10px] text-brun-mid uppercase tracking-wider">
                  Aperçu
                </p>
                <p className="text-sm font-ui text-brun-chaud font-normal">
                  <span className="text-brun-mid/60">Sujet :</span>{" "}
                  {renderPreview(formVariants[activeTab]?.subject || "")}
                </p>
                <div className="text-sm font-ui text-brun-chaud whitespace-pre-wrap leading-relaxed">
                  {renderPreview(formVariants[activeTab]?.body || "")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
