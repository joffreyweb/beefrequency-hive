"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";
import PhotoLightbox, { type LightboxPhoto } from "./PhotoLightbox";

const PAGE_SIZE = 60;

const SOURCE_BADGE: Record<LightboxPhoto["source"], string> = {
  journal: "📓",
  morning: "🌅",
  evening: "🌙",
};

function shortDate(iso: string, lang: "EN" | "FR"): string {
  return new Date(iso).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

export default function PhotoGallery() {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];

  const [photos, setPhotos] = useState<LightboxPhoto[]>([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const load = useCallback(async (nextOffset: number, append: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/client/photos?limit=${PAGE_SIZE}&offset=${nextOffset}`);
      if (!res.ok) return;
      const data = await res.json();
      setTotal(data.total ?? 0);
      setHasMore(data.hasMore ?? false);
      setPhotos((prev) => (append ? [...prev, ...(data.photos ?? [])] : data.photos ?? []));
      setOffset(nextOffset);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, false);
  }, [load]);

  if (loading && photos.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 pt-6 mt-6 border-t border-or-pale">
      <h2 className="font-display text-xl text-brun-chaud">{T(t.gallery.title)}</h2>

      {photos.length === 0 ? (
        <p className="font-ui text-sm text-brun-mid/60 italic text-center py-6">{T(t.gallery.empty)}</p>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="relative aspect-square overflow-hidden bg-cire-chaude rounded-sm group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {SOURCE_BADGE[p.source]}
                </span>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] px-1 py-0.5 rounded font-ui">
                  {shortDate(p.date, lang)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="font-ui text-[11px] text-brun-mid/50">
              {photos.length} / {total}
            </p>
            {hasMore && (
              <button
                type="button"
                onClick={() => load(offset + PAGE_SIZE, true)}
                disabled={loading}
                className="px-4 py-2 border border-or-sacre text-or-sacre hover:bg-or-sacre hover:text-white font-ui text-xs uppercase tracking-wider rounded-sharp transition-colors disabled:opacity-50"
              >
                {loading ? "…" : T(t.gallery.loadMore)}
              </button>
            )}
          </div>
        </>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(n) => setLightboxIndex(n)}
          lang={lang}
        />
      )}
    </section>
  );
}
