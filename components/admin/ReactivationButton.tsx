"use client";

import { useState } from "react";

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

// Bouton manuel de relance sur la fiche client (envoie l'email « On pense à toi »).
// Réutilise /api/admin/send-reactivation-email (même route que le widget dashboard).
export default function ReactivationButton({
  clientId,
  lastReactivationAt,
}: {
  clientId: string;
  lastReactivationAt: string | null;
}) {
  const [sending, setSending] = useState(false);
  const [last, setLast] = useState<string | null>(lastReactivationAt);
  const [msg, setMsg] = useState("");

  async function relance() {
    if (!confirm("Envoyer l'email de relance « On pense à toi » à ce client ?")) return;
    setSending(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/send-reactivation-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        setLast(d.lastReactivationAt ?? new Date().toISOString());
        setMsg("Relance envoyée ✓");
        setTimeout(() => setMsg(""), 4000);
      } else {
        setMsg("Échec de l'envoi");
      }
    } catch {
      setMsg("Échec de l'envoi");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        onClick={relance}
        disabled={sending}
        title={last ? `Dernière relance : ${fmt(last)}` : "Aucune relance envoyée"}
        className="px-3 py-1.5 border border-or-pale text-brun-mid text-xs font-ui uppercase tracking-wider rounded-sharp hover:border-or-sacre hover:text-or-sacre transition-colors disabled:opacity-50"
      >
        {sending ? "Envoi…" : "Relancer"}
      </button>
      {(msg || last) && (
        <span className={`text-[10px] font-ui ${msg.startsWith("Échec") ? "text-red-600" : "text-brun-mid/50"}`}>
          {msg || (last ? `Relancé le ${fmt(last)}` : "")}
        </span>
      )}
    </div>
  );
}
