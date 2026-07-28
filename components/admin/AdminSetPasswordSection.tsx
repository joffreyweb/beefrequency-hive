"use client";

import { useState } from "react";

// Génère un mot de passe lisible (sans caractères ambigus). Math.random côté
// navigateur = OK (ce n'est pas un script de workflow).
function genPassword(): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Bloc admin sur la fiche client : définir un nouveau mot de passe pour le client
// (dépannage s'il l'a oublié), puis le lui communiquer. Aucun email.
export default function AdminSetPasswordSection({ clientId }: { clientId: string }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    if (pw.length < 8) {
      setMsg("Le mot de passe doit faire au moins 8 caractères.");
      setDone(false);
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: pw }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      setMsg(`Mot de passe défini ✓ — à communiquer au client : ${pw}`);
    } catch {
      setDone(false);
      setMsg("Échec de la définition du mot de passe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6">
      <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-1">
        Mot de passe du client
      </h2>
      <p className="text-xs font-ui text-brun-mid/60 mb-3">
        Définis un nouveau mot de passe pour ce client (s&apos;il l&apos;a oublié), puis
        communique-le-lui. Aucun email requis.
      </p>
      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="text"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Nouveau mot de passe (min 8)"
          className="px-3 py-2 bg-creme-sacree border border-or-pale rounded-[8px] text-brun-chaud font-ui text-sm flex-1 min-w-[180px] focus:outline-none focus:border-or-sacre"
        />
        <button
          type="button"
          onClick={() => setPw(genPassword())}
          className="px-3 py-2 rounded-[8px] border border-or-pale text-brun-mid text-sm font-ui hover:border-or-sacre transition-colors"
        >
          Générer
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy || pw.length < 8}
          className="px-4 py-2 rounded-[8px] bg-or-sacre text-white text-sm font-ui hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {busy ? "…" : "Définir"}
        </button>
      </div>
      {msg && (
        <p className={`text-xs font-ui mt-2 ${done ? "text-foret" : "text-red-600"}`}>{msg}</p>
      )}
    </div>
  );
}
