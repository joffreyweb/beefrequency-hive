import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Page admin — vue globale des entrées de journal (non privées)
export default async function AdminJournalPage() {
  // Récupère les 50 dernières entrées publiques avec le nom du client
  const entries = await prisma.journalEntry.findMany({
    where: { isPrivate: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      client: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-8">
        Journal global
      </h1>

      {entries.length === 0 ? (
        <p className="text-sm text-brun-mid/60 font-ui">
          Aucune entrée de journal
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="bg-cire-chaude border border-or-pale rounded-sm p-5"
            >
              <Link
                href={`/admin/clients/${entry.clientId}`}
                className="block hover:bg-creme-sacree/50 rounded-sharp transition-colors duration-150 -m-2 p-2"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-ui text-brun-chaud font-medium">
                    {entry.client.user.name}
                  </p>
                  <span className="text-xs font-ui text-or-sacre">
                    {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {entry.mood && (
                  <p className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
                    Humeur : {entry.mood}
                  </p>
                )}
                <p className="text-sm font-ui text-brun-mid/80">
                  {entry.content.length > 100
                    ? entry.content.slice(0, 100) + "…"
                    : entry.content}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
