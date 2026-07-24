// lib/program-state.ts
// Cycle de vie d'un ClientProgram, calculé (jamais lu depuis le champ `status` stocké,
// sauf "paused" qui reste une décision manuelle admin).
//
// Lesson 9 avril : ne JAMAIS comparer des instants bruts (getTime / Date.now) pour
// décider d'une phase — le décalage UTC/local fait sauter un jour en soirée. On
// compare des numéros de JOUR-CALENDRIER à Bruxelles, immunisés UTC/DST.

const TZ = "Europe/Brussels";

/**
 * Numéro de jour-calendrier (jours depuis l'epoch) de la date civile à Bruxelles.
 * Deux dates le même jour à Bruxelles → même entier, quelle que soit l'heure/DST.
 */
export function brusselsDayIndex(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === "year")!.value);
  const m = Number(parts.find((p) => p.type === "month")!.value);
  const d = Number(parts.find((p) => p.type === "day")!.value);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export type ProgramState = "pending" | "active" | "completed" | "paused";

export interface ProgramStateInfo {
  startDate: Date;
  /** Date civile du dernier jour du programme (jour `totalDays`, inclus). */
  endDate: Date;
  /** Somme des durées des modules actifs (hors skippedModules). 103j pour Monitoring. */
  totalDays: number;
  /** Jour courant clampé dans [1, totalDays]. */
  currentDay: number;
  state: ProgramState;
}

interface ModuleLike {
  id: string;
  duration: number;
}
interface ProgramModuleLike {
  module: ModuleLike;
}
interface ProgramLike {
  modules: ProgramModuleLike[];
}
interface ClientProgramLike {
  startDate: Date | string;
  status?: string | null;
  skippedModules?: unknown;
}

/**
 * Source de vérité unique du cycle de vie d'un parcours assigné.
 * `program` doit inclure ses `modules[].module.{id,duration}`.
 */
export function getProgramState(
  clientProgram: ClientProgramLike,
  program: ProgramLike,
): ProgramStateInfo {
  const skipped = Array.isArray(clientProgram.skippedModules)
    ? (clientProgram.skippedModules as string[])
    : [];

  const totalDays = program.modules
    .filter((pm) => !skipped.includes(pm.module.id))
    .reduce((acc, pm) => acc + pm.module.duration, 0);

  const startDate = new Date(clientProgram.startDate);

  // Jour 1 = startDate → le dernier jour est startDate + (totalDays - 1).
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(totalDays - 1, 0));

  const startIdx = brusselsDayIndex(startDate);
  const endIdx = brusselsDayIndex(endDate);
  const todayIdx = brusselsDayIndex(new Date());

  const rawDay = todayIdx - startIdx + 1;
  const currentDay = Math.min(Math.max(rawDay, 1), Math.max(totalDays, 1));

  let state: ProgramState;
  if (clientProgram.status === "paused") {
    state = "paused"; // décision manuelle admin — on la respecte
  } else if (todayIdx < startIdx) {
    state = "pending";
  } else if (todayIdx > endIdx) {
    state = "completed";
  } else {
    state = "active";
  }

  return { startDate, endDate, totalDays, currentDay, state };
}

/** Libellés FR du cycle de vie, pour l'UI. */
export const PROGRAM_STATE_LABELS: Record<ProgramState, string> = {
  pending: "En attente",
  active: "En cours",
  completed: "Terminé",
  paused: "En pause",
};
