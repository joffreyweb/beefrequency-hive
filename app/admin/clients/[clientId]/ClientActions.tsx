"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClientActionsProps {
  clientId: string;
  clientName: string;
  blocked: boolean;
  clientStatus: string;
  inviteLink: string | null;
}

export default function ClientActions({
  clientId,
  clientName,
  blocked,
  clientStatus,
  inviteLink,
}: ClientActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(clientStatus);
  const [loading, setLoading] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteMotif, setDeleteMotif] = useState("");

  async function changeStatus(newStatus: string) {
    setLoading("status");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setLoading("");
    }
  }

  async function handleDelete() {
    if (deleteConfirmName.trim().toLowerCase() !== clientName.trim().toLowerCase()) {
      return;
    }
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif: deleteMotif || "Suppression demandee par l'admin" }),
      });
      if (res.ok) {
        router.push("/admin/clients");
      }
    } finally {
      setLoading("");
    }
  }

  async function handleSendEmail() {
    setLoading("email");
    setEmailStatus("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/send-invitation`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setEmailStatus("sent");
      } else {
        setEmailStatus(data.error || "Erreur");
      }
    } catch {
      setEmailStatus("Erreur de connexion");
    } finally {
      setLoading("");
    }
  }

  const isDeactivated = status === "DEACTIVATED";
  const isArchived = status === "ARCHIVED";

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-or-pale/50">
      {/* Badges statut */}
      {isDeactivated && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-sm font-ui text-orange-700">Client desactive — ne peut plus se connecter</span>
        </div>
      )}
      {isArchived && (
        <div className="flex items-center gap-2 px-3 py-2 bg-brun-mid/5 border border-brun-mid/20 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-brun-mid" />
          <span className="text-sm font-ui text-brun-mid">Client archive — dossier en lecture seule</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {/* Niveau 1 — Desactiver / Reactiver */}
        {!isArchived && (
          <>
            {isDeactivated ? (
              <button
                onClick={() => changeStatus("ACTIVE")}
                disabled={loading === "status"}
                className="px-3 py-1.5 border border-foret/30 text-foret text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-foret/5 transition-colors disabled:opacity-50"
              >
                {loading === "status" ? "..." : "Reactiver l'acces"}
              </button>
            ) : (
              <button
                onClick={() => changeStatus("DEACTIVATED")}
                disabled={loading === "status"}
                className="px-3 py-1.5 border border-orange-400/50 text-orange-600 text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-orange-50 transition-colors disabled:opacity-50"
              >
                {loading === "status" ? "..." : "Desactiver"}
              </button>
            )}
          </>
        )}

        {/* Niveau 2 — Archiver */}
        {!isArchived && !isDeactivated && (
          <button
            onClick={() => {
              if (window.confirm("Archiver ce client ? Le dossier passera en lecture seule.")) {
                changeStatus("ARCHIVED");
              }
            }}
            disabled={loading === "status"}
            className="px-3 py-1.5 border border-brun-mid/30 text-brun-mid text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-brun-mid/5 transition-colors disabled:opacity-50"
          >
            {loading === "status" ? "..." : "Archiver"}
          </button>
        )}

        {/* Reactiver depuis archive */}
        {isArchived && (
          <button
            onClick={() => {
              if (window.confirm("Reactiver ce client depuis l'archive ?")) {
                changeStatus("ACTIVE");
              }
            }}
            disabled={loading === "status"}
            className="px-3 py-1.5 border border-foret/30 text-foret text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-foret/5 transition-colors disabled:opacity-50"
          >
            {loading === "status" ? "..." : "Reactiver (desarchiver)"}
          </button>
        )}

        {/* Envoyer par email */}
        {inviteLink && (
          <button
            onClick={handleSendEmail}
            disabled={loading === "email"}
            className="px-3 py-1.5 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {loading === "email" ? "Envoi..." : "Envoyer par email"}
          </button>
        )}
        {emailStatus === "sent" && (
          <span className="text-xs font-ui text-foret">Email envoye</span>
        )}
        {emailStatus && emailStatus !== "sent" && (
          <span className="text-xs font-ui text-red-600">{emailStatus}</span>
        )}

        {/* Niveau 3 — Supprimer definitivement */}
        <button
          onClick={() => setDeleteStep(1)}
          className="px-3 py-1.5 border border-red-300 text-red-600 text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-red-50 transition-colors ml-auto"
        >
          Supprimer definitivement
        </button>
      </div>

      {/* Modale suppression — Etape 1 : avertissement */}
      {deleteStep >= 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-creme-sacree border border-or-pale rounded-[10px] p-6 w-full max-w-md shadow-xl">
            {deleteStep === 1 && (
              <>
                <h3 className="font-display text-lg text-red-700 mb-3">Suppression definitive</h3>
                <p className="text-sm font-ui text-brun-mid mb-4">
                  Cette action est <strong>irreversible</strong>. Toutes les donnees du client seront
                  supprimees : compte, journal, check-ins, sessions, documents, messages.
                </p>
                <p className="text-sm font-ui text-brun-mid mb-4">
                  Un log RGPD sera genere automatiquement comme preuve de suppression.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setDeleteStep(0)}
                    className="px-4 py-2 border border-or-pale text-brun-mid text-xs font-ui uppercase rounded-sharp hover:bg-cire-chaude transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setDeleteStep(2)}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-ui uppercase rounded-sharp hover:bg-red-700 transition-colors"
                  >
                    Continuer
                  </button>
                </div>
              </>
            )}

            {deleteStep === 2 && (
              <>
                <h3 className="font-display text-lg text-red-700 mb-3">Confirmation finale</h3>
                <p className="text-sm font-ui text-brun-mid mb-2">
                  Tapez le nom complet du client pour confirmer :
                </p>
                <p className="text-sm font-ui text-brun-chaud font-medium mb-3">
                  {clientName}
                </p>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="Nom complet du client"
                  className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui text-sm focus:outline-none focus:border-red-400 mb-3"
                />
                <div className="mb-4">
                  <label className="block text-xs font-ui text-brun-mid/60 uppercase tracking-wider mb-1">
                    Motif de suppression (RGPD)
                  </label>
                  <textarea
                    value={deleteMotif}
                    onChange={(e) => setDeleteMotif(e.target.value)}
                    placeholder="Ex: Demande du client, fin de programme..."
                    className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-brun-chaud font-ui text-sm focus:outline-none focus:border-red-400 h-20 resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => { setDeleteStep(0); setDeleteConfirmName(""); setDeleteMotif(""); }}
                    className="px-4 py-2 border border-or-pale text-brun-mid text-xs font-ui uppercase rounded-sharp hover:bg-cire-chaude transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={
                      loading === "delete" ||
                      deleteConfirmName.trim().toLowerCase() !== clientName.trim().toLowerCase()
                    }
                    className="px-4 py-2 bg-red-600 text-white text-xs font-ui uppercase rounded-sharp hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {loading === "delete" ? "Suppression..." : "Supprimer definitivement"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
