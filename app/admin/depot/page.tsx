"use client";

import { useState } from "react";
import Link from "next/link";

const EXEMPLE = `{
  "programme": { "nom": "Sprint Instagram", "type": "sprint", "cadence": "1-2 par jour", "couleur": "#B8821E" },
  "elements": [
    { "ordre": 1, "titre": "Carte C01 — seuil", "type": "post_instagram", "format": "carte",
      "fichier": "C01_manifeste.png", "legende": "From fear to love...", "hashtags": "#frompoisontonectar",
      "epingle": false, "statut": "a_faire" },
    { "ordre": 2, "titre": "Reel — lever le cadre", "type": "post_instagram", "format": "reel",
      "fichier": "V_lift_frame.mp4", "legende": "When my being honors life...", "hashtags": "#frompoisontonectar",
      "epingle": true, "statut": "a_faire" }
  ]
}`;

interface ImportResult {
  ok: boolean;
  project?: { id: string; name: string };
  posts?: number;
  tasks?: number;
  total?: number;
  error?: string;
}

export default function DepotPage() {
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function loadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJson(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function derouler() {
    const text = json.trim();
    if (!text) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: text }),
      });
      setResult(await res.json());
    } catch {
      setResult({ ok: false, error: "Erreur réseau" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="font-caps text-[11px] tracking-[0.2em] uppercase text-or-sacre">Dépôt</p>
        <h1 className="font-display text-3xl text-brun-chaud mt-0.5">Déposer un programme</h1>
        <p className="font-ui text-sm text-brun-mid/70 mt-1">
          Colle ou dépose un fichier <span className="font-caps">JSON</span> — l&apos;app le déroule toute seule
          en projet + tâches/posts ordonnés. Re-déposer le même programme n&apos;écrase pas ta progression.
        </p>
      </div>

      <div className="bg-cire-chaude border border-or-pale rounded-[12px] p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="px-4 py-2 font-caps text-sm bg-or-sacre/10 text-or-sacre rounded-[8px] hover:bg-or-sacre/20 cursor-pointer">
            Choisir un fichier .json
            <input type="file" accept=".json,application/json" onChange={loadFile} className="hidden" />
          </label>
          <button
            onClick={() => setJson(EXEMPLE)}
            className="px-4 py-2 font-caps text-sm bg-or-pale/40 text-brun-mid rounded-[8px] hover:bg-or-pale/70"
          >
            Voir un exemple
          </button>
        </div>

        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder="Colle ton JSON ici…"
          rows={16}
          className="w-full px-4 py-3 font-mono text-[12px] text-brun-chaud bg-creme-sacree border border-or-pale rounded-[10px] focus:outline-none focus:border-or-sacre transition-colors"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={derouler}
            disabled={busy || !json.trim()}
            className="px-5 py-3 font-caps text-sm bg-or-sacre text-white rounded-[10px] hover:bg-ambre-profond transition-colors disabled:opacity-30"
          >
            {busy ? "Déroulement…" : "Dérouler le programme"}
          </button>
          <Link href="/admin/journee" className="font-ui text-sm text-brun-mid/60 hover:text-or-sacre">
            ← Ma Journée
          </Link>
        </div>

        {result && (
          <div
            className={`mt-2 p-4 rounded-[10px] border ${
              result.ok ? "border-foret/40 bg-foret/5" : "border-red-300 bg-red-50"
            }`}
          >
            {result.ok ? (
              <p className="font-ui text-sm text-brun-chaud">
                ✅ Programme « {result.project?.name} » déroulé —{" "}
                <span className="text-or-sacre">{result.posts}</span> post(s) +{" "}
                <span className="text-or-sacre">{result.tasks}</span> tâche(s). La prochaine action remonte
                dans Ma Journée.
              </p>
            ) : (
              <p className="font-ui text-sm text-red-600">⚠️ {result.error || "Échec de l'import"}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
