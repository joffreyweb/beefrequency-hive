"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface Point {
  date: string;
  energy: number;
  sleep: number | null;
}

interface MirrorData {
  visible: boolean;
  dayIndex: number;
  cadenceDays: number;
  points: Point[];
  weekCount: number;
  totalCheckins: number;
  avgEnergy: number | null;
  trend: "up" | "down" | "flat" | null;
}

// Miroir de progression — carte accueil client.
// Redonne au client ses propres données : courbe d'énergie récente + assiduité.
// Rend null tant qu'il n'y a rien à refléter (aucune carte vide).
export default function ProgressMirror() {
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
  const [data, setData] = useState<MirrorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/mirror")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  // Visible uniquement dans la fenêtre d'un cap de 21 jours (logique serveur).
  if (!data || !data.visible) return null;

  const pts = data.points.slice(-14); // 14 derniers points pour la courbe

  // Sparkline SVG (énergie 1→10).
  const W = 280;
  const H = 64;
  const PAD = 8;
  let path = "";
  let lastDot: { x: number; y: number } | null = null;
  if (pts.length >= 2) {
    const xs = pts.map((_, i) => PAD + (i * (W - 2 * PAD)) / (pts.length - 1));
    const ys = pts.map((p) => H - PAD - ((p.energy - 1) / 9) * (H - 2 * PAD));
    path = xs
      .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`)
      .join(" ");
    lastDot = { x: xs[xs.length - 1], y: ys[ys.length - 1] };
  }

  const trendLabel =
    data.trend === "up"
      ? { icon: "↗", text: T({ EN: "rising", FR: "en hausse" }), cls: "text-foret" }
      : data.trend === "down"
        ? { icon: "↘", text: T({ EN: "gentler", FR: "plus doux" }), cls: "text-brun-mid" }
        : data.trend === "flat"
          ? { icon: "→", text: T({ EN: "steady", FR: "stable" }), cls: "text-brun-mid" }
          : null;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">
          {T({ EN: "Your reflection", FR: "Ton reflet" })}
        </p>
        <span className="text-xs font-ui text-brun-mid/60">
          {T({ EN: "A milestone", FR: "Un point d'étape" })} · {T({ EN: "day", FR: "jour" })} {data.dayIndex}
        </span>
      </div>

      {/* Courbe d'énergie */}
      {pts.length >= 2 ? (
        <>
          <div className="flex items-baseline justify-between mb-1">
            <p className="font-ui text-xs text-brun-mid/60">
              {T({ EN: "Energy — last days", FR: "Énergie — derniers jours" })}
            </p>
            {data.avgEnergy != null && (
              <p className="font-ui text-xs text-brun-mid">
                {T({ EN: "avg", FR: "moy." })}{" "}
                <span className="text-brun-chaud font-medium">{data.avgEnergy}</span>
                <span className="text-brun-mid/40">/10</span>
                {trendLabel && (
                  <span className={`ml-2 ${trendLabel.cls}`}>
                    {trendLabel.icon} {trendLabel.text}
                  </span>
                )}
              </p>
            )}
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-16"
            preserveAspectRatio="none"
            role="img"
            aria-label={T({ EN: "Energy trend", FR: "Tendance d'énergie" })}
          >
            <path
              d={path}
              fill="none"
              stroke="#C9A227"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {lastDot && <circle cx={lastDot.x} cy={lastDot.y} r="3.5" fill="#C9A227" />}
          </svg>
        </>
      ) : (
        <p className="font-ui text-sm text-brun-mid/60 py-2">
          {T({
            EN: "Keep noting your mornings — your curve appears after a few check-ins.",
            FR: "Continue tes check-ins du matin — ta courbe apparaît après quelques jours.",
          })}
        </p>
      )}

      <p className="font-ui text-xs text-brun-mid/50 mt-3">
        {T({
          EN: `A reflection set down every ${data.cadenceDays} days — then it fades. Nothing to achieve, only to contemplate.`,
          FR: `Un reflet posé tous les ${data.cadenceDays} jours — puis il s'efface. Rien à réussir, seulement à contempler.`,
        })}
      </p>
    </div>
  );
}
