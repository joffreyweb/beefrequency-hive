// ═══════════════════════════════════════
// Logique métier — Parcours 3 mois
// ═══════════════════════════════════════

export type PhaseType = "CYCLE" | "BREAK";
export type PhaseStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

export interface PhaseDefinition {
  phaseType: PhaseType;
  phaseNumber: number; // 1, 2 ou 3
  durationDays: number;
  startDay: number; // jour absolu depuis startDate (0-indexed)
  label: string;
}

export interface ComputedPhase extends PhaseDefinition {
  startDate: Date;
  endDate: Date;
  status: PhaseStatus;
}

export interface ActivePhaseInfo {
  phase: ComputedPhase;
  dayInPhase: number; // 1-indexed (J.1, J.2, etc.)
  dayInProgram: number; // jour global 1-indexed
  totalDays: number; // durée totale du programme
}

// Structure fixe du parcours 3 mois
const PHASE_DEFINITIONS: PhaseDefinition[] = [
  { phaseType: "CYCLE", phaseNumber: 1, durationDays: 21, startDay: 0, label: "Cycle 1" },
  { phaseType: "BREAK", phaseNumber: 1, durationDays: 10, startDay: 21, label: "Intégration 1" },
  { phaseType: "CYCLE", phaseNumber: 2, durationDays: 21, startDay: 31, label: "Cycle 2" },
  { phaseType: "BREAK", phaseNumber: 2, durationDays: 10, startDay: 52, label: "Intégration 2" },
  { phaseType: "CYCLE", phaseNumber: 3, durationDays: 21, startDay: 62, label: "Cycle 3" },
  { phaseType: "BREAK", phaseNumber: 3, durationDays: 10, startDay: 83, label: "Intégration 3" },
];

export const TOTAL_PROGRAM_DAYS = 93; // 3×21 + 3×10

/** Calcule les 6 phases avec dates absolues à partir de la startDate du client */
export function computePhases(startDate: Date | string, today?: Date): ComputedPhase[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const now = today ?? new Date();
  now.setHours(0, 0, 0, 0);

  return PHASE_DEFINITIONS.map((def) => {
    const phaseStart = addDays(start, def.startDay);
    const phaseEnd = addDays(start, def.startDay + def.durationDays - 1);

    let status: PhaseStatus = "UPCOMING";
    if (now > phaseEnd) {
      status = "COMPLETED";
    } else if (now >= phaseStart) {
      status = "ACTIVE";
    }

    return {
      ...def,
      startDate: phaseStart,
      endDate: phaseEnd,
      status,
    };
  });
}

/** Détecte la phase active et le jour courant */
export function getActivePhaseInfo(startDate: Date | string, today?: Date): ActivePhaseInfo | null {
  const phases = computePhases(startDate, today);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const now = today ?? new Date();
  now.setHours(0, 0, 0, 0);

  const dayInProgram = diffDays(start, now) + 1; // 1-indexed

  const activePhase = phases.find((p) => p.status === "ACTIVE");
  if (!activePhase) return null;

  const dayInPhase = diffDays(activePhase.startDate, now) + 1;

  return {
    phase: activePhase,
    dayInPhase,
    dayInProgram,
    totalDays: TOTAL_PROGRAM_DAYS,
  };
}

/** Vérifie si un élixir doit être pris un jour donné selon sa fréquence */
export function isElixirDayMatch(frequency: string, date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0=dimanche, 1=lundi, ..., 6=samedi

  switch (frequency) {
    case "DAILY":
      return true;
    case "MON_JEU":
      return dayOfWeek === 1 || dayOfWeek === 4;
    case "MAR_VEN":
      return dayOfWeek === 2 || dayOfWeek === 5;
    case "LUNDI":
      return dayOfWeek === 1;
    case "MARDI":
      return dayOfWeek === 2;
    case "MERCREDI":
      return dayOfWeek === 3;
    case "JEUDI":
      return dayOfWeek === 4;
    case "VENDREDI":
      return dayOfWeek === 5;
    case "SAMEDI":
      return dayOfWeek === 6;
    case "DIMANCHE":
      return dayOfWeek === 0;
    default:
      return true;
  }
}

// --- Helpers dates ---

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}
