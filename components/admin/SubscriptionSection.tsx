"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  totalSessions: number;
  usedSessionsManual: number | null;
  autoUsedSessions: number;
  subscriptionNotes: string | null;
  startDate: string;
  offerType: string;
}

export default function SubscriptionSection({
  clientId,
  totalSessions: initTotal,
  usedSessionsManual: initManual,
  autoUsedSessions,
  subscriptionNotes: initNotes,
  startDate: initStart,
  offerType,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    totalSessions: initTotal || 0,
    usedSessionsManual: initManual as number | null,
    subscriptionNotes: initNotes || "",
  });

  const usedSessions = form.usedSessionsManual != null ? form.usedSessionsManual : autoUsedSessions;
  const remaining = Math.max(0, form.totalSessions - usedSessions);
  const isManual = form.usedSessionsManual != null;

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/admin/clients/${clientId}/parcours-stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalSessions: form.totalSessions,
          usedSessionsManual: form.usedSessionsManual,
          subscriptionNotes: form.subscriptionNotes || null,
        }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Abonnement
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors"
          >
            Modifier
          </button>
        )}
      </div>

      {!editing ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-caps text-[10px] text-brun-mid/60 uppercase tracking-wider">Offre</p>
            <p className="font-ui text-sm text-brun-chaud mt-0.5">{offerType}</p>
          </div>
          <div>
            <p className="font-caps text-[10px] text-brun-mid/60 uppercase tracking-wider">Date de début</p>
            <p className="font-ui text-sm text-brun-chaud mt-0.5">
              {new Date(initStart).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div>
            <p className="font-caps text-[10px] text-brun-mid/60 uppercase tracking-wider">Séances totales</p>
            <p className="font-ui text-lg text-brun-chaud">{form.totalSessions}</p>
          </div>
          <div>
            <p className="font-caps text-[10px] text-brun-mid/60 uppercase tracking-wider">Séances utilisées</p>
            <p className="font-ui text-lg text-brun-chaud">
              {usedSessions}
              {isManual
                ? <span className="text-[10px] text-amber-600 ml-1">(manuel)</span>
                : <span className="text-[10px] text-brun-mid/50 ml-1">(auto)</span>
              }
            </p>
          </div>
          <div>
            <p className="font-caps text-[10px] text-brun-mid/60 uppercase tracking-wider">Restantes</p>
            <p className={`font-ui text-lg ${remaining <= 1 ? "text-red-500" : "text-or-sacre"}`}>
              {remaining}
            </p>
          </div>
          {form.subscriptionNotes && (
            <div className="col-span-2">
              <p className="font-caps text-[10px] text-brun-mid/60 uppercase tracking-wider">Notes</p>
              <p className="font-ui text-sm text-brun-mid mt-0.5">{form.subscriptionNotes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Séances totales</label>
              <input
                type="number"
                value={form.totalSessions}
                onChange={(e) => setForm((p) => ({ ...p, totalSessions: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
              />
            </div>
            <div>
              <label className="block text-xs font-ui text-brun-mid mb-1">Séances utilisées</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={form.usedSessionsManual ?? ""}
                  onChange={(e) => setForm((p) => ({
                    ...p,
                    usedSessionsManual: e.target.value === "" ? null : parseInt(e.target.value) || 0,
                  }))}
                  placeholder={`Auto: ${autoUsedSessions}`}
                  className="w-24 px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre"
                />
                <span className="text-[10px] font-ui text-brun-mid/60">
                  Vide = auto ({autoUsedSessions} RDV passés)
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-ui text-brun-mid mb-1">Notes abonnement</label>
            <textarea
              value={form.subscriptionNotes}
              onChange={(e) => setForm((p) => ({ ...p, subscriptionNotes: e.target.value }))}
              rows={2}
              placeholder="Ex: Client transféré, avait déjà 3 séances utilisées..."
              className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif transition-colors disabled:opacity-50"
            >
              {saving ? "..." : "Enregistrer"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-brun-mid text-brun-mid font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
