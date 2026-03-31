import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClientsGrid from "./ClientsGrid";

// Labels lisibles pour les offres
const OFFER_LABELS: Record<string, string> = {
  CONVERSATION_EXPLORATOIRE: "Conversation exploratoire",
  SESSION_SEUIL: "Session Seuil",
  LE_NECTAR_CYCLE: "Le Nectar Cycle",
  LE_PASSAGE_1_1: "Le Passage 1:1",
  LES_CYCLES_DE_LA_RUCHE: "Les Cycles de la Ruche",
  CEREMONIE_RESET: "Cérémonie Reset",
  LA_RUCHE_VIVANTE: "La Ruche Vivante",
  SOUVERAINETE: "Souveraineté",
  LA_CHAMBRE_DE_LA_REINE: "La Chambre de la Reine",
  SOS_URGENCE_VIP: "SOS Urgence VIP",
  LE_FIL_DE_LA_RUCHE: "Le Fil de la Ruche",
  // Legacy
  HIVE_EXPERIENCE: "Hive Experience",
  THE_PASSAGE: "The Passage",
};

export default async function ClientsListPage() {
  // Chargement de tous les clients avec pendingActions count
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      analysis: { select: { status: true } },
      _count: { select: { pendingActions: { where: { completedAt: null } } } },
    },
  });

  // Sérialiser les clients pour le composant client
  const serializedClients = clients.map((client) => ({
    id: client.id,
    name: client.user.name ?? "",
    email: client.user.email ?? "",
    offerType: client.offerType,
    offerLabel: OFFER_LABELS[client.offerType] ?? client.offerType,
    status: client.status,
    language: client.language,
    startDate: client.startDate.toISOString(),
    analysisStatus: client.analysis?.status ?? null,
    pendingCount: client._count.pendingActions,
    isLegacy: (client as any).isLegacy || false,
  }));

  return (
    <div>
      {/* En-tête avec titre et barre de recherche */}
      {/* Grille de clients avec modal invite integre */}
      <ClientsGrid clients={serializedClients} />
    </div>
  );
}
