import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClientProfileTabs from "./ClientProfileTabs";
import ClientActions from "./ClientActions";

// Labels lisibles pour les offres
const OFFER_LABELS: Record<string, string> = {
  HIVE_EXPERIENCE: "Hive Experience",
  THE_PASSAGE: "The Passage",
  SOUVERAINETE: "Souverainete",
};

// Labels lisibles pour les statuts
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  PAUSED: "En pause",
  COMPLETED: "Termine",
};

/** Style du badge statut */
function statusBadgeStyle(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-foret/10 text-foret";
    case "PAUSED":
      return "bg-or-sacre/10 text-or-sacre";
    default:
      return "bg-brun-mid/10 text-brun-mid";
  }
}

/** Formater une date en francais */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface ClientPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { clientId } = await params;

  // Chargement du client avec toutes ses relations
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      user: { select: { name: true, email: true, blocked: true } },
      // Entrees de journal non privees uniquement
      journalEntries: {
        where: { isPrivate: false },
        orderBy: { createdAt: "desc" },
      },
      // Prescriptions avec details de l'elixir
      elixirPrescriptions: {
        orderBy: { createdAt: "desc" },
        include: { elixir: true },
      },
      // Protocoles
      protocols: {
        orderBy: { createdAt: "desc" },
      },
      // Sessions
      sessions: {
        orderBy: { scheduledAt: "desc" },
      },
      // Supports
      supports: {
        orderBy: { createdAt: "desc" },
      },
      // Recommandations quotidiennes
      dailyRecommendations: {
        orderBy: { dayFrom: "asc" },
      },
      // Focus du jour
      dailyFocuses: {
        orderBy: { dayFrom: "asc" },
      },
      // Recommandations personnalisees (catalogue)
      clientRecommendations: {
        orderBy: { createdAt: "desc" },
        include: { recommendation: true },
      },
      // Pratiques assignees au client
      clientPractices: {
        orderBy: { assignedAt: "desc" },
        include: { practice: true },
      },
      // Documents du client
      documents: {
        orderBy: { createdAt: "desc" },
      },
      // Analyse IA
      analysis: true,
      // Intake onboarding
      intake: true,
    },
  });

  if (!client) {
    notFound();
  }

  // Nombre de documents non lus par l'admin
  const unreadDocCount = client.documents.filter((d) => !d.readByAdmin).length;

  // Chargement des messages lies a cet utilisateur
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: client.userId }, { receiverId: client.userId }],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      sender: { select: { name: true, role: true } },
      receiver: { select: { name: true, role: true } },
    },
  });

  // Calcul du jour du parcours
  const dayNumber = Math.max(
    1,
    Math.ceil(
      (Date.now() - new Date(client.startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  // Initiales du client (2 premieres lettres du nom en majuscules)
  const initials = (client.user.name ?? "??").slice(0, 2).toUpperCase();

  // Style du badge statut
  const statusStyle = statusBadgeStyle(client.status);

  // Token d'invitation actif pour cet email (pour envoi email)
  const activeInvite = await prisma.inviteToken.findFirst({
    where: {
      email: client.user.email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const inviteLink = activeInvite ? `${baseUrl}/register?token=${activeInvite.token}` : null;

  // Serialisation des donnees Prisma pour le client component
  const serializedClient = JSON.parse(JSON.stringify(client));
  const serializedMessages = JSON.parse(JSON.stringify(messages));

  return (
    <div>
      {/* Retour */}
      <Link
        href="/admin/clients"
        className="text-[13px] font-ui text-brun-mid/50 hover:text-or-sacre transition-colors duration-150 mb-4 inline-block"
      >
        &larr; La Ruche
      </Link>

      {/* Header client — compact, toujours visible */}
      <div className="flex items-center gap-4 mb-6">
        {/* Avatar initiales */}
        <div className="w-12 h-12 rounded-full bg-or-sacre flex items-center justify-center shrink-0">
          <span className="text-white font-ui text-base font-medium">
            {initials}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl text-brun-chaud">
              {client.user.name}
            </h1>
            <span className="text-xs font-ui px-2 py-0.5 rounded-full bg-or-sacre/10 text-or-sacre">
              {OFFER_LABELS[client.offerType]}
            </span>
            <span className={`text-xs font-ui px-2 py-0.5 rounded-full ${statusStyle}`}>
              {STATUS_LABELS[client.status]}
            </span>
            <span className="text-xs font-ui text-brun-mid/50">J+{dayNumber}</span>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-xs font-ui text-brun-mid/60">{client.user.email}</p>
            <span className="text-xs font-ui px-1.5 py-0.5 rounded-sharp bg-cire-chaude text-brun-mid border border-or-pale">
              {client.language === "EN" ? "EN" : "FR"}
            </span>
            {client.nextSessionDate && (
              <p className="text-xs font-ui text-brun-mid/50">
                Prochaine session : {formatDate(client.nextSessionDate)}
              </p>
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 shrink-0">
          <Link
            href="/admin/sessions"
            className="px-3 py-1.5 bg-or-sacre text-white text-xs font-ui uppercase tracking-wider rounded-sharp hover:bg-ambre-vif transition-colors"
          >
            Nouvelle session
          </Link>
          <Link
            href="/admin/messages"
            className="px-3 py-1.5 border border-or-pale text-brun-mid text-xs font-ui uppercase tracking-wider rounded-sharp hover:border-or-sacre hover:text-or-sacre transition-colors"
          >
            Envoyer un message
          </Link>
        </div>
      </div>

      {/* Actions : bloquer, supprimer, envoyer email */}
      <ClientActions
        clientId={clientId}
        blocked={client.user.blocked}
        inviteLink={inviteLink}
      />

      {/* Onglets (client component) */}
      <ClientProfileTabs
        client={serializedClient}
        messages={serializedMessages}
        unreadDocCount={unreadDocCount}
        dayNumber={dayNumber}
      />
    </div>
  );
}
