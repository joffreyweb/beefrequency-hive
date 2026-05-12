import type { ParcoursType } from "@prisma/client";

export type ParcoursFlags = {
  requiresWelcomeVideo: boolean;
  requiresConvention: boolean;
  requiresQuestionnaire: boolean;
  requiresPhaseVideos: boolean;
  requiresMorningCheckin: boolean;
  requiresEveningCheckin: boolean;
  requiresJournal: boolean;
  requiresProgramTimeline: boolean;
};

export const FLAG_KEYS = [
  "requiresWelcomeVideo",
  "requiresConvention",
  "requiresQuestionnaire",
  "requiresPhaseVideos",
  "requiresMorningCheckin",
  "requiresEveningCheckin",
  "requiresJournal",
  "requiresProgramTimeline",
] as const satisfies readonly (keyof ParcoursFlags)[];

const allTrue: ParcoursFlags = {
  requiresWelcomeVideo: true,
  requiresConvention: true,
  requiresQuestionnaire: true,
  requiresPhaseVideos: true,
  requiresMorningCheckin: true,
  requiresEveningCheckin: true,
  requiresJournal: true,
  requiresProgramTimeline: true,
};

const allFalse: ParcoursFlags = {
  requiresWelcomeVideo: false,
  requiresConvention: false,
  requiresQuestionnaire: false,
  requiresPhaseVideos: false,
  requiresMorningCheckin: false,
  requiresEveningCheckin: false,
  requiresJournal: false,
  requiresProgramTimeline: false,
};

export const PARCOURS_DEFAULTS: Record<ParcoursType, ParcoursFlags> = {
  LE_PASSAGE: { ...allTrue },
  NECTAR_CYCLE: {
    ...allFalse,
    requiresWelcomeVideo: true,
    requiresConvention: true,
    requiresQuestionnaire: true,
  },
  SEANCE_UNIQUE: {
    ...allFalse,
    requiresWelcomeVideo: true,
    requiresConvention: true,
  },
  RESET_6: {
    ...allFalse,
    requiresWelcomeVideo: true,
    requiresConvention: true,
    requiresQuestionnaire: true,
    requiresMorningCheckin: true,
    requiresEveningCheckin: true,
    requiresJournal: true,
  },
  CUSTOM: { ...allFalse },
};

export function getDefaultsForParcoursType(type: ParcoursType): ParcoursFlags {
  return { ...PARCOURS_DEFAULTS[type] };
}
