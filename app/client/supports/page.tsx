import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";

// Icônes texte par type de support
const TYPE_ICONS: Record<string, string> = {
  MUSIC: "\uD83C\uDFB5",
  VIDEO: "\uD83C\uDFAC",
  PDF: "\uD83D\uDCC4",
  LINK: "\uD83D\uDD17",
};

const TYPE_LABELS: Record<string, string> = {
  MUSIC: "Music",
  VIDEO: "Video",
  PDF: "PDF",
  LINK: "Link",
};

// Page supports côté client — server component
export default async function ClientSupportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await requireOnboarding();

  // Récupérer le profil client
  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
  });

  if (!client) redirect("/login");

  // Charger les supports du client
  const supports = await prisma.support.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          My resources
        </h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          Resources shared with you
        </p>
      </div>

      {supports.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 text-center">
          <p className="text-sm font-ui text-brun-mid/60">
            No resources shared yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {supports.map((support) => (
            <div
              key={support.id}
              className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex flex-col"
            >
              {/* En-tête : icône type + titre */}
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl leading-none" aria-hidden="true">
                  {TYPE_ICONS[support.type] || "\uD83D\uDD17"}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-ui text-brun-chaud font-normal truncate">
                    {support.title}
                  </h3>
                  <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
                    {TYPE_LABELS[support.type] || support.type}
                  </p>
                </div>
              </div>

              {/* Description */}
              {support.description && (
                <p className="text-sm font-ui text-brun-mid/70 mb-4 flex-1">
                  {support.description}
                </p>
              )}

              {/* Lien d'accès */}
              <a
                href={support.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 px-3 py-2 bg-or-sacre text-creme-sacree rounded-sharp text-sm font-ui hover:bg-ambre-vif transition-colors text-center justify-center"
              >
                Access
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
