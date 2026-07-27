"use client";

import { useLanguage } from "@/lib/LanguageContext";

// Accordion natif (HTML5 <details>) — instruction de prise d'un élixir, repliée par défaut.
// Accessible. Affiche uniquement la description (champ ElixirLibrary.description).
export default function ElixirInstructions({ description }: { description: string | null | undefined }) {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
  if (!description || !description.trim()) return null;

  return (
    <details className="mt-2 border-t border-or-pale/40 pt-2">
      <summary className="cursor-pointer list-none text-xs font-caps uppercase tracking-wider text-or-sacre hover:text-ambre-vif transition-colors flex items-center gap-1">
        <span className="transition-transform">▸</span> {T({ EN: "How to take it", FR: "Comment prendre" })}
      </summary>
      <p className="mt-2 text-sm font-ui text-brun-mid whitespace-pre-line">{description}</p>
    </details>
  );
}
