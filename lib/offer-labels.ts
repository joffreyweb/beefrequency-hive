/** Labels lisibles pour les offres — source unique de vérité */
export const OFFER_LABELS: Record<string, string> = {
  CONVERSATION_EXPLORATOIRE: "Conversation exploratoire privée",
  SESSION_SEUIL: "Session Seuil",
  LE_NECTAR_CYCLE: "Le Nectar Cycle",
  LE_PASSAGE_1_1: "Le Passage 1:1",
  LES_CYCLES_DE_LA_RUCHE: "Les Cycles de la Ruche",
  CEREMONIE_RESET: "Cérémonie Reset",
  LA_RUCHE_VIVANTE: "La Ruche Vivante",
  SOUVERAINETE: "Souveraineté",
  LA_CHAMBRE_DE_LA_REINE: "La Chambre de la Reine",
  SOS_URGENCE_VIP: "SOS · Urgence VIP",
  LE_FIL_DE_LA_RUCHE: "Le Fil de la Ruche",
  PARCOURS_PERSONNALISE: "Parcours personnalisé",
  MONITORING: "Monitoring",
  // Legacy
  HIVE_EXPERIENCE: "Hive Experience",
  THE_PASSAGE: "The Passage",
};

export function formatOfferName(offerType: string | null | undefined): string {
  if (!offerType) return "Non défini";
  return OFFER_LABELS[offerType] || offerType.replace(/_/g, " ");
}
