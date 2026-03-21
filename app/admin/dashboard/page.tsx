import { prisma } from "@/lib/prisma";
import { computeStockInfo } from "@/lib/stock-utils";
import DashboardActions from "./DashboardActions";
import AgendaZoomButton from "./AgendaZoomButton";

const OFFER_LABELS: Record<string, string> = {
  HIVE_EXPERIENCE: "Hive Experience",
  THE_PASSAGE: "The Passage",
  SOUVERAINETE: "Souveraineté",
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  ONLINE: "En ligne",
  PRESENTIAL: "Présentiel",
  CEREMONY: "Cérémonie",
};

const URGENCY_ORDER: Record<string, number> = {
  red: 0,
  amber: 1,
  green: 2,
};

/** Extrait les 2 premières lettres d'un nom pour l'avatar */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AdminDashboard() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [activeClientsCount, todaySessions, pendingActions, allPrescriptions] =
    await Promise.all([
      // 1. Clients actifs
      prisma.client.count({ where: { status: "ACTIVE" } }),

      // 2. Séances du jour
      prisma.session.findMany({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          client: {
            include: { user: { select: { name: true } } },
          },
        },
      }),

      // 3. Actions en attente (tri custom en JS)
      prisma.pendingAction.findMany({
        where: { completedAt: null },
        include: {
          client: {
            include: { user: { select: { name: true } } },
          },
        },
      }),

      // 4. Prescriptions actives pour calcul stocks critiques
      prisma.elixirPrescription.findMany({
        where: { client: { status: "ACTIVE" } },
      }),
    ]);

  // Tri custom des actions : red > amber > green, puis createdAt desc
  pendingActions.sort((a, b) => {
    const urgDiff =
      (URGENCY_ORDER[a.urgency] ?? 2) - (URGENCY_ORDER[b.urgency] ?? 2);
    if (urgDiff !== 0) return urgDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Calcul stocks critiques
  const criticalStocksCount = allPrescriptions.filter(
    (rx) => computeStockInfo(rx).isLow
  ).length;

  // Sérialiser les actions pour le client component
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

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Titre de la page */}
      <h1 className="font-display text-2xl font-light text-brun-chaud">
        Le Cockpit
      </h1>

      {/* Ligne du haut : 4 cards métriques */}
      <div className="grid grid-cols-4 gap-4">
        {/* Clients actifs */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">
            Clients actifs
          </p>
          <p className="font-display text-3xl text-or-sacre">
            {activeClientsCount}
          </p>
        </div>

        {/* Séances aujourd'hui */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">
            Séances aujourd&apos;hui
          </p>
          <p className="font-display text-3xl text-or-sacre">
            {todaySessions.length}
          </p>
        </div>

        {/* Actions en attente */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">
            Actions en attente
          </p>
          <p
            className={`font-display text-3xl ${
              pendingActions.length > 0 ? "text-red-500" : "text-or-sacre"
            }`}
          >
            {pendingActions.length}
          </p>
        </div>

        {/* Stocks critiques */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
          <p className="font-caps text-xs text-brun-mid uppercase tracking-wider">
            Stocks critiques
          </p>
          <p
            className={`font-display text-3xl ${
              criticalStocksCount > 0 ? "text-red-500" : "text-or-sacre"
            }`}
          >
            {criticalStocksCount}
          </p>
        </div>
      </div>

      {/* Ligne du bas : 2 colonnes */}
      <div className="flex-1 grid grid-cols-[1.2fr_1fr] gap-6 min-h-0">
        {/* Colonne gauche — Agenda du jour */}
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] h-full overflow-y-auto">
          <div className="p-5">
            <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
              Agenda du jour
            </h2>

            {todaySessions.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm font-ui text-brun-mid/60">
                  Aucune séance aujourd&apos;hui
                </p>
              </div>
            ) : (
              <div>
                {todaySessions.map((session, index) => {
                  const clientName = session.client.user.name ?? "";
                  const initials = getInitials(clientName);

                  return (
                    <div key={session.id}>
                      <div className="flex items-start gap-3 py-3">
                        {/* Avatar initiales */}
                        <div className="w-8 h-8 rounded-full bg-or-sacre/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-ui font-medium text-or-sacre">
                            {initials}
                          </span>
                        </div>

                        {/* Contenu */}
                        <div className="flex-1">
                          <p className="font-display text-lg text-or-sacre">
                            {new Date(session.scheduledAt).toLocaleTimeString(
                              "fr-FR",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </p>
                          <p className="font-ui text-sm text-brun-chaud mt-0.5">
                            {clientName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-caps uppercase bg-or-sacre/10 text-or-sacre px-2 py-0.5 rounded-sharp">
                              {OFFER_LABELS[session.client.offerType] ??
                                session.client.offerType}
                            </span>
                            {/* Status pill */}
                            <span
                              className={`text-xs font-ui px-2 py-0.5 rounded-full ${
                                session.status === "COMPLETED"
                                  ? "bg-or-sacre/10 text-or-sacre"
                                  : "bg-foret/10 text-foret"
                              }`}
                            >
                              {session.status === "COMPLETED"
                                ? "Terminée"
                                : "Planifiée"}
                            </span>
                          </div>
                          <p className="text-xs text-brun-mid mt-1">
                            {SESSION_TYPE_LABELS[session.type] ?? session.type} ·{" "}
                            {session.duration} min
                          </p>
                        </div>

                        {/* Bouton Zoom — prominent si lien existant, sinon ajout inline */}
                        <AgendaZoomButton
                          sessionId={session.id}
                          initialZoomLink={session.zoomLink ?? null}
                        />
                      </div>
                      {index < todaySessions.length - 1 && (
                        <div className="border-b border-or-pale/30" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite — Actions en attente (client component) */}
        <DashboardActions initialActions={serializedActions} />
      </div>
    </div>
  );
}
