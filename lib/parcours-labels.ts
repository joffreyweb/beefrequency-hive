import type { ParcoursType } from "@prisma/client";
import type { ParcoursFlags } from "./parcours-defaults";

export const PARCOURS_TYPE_LABELS: Record<ParcoursType, string> = {
  DISCOVERY: "Conversation exploratoire",
  SEANCE_UNIQUE: "Séance unique",
  NECTAR_CYCLE: "Nectar Cycle (3 séances)",
  LE_PASSAGE: "Le Passage 103j",
  CYCLES_RUCHE: "Les Cycles de la Ruche (10 sem.)",
  CEREMONIE_RESET: "Cérémonie Reset",
  RUCHE_VIVANTE: "La Ruche Vivante",
  SOUVERAINETE: "Souveraineté",
  CHAMBRE_REINE: "La Chambre de la Reine",
  SOS_URGENCE: "SOS · Urgence VIP",
  FIL_RUCHE: "Le Fil de la Ruche",
  CUSTOM: "Parcours personnalisé",
  RESET_6: "Reset 6 séances (legacy)",
};

// Options proposées à l'admin (RESET_6 legacy exclu — remplacé par CEREMONIE_RESET).
export const PARCOURS_TYPE_OPTIONS: ReadonlyArray<{ value: ParcoursType; label: string }> = [
  { value: "DISCOVERY", label: PARCOURS_TYPE_LABELS.DISCOVERY },
  { value: "SEANCE_UNIQUE", label: PARCOURS_TYPE_LABELS.SEANCE_UNIQUE },
  { value: "NECTAR_CYCLE", label: PARCOURS_TYPE_LABELS.NECTAR_CYCLE },
  { value: "LE_PASSAGE", label: PARCOURS_TYPE_LABELS.LE_PASSAGE },
  { value: "CYCLES_RUCHE", label: PARCOURS_TYPE_LABELS.CYCLES_RUCHE },
  { value: "CEREMONIE_RESET", label: PARCOURS_TYPE_LABELS.CEREMONIE_RESET },
  { value: "RUCHE_VIVANTE", label: PARCOURS_TYPE_LABELS.RUCHE_VIVANTE },
  { value: "SOUVERAINETE", label: PARCOURS_TYPE_LABELS.SOUVERAINETE },
  { value: "CHAMBRE_REINE", label: PARCOURS_TYPE_LABELS.CHAMBRE_REINE },
  { value: "SOS_URGENCE", label: PARCOURS_TYPE_LABELS.SOS_URGENCE },
  { value: "FIL_RUCHE", label: PARCOURS_TYPE_LABELS.FIL_RUCHE },
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
