"use client";

import { useState, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

export default function DocumentUploadButton() {
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", "AUTRE");

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSuccess(true);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const sendLabel = lang === "FR" ? "Envoyer" : "Send";
  const sendingLabel = lang === "FR" ? "Envoi..." : "Sending...";
  const cancelLabel = lang === "FR" ? "Annuler" : "Cancel";
  const successLabel = lang === "FR" ? "Document envoy\u00e9 avec succ\u00e8s." : "Document sent successfully.";

  return (
    <div className="text-center space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setSelectedFile(file);
            setError("");
            setSuccess(false);
          }
        }}
        accept=".pdf,.doc,.docx,image/*"
        className="hidden"
      />

      {success ? (
        <p className="text-sm font-ui text-foret">{successLabel}</p>
      ) : selectedFile ? (
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-ui text-brun-chaud truncate max-w-48">
            {selectedFile.name}
          </span>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors disabled:opacity-50"
          >
            {uploading ? sendingLabel : sendLabel}
          </button>
          <button
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="text-xs font-ui text-brun-mid/50 hover:text-brun-mid transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-sm font-ui text-brun-mid/50 hover:text-or-sacre transition-colors"
        >
          {T(t.home.shareDocument)} &rarr;
        </button>
      )}

      {error && <p className="text-xs font-ui text-red-600">{error}</p>}
    </div>
  );
}
