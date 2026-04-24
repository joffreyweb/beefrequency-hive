"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/translations";

interface ModuleDay {
  id: string;
  dayNumber: number;
  elixirs: unknown;
  practices: unknown;
  notification: string | null;
}

interface ClientModuleLite {
  id: string;
  unlockedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface ModuleDetail {
  id: string;
  nameFr: string;
  nameEn: string;
  duration: number;
  description: string | null;
  navigationMode: "LIBRE" | "SEQUENTIEL";
  accessMode: "LIBRE" | "DEBLOQUE" | "ACHETE";
  days: ModuleDay[];
  clientModule: ClientModuleLite | null;
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / 86400000);
}

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useLanguage();
  // T memoized : sans ça, la ref change à chaque render → invalide useCallback([T])
  // → useEffect([load]) re-fire → setState → re-render → boucle infinie (hotfix V3b).
  const T = useMemo(() => (k: { EN: string; FR: string }) => k[lang], [lang]);
  const moduleId = params?.moduleId as string;

  const [mod, setMod] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [currentDay, setCurrentDay] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/client/modules/${moduleId}`);
      if (!res.ok) {
        setError(res.status === 404 ? T({ EN: "Module not found", FR: "Module introuvable" }) : T({ EN: "Access denied", FR: "Accès refusé" }));
        return;
      }
      const data = await res.json();
      setMod(data.module);
      // Calcul du jour courant en mode SEQUENTIEL
      if (data.module.navigationMode === "SEQUENTIEL" && data.module.clientModule?.startedAt) {
        const d = Math.min(data.module.duration, daysSince(data.module.clientModule.startedAt) + 1);
        setCurrentDay(Math.max(d, 1));
      }
    } catch {
      setError(T({ EN: "Network error", FR: "Erreur réseau" }));
    } finally {
      setLoading(false);
    }
  }, [moduleId, T]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleStart() {
    setStarting(true);
    try {
      const res = await fetch(`/api/client/modules/${moduleId}/start`, { method: "POST" });
      if (res.ok) {
        await load();
      }
    } finally {
      setStarting(false);
    }
  }

  if (loading) {
    return <p className="font-ui text-sm text-brun-mid/60 py-10 text-center">…</p>;
  }

  if (error || !mod) {
    return (
      <div className="py-10 text-center space-y-3">
        <p className="font-ui text-sm text-brun-mid">{error || T({ EN: "Module not found", FR: "Module introuvable" })}</p>
        <Link href="/client/mes-modules" className="font-ui text-xs text-or-sacre underline">
          ← {T(t.modules.sectionTitle)}
        </Link>
      </div>
    );
  }

  const title = lang === "FR" ? mod.nameFr : mod.nameEn;
  const cm = mod.clientModule;

  // Badge
  let badge: { label: string; classes: string } | null = null;
  if (cm?.completedAt) {
    badge = { label: T(t.modules.moduleCompleted), classes: "bg-foret text-white" };
  } else if (cm?.startedAt) {
    badge = { label: T(t.modules.moduleInProgress), classes: "bg-or-sacre text-white" };
  } else if (cm?.unlockedAt) {
    const ds = daysSince(cm.unlockedAt);
    if (ds < 7) badge = { label: T(t.modules.moduleNew), classes: "bg-or-sacre/20 text-or-sacre" };
  }

  const isSequential = mod.navigationMode === "SEQUENTIEL";
  const notStarted = !cm?.startedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/client/mes-modules")}
          className="font-ui text-xs text-brun-mid/70 hover:text-or-sacre underline"
        >
          ← {T(t.modules.sectionTitle)}
        </button>
        <div className="flex items-start justify-between gap-3 mt-3">
          <div>
            <h1 className="font-display text-2xl text-brun-chaud">{title}</h1>
            <p className="font-ui text-sm text-brun-mid/70 mt-1">
              {mod.duration} {T(t.modules.days)}
            </p>
          </div>
          {badge && (
            <span className={`text-[10px] font-ui uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${badge.classes}`}>
              {badge.label}
            </span>
          )}
        </div>
        {mod.description && (
          <p className="font-ui text-sm text-brun-mid mt-3 whitespace-pre-wrap">{mod.description}</p>
        )}
      </div>

      {/* Corps selon navigationMode */}
      {isSequential ? (
        <SequentialView
          mod={mod}
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
          notStarted={notStarted}
          starting={starting}
          onStart={handleStart}
          T={T}
        />
      ) : (
        <LibreView mod={mod} T={T} />
      )}
    </div>
  );
}

function LibreView({ mod, T }: { mod: ModuleDetail; T: (k: { EN: string; FR: string }) => string }) {
  if (mod.days.length === 0) {
    return (
      <p className="font-ui text-sm text-brun-mid/60 italic text-center py-8">
        {T({ EN: "Content coming soon.", FR: "Contenu à venir." })}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {mod.days.map((d) => (
        <li key={d.id} className="border border-or-pale/50 rounded-sm bg-cire-chaude/50">
          <details>
            <summary className="cursor-pointer px-4 py-3 font-ui text-sm text-brun-chaud">
              {T({ EN: "Day", FR: "Jour" })} {d.dayNumber}
            </summary>
            <div className="px-4 pb-4">
              <DayContent day={d} T={T} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

function SequentialView({
  mod,
  currentDay,
  setCurrentDay,
  notStarted,
  starting,
  onStart,
  T,
}: {
  mod: ModuleDetail;
  currentDay: number;
  setCurrentDay: (n: number) => void;
  notStarted: boolean;
  starting: boolean;
  onStart: () => void;
  T: (k: { EN: string; FR: string }) => string;
}) {
  if (notStarted) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center space-y-4">
        <p className="font-ui text-sm text-brun-mid">
          {T({ EN: "This module unfolds day by day.", FR: "Ce module se déroule jour après jour." })}
        </p>
        <button
          onClick={onStart}
          disabled={starting}
          className="px-6 py-2.5 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors disabled:opacity-50"
        >
          {starting
            ? T({ EN: "Starting…", FR: "Démarrage…" })
            : T({ EN: "Start the module", FR: "Commencer le module" })}
        </button>
      </div>
    );
  }

  const day = mod.days.find((d) => d.dayNumber === currentDay) ?? null;
  const maxReachable = Math.min(mod.duration, mod.days.length);

  return (
    <div className="space-y-4">
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <p className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-2">
          {T({ EN: "Day", FR: "Jour" })} {currentDay} / {mod.duration}
        </p>
        {day ? <DayContent day={day} T={T} /> : (
          <p className="font-ui text-sm text-brun-mid/60 italic">
            {T({ EN: "Content coming soon.", FR: "Contenu à venir." })}
          </p>
        )}
      </div>
      <div className="flex justify-between gap-2">
        <button
          type="button"
          disabled={currentDay <= 1}
          onClick={() => setCurrentDay(currentDay - 1)}
          className="font-ui text-xs text-brun-mid px-3 py-2 border border-or-pale rounded-sharp hover:bg-creme-sacree disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← {T({ EN: "Previous day", FR: "Jour précédent" })}
        </button>
        <button
          type="button"
          disabled={currentDay >= maxReachable}
          onClick={() => setCurrentDay(currentDay + 1)}
          className="font-ui text-xs text-brun-mid px-3 py-2 border border-or-pale rounded-sharp hover:bg-creme-sacree disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {T({ EN: "Next day", FR: "Jour suivant" })} →
        </button>
      </div>
    </div>
  );
}

function DayContent({ day, T }: { day: ModuleDay; T: (k: { EN: string; FR: string }) => string }) {
  const hasContent =
    day.notification !== null ||
    (day.elixirs !== null && day.elixirs !== undefined) ||
    (day.practices !== null && day.practices !== undefined);

  if (!hasContent) {
    return (
      <p className="font-ui text-sm text-brun-mid/60 italic">
        {T({ EN: "Content coming soon.", FR: "Contenu à venir." })}
      </p>
    );
  }

  return (
    <div className="space-y-3 text-sm font-ui text-brun-chaud">
      {day.notification && <p className="whitespace-pre-wrap">{day.notification}</p>}
      {day.elixirs !== null && day.elixirs !== undefined && (
        <div>
          <p className="font-caps text-[10px] uppercase tracking-wider text-or-sacre mb-1">
            {T({ EN: "Elixirs", FR: "Élixirs" })}
          </p>
          <pre className="text-xs text-brun-mid/80 whitespace-pre-wrap">
            {JSON.stringify(day.elixirs, null, 2)}
          </pre>
        </div>
      )}
      {day.practices !== null && day.practices !== undefined && (
        <div>
          <p className="font-caps text-[10px] uppercase tracking-wider text-or-sacre mb-1">
            {T({ EN: "Practices", FR: "Pratiques" })}
          </p>
          <pre className="text-xs text-brun-mid/80 whitespace-pre-wrap">
            {JSON.stringify(day.practices, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
