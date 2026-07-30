"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

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

const CATEGORY_LABELS: Record<string, string> = {
  ANALYSE: "Analyse",
  IDENTITE: "Identité",
  MEDICAL: "Médical",
  AUTRE: "Autre",
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  return (
    <svg className="w-5 h-5 text-brun-mid/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

export default function DocumentsSection({ documents, clientId }: DocumentsSectionProps) {
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<"ANALYSE" | "IDENTITE" | "MEDICAL" | "AUTRE">("AUTRE");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("category", category);
      fd.append("clientId", clientId);
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error || "Échec de l'envoi.");
      } else {
        setMsg(`« ${file.name} » déposé pour le client ✓`);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        router.refresh();
      }
    } catch {
      setMsg("Erreur réseau.");
    } finally {
      setUploading(false);
    }
  }

  const handleOpen = async (doc: ClientDocument) => {
    try {
      await fetch(`/api/documents/${doc.id}`);
      setReadIds((prev) => new Set(prev).add(doc.id));
    } catch {
      /* on ouvre quand même */
    }
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  };

  const isUnread = (doc: ClientDocument) => !doc.readByAdmin && !readIds.has(doc.id);

  return (
    <div className="space-y-4">
      {/* Déposer un document POUR le client (admin -> client) */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-4">
        <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-3">Déposer un document pour le client</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm font-ui text-brun-chaud file:mr-3 file:px-3 file:py-1.5 file:rounded-sharp file:border-0 file:bg-or-sacre/10 file:text-or-sacre file:font-caps file:cursor-pointer"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "ANALYSE" | "IDENTITE" | "MEDICAL" | "AUTRE")}
            className="px-3 py-2 text-sm font-ui bg-creme-sacree border border-or-pale rounded-sharp focus:outline-none focus:border-or-sacre"
          >
            <option value="AUTRE">Autre</option>
            <option value="ANALYSE">Analyse</option>
            <option value="IDENTITE">Identité</option>
            <option value="MEDICAL">Médical</option>
          </select>
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="px-4 py-2 font-caps text-sm bg-or-sacre text-white rounded-sharp hover:bg-ambre-profond transition-colors disabled:opacity-30"
          >
            {uploading ? "Envoi…" : "Déposer pour le client"}
          </button>
          {msg && <span className="font-ui text-xs text-brun-mid/70">{msg}</span>}
        </div>
        <p className="font-ui text-[11px] text-brun-mid/50 mt-2">
          PDF, Word ou image · 10 Mo max · le client le voit dans son espace « Documents » · archivé sur kDrive.
        </p>
      </div>

      {/* Liste des documents */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm overflow-hidden">
        {documents.length === 0 ? (
          <p className="px-4 py-6 text-sm font-ui text-brun-mid/50">Aucun document.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-or-pale/50">
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Fichier</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Sens</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Taille</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Catégorie</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-or-pale/20 last:border-b-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isUnread(doc) && <span className="w-2 h-2 rounded-full bg-or-sacre shrink-0" />}
                      <DocIcon mimeType={doc.mimeType} />
                      <span className="text-sm font-ui text-brun-chaud truncate max-w-xs">{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-ui px-2 py-0.5 rounded-sharp ${doc.uploadedBy === "ADMIN" ? "bg-foret/10 text-foret" : "bg-or-sacre/10 text-or-sacre"}`}>
                      {doc.uploadedBy === "ADMIN" ? "↗ envoyé" : "↙ reçu"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-ui text-brun-mid">{formatSize(doc.fileSize)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-ui px-2 py-0.5 rounded-sharp bg-or-sacre/10 text-or-sacre">
                      {CATEGORY_LABELS[doc.category] || doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-ui text-brun-mid/70">
                    {new Date(doc.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleOpen(doc)} className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors duration-150 underline cursor-pointer">
                      Ouvrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
