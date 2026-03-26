"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Labels français pour les catégories
const CATEGORY_LABELS: Record<string, string> = {
  ANALYSE: "Analysis",
  IDENTITE: "Identity",
  MEDICAL: "Medical",
  AUTRE: "Other",
};

// Icône selon le type MIME
function mimeIcon(mimeType: string): string {
  if (mimeType === "application/pdf") return "\u{1F4C4}";
  if (mimeType.startsWith("image/")) return "\u{1F5BC}";
  if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "\u{1F4DD}";
  return "\u{1F4C4}";
}

// Formate la taille en KB ou MB
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Formate la date
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface ClientDocument {
  id: string;
  clientId: string;
  uploadedBy: "CLIENT" | "ADMIN";
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: string;
  readByAdmin: boolean;
  createdAt: string;
}

export default function ClientDocumentsPage() {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("ANALYSE");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chargement des documents
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Gestion du drag & drop
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  }

  // Sélection via input
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  }

  // Envoi du fichier
  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", category);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await fetchDocuments();
      } else {
        const data = await res.json();
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("File upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Suppression d'un document
  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      // Erreur silencieuse
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          My documents
        </h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          Share your analyses, medical documents, and other files
        </p>
      </div>

      {/* Zone d'upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-sm p-8 text-center transition-colors ${
          dragOver
            ? "border-or-sacre bg-creme-sacree/50"
            : "border-or-pale bg-cire-chaude"
        }`}
      >
        {selectedFile ? (
          <div className="space-y-4">
            <p className="text-brun-chaud font-ui">
              {mimeIcon(selectedFile.type)} {selectedFile.name}{" "}
              <span className="text-brun-mid text-sm">
                ({formatSize(selectedFile.size)})
              </span>
            </p>

            <div className="flex items-center justify-center gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-or-pale rounded-sharp px-3 py-2 text-sm font-ui bg-white text-brun-chaud"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-or-sacre text-white rounded-sharp px-5 py-2 text-sm font-ui hover:bg-ambre-vif transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Send"}
              </button>

              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-brun-mid text-sm font-ui hover:text-brun-chaud transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-brun-mid font-ui">
              Drag and drop a file here
            </p>
            <p className="text-brun-mid/60 text-sm font-ui">or</p>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-or-sacre text-white rounded-sharp px-5 py-2 text-sm font-ui hover:bg-ambre-vif transition-colors"
            >
              Choose a file
            </button>
            <p className="text-brun-mid/50 text-xs font-ui mt-2">
              PDF, images or Word — 10 MB maximum
            </p>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm font-ui mt-3">{error}</p>
        )}
      </div>

      {/* Liste des documents */}
      {loading ? (
        <p className="text-brun-mid font-ui text-sm">
          Loading documents...
        </p>
      ) : documents.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
          <p className="text-brun-mid font-ui">No documents yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-cire-chaude border border-or-pale rounded-sm p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-2xl flex-shrink-0">
                  {mimeIcon(doc.mimeType)}
                </span>
                <div className="min-w-0">
                  <p className="text-brun-chaud font-ui text-sm truncate">
                    {doc.fileName}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-brun-mid/70 text-xs font-ui">
                      {formatSize(doc.fileSize)}
                    </span>
                    <span className="text-brun-mid/40 text-xs">·</span>
                    <span className="text-brun-mid/70 text-xs font-ui">
                      {formatDate(doc.createdAt)}
                    </span>
                    <span className="text-brun-mid/40 text-xs">·</span>
                    <span className="bg-creme-sacree text-brun-chaud text-xs font-ui px-2 py-0.5 rounded-sharp">
                      {CATEGORY_LABELS[doc.category] || doc.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={doc.fileUrl}
                  download={doc.fileName}
                  className="text-or-sacre text-sm font-ui hover:text-ambre-vif transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-brun-mid/60 text-sm font-ui hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
