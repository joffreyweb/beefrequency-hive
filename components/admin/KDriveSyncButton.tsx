"use client";

import { useState } from "react";

// Bouton admin « Tout archiver sur kDrive » — rejoue tous les archiveurs pour ce
// client (rattrape l'historique et relance à la demande). Le coffre-fort durable.
export default function KDriveSyncButton({ clientId }: { clientId: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function sync() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/kdrive-sync`, { method: "POST" });
      if (!res.ok) throw new Error();
      setMsg("Archivage relancé — les fichiers apparaîtront dans le dossier kDrive du client d'ici ~1 minute.");
    } catch {
      setMsg("Échec du lancement de l'archivage.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Archivage kDrive</h2>
          <p className="text-xs font-ui text-brun-mid/60 mt-1 max-w-xl">
            Copie toutes les pièces du client (documents, contrats, RGPD, questionnaire, Clarity,
            notes de séance, messages, journal, check-ins, cartes) dans son dossier kDrive.
            Double sécurité — rien ne se perd même si l&apos;app tombe.
          </p>
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={busy}
          className="px-4 py-2 rounded-[8px] bg-or-sacre text-white text-sm font-ui hover:bg-ambre-vif transition-colors disabled:opacity-50 shrink-0"
        >
          {busy ? "Archivage…" : "Tout archiver sur kDrive"}
        </button>
      </div>
      {msg && (
        <p className={`text-xs font-ui mt-3 ${msg.startsWith("Échec") ? "text-red-600" : "text-foret"}`}>{msg}</p>
      )}
    </div>
  );
}
