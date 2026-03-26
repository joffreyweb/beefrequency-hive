"use client";

import { useState, useRef } from "react";

const CATEGORY_LABELS: Record<string, string> = {
  ANALYSE: "Analysis",
  IDENTITE: "Identity",
  MEDICAL: "Medical",
  AUTRE: "Other",
};

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
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

interface HomeDocumentsProps {
  clientDocuments: ClientDocument[];
}

export default function HomeDocuments({ clientDocuments }: HomeDocumentsProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>(clientDocuments);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("ANALYSE");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
    }
  }

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
        const data = await res.json();
        setDocuments((prev) => [data.document, ...prev]);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
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

  return (
    <div className="space-y-3">
      {/* Zone d'upload compacte */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-sm p-4 text-center transition-colors ${
          dragOver
            ? "border-or-sacre bg-creme-sacree/50"
            : "border-or-pale bg-cire-chaude"
        }`}
      >
        {selectedFile ? (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-brun-chaud font-ui text-sm truncate max-w-48">
              {mimeIcon(selectedFile.type)} {selectedFile.name}
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-or-pale rounded-sharp px-2 py-1 text-xs font-ui bg-white text-brun-chaud"
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
              className="bg-or-sacre text-white rounded-sharp px-3 py-1 text-xs font-ui hover:bg-ambre-vif transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Send"}
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-brun-mid text-xs font-ui hover:text-brun-chaud transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
            />
            <p className="text-brun-mid font-ui text-sm">
              Drag a file here or
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-or-sacre text-white rounded-sharp px-3 py-1 text-xs font-ui hover:bg-ambre-vif transition-colors"
            >
              Choose a file
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-xs font-ui mt-2">{error}</p>
        )}
      </div>

      {/* Liste compacte des documents */}
      {documents.length === 0 ? (
        <p className="text-brun-mid font-ui text-sm text-center py-2">
          No documents
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-cire-chaude border border-or-pale rounded-sm px-4 py-2.5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-lg flex-shrink-0">
                  {mimeIcon(doc.mimeType)}
                </span>
                <span className="text-brun-chaud font-ui text-sm truncate">
                  {doc.fileName}
                </span>
                <span className="text-brun-mid/60 text-xs font-ui flex-shrink-0 hidden sm:inline">
                  {formatSize(doc.fileSize)}
                </span>
                <span className="text-brun-mid/60 text-xs font-ui flex-shrink-0 hidden sm:inline">
                  {formatDate(doc.createdAt)}
                </span>
              </div>
              <a
                href={doc.fileUrl}
                download={doc.fileName}
                className="text-or-sacre text-xs font-ui hover:text-ambre-vif transition-colors flex-shrink-0"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
