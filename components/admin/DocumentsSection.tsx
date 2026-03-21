"use client";

import { useState } from "react";

// Types pour un document client
interface ClientDocument {
  id: string;
  clientId: string;
  uploadedBy: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: "ANALYSE" | "IDENTITE" | "MEDICAL" | "AUTRE";
  readByAdmin: boolean;
  createdAt: string;
}

interface DocumentsSectionProps {
  documents: ClientDocument[];
  clientId: string;
}

// Labels lisibles pour les catégories
const CATEGORY_LABELS: Record<string, string> = {
  ANALYSE: "Analyse",
  IDENTITE: "Identité",
  MEDICAL: "Médical",
  AUTRE: "Autre",
};

// Formate la taille en KB ou MB
function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Icône simplifiée selon le type MIME
function DocIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) {
    return (
      <svg className="w-5 h-5 text-brun-mid/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
      </svg>
    );
  }
  if (mimeType === "application/pdf") {
    return (
      <svg className="w-5 h-5 text-brun-mid/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    );
  }
  // Icône générique document
  return (
    <svg className="w-5 h-5 text-brun-mid/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

export default function DocumentsSection({
  documents,
  clientId,
}: DocumentsSectionProps) {
  // État local pour marquer les documents lus côté client
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Marquer comme lu via l'API puis ouvrir le fichier
  const handleOpen = async (doc: ClientDocument) => {
    try {
      // L'appel GET marque readByAdmin=true côté serveur
      await fetch(`/api/documents/${doc.id}`);
      setReadIds((prev) => new Set(prev).add(doc.id));
    } catch {
      // En cas d'erreur, on ouvre quand même le fichier
    }
    // Ouvrir le fichier dans un nouvel onglet
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  // Détermine si un document est non lu (côté serveur ET pas encore marqué côté client)
  const isUnread = (doc: ClientDocument) =>
    !doc.readByAdmin && !readIds.has(doc.id);

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-or-pale/50">
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Fichier
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Taille
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Catégorie
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Date
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="border-b border-or-pale/20 last:border-b-0"
            >
              {/* Nom du fichier avec dot non lu */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {isUnread(doc) && (
                    <span className="w-2 h-2 rounded-full bg-or-sacre shrink-0" />
                  )}
                  <DocIcon mimeType={doc.mimeType} />
                  <span className="text-sm font-ui text-brun-chaud truncate max-w-xs">
                    {doc.fileName}
                  </span>
                </div>
              </td>
              {/* Taille formatée */}
              <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                {formatSize(doc.fileSize)}
              </td>
              {/* Badge catégorie */}
              <td className="px-4 py-3">
                <span className="text-xs font-ui px-2 py-0.5 rounded-sharp bg-or-sacre/10 text-or-sacre">
                  {CATEGORY_LABELS[doc.category] || doc.category}
                </span>
              </td>
              {/* Date */}
              <td className="px-4 py-3 text-xs font-ui text-brun-mid/70">
                {new Date(doc.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              {/* Bouton télécharger */}
              <td className="px-4 py-3">
                <button
                  onClick={() => handleOpen(doc)}
                  className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors duration-150 underline cursor-pointer"
                >
                  Télécharger
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
