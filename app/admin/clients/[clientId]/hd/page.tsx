"use client";

import { useState, useEffect, use } from "react";

const HD_TYPES = ["Générateur", "Générateur Manifestant", "Manifesteur", "Projecteur", "Réflecteur"];
const HD_AUTHORITIES = ["Émotionnel", "Sacral", "Rate/Splénique", "Ego/Cœur", "Soi/Identité", "Mental/Environnement", "Lunaire"];
const HD_DEFINITIONS = ["Simple", "Split", "Triple Split", "Quadruple Split"];
const HD_PROFILES = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"];

interface HDData {
  hdType: string;
  authority: string;
  profile: string;
  definition: string;
  definedCenters: string;
  openCenters: string;
  gates: string;
  channels: string;
  incarnationCross: string;
  notes: string;
  aiSynthesis: string;
}

const EMPTY: HDData = {
  hdType: "", authority: "", profile: "", definition: "",
  definedCenters: "", openCenters: "", gates: "", channels: "",
  incarnationCross: "", notes: "", aiSynthesis: "",
};

export default function HDPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [data, setData] = useState<HDData>(EMPTY);
  const [clientName, setClientName] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/clients/${clientId}/hd`)
      .then(r => r.json())
      .then(d => {
        if (d.hd) setData(d.hd);
        if (d.clientName) setClientName(d.clientName);
      });
  }, [clientId]);

  function update(field: keyof HDData, value: string) {
    setData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/clients/${clientId}/hd`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    const res = await fetch(`/api/admin/clients/${clientId}/hd/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, clientName }),
    });
    const result = await res.json();
    if (result.synthesis) {
      setData(prev => ({ ...prev, aiSynthesis: result.synthesis }));
    }
    setAnalyzing(false);
  }

  const SelectField = ({ label, field, options }: { label: string; field: keyof HDData; options: string[] }) => (
    <div>
      <label className="block font-ui text-xs uppercase tracking-wider text-brun-mid mb-1">{label}</label>
      <select value={data[field]} onChange={e => update(field, e.target.value)}
        className="w-full px-3 py-2 border border-or-pale rounded-sm bg-cire-chaude text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre">
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const TextField = ({ label, field, placeholder, rows }: { label: string; field: keyof HDData; placeholder?: string; rows?: number }) => (
    <div>
      <label className="block font-ui text-xs uppercase tracking-wider text-brun-mid mb-1">{label}</label>
      {rows ? (
        <textarea value={data[field]} onChange={e => update(field, e.target.value)} rows={rows} placeholder={placeholder}
          className="w-full px-3 py-2 border border-or-pale rounded-sm bg-cire-chaude text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre resize-none" />
      ) : (
        <input type="text" value={data[field]} onChange={e => update(field, e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 border border-or-pale rounded-sm bg-cire-chaude text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre" />
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-brun-chaud">Human Design</h2>
          {clientName && <p className="font-ui text-sm text-brun-mid mt-1">{clientName}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 border border-or-sacre text-or-sacre font-ui text-xs uppercase tracking-wider rounded-sm hover:bg-or-sacre hover:text-white transition-colors disabled:opacity-40">
            {saving ? "Sauvegarde..." : saved ? "✓ Sauvegardé" : "Sauvegarder"}
          </button>
          <button onClick={handleAnalyze} disabled={analyzing || !data.hdType}
            className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-sm hover:bg-ambre-vif transition-colors disabled:opacity-40">
            {analyzing ? "Analyse en cours..." : "🐝 Analyser"}
          </button>
        </div>
      </div>

      {/* Données brutes */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 space-y-4">
        <h3 className="font-caps text-xs uppercase tracking-widest text-brun-mid">Données brutes — myBodyGraph.com</h3>
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Type" field="hdType" options={HD_TYPES} />
          <SelectField label="Autorité intérieure" field="authority" options={HD_AUTHORITIES} />
          <SelectField label="Profil" field="profile" options={HD_PROFILES} />
          <SelectField label="Définition" field="definition" options={HD_DEFINITIONS} />
        </div>
        <TextField label="Centres définis" field="definedCenters" placeholder="ex: Sacral, Gorge, Cœur..." />
        <TextField label="Centres ouverts" field="openCenters" placeholder="ex: Tête, Ajna, Rate..." />
        <TextField label="Gates principaux" field="gates" placeholder="ex: Gate 1, 8, 14, 34..." />
        <TextField label="Canaux actifs" field="channels" placeholder="ex: Canal 1-8, 14-2..." />
        <TextField label="Croix incarnée" field="incarnationCross" placeholder="ex: Croix du Sphinx..." />
        <TextField label="Notes personnelles" field="notes" placeholder="Observations de Joffrey..." rows={3} />
      </div>

      {/* Synthèse IA */}
      {data.aiSynthesis && (
        <div className="bg-creme-sacree border border-or-sacre/30 rounded-sm p-6">
          <h3 className="font-caps text-xs uppercase tracking-widest text-or-sacre mb-4">🐝 Synthèse — Communication & Accompagnement</h3>
          <div className="font-ui text-sm text-brun-chaud leading-relaxed whitespace-pre-wrap">{data.aiSynthesis}</div>
          <p className="text-xs text-brun-mid/50 mt-4">Généré par Claude · Basé sur Ra Uru Hu</p>
        </div>
      )}
    </div>
  );
}
