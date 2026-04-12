import { prisma } from "@/lib/prisma";
import { computeStockInfo } from "@/lib/stock-utils";
import DashboardActions from "./DashboardActions";
import AgendaZoomButton from "./AgendaZoomButton";
import ClientTimeline from "./ClientTimeline";
import TasksWidget from "@/components/admin/TasksWidget";
import InactiveClientsWidget from "@/components/admin/InactiveClientsWidget";

const SESSION_TYPE_LABELS: Record<string, string> = {
  ONLINE: "En ligne",
  PRESENTIAL: "Pr\u00e9sentiel",
  CEREMONY: "C\u00e9r\u00e9monie",
};

const URGENCY_ORDER: Record<string, number> = {
  red: 0,
  amber: 1,
  green: 2,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AdminDashboard() {
  // Compute today boundaries in Europe/Brussels (DST-aware)
  const TZ = "Europe/Brussels";
  const nowParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const todayStr = `${nowParts.find((p) => p.type === "year")?.value}-${nowParts.find((p) => p.type === "month")?.value}-${nowParts.find((p) => p.type === "day")?.value}`;
  // Use Intl to find the UTC offset for midnight Brussels
  const midnightRef = new Date(`${todayStr}T00:00:00Z`);
  const inTz = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(midnightRef);
  const getTz = (t: Intl.DateTimeFormatPartTypes) => inTz.find((p) => p.type === t)?.value || "00";
  const actualLocal = `${getTz("year")}-${getTz("month")}-${getTz("day")}T${getTz("hour")}:${getTz("minute")}:${getTz("second")}`;
  const offsetMs = new Date(`${actualLocal}Z`).getTime() - new Date(`${todayStr}T00:00:00Z`).getTime();
  const todayStart = new Date(midnightRef.getTime() - offsetMs);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  const [activeClientsCount, todaySessionsRaw, todayAppointments, pendingActions, allPrescriptions, activeClients, unreadMessages, pendingQuestionnaires] =
    await Promise.all([
      prisma.client.count({ where: { status: "ACTIVE" } }),
      prisma.session.findMany({
        where: { scheduledAt: { gte: todayStart, lte: todayEnd } },
        orderBy: { scheduledAt: "asc" },
        include: { client: { include: { user: { select: { name: true } } } } },
      }),
      prisma.appointment.findMany({
        where: { scheduledAt: { gte: todayStart, lte: todayEnd }, status: { not: "CANCELLED" } },
        orderBy: { scheduledAt: "asc" },
        include: { client: { include: { user: { select: { name: true } } } } },
      }),
      prisma.pendingAction.findMany({
        where: { completedAt: null },
        include: { client: { include: { user: { select: { name: true } } } } },
      }),
      prisma.elixirPrescription.findMany({
        where: { client: { status: "ACTIVE" } },
      }),
      // Detailed client data for overview
      prisma.client.findMany({
        where: { status: { in: ["ACTIVE", "PAUSED"] } },
        include: {
          user: { select: { name: true } },
          intake: { select: { firstName: true } },
          elixirPrescriptions: {
            where: { endDate: null },
            include: { elixir: { select: { name: true } } },
          },
          sessions: {
            where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
            orderBy: { scheduledAt: "asc" },
            take: 1,
          },
          dailyCheckins: {
            orderBy: { date: "desc" },
            take: 1,
          },
          clientPhases: {
            orderBy: { startDate: "asc" },
          },
          sessionPacks: {
            select: { totalSessions: true },
          },
          appointments: {
            where: { sessionPackId: { not: null }, status: { not: "CANCELLED" } },
            select: { id: true },
          },
        },
        orderBy: { startDate: "asc" },
      }),
      prisma.message.count({ where: { readAt: null, receiver: { role: "ADMIN" } } }),
      prisma.questionnaireResponse.findMany({
        where: { status: "PENDING" },
        include: {
          client: { include: { user: { select: { name: true } } } },
          questionnaire: { select: { title: true, type: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  // Merge Sessions + Appointments into unified list
  const APPT_TYPE_LABELS: Record<string, string> = { zoom: "En ligne", presentiel: "Présentiel" };
  const todaySessions = [
    ...todaySessionsRaw.map((s) => ({
      id: s.id, scheduledAt: s.scheduledAt, clientName: s.client.user.name ?? "",
      duration: s.duration, typeLabel: SESSION_TYPE_LABELS[s.type] ?? s.type, zoomLink: s.zoomLink,
      source: "session" as const,
    })),
    ...todayAppointments.map((a) => ({
      id: a.id, scheduledAt: a.scheduledAt, clientName: a.client.user.name ?? "",
      duration: a.durationMin, typeLabel: APPT_TYPE_LABELS[a.meetingType] ?? a.meetingType, zoomLink: a.zoomJoinUrl,
      source: "appointment" as const,
    })),
  ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  pendingActions.sort((a, b) => {
    const urgDiff = (URGENCY_ORDER[a.urgency] ?? 2) - (URGENCY_ORDER[b.urgency] ?? 2);
    if (urgDiff !== 0) return urgDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const criticalStocksCount = allPrescriptions.filter(
    (rx) => computeStockInfo(rx).isLow
  ).length;

  const serializedActions = pendingActions.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    urgency: a.urgency,
    clientId: a.clientId,
    client: a.client ? { user: { name: a.client.user.name } } : null,
    createdAt: a.createdAt.toISOString(),
  }));

  // Prepare client overview data
  const clientOverviews = activeClients.map((c) => {
    const dayNumber = Math.floor((Date.now() - new Date(c.startDate).getTime()) / 86400000) + 1;
    const displayName = c.intake?.firstName || c.user.name || "Client";

    // Determine current cycle
    let currentCycle = "Cycle 1";
    let currentWeek = Math.ceil(dayNumber / 7);
    if (dayNumber <= 21) { currentCycle = "Cycle 1"; currentWeek = Math.ceil(dayNumber / 7); }
    else if (dayNumber <= 31) { currentCycle = "Break 1"; currentWeek = Math.ceil((dayNumber - 21) / 7); }
    else if (dayNumber <= 52) { currentCycle = "Cycle 2"; currentWeek = Math.ceil((dayNumber - 31) / 7); }
    else if (dayNumber <= 62) { currentCycle = "Break 2"; currentWeek = Math.ceil((dayNumber - 52) / 7); }
    else if (dayNumber <= 83) { currentCycle = "Cycle 3"; currentWeek = Math.ceil((dayNumber - 62) / 7); }
    else { currentCycle = "Break 3"; currentWeek = Math.ceil((dayNumber - 83) / 7); }

    const lastCheckin = c.dailyCheckins[0];
    const nextSession = c.sessions[0];

    return {
      id: c.id,
      name: displayName,
      dayNumber,
      totalDays: 93,
      currentCycle,
      currentWeek,
      status: c.status,
      startDate: c.startDate.toISOString(),
      lastCheckinDate: lastCheckin?.date ? new Date(lastCheckin.date).toISOString() : null,
      hasMorningCheckin: lastCheckin?.energyLevel != null,
      hasEveningCheckin: lastCheckin?.gratitudeMoment != null,
      elixirs: c.elixirPrescriptions.map((rx) => ({
        name: rx.elixir.name,
        dosage: rx.dosage || "",
      })),
      nextSession: nextSession ? {
        date: nextSession.scheduledAt.toISOString(),
        zoomLink: nextSession.zoomLink,
      } : null,
      packTotal: c.sessionPacks.reduce((sum, p) => sum + p.totalSessions, 0),
      packUsed: c.appointments.length,
      packRemaining: c.sessionPacks.reduce((sum, p) => sum + p.totalSessions, 0) - c.appointments.length,
    };
  });

  return (
    <div className="h-full flex flex-col gap-6">
      <h1 className="font-display text-2xl font-light text-brun-chaud">
        Le Cockpit
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">Clients actifs</p>
          <p className="font-display text-3xl text-or-sacre">{activeClientsCount}</p>
        </div>
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">S&eacute;ances aujourd&apos;hui</p>
          <p className="font-display text-3xl text-or-sacre">{todaySessions.length}</p>
        </div>
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">Messages non lus</p>
          <p className={`font-display text-3xl ${unreadMessages > 0 ? "text-red-500" : "text-or-sacre"}`}>
            {unreadMessages}
          </p>
        </div>
      </div>

      {/* Client overview list */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
          Vue clients
        </h2>
        {clientOverviews.length === 0 ? (
          <p className="text-sm font-ui text-brun-mid/60">Aucun client actif</p>
        ) : (
          <div className="space-y-4">
            {clientOverviews.map((client) => (
              <div key={client.id} className="border border-or-pale/50 rounded-lg p-4 space-y-3">
                {/* Name + Day + Progress */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-or-sacre/10 flex items-center justify-center">
                      <span className="text-xs font-ui font-medium text-or-sacre">
                        {getInitials(client.name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-display text-base text-brun-chaud">{client.name}</p>
                      <p className="font-ui text-xs text-brun-mid">
                        Day {client.dayNumber} / {client.totalDays} &middot; {client.currentCycle} &middot; Semaine {client.currentWeek}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-ui px-2 py-0.5 rounded-full ${
                    client.status === "ACTIVE" ? "bg-foret/10 text-foret" :
                    client.status === "PAUSED" ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {client.status === "ACTIVE" ? "Actif" : client.status === "PAUSED" ? "En pause" : "Termin\u00e9"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-or-pale/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-or-sacre transition-all"
                    style={{ width: `${Math.min((client.dayNumber / client.totalDays) * 100, 100)}%` }}
                  />
                </div>

                {/* Timeline */}
                <ClientTimeline dayNumber={client.dayNumber} />

                {/* Quick info row */}
                <div className="grid grid-cols-3 gap-3 text-xs font-ui">
                  {/* Check-ins */}
                  <div>
                    <p className="text-brun-mid/60 mb-1">Derniers check-ins</p>
                    <div className="flex gap-2">
                      <span className={client.hasMorningCheckin ? "text-or-sacre" : "text-brun-mid/30"}>
                        {"\u2600\uFE0F"} {client.hasMorningCheckin ? "Fait" : "-"}
                      </span>
                      <span className={client.hasEveningCheckin ? "text-or-sacre" : "text-brun-mid/30"}>
                        {"\uD83C\uDF19"} {client.hasEveningCheckin ? "Fait" : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Elixirs */}
                  <div>
                    <p className="text-brun-mid/60 mb-1">&Eacute;lixirs</p>
                    {client.elixirs.length > 0 ? (
                      client.elixirs.map((e, i) => (
                        <p key={i} className="text-brun-chaud truncate">{e.name}</p>
                      ))
                    ) : (
                      <p className="text-brun-mid/30">-</p>
                    )}
                  </div>

                  {/* Next session */}
                  <div>
                    <p className="text-brun-mid/60 mb-1">Prochain RDV</p>
                    {client.nextSession ? (
                      <div>
                        <p className="text-brun-chaud">
                          {new Date(client.nextSession.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                        {client.nextSession.zoomLink && (
                          <a href={client.nextSession.zoomLink} target="_blank" rel="noopener noreferrer" className="text-or-sacre hover:text-ambre-vif">
                            Zoom &rarr;
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-brun-mid/30">-</p>
                    )}
                  </div>

                  {/* Session pack count */}
                  {client.packTotal > 0 && (
                    <div>
                      <p className="text-brun-mid/60 mb-1">Seances</p>
                      <p className={`font-medium ${client.packRemaining <= 0 ? "text-red-600" : client.packRemaining <= 2 ? "text-orange-500" : "text-brun-chaud"}`}>
                        {client.packRemaining} restantes / {client.packTotal}
                      </p>
                      {client.packRemaining <= 0 && (
                        <p className="text-[10px] text-red-500 font-ui">Pack epuise</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agenda + Actions */}
      <div className="grid grid-cols-[1.2fr_1fr] gap-6 min-h-0">
        {/* Agenda du jour */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] overflow-y-auto">
          <div className="p-5">
            <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
              Agenda du jour
            </h2>
            {todaySessions.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm font-ui text-brun-mid/60">Aucune s&eacute;ance aujourd&apos;hui</p>
              </div>
            ) : (
              <div>
                {todaySessions.map((session, index) => {
                  const initials = getInitials(session.clientName);
                  return (
                    <div key={session.id}>
                      <div className="flex items-start gap-3 py-3">
                        <div className="w-8 h-8 rounded-full bg-or-sacre/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-ui font-medium text-or-sacre">{initials}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-display text-lg text-or-sacre">
                            {new Date(session.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" })}
                          </p>
                          <p className="font-ui text-sm text-brun-chaud mt-0.5">{session.clientName}</p>
                          <p className="text-xs text-brun-mid mt-1">
                            {session.typeLabel} &middot; {session.duration} min
                          </p>
                        </div>
                        <AgendaZoomButton sessionId={session.id} initialZoomLink={session.zoomLink ?? null} type={session.source} />
                      </div>
                      {index < todaySessions.length - 1 && <div className="border-b border-or-pale/30" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* À faire */}
        <TasksWidget />

        {/* Actions en attente */}
        <DashboardActions initialActions={serializedActions} />
      </div>

      {/* Clients à relancer */}
      <InactiveClientsWidget />

      {/* Questionnaires en attente — section independante sous la grille */}
      <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-3">
          Questionnaires en attente {pendingQuestionnaires.length > 0 && `(${pendingQuestionnaires.length})`}
        </h2>
        {pendingQuestionnaires.length === 0 ? (
          <p className="text-sm text-brun-mid/60 font-ui text-center py-3">
            Aucun questionnaire en attente
          </p>
        ) : (
          <div className="space-y-2">
            {pendingQuestionnaires.map((pq) => {
              const hours = Math.round((Date.now() - new Date(pq.createdAt).getTime()) / (1000 * 60 * 60));
              const isOverdue = hours > 48;
              return (
                <a
                  key={pq.id}
                  href={`/admin/clients/${pq.clientId}`}
                  className="flex items-center justify-between p-3 border border-or-pale/40 rounded-lg hover:border-or-sacre transition-colors"
                >
                  <div>
                    <p className="text-sm font-ui text-brun-chaud">{pq.client.user.name}</p>
                    <p className="text-xs font-ui text-brun-mid/50">
                      {pq.questionnaire.type === "PRE_START" ? "Pre-Start" : "Follow-Up"} — {pq.questionnaire.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOverdue && <span className="w-2 h-2 rounded-full bg-red-500" title="Plus de 48h" />}
                    <span className="text-xs font-ui text-brun-mid/40">
                      {hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}j`}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
