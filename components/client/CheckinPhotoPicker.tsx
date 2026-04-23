"use client";

import { useRef, useState } from "react";

interface Props {
  type: "morning" | "evening";
  value: string | null;
  onChange: (path: string | null) => void;
  labelAdd?: string;
  labelRemove?: string;
}

export default function CheckinPhotoPicker({
  type,
  value,
  onChange,
  labelAdd = "📷 Ajouter une photo",
  labelRemove = "Retirer",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    // Preview local (objectURL) pendant l'upload
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("type", type);
      const res = await fetch("/api/client/checkin/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur upload");
        setPreviewUrl(null);
        return;
      }
      const data = await res.json();
      onChange(data.path);
    } catch {
      setError("Erreur réseau");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove() {
    onChange(null);
    setPreviewUrl(null);
    setError("");
  }

  const displayUrl = previewUrl || (value ? `/api/client/uploads/${value}` : null);

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
      {displayUrl ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayUrl} alt="Photo du check-in" className="max-w-full max-h-64 rounded-sm border border-or-pale" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-xs font-ui text-brun-mid/70 hover:text-red-600 underline"
            >
              {labelRemove}
            </button>
            {uploading && <span className="text-xs font-ui text-brun-mid/50">Envoi…</span>}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-ui text-or-sacre hover:text-ambre-vif underline underline-offset-4 disabled:opacity-50"
        >
          {uploading ? "Envoi…" : labelAdd}
        </button>
      )}
      {error && <p className="text-xs font-ui text-red-600">{error}</p>}
    </div>
  );
}
