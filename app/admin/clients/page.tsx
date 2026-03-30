import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ClientsGrid from "./ClientsGrid";

// Labels lisibles pour les offres
const OFFER_LABELS: Record<string, string> = {
  HIVE_EXPERIENCE: "Hive Experience",
  THE_PASSAGE: "The Passage",
  SOUVERAINETE: "Souveraineté",
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
