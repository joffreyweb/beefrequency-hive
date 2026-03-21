"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// ═══════════════════════════════════════
// Types pour les props du composant
// ═══════════════════════════════════════

interface AnalysisData {
  id: string;
  clientId: string;
  astroWestern: string | null;
  humanDesign: string | null;
  numerology: string | null;
  bazi: string | null;
  synthesisMarkdown: string | null;
  status: "PENDING" | "GENERATING" | "COMPLETE" | "ERROR";
  generatedAt: string | null;
}

interface IntakeData {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthTime: string | null;
  birthPlace: string;
  birthCountry: string;
  intention: string;
}

interface AnalysisSectionProps {
  clientId: string;
  analysis: AnalysisData | null;
  intake: IntakeData | null;
}

// ═══════════════════════════════════════
// Rendu markdown basique (pas besoin de lib)
// ═══════════════════════════════════════

function renderMarkdown(md: string): string {
  let html = md
    // Échapper le HTML
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Titres h3 (## )
    .replace(
      /^## (.+)$/gm,
      '<h3 class="font-display text-lg text-brun-chaud mt-6 mb-2 first:mt-0">$1</h3>'
    )
    // Titres h4 (### )
    .replace(
      /^### (.+)$/gm,
      '<h4 class="font-display text-base text-brun-chaud mt-4 mb-1">$1</h4>'
    )
    // Gras
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italique
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Listes à puces
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm font-ui text-brun-mid">$1</li>')
    // Paragraphes (lignes non vides qui ne sont pas déjà du HTML)
    .replace(
      /^(?!<[hlu]|<li)(.+)$/gm,
      '<p class="text-sm font-ui text-brun-mid leading-relaxed mb-2">$1</p>'
    );

  // Regrouper les li consécutifs dans des ul
  html = html.replace(
    /(<li[^>]*>.*?<\/li>\n?)+/g,
    '<ul class="list-disc mb-3">$&</ul>'
  );

  return html;
}

// ═══════════════════════════════════════
// Affichage récursif d'un objet JSON
// ═══════════════════════════════════════

function renderValue(value: unknown, depth = 0): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-brun-mid/40 text-sm font-ui">—</span>;
  }

  if (typeof value === "string") {
    return <span className="text-sm font-ui text-brun-mid">{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-sm font-ui text-brun-chaud font-medium">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-brun-mid/40 text-sm font-ui">Aucun</span>;
    }
    return (
      <ul className="list-disc ml-4 space-y-1">
        {value.map((item, i) => (
          <li key={i} className="text-sm font-ui text-brun-mid">
            {typeof item === "object" ? renderValue(item, depth + 1) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "object") {
    return (
      <div className={depth > 0 ? "ml-3 border-l border-or-pale/50 pl-3" : ""}>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="mb-2">
            <span className="text-xs font-caps text-brun-mid uppercase tracking-wider">
              {formatKey(k)}
            </span>
            <div className="mt-0.5">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-sm font-ui text-brun-mid">{String(value)}</span>;
}

/** Transforme une clé camelCase en label lisible */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/** Tente de parser un JSON string, retourne l'objet ou null */
function tryParse(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value; // Retourner le texte brut si ce n'est pas du JSON valide
  }
}

// ═══════════════════════════════════════
// Composant Accordion (section dépliable)
// ═══════════════════════════════════════

function AccordionSection({
  title,
  data,
}: {
  title: string;
  data: string | null;
}) {
  const [open, setOpen] = useState(false);
  const parsed = tryParse(data);

  if (!parsed) {
    return null;
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-creme-sacree/30 transition-colors duration-150"
      >
        <span className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-brun-mid/60 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-or-pale/30">
          <div className="pt-4">
            {typeof parsed === "string" ? (
              <p className="text-sm font-ui text-brun-mid whitespace-pre-wrap">
                {parsed}
              </p>
            ) : (
              renderValue(parsed)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// Composant principal
// ═══════════════════════════════════════

export default function AnalysisSection({
  clientId,
  analysis,
  intake,
}: AnalysisSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lancer ou regénérer l'analyse
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analysis/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la génération");
      }

      // Rafraîchir la page pour voir les résultats
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // ── Pas d'intake ──
  if (!intake) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <p className="text-sm text-brun-mid/60 font-ui">
          Le client n&apos;a pas encore compl&eacute;t&eacute; l&apos;onboarding.
        </p>
      </div>
    );
  }

  // ── Intake mais pas d'analyse ou PENDING ──
  if (!analysis || analysis.status === "PENDING") {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <p className="text-sm text-brun-mid/60 font-ui mb-4">
          L&apos;analyse n&apos;a pas encore &eacute;t&eacute; g&eacute;n&eacute;r&eacute;e.
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
        >
          {loading ? "G\u00e9n\u00e9ration en cours\u2026" : "Lancer l\u2019analyse"}
        </button>
        {error && (
          <p className="text-sm text-red-600 font-ui mt-3">{error}</p>
        )}
      </div>
    );
  }

  // ── En cours de génération ──
  if (analysis.status === "GENERATING") {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-or-sacre rounded-full animate-pulse" />
          <p className="text-sm text-brun-mid font-ui">
            Analyse en cours de g&eacute;n&eacute;ration&hellip;
          </p>
        </div>
      </div>
    );
  }

  // ── Erreur ──
  if (analysis.status === "ERROR") {
    return (
      <div className="space-y-4">
        <div className="bg-cire-chaude border border-red-300 rounded-sm p-5">
          <p className="text-sm text-red-600 font-ui mb-4">
            Une erreur est survenue lors de la g&eacute;n&eacute;ration de l&apos;analyse.
            {analysis.synthesisMarkdown || analysis.astroWestern || analysis.humanDesign || analysis.numerology || analysis.bazi
              ? " Certains r\u00e9sultats partiels ont \u00e9t\u00e9 sauvegard\u00e9s."
              : ""}
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
          >
            {loading ? "Reg\u00e9n\u00e9ration\u2026" : "Reg\u00e9n\u00e9rer l\u2019analyse"}
          </button>
          {error && (
            <p className="text-sm text-red-600 font-ui mt-3">{error}</p>
          )}
        </div>

        {/* Afficher les résultats partiels s'il y en a */}
        {(analysis.astroWestern || analysis.humanDesign || analysis.numerology || analysis.bazi) && (
          <div className="space-y-3">
            <AccordionSection title="Astrologie occidentale" data={analysis.astroWestern} />
            <AccordionSection title="Human Design" data={analysis.humanDesign} />
            <AccordionSection title="Num\u00e9rologie" data={analysis.numerology} />
            <AccordionSection title="BaZi" data={analysis.bazi} />
          </div>
        )}
      </div>
    );
  }

  // ── Analyse complète (COMPLETE) ──
  return (
    <div className="space-y-6">
      {/* Synthèse */}
      {analysis.synthesisMarkdown && (
        <div className="bg-cire-chaude border-2 border-or-sacre rounded-sm p-6">
          <h3 className="font-caps text-sm text-or-sacre uppercase tracking-wider mb-4">
            Synth&egrave;se
          </h3>
          <div
            className="prose-custom"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(analysis.synthesisMarkdown),
            }}
          />
          {analysis.generatedAt && (
            <p className="text-xs text-brun-mid/40 font-ui mt-4 pt-3 border-t border-or-pale/30">
              G&eacute;n&eacute;r&eacute;e le{" "}
              {new Date(analysis.generatedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}

      {/* 4 sections dépliables */}
      <div className="space-y-3">
        <AccordionSection title="Astrologie occidentale" data={analysis.astroWestern} />
        <AccordionSection title="Human Design" data={analysis.humanDesign} />
        <AccordionSection title="Num\u00e9rologie" data={analysis.numerology} />
        <AccordionSection title="BaZi" data={analysis.bazi} />
      </div>

      {/* Bouton regénérer */}
      <div className="pt-2">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2.5 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
        >
          {loading ? "Reg\u00e9n\u00e9ration\u2026" : "Reg\u00e9n\u00e9rer l\u2019analyse"}
        </button>
        {error && (
          <p className="text-sm text-red-600 font-ui mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
