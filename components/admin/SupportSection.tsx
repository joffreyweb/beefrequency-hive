"use client";

import { useState } from "react";
import SupportForm from "./SupportForm";

// Icônes texte par type de support
const TYPE_ICONS: Record<string, string> = {
  MUSIC: "\uD83C\uDFB5",
  VIDEO: "\uD83C\uDFAC",
  PDF: "\uD83D\uDCC4",
  LINK: "\uD83D\uDD17",
};

interface Support {
  id: string;
  title: string;
  type: string;
  url: string;
  description: string | null;
  createdAt: string;
}

interface SupportSectionProps {
  clientId: string;
  initialSupports: Support[];
}

// Section supports dans la fiche client admin
export default function SupportSection({
  clientId,
  initialSupports,
}: SupportSectionProps) {
  const [supports, setSupports] = useState<Support[]>(initialSupports);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Recharger les supports après ajout
  async function refreshSupports() {
    try {
      const res = await fetch(`/api/supports?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setSupports(data.supports);
      }
    } catch {
      // Silencieux — les données initiales restent affichées
    }
    setShowForm(false);
  }

  // Supprimer un support
  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce support ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/supports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSupports((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Supports ({supports.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-ui px-3 py-1 bg-or-sacre text-creme-sacree rounded-sharp hover:bg-ambre-vif transition-colors"
        >
          {showForm ? "Annuler" : "Ajouter un support"}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5 mb-4">
          <SupportForm clientId={clientId} onSuccess={refreshSupports} />
        </div>
      )}

      {/* Liste des supports */}
      {supports.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <p className="text-sm text-brun-mid/60 font-ui">Aucun support.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {supports.map((support) => (
            <div
              key={support.id}
              className="bg-cire-chaude border border-or-pale rounded-sm p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-lg leading-none mt-0.5" aria-hidden="true">
                    {TYPE_ICONS[support.type] || "\uD83D\uDD17"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-ui text-brun-chaud font-normal truncate">
                        {support.title}
                      </h3>
                      <span className="text-xs font-ui text-brun-mid/50 shrink-0">
                        {support.type}
                      </span>
                    </div>
                    {support.description && (
                      <p className="text-sm font-ui text-brun-mid/70 mb-2">
                        {support.description}
                      </p>
                    )}
                    <a
                      href={support.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors break-all"
                    >
                      {support.url}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(support.id)}
                  disabled={deleting === support.id}
                  className="text-xs font-ui text-red-500 hover:text-red-700 transition-colors shrink-0 disabled:opacity-50"
                  title="Supprimer"
                >
                  {deleting === support.id ? "..." : "Supprimer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
