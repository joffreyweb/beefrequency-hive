import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/translations";
import { t } from "@/lib/translations";

const OFFER_LABELS: Record<string, Record<string, string>> = {
  LE_NECTAR_CYCLE: { FR: "Le Nectar Cycle", EN: "Le Nectar Cycle" },
  LE_PASSAGE_1_1: { FR: "Le Passage 1:1", EN: "Le Passage 1:1" },
  LES_CYCLES_DE_LA_RUCHE: { FR: "Les Cycles de la Ruche", EN: "The Hive Cycles" },
  CEREMONIE_RESET: { FR: "Cérémonie Reset", EN: "Reset Ceremony" },
  LA_RUCHE_VIVANTE: { FR: "La Ruche Vivante", EN: "The Living Hive" },
  SOUVERAINETE: { FR: "Souveraineté", EN: "Sovereignty" },
  CONVERSATION_EXPLORATOIRE: { FR: "Conversation exploratoire", EN: "Exploratory Conversation" },
  SESSION_SEUIL: { FR: "Session Seuil", EN: "Threshold Session" },
};

export default async function AbonnementPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true } },
      intake: { select: { firstName: true } },
      clientPhases: { orderBy: { startDate: "asc" } },
      appointments: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { scheduledAt: "asc" },
      },
      sessionPacks: true,
    },
  });

  if (!client) redirect("/login");

  const lang = (client.language === "EN" ? "EN" : "FR") as Lang;
  const T = (key: { EN: string; FR: string }) => key[lang];

  const now = new Date();

  // Sessions: manual fields OR session pack total
  const packTotal = client.sessionPacks.reduce((sum, p) => sum + p.totalSessions, 0);
  const totalSessions = client.totalSessions || packTotal || 0;
  const usedSessions = client.usedSessions || 0;
  const remainingSessions = Math.max(0, totalSessions - usedSessions);

  const pastAppointments = client.appointments.filter(
    (a) => new Date(a.scheduledAt).getTime() < now.getTime()
  );
  const upcomingAppointments = client.appointments.filter(
    (a) => new Date(a.scheduledAt).getTime() >= now.getTime()
  );

  // Current phase
  const currentPhase = client.clientPhases.find((p) => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });
  const currentDay = currentPhase
    ? Math.ceil((now.getTime() - new Date(currentPhase.startDate).getTime()) / 86400000) + 1
    : 0;

  const offerLabel =
    OFFER_LABELS[client.offerType]?.[lang] || client.offerType;

  return (
    <div className="space-y-6 pb-8">
      <h1 className="font-display text-2xl text-brun-chaud">
        {T({ EN: "My Subscription", FR: "Mon Abonnement" })}
      </h1>

      {/* Mon offre */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
          {T({ EN: "My offer", FR: "Mon offre" })}
        </h2>
        <p className="font-display text-xl text-brun-chaud">{offerLabel}</p>
        {client.startDate && (
          <p className="font-ui text-sm text-brun-mid mt-1">
            {T({ EN: "Since ", FR: "Depuis le " })}
            {new Date(client.startDate).toLocaleDateString(
              lang === "FR" ? "fr-FR" : "en-US",
              { day: "numeric", month: "long", year: "numeric" }
            )}
          </p>
        )}
        {currentPhase && (
          <p className="font-ui text-sm text-or-sacre mt-1">
            {currentPhase.customName || `Phase ${currentPhase.phaseNumber}`} — {T({ EN: "Day", FR: "Jour" })} {currentDay}
          </p>
        )}
      </div>

      {/* Mes séances */}
      {totalSessions > 0 && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            {T({ EN: "My sessions", FR: "Mes séances" })}
          </h2>

          {/* Progress bar */}
          <div className="flex gap-1 mb-3">
            {Array.from({ length: totalSessions }).map((_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-full transition-colors ${
                  i < usedSessions ? "bg-or-sacre" : "bg-or-pale/30"
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between text-sm font-ui">
            <span className="text-brun-mid">
              {usedSessions} {T({ EN: "used", FR: "utilisée" })}{usedSessions > 1 ? "s" : ""}
            </span>
            <span className="text-brun-chaud font-medium">
              {remainingSessions} {T({ EN: "remaining", FR: "restante" })}{remainingSessions > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Prochaine séance */}
      {upcomingAppointments.length > 0 && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            {T({ EN: "Next session", FR: "Prochaine séance" })}
          </h2>
          {upcomingAppointments.map((apt) => (
            <div key={apt.id} className="flex items-center justify-between py-2 border-b border-or-pale/30 last:border-0">
              <div>
                <p className="font-display text-base text-brun-chaud">
                  📅{" "}
                  {new Date(apt.scheduledAt).toLocaleDateString(
                    lang === "FR" ? "fr-FR" : "en-US",
                    { weekday: "long", day: "numeric", month: "long" }
                  )}
                </p>
                <p className="font-ui text-sm text-brun-mid">
                  {new Date(apt.scheduledAt).toLocaleTimeString(
                    lang === "FR" ? "fr-FR" : "en-US",
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                  {" · "}
                  {apt.durationMin} min
                </p>
              </div>
              {apt.zoomJoinUrl && (
                <a
                  href={apt.zoomJoinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-ui text-or-sacre hover:text-ambre-vif"
                >
                  {T(t.home.joinZoom)} →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      {pastAppointments.length > 0 && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            {T({ EN: "History", FR: "Historique" })}
          </h2>
          <div className="space-y-2">
            {pastAppointments.map((apt) => (
              <div key={apt.id} className="flex justify-between text-sm font-ui">
                <span className="text-brun-mid">
                  {new Date(apt.scheduledAt).toLocaleDateString(
                    lang === "FR" ? "fr-FR" : "en-US",
                    { day: "numeric", month: "long" }
                  )}
                </span>
                <span className="text-foret">✓ {apt.durationMin || 60} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
