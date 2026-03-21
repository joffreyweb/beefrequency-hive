import { prisma } from "@/lib/prisma";
import SessionsAdmin from "./SessionsAdmin";
import UpcomingSessions from "./UpcomingSessions";

// Labels lisibles pour les types et statuts de session
const TYPE_LABELS: Record<string, string> = {
  ONLINE: "En ligne",
  PRESENTIAL: "Présentiel",
  CEREMONY: "Cérémonie",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Planifiée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

// Agenda global admin — server component
export default async function SessionsPage() {
  // Charger toutes les sessions triées par date + clients pour le formulaire
  const [sessions, clients] = await Promise.all([
    prisma.session.findMany({
      orderBy: { scheduledAt: "asc" },
      include: {
        client: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  // Séparer les sessions à venir et passées
  const now = new Date();
  const upcoming = sessions.filter(
    (s) => new Date(s.scheduledAt) >= now && s.status === "SCHEDULED"
  );
  const past = sessions.filter(
    (s) => new Date(s.scheduledAt) < now || s.status !== "SCHEDULED"
  );

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-8">
        Sessions
      </h1>

      {/* Formulaire de création (client component) */}
      <SessionsAdmin clients={clients} />

      {/* Sessions à venir */}
      <div className="mb-10">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
          À venir ({upcoming.length})
        </h2>

        {/* Client component pour les actions interactives (Zoom, terminer) */}
        <UpcomingSessions
          sessions={upcoming.map((s) => ({
            ...s,
            scheduledAt: s.scheduledAt.toISOString(),
          }))}
        />
      </div>

      {/* Sessions passées / terminées */}
      <div>
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
          Historique ({past.length})
        </h2>

        {past.length === 0 ? (
          <p className="text-sm text-brun-mid/60 font-ui">Aucun historique</p>
        ) : (
          <div className="space-y-2">
            {past.map((session) => (
              <div
                key={session.id}
                className="bg-cire-chaude/50 border border-or-pale/50 rounded-sm p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-ui text-brun-mid">
                    {session.client.user.name}
                  </p>
                  <p className="text-xs font-ui text-brun-mid/50">
                    {TYPE_LABELS[session.type] || session.type} ·{" "}
                    {session.duration} min
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span
                    className={`text-xs font-ui px-2 py-0.5 rounded-sharp ${
                      session.status === "COMPLETED"
                        ? "bg-foret/10 text-foret"
                        : session.status === "CANCELLED"
                          ? "bg-red-50 text-red-600"
                          : "bg-or-sacre/10 text-or-sacre"
                    }`}
                  >
                    {STATUS_LABELS[session.status] || session.status}
                  </span>
                  <p className="text-xs font-ui text-brun-mid/50">
                    {new Date(session.scheduledAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
