"use client";

import { useState, useEffect, useCallback } from "react";
import { CLARITY_MAPS, answerKey, CLARITY_TOTAL_SECTIONS } from "@/lib/clarity/maps";

type Lite = { id: string; status: string; sectionsDone: number } | null;
type Detail = {
  status: string; sectionsDone: number; answers: Record<string, string>;
  reportMd: string | null; reportToken: string;
} | null;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Activé — en attente (le client n'a pas encore commencé)",
  IN_PROGRESS: "En cours de remplissage",
  SUBMITTED: "Soumis par le client — prêt à générer",
  GENERATING: "Génération de la synthèse…",
  READY: "Synthèse prête (non publiée)",
  PUBLISHED: "Rapport publié",
};

const REPORTABLE = ["SUBMITTED", "GENERATING", "READY", "PUBLISHED"];

export default function ClientClaritySection({
  clientId,
  initialSubmission,
}: {
  clientId: string;
  initialSubmission: Lite;
}) {
  const [submission, setSubmission] = useState<Lite>(initialSubmission);
  const [detail, setDetail] = useState<Detail>(null);
  const [reportMd, setReportMd] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);
  const [copied, setCopied] = useState(false);

  const active = submission !== null;
  const status = submission?.status ?? "";
  const canDeactivate = active && status === "DRAFT" && (submission?.sectionsDone ?? 0) === 0;
  const showReport = active && REPORTABLE.includes(status);

  const flash = (t: string, ms = 3500) => { setMsg(t); setTimeout(() => setMsg(""), ms); };

  const loadDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/clarity`);
      const data = await res.json();
      if (data.submission) { setDetail(data.submission); setReportMd(data.submission.reportMd || ""); }
    } catch { /* silencieux */ }
  }, [clientId]);

  useEffect(() => { if (showReport) loadDetail(); }, [showReport, loadDetail]);

  async function activate() {
    setBusy("activate"); setMsg("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/clarity`, { method: "POST" });
      if (!res.ok) throw new Error();
      setSubmission((await res.json()).submission); flash("Clarity activé ✓");
    } catch { flash("Échec de l'activation"); } finally { setBusy(""); }
  }

  async function deactivate() {
    setBusy("deactivate"); setMsg("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/clarity`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "");
      setSubmission(null); setDetail(null); flash("Clarity désactivé ✓");
    } catch (e) { flash(e instanceof Error && e.message ? e.message : "Échec", 4500); } finally { setBusy(""); }
  }

  async function patch(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action); setMsg("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/clarity`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const s = data.submission?.status;
      if (s) setSubmission((prev) => (prev ? { ...prev, status: s } : prev));
      if (data.submission?.reportMd != null) setReportMd(data.submission.reportMd);
      await loadDetail();
      flash(
        action === "generate" ? "Rapport généré ✓" :
        action === "save" ? "Enregistré ✓" :
        action === "publish" ? "Publié ✓" : "Dépublié ✓"
      );
    } catch (e) { flash(e instanceof Error ? e.message : "Erreur", 6000); } finally { setBusy(""); }
  }

  const pollGeneration = useCallback(async () => {
    setBusy("generate");
    setMsg("Génération en cours… (elle continue même si tu changes d'écran)");
    try {
      for (let i = 0; i < 90; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        const res = await fetch(`/api/admin/clients/${clientId}/clarity`);
        const d = await res.json();
        const st = d.submission?.status;
        if (st && st !== "GENERATING") {
          setSubmission((prev) => (prev ? { ...prev, status: st } : prev));
          setDetail(d.submission);
          setReportMd(d.submission.reportMd || "");
          setMsg(st === "READY" || st === "PUBLISHED" ? "Rapport généré ✓" : "Génération échouée — réessaie.");
          setTimeout(() => setMsg(""), 5000);
          return;
        }
      }
      setMsg("Toujours en génération — patiente puis recharge la page.");
      setTimeout(() => setMsg(""), 6000);
    } finally {
      setBusy("");
    }
  }, [clientId]);

  async function handleGenerate() {
    setMsg("");
    setBusy("generate");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/clarity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSubmission((prev) => (prev ? { ...prev, status: "GENERATING" } : prev));
      await pollGeneration();
    } catch (e) {
      setBusy("");
      flash(e instanceof Error ? e.message : "Erreur", 6000);
    }
  }

  const reportUrl = detail ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${detail.reportToken}` : "";
  function copyLink() {
    if (!reportUrl) return;
    navigator.clipboard.writeText(reportUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }).catch(() => {});
  }

  const isError = msg.startsWith("Échec") || msg.startsWith("Impossible") || msg.startsWith("Génération échouée") || msg.startsWith("Aucun");

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
              {STATUS_LABELS[status] ?? status}
              {(status === "IN_PROGRESS" || status === "SUBMITTED") && (
                <span className="text-brun-mid/50"> · {submission?.sectionsDone ?? 0}/{CLARITY_TOTAL_SECTIONS} sections</span>
              )}
            </span>
          ) : (
            <span className="text-brun-mid/60">Non activé pour ce client.</span>
          )}
        </div>

        {!active && (
          <button onClick={activate} disabled={!!busy} className="shrink-0 px-4 py-2 rounded-[8px] bg-or-sacre text-white text-sm font-ui disabled:opacity-50">
            {busy === "activate" ? "…" : "Activer Clarity"}
          </button>
        )}
        {active && canDeactivate && (
          <button onClick={deactivate} disabled={!!busy} className="shrink-0 px-4 py-2 rounded-[8px] border border-or-pale text-brun-mid text-sm font-ui disabled:opacity-50">
            {busy === "deactivate" ? "…" : "Désactiver"}
          </button>
        )}
      </div>

      {/* Panneau rapport — dès que le client a soumis */}
      {showReport && (
        <div className="mt-5 pt-4 border-t border-or-pale/40 space-y-4">
          {/* Réponses (admin only) */}
          {detail && (
            <div>
              <button onClick={() => setShowAnswers((v) => !v)} className="text-xs font-caps uppercase tracking-wider text-or-sacre hover:text-ambre-vif">
                {showAnswers ? "▾ Masquer les réponses" : "▸ Voir les réponses du client"}
              </button>
              {showAnswers && (
                <div className="mt-3 max-h-72 overflow-y-auto space-y-3 bg-creme-sacree rounded-[8px] p-3">
                  {CLARITY_MAPS.map((m, mi) => (
                    <div key={m.id}>
                      <p className="font-caps text-[11px] uppercase tracking-wider text-brun-mid">{m.emoji} {m.label}</p>
                      {m.sections.map((sec, si) =>
                        sec.questions.map((q, qi) => {
                          const a = (detail.answers || {})[answerKey(mi, si, qi)];
                          if (!a) return null;
                          return (
                            <p key={`${mi}-${si}-${qi}`} className="text-xs font-ui text-brun-chaud mt-1">
                              <span className="text-brun-mid/60">{q.text}</span><br />→ {a}
                            </p>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Générer / Régénérer */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={!!busy}
              className="px-4 py-2 rounded-[8px] bg-or-sacre text-white text-sm font-ui disabled:opacity-50"
            >
              {busy === "generate" ? "Génération en cours… (~1-3 min)" : (detail?.reportMd ? "Régénérer la synthèse" : "Générer la synthèse")}
            </button>
            <span className="text-[11px] font-ui text-brun-mid/50">Rédigée localement par ton cerveau souverain (Ollama · VPS).</span>
          </div>

          {/* Éditeur + publier */}
          {(status === "READY" || status === "PUBLISHED" || reportMd) && (
            <div className="space-y-3">
              <label className="block text-xs font-caps uppercase tracking-wider text-brun-mid">Rapport (markdown · retravaille-le avant de publier)</label>
              <textarea
                value={reportMd}
                onChange={(e) => setReportMd(e.target.value)}
                rows={14}
                className="w-full px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-[8px] leading-relaxed"
                placeholder="Le rapport généré apparaîtra ici. Tu peux le retravailler librement."
              />
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => patch("save", { reportMd })} disabled={!!busy} className="px-4 py-2 rounded-[8px] border border-or-pale text-brun-mid text-sm font-ui disabled:opacity-50">
                  {busy === "save" ? "…" : "Enregistrer"}
                </button>
                {status !== "PUBLISHED" ? (
                  <button onClick={() => patch("publish")} disabled={!!busy || !reportMd.trim()} className="px-4 py-2 rounded-[8px] bg-foret text-white text-sm font-ui disabled:opacity-50">
                    {busy === "publish" ? "…" : "Publier au client"}
                  </button>
                ) : (
                  <button onClick={() => patch("unpublish")} disabled={!!busy} className="px-4 py-2 rounded-[8px] border border-red-200 text-red-500 text-sm font-ui disabled:opacity-50">
                    {busy === "unpublish" ? "…" : "Dépublier"}
                  </button>
                )}
              </div>

              {/* Lien /r */}
              {detail?.reportToken && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-caps uppercase tracking-wider text-brun-mid">Lien rapport :</span>
                  <code className="text-xs font-ui text-brun-chaud bg-creme-sacree px-2 py-1 rounded break-all">{reportUrl}</code>
                  <button onClick={copyLink} className="text-xs font-ui text-or-sacre hover:text-ambre-vif">{copied ? "copié ✓" : "copier"}</button>
                  {status === "PUBLISHED" && <span className="text-[11px] text-foret">✓ visible par le client</span>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {active && !canDeactivate && status === "DRAFT" && (
        <p className="text-xs font-ui text-brun-mid/50 mt-3">En attente que le client commence.</p>
      )}
      {!active && (
        <p className="text-xs font-ui text-brun-mid/50 mt-3">Active Clarity pour proposer le questionnaire guidé à ce client.</p>
      )}
    </div>
  );
}
