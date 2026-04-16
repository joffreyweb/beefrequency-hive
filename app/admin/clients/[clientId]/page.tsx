import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClientProfileTabs from "./ClientProfileTabs";
import ClientActions from "./ClientActions";
import ParcoursStatusBanner from "@/components/admin/ParcoursStatusBanner";
import ClientProgramSection from "@/components/admin/ClientProgramSection";
import ClientActionBanner from "@/components/admin/ClientActionBanner";
import SubscriptionSection from "@/components/admin/SubscriptionSection";

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
  DEACTIVATED: "Desactive",
  ARCHIVED: "Archive",
};

/** Style du badge statut */
function statusBadgeStyle(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-foret/10 text-foret";
    case "PAUSED":
      return "bg-or-sacre/10 text-or-sacre";
    case "DEACTIVATED":
      return "bg-orange-100 text-orange-700";
    case "ARCHIVED":
      return "bg-brun-mid/10 text-brun-mid";
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
      user: { select: { name: true, email: true, blocked: true, lastLoginAt: true } },
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
      // Questionnaire d'entrée
      questionnaireEntry: { select: { status: true } },
      // RDV
      appointments: {
        where: { status: { not: "CANCELLED" } },
        select: { id: true, scheduledAt: true },
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Derniers 5 check-ins avec statut élixir
  const recentCheckins = await prisma.dailyCheckin.findMany({
    where: { clientId },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Prochain RDV (session SCHEDULED dans le futur)
  const nextSession = await prisma.session.findFirst({
    where: {
      clientId,
      status: "SCHEDULED",
      scheduledAt: { gte: new Date() },
    },
    orderBy: { scheduledAt: "asc" },
  });

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

  // Calcul du jour du parcours — uniquement si produits reçus ET date de départ atteinte
  const programStart = client.detoxStartDate || client.programmeStartDate;
  const programHasStarted =
    client.produitsRecus &&
    !!programStart &&
    new Date(programStart).getTime() <= Date.now();
  const dayNumber = programHasStarted
    ? Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(programStart!).getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

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
  const serializedCheckins = JSON.parse(JSON.stringify(recentCheckins));
  const serializedNextSession = nextSession ? JSON.parse(JSON.stringify(nextSession)) : null;

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
            <span className="text-xs font-ui text-brun-mid/50">
              {dayNumber > 0 ? `J+${dayNumber}` : "Pré-démarrage"}
            </span>
            {client.isLegacy && (
              <span className="text-[9px] font-ui px-1.5 py-0.5 rounded-full bg-brun-mid/10 text-brun-mid">Legacy</span>
            )}
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

      {/* Bandeau parcours */}
      <ParcoursStatusBanner
        clientId={clientId}
        onboardingCompleted={client.onboardingCompleted}
        colisEnvoye={client.colisEnvoye}
        colisEnvoyeAt={client.colisEnvoyeAt ? client.colisEnvoyeAt.toISOString() : null}
        produitsRecus={client.produitsRecus}
        produitsRecusAt={client.produitsRecusAt ? client.produitsRecusAt.toISOString() : null}
        detoxStartDate={client.detoxStartDate ? client.detoxStartDate.toISOString() : null}
        programmeStartDate={client.programmeStartDate ? client.programmeStartDate.toISOString() : null}
        startDate={client.startDate.toISOString()}
      />

      {/* Actions requises */}
      <ClientActionBanner
        clientId={clientId}
        charteSignee={client.charteSignee}
        questionnaireSubmitted={client.questionnaireEntry?.status === "SUBMITTED"}
        colisEnvoye={client.colisEnvoye}
        hasAppointment={client.appointments.length > 0}
      />

      {/* Abonnement */}
      <SubscriptionSection
        clientId={clientId}
        totalSessions={client.totalSessions || 0}
        usedSessionsManual={client.usedSessionsManual ?? null}
        autoUsedSessions={client.appointments.filter((a) => new Date(a.scheduledAt).getTime() < Date.now()).length}
        subscriptionNotes={client.subscriptionNotes || null}
        startDate={client.startDate.toISOString()}
        offerType={OFFER_LABELS[client.offerType] ?? client.offerType}
      />

      {/* Programme assigné */}
      <ClientProgramSection clientId={clientId} clientName={client.user.name} />

      {/* Actions : desactiver, archiver, supprimer, envoyer email */}
      <ClientActions
        clientId={clientId}
        clientName={client.user.name}
        blocked={client.user.blocked}
        clientStatus={client.status}
        inviteLink={inviteLink}
      />

      {/* Onglets (client component) */}
      <ClientProfileTabs
        client={serializedClient}
        messages={serializedMessages}
        unreadDocCount={unreadDocCount}
        dayNumber={dayNumber}
        recentCheckins={serializedCheckins}
        nextSession={serializedNextSession}
      />
    </div>
  );
}
