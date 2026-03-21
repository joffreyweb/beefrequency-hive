import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";

export default async function AgendaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await requireOnboarding();

  // Charge le client
  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
  });

  if (!client) redirect("/login");

  // Calcul du jour dans le parcours
  const dayNumber =
    Math.floor(
      (Date.now() - new Date(client.startDate).getTime()) / 86400000
    ) + 1;

  // Recommandations du jour
  const recommendations = await prisma.dailyRecommendation.findMany({
    where: {
      clientId: client.id,
      dayFrom: { lte: dayNumber },
      dayTo: { gte: dayNumber },
    },
    orderBy: { dayFrom: "asc" },
  });

  // Focus du jour (le plus spécifique)
  const focus = await prisma.dailyFocus.findFirst({
    where: {
      clientId: client.id,
      dayFrom: { lte: dayNumber },
      dayTo: { gte: dayNumber },
    },
    orderBy: { dayFrom: "desc" },
  });

  // Sépare matin et soir
  const morningRecos = recommendations.filter((r) => r.slot === "MORNING");
  const eveningRecos = recommendations.filter((r) => r.slot === "EVENING");

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          Jour {dayNumber} de votre parcours
        </h1>
      </div>

      {/* Focus du jour */}
      <section className="border border-or-sacre bg-cire-chaude rounded-sm p-5">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
          Focus du jour
        </h2>
        {focus ? (
          <>
            <p className="font-display text-lg text-brun-chaud mb-2">
              {focus.title}
            </p>
            <p className="font-ui text-sm text-brun-mid">{focus.message}</p>
          </>
        ) : (
          <p className="font-ui text-sm text-brun-mid">
            Continuez votre chemin avec confiance.
          </p>
        )}
      </section>

      {/* Recommandations matin */}
      <section>
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
          Recommandations matin
        </h2>
        {morningRecos.length === 0 ? (
          <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
            <p className="text-sm text-brun-mid/60 font-ui">
              Pas de recommandation pour ce matin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {morningRecos.map((reco) => (
              <div
                key={reco.id}
                className="bg-cire-chaude border border-or-pale rounded-sm p-5"
              >
                <p className="font-display text-base text-brun-chaud mb-1">
                  {reco.title}
                </p>
                <p className="font-ui text-sm text-brun-mid whitespace-pre-wrap">
                  {reco.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recommandations soir */}
      <section>
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
          Recommandations soir
        </h2>
        {eveningRecos.length === 0 ? (
          <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
            <p className="text-sm text-brun-mid/60 font-ui">
              Pas de recommandation pour ce soir.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {eveningRecos.map((reco) => (
              <div
                key={reco.id}
                className="bg-cire-chaude border border-or-pale rounded-sm p-5"
              >
                <p className="font-display text-base text-brun-chaud mb-1">
                  {reco.title}
                </p>
                <p className="font-ui text-sm text-brun-mid whitespace-pre-wrap">
                  {reco.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
