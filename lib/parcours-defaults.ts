import type { ParcoursType } from "@prisma/client";
import { PARCOURS_CONFIG } from "./offer-parcours-binding";

export type ParcoursFlags = {
  requiresWelcomeVideo: boolean;
  requiresConvention: boolean;
  requiresQuestionnaire: boolean;
  requiresPhaseVideos: boolean;
  requiresMorningCheckin: boolean;
  requiresEveningCheckin: boolean;
  requiresJournal: boolean;
  requiresProgramTimeline: boolean;
  requiresElixirs: boolean;
  requiresModules: boolean;
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
  "requiresElixirs",
  "requiresModules",
] as const satisfies readonly (keyof ParcoursFlags)[];

// Flags éditables par l'admin (UI). requiresWelcomeVideo en est exclu : il est
// dérivé de l'offre côté serveur (welcomeVideoForOffer), jamais coché à la main.
export const EDITABLE_FLAG_KEYS = FLAG_KEYS.filter(
  (k) => k !== "requiresWelcomeVideo"
) as Exclude<(typeof FLAG_KEYS)[number], "requiresWelcomeVideo">[];

// Dérivé de PARCOURS_CONFIG (source unique du binding — lib/offer-parcours-binding.ts).
// Chaque parcoursType expose ses 8 flags legacy via PARCOURS_CONFIG[type].flags.
export const PARCOURS_DEFAULTS: Record<ParcoursType, ParcoursFlags> = Object.fromEntries(
  Object.entries(PARCOURS_CONFIG).map(([type, cfg]) => [type, cfg.flags])
) as Record<ParcoursType, ParcoursFlags>;

export function getDefaultsForParcoursType(type: ParcoursType): ParcoursFlags {
  return { ...PARCOURS_DEFAULTS[type] };
}
