// ════════════════════════════════════════════════════════════════════════
// LOT P0 — Source de vérité du binding offre → parcours → configuration
//
//  - OFFER_TO_PARCOURS : chaque OfferType commercial → un ParcoursType technique
//  - PARCOURS_CONFIG   : pour chaque ParcoursType, la config complète (flags +
//    dimensions : élixirs, check-ins, phases, journal, zoom, anniversaire,
//    sections de questionnaire, niveau d'accès PWA)
//
// `requiresQuestionnaire` = le questionnaire est BLOQUANT (gate PWA).
// `questionnaireSections` = les sections à présenter (peuvent exister sans bloquer).
// ════════════════════════════════════════════════════════════════════════

import type { OfferType, ParcoursType } from "@prisma/client";
import type { ParcoursFlags } from "./parcours-defaults";

// ── Sections de questionnaire (bibliothèque modulaire) ──
export type SectionSlug =
  | "identity"
  | "postal_address"
  | "hd_astro"
  | "life_story"
  | "physical_health"
  | "emotional_health"
  | "habits"
  | "intentions"
  | "engagement"
  | "ceremony_prep"
  | "group_dynamic";

// Seed des 11 sections (titres FR, ordre d'affichage). Questions vides en P0
// (à remplir par Joffrey via l'admin plus tard).
export const SECTION_SEED: { slug: SectionSlug; title: string; order: number }[] = [
  { slug: "identity", title: "Identité", order: 10 },
  { slug: "postal_address", title: "Adresse postale", order: 20 },
  { slug: "hd_astro", title: "Human Design & Astrologie", order: 30 },
  { slug: "life_story", title: "Histoire de vie", order: 40 },
  { slug: "physical_health", title: "Santé physique", order: 50 },
  { slug: "emotional_health", title: "Santé émotionnelle", order: 60 },
  { slug: "habits", title: "Habitudes de vie", order: 70 },
  { slug: "intentions", title: "Intentions", order: 80 },
  { slug: "engagement", title: "Engagement", order: 90 },
  { slug: "ceremony_prep", title: "Préparation cérémonie", order: 100 },
  { slug: "group_dynamic", title: "Dynamique de groupe", order: 110 },
];

export type PwaAccessLevel = "NONE" | "MINIMAL_RDV" | "FULL" | "CONTINUITY" | "GROUP";

export interface ParcoursConfig {
  /** Le questionnaire est-il bloquant (gate PWA) ? */
  requiresQuestionnaire: boolean;
  /** Sections à présenter (indépendant du caractère bloquant). */
  questionnaireSections: SectionSlug[];
  hasElixirs: boolean;
  hasCheckinMorning: boolean;
  hasCheckinEvening: boolean;
  hasPhases: boolean;
  hasJournal: boolean;
  hasZoomIntegration: boolean;
  sendBirthdayNotif: boolean;
  pwaAccessLevel: PwaAccessLevel;
  /** 8 flags legacy dérivés (source des `Client.requires*` / `PARCOURS_DEFAULTS`). */
  flags: ParcoursFlags;
}

// Helper interne : construit les 8 flags. welcomeVideo/convention/phaseVideos
// sont dérivés (non spécifiés dans la matrice du 26/05) — ajustables.
function mkFlags(f: {
  welcome: boolean; convention: boolean; questionnaire: boolean; phaseVideos: boolean;
  morning: boolean; evening: boolean; journal: boolean; timeline: boolean; elixirs?: boolean;
}): ParcoursFlags {
  return {
    requiresWelcomeVideo: f.welcome,
    requiresConvention: f.convention,
    requiresQuestionnaire: f.questionnaire,
    requiresPhaseVideos: f.phaseVideos,
    requiresMorningCheckin: f.morning,
    requiresEveningCheckin: f.evening,
    requiresJournal: f.journal,
    requiresProgramTimeline: f.timeline,
    requiresElixirs: f.elixirs ?? false,
  };
}

// ── Binding OfferType → ParcoursType (noms d'enum réels en prod) ──
export const OFFER_TO_PARCOURS: Record<OfferType, ParcoursType> = {
  CONVERSATION_EXPLORATOIRE: "DISCOVERY",
  SESSION_SEUIL: "SEANCE_UNIQUE",
  LE_NECTAR_CYCLE: "NECTAR_CYCLE",
  LE_PASSAGE_1_1: "LE_PASSAGE",
  LES_CYCLES_DE_LA_RUCHE: "CYCLES_RUCHE",
  CEREMONIE_RESET: "CEREMONIE_RESET",
  LA_RUCHE_VIVANTE: "RUCHE_VIVANTE",
  SOUVERAINETE: "SOUVERAINETE",
  LA_CHAMBRE_DE_LA_REINE: "CHAMBRE_REINE",
  SOS_URGENCE_VIP: "SOS_URGENCE",
  LE_FIL_DE_LA_RUCHE: "FIL_RUCHE",
  PARCOURS_PERSONNALISE: "CUSTOM",
  // Legacy → fallback parcours complet
  HIVE_EXPERIENCE: "LE_PASSAGE",
  THE_PASSAGE: "LE_PASSAGE",
};

// ── Configuration par ParcoursType ──
export const PARCOURS_CONFIG: Record<ParcoursType, ParcoursConfig> = {
  DISCOVERY: {
    requiresQuestionnaire: false,
    questionnaireSections: [],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: false, hasZoomIntegration: true,
    sendBirthdayNotif: false, pwaAccessLevel: "MINIMAL_RDV",
    flags: mkFlags({ welcome: false, convention: false, questionnaire: false, phaseVideos: false, morning: false, evening: false, journal: false, timeline: false }),
  },
  SEANCE_UNIQUE: {
    requiresQuestionnaire: true, // questionnaire SEUIL bloquant (décision 26/05)
    questionnaireSections: ["identity", "life_story", "intentions"],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: false, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "MINIMAL_RDV",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: true, phaseVideos: false, morning: false, evening: false, journal: false, timeline: false }),
  },
  NECTAR_CYCLE: {
    requiresQuestionnaire: true,
    questionnaireSections: ["identity", "life_story", "intentions"],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: false, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "MINIMAL_RDV",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: true, phaseVideos: false, morning: false, evening: false, journal: false, timeline: false }),
  },
  LE_PASSAGE: {
    requiresQuestionnaire: true,
    questionnaireSections: ["identity", "postal_address", "hd_astro", "life_story", "physical_health", "emotional_health", "habits", "intentions", "engagement"],
    hasElixirs: true, hasCheckinMorning: true, hasCheckinEvening: true,
    hasPhases: true, hasJournal: true, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "FULL",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: true, phaseVideos: true, morning: true, evening: true, journal: true, timeline: true, elixirs: true }),
  },
  CYCLES_RUCHE: {
    requiresQuestionnaire: true,
    questionnaireSections: ["identity", "postal_address", "life_story", "intentions", "group_dynamic"],
    hasElixirs: false, hasCheckinMorning: true, hasCheckinEvening: true,
    hasPhases: false, hasJournal: true, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "GROUP",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: true, phaseVideos: false, morning: true, evening: true, journal: true, timeline: false }),
  },
  CEREMONIE_RESET: {
    requiresQuestionnaire: true,
    questionnaireSections: ["identity", "life_story", "intentions", "ceremony_prep"],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: true, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "FULL",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: true, phaseVideos: false, morning: false, evening: false, journal: true, timeline: false }),
  },
  RUCHE_VIVANTE: {
    requiresQuestionnaire: true, // questionnaire bloquant (décision 26/05, aligné sur Reset)
    questionnaireSections: ["identity", "intentions", "ceremony_prep"],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: false, hasZoomIntegration: false,
    sendBirthdayNotif: true, pwaAccessLevel: "CONTINUITY",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: true, phaseVideos: false, morning: false, evening: false, journal: false, timeline: false }),
  },
  SOUVERAINETE: {
    requiresQuestionnaire: true,
    // = LE_PASSAGE (+ section future "souveraineté_deep" à seeder en P1)
    questionnaireSections: ["identity", "postal_address", "hd_astro", "life_story", "physical_health", "emotional_health", "habits", "intentions", "engagement"],
    hasElixirs: true, hasCheckinMorning: true, hasCheckinEvening: true,
    hasPhases: true, hasJournal: true, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "FULL",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: true, phaseVideos: true, morning: true, evening: true, journal: true, timeline: true, elixirs: true }),
  },
  CHAMBRE_REINE: {
    requiresQuestionnaire: false, // modulaire — activé par l'admin quand des sections sont ajoutées
    questionnaireSections: [],
    hasElixirs: true, hasCheckinMorning: true, hasCheckinEvening: true,
    hasPhases: true, hasJournal: true, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "FULL",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: false, phaseVideos: true, morning: true, evening: true, journal: true, timeline: true, elixirs: true }),
  },
  SOS_URGENCE: {
    requiresQuestionnaire: false,
    questionnaireSections: [],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: false, hasZoomIntegration: true,
    sendBirthdayNotif: false, pwaAccessLevel: "MINIMAL_RDV",
    flags: mkFlags({ welcome: false, convention: false, questionnaire: false, phaseVideos: false, morning: false, evening: false, journal: false, timeline: false }),
  },
  FIL_RUCHE: {
    requiresQuestionnaire: false, // réutilise ce qui a été rempli au parcours précédent
    questionnaireSections: [],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: true, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "CONTINUITY",
    flags: mkFlags({ welcome: false, convention: false, questionnaire: false, phaseVideos: false, morning: false, evening: false, journal: true, timeline: false, elixirs: true }),
  },
  CUSTOM: {
    requiresQuestionnaire: false, // modulaire — activé par l'admin
    questionnaireSections: [],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: false, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "FULL",
    flags: mkFlags({ welcome: false, convention: false, questionnaire: false, phaseVideos: false, morning: false, evening: false, journal: false, timeline: false }),
  },
  // Legacy — alias de CEREMONIE_RESET (aucun client ne l'utilise)
  RESET_6: {
    requiresQuestionnaire: true,
    questionnaireSections: ["identity", "life_story", "intentions", "ceremony_prep"],
    hasElixirs: false, hasCheckinMorning: false, hasCheckinEvening: false,
    hasPhases: false, hasJournal: true, hasZoomIntegration: true,
    sendBirthdayNotif: true, pwaAccessLevel: "FULL",
    flags: mkFlags({ welcome: true, convention: true, questionnaire: true, phaseVideos: false, morning: false, evening: false, journal: true, timeline: false }),
  },
};

// Parcours jamais bloqués par le questionnaire (sécurité explicite en plus du flag).
export const QUESTIONNAIRE_EXEMPT: ReadonlySet<ParcoursType> = new Set(["DISCOVERY", "SOS_URGENCE"]);

// ── Helpers ──
export function getParcoursTypeForOffer(offerType: OfferType | string): ParcoursType {
  return OFFER_TO_PARCOURS[offerType as OfferType] ?? "LE_PASSAGE";
}

export function getConfigForParcours(parcoursType: ParcoursType | string): ParcoursConfig {
  return PARCOURS_CONFIG[parcoursType as ParcoursType] ?? PARCOURS_CONFIG.CUSTOM;
}

export function getConfigForOffer(offerType: OfferType | string): ParcoursConfig {
  return getConfigForParcours(getParcoursTypeForOffer(offerType));
}

/** Le questionnaire est-il bloquant pour ce parcours ? (false pour DISCOVERY/SOS_URGENCE) */
export function requiresQuestionnaire(parcoursType: ParcoursType | string): boolean {
  const pt = parcoursType as ParcoursType;
  if (QUESTIONNAIRE_EXEMPT.has(pt)) return false;
  return getConfigForParcours(pt).requiresQuestionnaire;
}

export function getQuestionnaireSections(parcoursType: ParcoursType | string): SectionSlug[] {
  return getConfigForParcours(parcoursType).questionnaireSections;
}
