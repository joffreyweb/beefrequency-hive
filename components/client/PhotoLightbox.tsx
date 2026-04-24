"use client";

import { useEffect } from "react";

export interface LightboxPhoto {
  id: string;
  url: string;
  date: string;
  source: "journal" | "morning" | "evening";
  caption?: string | null;
  isPrivate?: boolean;
}

interface Props {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (next: number) => void;
  lang: "EN" | "FR";
}

const SOURCE_LABEL: Record<LightboxPhoto["source"], { EN: string; FR: string; emoji: string }> = {
  journal: { EN: "Journal", FR: "Journal", emoji: "📓" },
  morning: { EN: "Morning check-in", FR: "Check-in matin", emoji: "🌅" },
  evening: { EN: "Evening check-in", FR: "Check-in soir", emoji: "🌙" },
};

function formatDate(iso: string, lang: "EN" | "FR"): string {
  return new Date(iso).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PhotoLightbox({ photos, index, onClose, onNavigate, lang }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
      if (e.key === "ArrowRight" && index < photos.length - 1) onNavigate(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onNavigate]);

  const photo = photos[index];
  if (!photo) return null;

  const src = SOURCE_LABEL[photo.source];
  const dateStr = formatDate(photo.date, lang);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/90"
      onClick={onClose}
    >
      {/* Top bar : close */}
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-white/70 hover:text-white text-2xl w-10 h-10 flex items-center justify-center"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Photo centrée */}
      <div
        className="flex-1 flex items-center justify-center px-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {index > 0 && (
          <button
            type="button"
            onClick={() => onNavigate(index - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl w-10 h-10 flex items-center justify-center"
            aria-label="Previous"
          >
            ‹
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt=""
          className="max-w-[90vw] max-h-[75vh] object-contain rounded-sm"
        />
        {index < photos.length - 1 && (
          <button
            type="button"
            onClick={() => onNavigate(index + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-3xl w-10 h-10 flex items-center justify-center"
            aria-label="Next"
          >
            ›
          </button>
        )}
      </div>

      {/* Bas : métadonnées */}
      <div
        className="bg-black/50 px-6 py-4 text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-ui text-xs flex items-center gap-2">
          <span>{src.emoji}</span>
          <span>{src[lang]}</span>
          <span className="text-white/50">·</span>
          <span>{dateStr}</span>
          {photo.isPrivate && (
            <>
              <span className="text-white/50">·</span>
              <span className="italic text-white/60">🔒 {lang === "FR" ? "privée" : "private"}</span>
            </>
          )}
        </p>
        {photo.caption && (
          <p className="font-ui text-sm text-white/80 mt-2 whitespace-pre-wrap">{photo.caption}</p>
        )}
      </div>
    </div>
  );
}
