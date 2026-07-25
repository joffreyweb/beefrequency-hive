"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

// Garde-fou d'erreur pour le remplissage Clarity : au lieu d'une page blanche
// muette, on affiche un message clair + une réf. technique (digest) pour le debug.
export default function ClarityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-4xl mb-4">🐝</div>
      <h1 className="font-display text-2xl text-brun-chaud mb-3">
        {T({ EN: "Something slipped up here", FR: "Un souci s'est glissé ici" })}
      </h1>
      <p className="font-ui text-sm text-brun-mid mb-6">
        {T({
          EN: "The answers you've already entered are saved. Try again — if the issue persists, let Joffrey know.",
          FR: "Tes réponses déjà saisies sont enregistrées. Réessaie — si le souci persiste, préviens Joffrey.",
        })}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
        >
          {T({ EN: "Try again", FR: "Réessayer" })}
        </button>
        <Link
          href="/client/home"
          className="px-6 py-2.5 border border-or-pale text-brun-mid rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-cire-chaude transition-colors"
        >
          {T({ EN: "Home", FR: "Accueil" })}
        </Link>
      </div>
      {error?.digest && (
        <p className="mt-6 font-ui text-[10px] text-brun-mid/40">
          {T({ EN: "technical ref.", FR: "réf. technique" })} : {error.digest}
        </p>
      )}
    </div>
  );
}
