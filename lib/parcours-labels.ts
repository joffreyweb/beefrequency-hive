import type { ParcoursType } from "@prisma/client";
import type { ParcoursFlags } from "./parcours-defaults";

export const PARCOURS_TYPE_LABELS: Record<ParcoursType, string> = {
  LE_PASSAGE: "Le Passage 103j",
  NECTAR_CYCLE: "Nectar Cycle 3 séances",
  SEANCE_UNIQUE: "Séance unique",
  RESET_6: "Reset 6 séances",
  CUSTOM: "Parcours personnalisé",
};

export const PARCOURS_TYPE_OPTIONS: ReadonlyArray<{ value: ParcoursType; label: string }> = [
  { value: "LE_PASSAGE", label: PARCOURS_TYPE_LABELS.LE_PASSAGE },
  { value: "NECTAR_CYCLE", label: PARCOURS_TYPE_LABELS.NECTAR_CYCLE },
  { value: "SEANCE_UNIQUE", label: PARCOURS_TYPE_LABELS.SEANCE_UNIQUE },
  { value: "RESET_6", label: PARCOURS_TYPE_LABELS.RESET_6 },
  { value: "CUSTOM", label: PARCOURS_TYPE_LABELS.CUSTOM },
];

export const FLAG_LABELS: Record<keyof ParcoursFlags, string> = {
  requiresWelcomeVideo: "Vidéo accueil",
  requiresConvention: "Charte / Convention",
  requiresQuestionnaire: "Questionnaire pré-start",
  requiresPhaseVideos: "Vidéos transitions phase",
  requiresMorningCheckin: "Check-in matin",
  requiresEveningCheckin: "Check-in soir",
  requiresJournal: "Journal",
  requiresProgramTimeline: "Timeline programme jour-par-jour",
};
