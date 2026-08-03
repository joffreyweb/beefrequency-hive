import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// Espace client — « Mes parcours passés » (refonte Parcours — Étape 2C).
// Lecture seule : chaque parcours terminé, ses phases et les élixirs associés.
export default async function ParcoursPassesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) redirect("/login");

  const parcours = await prisma.clientParcours.findMany({
    where: { clientId: client.id, status: "COMPLETED" },
    orderBy: [{ startedAt: "desc" }],
    include: {
      phases: {
        orderBy: { startDate: "asc" },
        include: {
          phaseElixirs: { include: { elixirLibrary: { select: { name: true } } } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brun-chaud">Mes parcours passés</h1>
        <Link
          href="/client/home"
          className="font-caps text-[10px] uppercase tracking-wider text-or-sacre hover:text-ambre-vif transition-colors"
        >
          ← Accueil
        </Link>
      </div>

      {parcours.length === 0 ? (
        <p className="font-ui text-sm text-brun-mid/60">
          Tu n'as pas encore de parcours terminé. Ce qui a été accompli apparaîtra ici.
        </p>
      ) : (
        <div className="space-y-5">
          {parcours.map((p) => (
            <div key={p.id} className="bg-cire-chaude border border-or-pale rounded-sm p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg text-brun-chaud">
                  {p.parcoursType === "LE_PASSAGE" ? "Le Passage" : p.parcoursType}
                </h2>
                <span className="font-caps text-[10px] uppercase tracking-wider text-foret">
                  Terminé
                </span>
              </div>
              <p className="font-ui text-xs text-brun-mid/60 mt-1">
                {fmt(p.detoxStartDate)} → {fmt(p.completedAt)}
              </p>

              {p.phases.length > 0 && (
                <div className="mt-4 space-y-3">
                  {p.phases.map((ph) => (
                    <div key={ph.id} className="border-t border-or-pale/40 pt-3">
                      <p className="font-ui text-sm text-brun-chaud">
                        {ph.customName || `${ph.phaseType} ${ph.phaseNumber}`}
                        <span className="text-brun-mid/50">
                          {" "}· {fmt(ph.startDate)} → {fmt(ph.endDate)}
                        </span>
                      </p>
                      {ph.phaseElixirs.length > 0 && (
                        <ul className="mt-1 ml-4 list-disc font-ui text-xs text-brun-mid/70 space-y-0.5">
                          {ph.phaseElixirs.map((e) => (
                            <li key={e.id}>
                              {e.elixirLibrary.name}
                              {e.dose ? ` — ${e.dose}` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
