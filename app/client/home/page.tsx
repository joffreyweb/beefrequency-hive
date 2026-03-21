import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";
import Link from "next/link";
import HomeDocuments from "@/components/client/HomeDocuments";

const sessionTypeLabels: Record<string, string> = {
  ONLINE: "En ligne",
  PRESENTIAL: "Présentiel",
  CEREMONY: "Cérémonie",
};

const practiceTypeEmoji: Record<string, string> = {
  BREATHING: "\uD83E\uDEC1",
  VIDEO: "\uD83C\uDFAC",
  MEDITATION: "\uD83E\uDDD8",
};

export default async function ClientHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await requireOnboarding();

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true } },
      intake: { select: { firstName: true } },
      sessions: {
        where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 1,
      },
      dailyFocuses: true,
      clientPractices: {
        where: { isActive: true },
        include: { practice: true },
        take: 3,
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) redirect("/login");

  // Jour dans le parcours
  const dayNumber =
    Math.floor(
      (Date.now() - new Date(client.startDate).getTime()) / 86400000
    ) + 1;

  // Prénom
  const firstName = client.intake?.firstName || client.user.name;

  // Focus du jour — le plus spécifique (dayFrom le plus élevé)
  const todayFocus =
    (
      client.dailyFocuses as {
        id: string;
        dayFrom: number;
        dayTo: number;
        title: string;
        message: string;
      }[]
    )
      .filter((f) => f.dayFrom <= dayNumber && f.dayTo >= dayNumber)
      .sort((a, b) => b.dayFrom - a.dayFrom)[0] ?? null;

  // Prochaine séance
  const nextSession = client.sessions[0] ?? null;
  const now = Date.now();
  const isWithin24h =
    nextSession &&
    new Date(nextSession.scheduledAt).getTime() - now < 24 * 60 * 60 * 1000;

  // Messages non lus
  const unreadMessages = await prisma.message.count({
    where: { receiverId: session.userId, readAt: null },
  });

  // Pratique du jour — première non complétée aujourd'hui
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayPractice =
    client.clientPractices.find(
      (cp) => !cp.lastCompletedAt || new Date(cp.lastCompletedAt) < todayStart
    ) ?? null;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          Bonjour {firstName} —{" "}
          <span className="text-or-sacre">Jour {dayNumber}</span> de votre
          parcours
        </h1>
      </div>

      {/* Focus du jour */}
      {todayFocus && (
        <div className="bg-cire-chaude border-l-4 border-or-sacre rounded-sm p-5">
          <p className="font-display text-lg text-brun-chaud mb-1">
            {todayFocus.title}
          </p>
          <p className="font-ui text-sm text-brun-mid">
            {todayFocus.message}
          </p>
        </div>
      )}

      {/* Grille principale */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prochaine séance */}
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            Prochaine séance
          </h2>
          {nextSession ? (
            <>
              <p className="font-display text-lg text-brun-chaud">
                {new Date(nextSession.scheduledAt).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p className="text-sm text-brun-mid mt-1">
                {new Date(nextSession.scheduledAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                —{" "}
                {sessionTypeLabels[nextSession.type] ?? nextSession.type}
              </p>
              {isWithin24h && nextSession.zoomLink && (
                <a
                  href={nextSession.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 bg-or-sacre text-white rounded-sharp px-4 py-2 text-xs font-ui hover:bg-ambre-vif transition-colors"
                >
                  Rejoindre sur Zoom
                </a>
              )}
            </>
          ) : (
            <p className="text-brun-mid text-sm font-ui">
              Aucune séance planifiée
            </p>
          )}
        </div>

        {/* Messages non lus */}
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            Messages
          </h2>
          {unreadMessages > 0 ? (
            <div>
              <p className="font-display text-lg text-brun-chaud">
                {unreadMessages} message{unreadMessages > 1 ? "s" : ""} non
                lu{unreadMessages > 1 ? "s" : ""}
              </p>
              <Link
                href="/client/messages"
                className="text-or-sacre text-sm font-ui hover:text-ambre-vif transition-colors mt-2 inline-block"
              >
                Voir &rarr;
              </Link>
            </div>
          ) : (
            <p className="text-brun-mid text-sm font-ui">
              Aucun nouveau message
            </p>
          )}
        </div>

        {/* Pratique du jour */}
        {todayPractice && (
          <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
            <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
              Pratique du jour
            </h2>
            <p className="font-display text-lg text-brun-chaud">
              {todayPractice.practice.title}
            </p>
            <span className="inline-block mt-1 text-sm text-brun-mid">
              {practiceTypeEmoji[todayPractice.practice.type] ?? ""}{" "}
              {todayPractice.practice.type === "BREATHING"
                ? "Respiration"
                : todayPractice.practice.type === "VIDEO"
                  ? "Vidéo"
                  : "Méditation"}
            </span>
            <div className="mt-3">
              <Link
                href="/client/programme"
                className="text-or-sacre text-sm font-ui hover:text-ambre-vif transition-colors"
              >
                Commencer &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Documents */}
      <div>
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
          Mes documents
        </h2>
        <HomeDocuments
          clientDocuments={JSON.parse(JSON.stringify(client.documents))}
        />
      </div>
    </div>
  );
}
