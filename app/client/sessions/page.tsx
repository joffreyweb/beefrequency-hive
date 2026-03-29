import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";
import SessionChangeButton from "@/components/client/SessionChangeButton";

// Labels lisibles pour les types de session
const TYPE_LABELS: Record<string, string> = {
  ONLINE: "Online",
  PRESENTIAL: "In-person",
  CEREMONY: "Ceremony",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// Sessions + Agenda client — server component, N'affiche PAS les notes privées
export default async function ClientSessionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await requireOnboarding();

  // Récupérer le profil client avec sessions + recommandations + focus
  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    include: {
      sessions: {
        orderBy: { scheduledAt: "asc" },
        select: {
          id: true,
          scheduledAt: true,
          duration: true,
          type: true,
          status: true,
          zoomLink: true,
          createdAt: true,
          changesUsed: true,
          // notes, checklistItems, recapDone exclues — privées
        },
      },
      dailyRecommendations: {
        orderBy: { dayFrom: "asc" },
      },
      dailyFocuses: {
        orderBy: { dayFrom: "desc" },
      },
    },
  });

  if (!client) redirect("/login");

  // Calcul du jour dans le parcours
  const dayNumber =
    Math.floor(
      (Date.now() - new Date(client.startDate).getTime()) / 86400000
    ) + 1;

  // Recommandations du jour (dayFrom <= dayNumber <= dayTo)
  const todayRecos = client.dailyRecommendations.filter(
    (r) => r.dayFrom <= dayNumber && r.dayTo >= dayNumber
  );
  const morningRecos = todayRecos.filter((r) => r.slot === "MORNING");
  const eveningRecos = todayRecos.filter((r) => r.slot === "EVENING");
  const hasRecos = todayRecos.length > 0;

  // Focus du jour (le plus spécifique — premier résultat car trié desc)
  const focus = client.dailyFocuses.find(
    (f) => f.dayFrom <= dayNumber && f.dayTo >= dayNumber
  );

  const now = new Date();
  const sessions = client.sessions;

  // Prochaine session planifiée
  const nextSession = sessions.find(
    (s) => new Date(s.scheduledAt) >= now && s.status === "SCHEDULED"
  );

  // Historique (passées ou terminées/annulées)
  const history = sessions.filter(
    (s) => new Date(s.scheduledAt) < now || s.status !== "SCHEDULED"
  );

  // Futures sessions (hors la prochaine)
  const upcoming = sessions.filter(
    (s) =>
      new Date(s.scheduledAt) >= now &&
      s.status === "SCHEDULED" &&
      s.id !== nextSession?.id
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          My sessions
        </h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          Day {dayNumber} of your journey
        </p>
      </div>

      {/* Agenda du jour — recommandations matin/soir */}
      {hasRecos && (
        <div>
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
            Day {dayNumber} — Recommendations
          </h2>

          <div className="space-y-3">
            {/* Focus du jour */}
            {focus && (
              <div className="border border-or-sacre bg-cire-chaude rounded-sm p-5">
                <p className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-2">
                  Focus of the day
                </p>
                <p className="font-display text-lg text-brun-chaud mb-1">
                  {focus.title}
                </p>
                <p className="font-ui text-sm text-brun-mid">{focus.message}</p>
              </div>
            )}

            {/* Recommandations matin */}
            {morningRecos.length > 0 && (
              <div className="bg-cire-chaude border-l-4 border-or-sacre rounded-sm p-5">
                <p className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
                  Morning
                </p>
                <div className="space-y-3">
                  {morningRecos.map((reco) => (
                    <div key={reco.id}>
                      <p className="font-display text-base text-brun-chaud mb-1">
                        {reco.title}
                      </p>
                      <p className="font-ui text-sm text-brun-mid whitespace-pre-wrap">
                        {reco.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations soir */}
            {eveningRecos.length > 0 && (
              <div className="bg-cire-chaude border-l-4 border-ambre-vif rounded-sm p-5">
                <p className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
                  Evening
                </p>
                <div className="space-y-3">
                  {eveningRecos.map((reco) => (
                    <div key={reco.id}>
                      <p className="font-display text-base text-brun-chaud mb-1">
                        {reco.title}
                      </p>
                      <p className="font-ui text-sm text-brun-mid whitespace-pre-wrap">
                        {reco.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prochaine séance mise en avant */}
      {nextSession ? (
        <div className="bg-cire-chaude border-2 border-or-sacre rounded-sm p-6">
          <p className="font-caps text-xs text-or-sacre uppercase tracking-widest mb-2">
            Next session
          </p>
          <p className="font-display text-2xl text-brun-chaud">
            {new Date(nextSession.scheduledAt).toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-sm font-ui text-brun-mid mt-1">
            {new Date(nextSession.scheduledAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            — {TYPE_LABELS[nextSession.type] || nextSession.type} ·{" "}
            {nextSession.duration} min
          </p>
          <SessionChangeButton
            sessionId={nextSession.id}
            changesUsed={nextSession.changesUsed}
            lang={client.language}
          />
          {/* Bouton Zoom — visible 30 min avant jusqu'à 2h après le début */}
          {nextSession.zoomLink && (() => {
            const sessionTime = new Date(nextSession.scheduledAt).getTime();
            const nowMs = now.getTime();
            const thirtyMinBefore = sessionTime - 30 * 60 * 1000;
            const twoHoursAfter = sessionTime + 2 * 60 * 60 * 1000;
            const isInWindow = nowMs >= thirtyMinBefore && nowMs <= twoHoursAfter;
            return isInWindow ? (
              <a
                href={nextSession.zoomLink!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 px-4 py-2 text-sm font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
              >
                Join session
              </a>
            ) : null;
          })()}
        </div>
      ) : (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
          <p className="text-sm font-ui text-brun-mid/60">
            No sessions scheduled
          </p>
        </div>
      )}

      {/* Autres séances à venir */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-2">
            {upcoming.map((s) => (
              <div
                key={s.id}
                className="bg-cire-chaude border border-or-pale rounded-sm p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-ui text-brun-chaud">
                    {new Date(s.scheduledAt).toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
                    {TYPE_LABELS[s.type] || s.type} · {s.duration} min
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Bouton Zoom — fenêtre 30min avant à 2h après */}
                  {s.zoomLink && (() => {
                    const sTime = new Date(s.scheduledAt).getTime();
                    const nMs = now.getTime();
                    const inWindow = nMs >= sTime - 30 * 60000 && nMs <= sTime + 2 * 3600000;
                    return inWindow ? (
                      <a
                        href={s.zoomLink!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
                      >
                        Join session
                      </a>
                    ) : null;
                  })()}
                  <p className="text-sm font-ui text-or-sacre">
                    {new Date(s.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      <div>
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
          History ({history.length})
        </h2>

        {history.length === 0 ? (
          <p className="text-sm text-brun-mid/60 font-ui">
            No past sessions
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((s) => (
              <div
                key={s.id}
                className="bg-cire-chaude/50 border border-or-pale/40 rounded-sm p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-ui text-brun-mid">
                    {new Date(s.scheduledAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs font-ui text-brun-mid/50 mt-0.5">
                    {TYPE_LABELS[s.type] || s.type} · {s.duration} min
                  </p>
                </div>
                <span
                  className={`text-xs font-ui px-2 py-0.5 rounded-sharp ${
                    s.status === "COMPLETED"
                      ? "bg-foret/10 text-foret"
                      : s.status === "CANCELLED"
                        ? "bg-red-50 text-red-600"
                        : "bg-or-sacre/10 text-or-sacre"
                  }`}
                >
                  {STATUS_LABELS[s.status] || s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
