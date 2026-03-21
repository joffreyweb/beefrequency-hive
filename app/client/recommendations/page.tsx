import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";

// Labels lisibles pour chaque catégorie
const CATEGORY_LABELS: Record<string, string> = {
  EAU: "Eau",
  COMPLEMENTS: "Compléments",
  OUTILS: "Outils",
  SOINS: "Soins",
  APITHERAPIE: "Apithérapie",
  AUTRE: "Autre",
};

// Couleurs de badge par catégorie — nuances subtiles
const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  EAU: "bg-or-sacre/10 text-or-sacre",
  COMPLEMENTS: "bg-or-sacre/10 text-or-sacre",
  OUTILS: "bg-or-sacre/10 text-or-sacre",
  SOINS: "bg-foret/10 text-foret",
  APITHERAPIE: "bg-foret/10 text-foret",
  AUTRE: "bg-or-sacre/10 text-or-sacre",
};

// Page recommandations côté client — server component
export default async function ClientRecommendationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await requireOnboarding();

  // Récupérer le profil client
  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
  });

  if (!client) redirect("/login");

  // Recommandations personnelles
  const personal = await prisma.clientRecommendation.findMany({
    where: { clientId: client.id },
    include: { recommendation: true },
    orderBy: { createdAt: "desc" },
  });

  // Recommandations globales (exclure celles déjà dans personal)
  const personalRecoIds = personal.map((p) => p.recommendationId);
  const global = await prisma.recommendation.findMany({
    where: { isGlobal: true, id: { notIn: personalRecoIds } },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });

  // Grouper les recommandations globales par catégorie
  const globalByCategory = global.reduce<Record<string, typeof global>>(
    (acc, reco) => {
      const cat = reco.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(reco);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="font-display text-2xl text-brun-chaud">
          Recommandations de Joffrey
        </h1>
        <p className="font-ui text-sm text-brun-mid mt-1">
          Ressources sélectionnées pour votre parcours
        </p>
      </div>

      {/* Section 1 : Sélectionnées pour vous */}
      {personal.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-lg text-brun-chaud">
            Sélectionnées pour vous
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {personal.map((cr) => {
              const reco = cr.recommendation;
              return (
                <div
                  key={cr.id}
                  className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col"
                >
                  {/* Badge catégorie */}
                  <span
                    className={`inline-block self-start text-xs font-caps uppercase tracking-wider px-2 py-0.5 rounded-sharp mb-3 ${CATEGORY_BADGE_CLASSES[reco.category] || "bg-or-sacre/10 text-or-sacre"}`}
                  >
                    {CATEGORY_LABELS[reco.category] || reco.category}
                  </span>

                  {/* Titre */}
                  <h3 className="font-display text-lg text-brun-chaud mb-2">
                    {reco.title}
                  </h3>

                  {/* Note personnalisée de Joffrey */}
                  {cr.note && (
                    <div className="mb-3">
                      <span className="font-caps text-xs text-brun-mid tracking-wider">
                        Note de Joffrey :
                      </span>
                      <p className="italic text-sm text-brun-mid mt-0.5">
                        {cr.note}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {reco.description && (
                    <p className="font-ui text-sm text-brun-mid mb-4 flex-1">
                      {reco.description}
                    </p>
                  )}

                  {/* Lien discret */}
                  {reco.url && (
                    <a
                      href={reco.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center gap-1 text-sm text-or-sacre hover:text-ambre-vif transition-colors font-ui"
                    >
                      Découvrir
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 2 : Catalogue général */}
      {Object.keys(globalByCategory).length > 0 && (
        <section className="space-y-6">
          <h2 className="font-display text-lg text-brun-chaud">
            Catalogue général
          </h2>

          {Object.entries(globalByCategory).map(([category, recos]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-caps text-xs uppercase tracking-wider text-brun-mid">
                {CATEGORY_LABELS[category] || category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recos.map((reco) => (
                  <div
                    key={reco.id}
                    className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col"
                  >
                    {/* Badge catégorie */}
                    <span
                      className={`inline-block self-start text-xs font-caps uppercase tracking-wider px-2 py-0.5 rounded-sharp mb-3 ${CATEGORY_BADGE_CLASSES[reco.category] || "bg-or-sacre/10 text-or-sacre"}`}
                    >
                      {CATEGORY_LABELS[reco.category] || reco.category}
                    </span>

                    {/* Titre */}
                    <h3 className="font-display text-lg text-brun-chaud mb-2">
                      {reco.title}
                    </h3>

                    {/* Description */}
                    {reco.description && (
                      <p className="font-ui text-sm text-brun-mid mb-4 flex-1">
                        {reco.description}
                      </p>
                    )}

                    {/* Lien discret */}
                    {reco.url && (
                      <a
                        href={reco.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center gap-1 text-sm text-or-sacre hover:text-ambre-vif transition-colors font-ui"
                      >
                        Découvrir
                        <span aria-hidden="true">&rarr;</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* État vide : aucune recommandation du tout */}
      {personal.length === 0 && global.length === 0 && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
          <p className="text-sm font-ui text-brun-mid/60">
            Aucune recommandation pour le moment
          </p>
        </div>
      )}
    </div>
  );
}
