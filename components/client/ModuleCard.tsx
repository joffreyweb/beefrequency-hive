"use client";

import Link from "next/link";
import type { Lang } from "@/lib/translations";
import { t } from "@/lib/translations";

export interface ModuleCardData {
  id: string;
  nameFr: string;
  nameEn: string;
  duration: number;
  unlockedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

interface Props {
  module: ModuleCardData;
  lang: Lang;
}

export default function ModuleCard({ module: m, lang }: Props) {
  const T = (k: { EN: string; FR: string }) => k[lang];
  const title = lang === "FR" ? m.nameFr : m.nameEn;

  // Badge logic (ordre priorité : Terminé > En cours > Nouveau < 7j > aucun)
  let badge: { label: string; classes: string } | null = null;
  if (m.completedAt) {
    badge = { label: T(t.modules.moduleCompleted), classes: "bg-foret text-white" };
  } else if (m.startedAt) {
    badge = { label: T(t.modules.moduleInProgress), classes: "bg-or-sacre text-white" };
  } else if (m.unlockedAt) {
    const daysSince = (Date.now() - new Date(m.unlockedAt).getTime()) / 86400000;
    if (daysSince < 7) {
      badge = { label: T(t.modules.moduleNew), classes: "bg-or-sacre/20 text-or-sacre" };
    }
  }

  return (
    <Link
      href={`/client/mes-modules/${m.id}`}
      className="relative block bg-cire-chaude border border-or-pale rounded-sm overflow-hidden hover:border-or-sacre transition-colors"
    >
      {/* Image placeholder gradient (Module.imageUrl n'existe pas en V3b) */}
      <div className="aspect-[16/9] bg-gradient-to-br from-or-sacre/30 via-ambre-vif/20 to-brun-chaud/40" />

      {badge && (
        <span
          className={`absolute top-2 right-2 text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded ${badge.classes}`}
        >
          {badge.label}
        </span>
      )}

      <div className="p-4">
        <p className="font-display text-lg text-brun-chaud">{title}</p>
        <p className="font-ui text-xs text-brun-mid/70 mt-1">
          {m.duration} {T(t.modules.days)}
        </p>
      </div>
    </Link>
  );
}
