"use client";

import { useState } from "react";

type ClaritySubmissionLite = {
  id: string;
  status: string;
  sectionsDone: number;
} | null;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Activé — en attente (le client n'a pas encore commencé)",
  IN_PROGRESS: "En cours de remplissage",
  SUBMITTED: "Soumis par le client",
  GENERATING: "Génération de la synthèse…",
  READY: "Synthèse prête (non publiée)",
  PUBLISHED: "Rapport publié",
};

// Section fiche client admin : activer / désactiver Clarity par client.
// L'activation crée une ligne ClaritySubmission (DRAFT). La désactivation n'est
// possible que tant que le client n'a rien rempli (garde-fou anti-perte).
export default function ClientClaritySection({
  clientId,
  initialSubmission,
}: {
  clientId: string;
  initialSubmission: ClaritySubmissionLite;
}) {
  const [submission, setSubmission] = useState<ClaritySubmissionLite>(initialSubmission);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const active = submission !== null;
  const canDeactivate = active && submission.status === "DRAFT" && submission.sectionsDone === 0;

  function flash(text: string, ms = 3000) {
    setMsg(text);
    setTimeout(() => setMsg(""), ms);
  }

  async function activate() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/clarity`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubmission(data.submission);
      flash("Clarity activé ✓");
    } catch {
      flash("Échec de l'activation");
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/clarity`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "");
      }
      setSubmission(null);
      flash("Clarity désactivé ✓");
    } catch (e) {
      flash(e instanceof Error && e.message ? e.message : "Échec de la désactivation", 4500);
    } finally {
      setBusy(false);
    }
  }

  const isError = msg.startsWith("Échec") || msg.startsWith("Impossible");

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">Clarity by Beefrequency</h2>
        {msg && <span className={`text-xs font-ui ${isError ? "text-red-600" : "text-foret"}`}>{msg}</span>}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-ui text-brun-chaud">
          {active ? (
            <span>
              <span className="inline-block w-2 h-2 rounded-full bg-or-sacre mr-2 align-middle" />
              {STATUS_LABELS[submission.status] ?? submission.status}
            </span>
          ) : (
            <span className="text-brun-mid/60">Non activé pour ce client.</span>
          )}
        </div>

        {!active && (
          <button
            onClick={activate}
            disabled={busy}
            className="shrink-0 px-4 py-2 rounded-[8px] bg-or-sacre text-white text-sm font-ui disabled:opacity-50"
          >
            {busy ? "…" : "Activer Clarity"}
          </button>
        )}

        {active && canDeactivate && (
          <button
            onClick={deactivate}
            disabled={busy}
            className="shrink-0 px-4 py-2 rounded-[8px] border border-or-pale text-brun-mid text-sm font-ui disabled:opacity-50"
          >
            {busy ? "…" : "Désactiver"}
          </button>
        )}
      </div>

      {active && !canDeactivate && (
        <p className="text-xs font-ui text-brun-mid/50 mt-3">
          Le client a commencé son Clarity — la désactivation est verrouillée pour protéger ses réponses.
        </p>
      )}
      {!active && (
        <p className="text-xs font-ui text-brun-mid/50 mt-3">
          Active Clarity pour proposer le questionnaire guidé à ce client.
        </p>
      )}
    </div>
  );
}
