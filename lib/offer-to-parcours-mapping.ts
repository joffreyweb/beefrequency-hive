import type { ParcoursType } from "@prisma/client";
import { getDefaultsForParcoursType, type ParcoursFlags } from "@/lib/parcours-defaults";

export const OFFER_TO_PARCOURS_TYPE: Record<string, ParcoursType> = {
  CONVERSATION_EXPLORATOIRE: "LE_PASSAGE",
  SESSION_SEUIL:             "SEANCE_UNIQUE",
  LE_NECTAR_CYCLE:           "NECTAR_CYCLE",
  LE_PASSAGE_1_1:            "LE_PASSAGE",
  LES_CYCLES_DE_LA_RUCHE:    "NECTAR_CYCLE",
  CEREMONIE_RESET:           "SEANCE_UNIQUE",
  LA_RUCHE_VIVANTE:          "SEANCE_UNIQUE",
  SOUVERAINETE:              "LE_PASSAGE",
  LA_CHAMBRE_DE_LA_REINE:    "SEANCE_UNIQUE",
  SOS_URGENCE_VIP:           "LE_PASSAGE",
  LE_FIL_DE_LA_RUCHE:        "LE_PASSAGE",
  PARCOURS_PERSONNALISE:     "CUSTOM",
};

export function getParcoursForOffer(offerType: string): {
  parcoursType: ParcoursType;
  flags: ParcoursFlags;
} {
  const parcoursType = OFFER_TO_PARCOURS_TYPE[offerType] ?? "LE_PASSAGE";
  return { parcoursType, flags: getDefaultsForParcoursType(parcoursType) };
}
