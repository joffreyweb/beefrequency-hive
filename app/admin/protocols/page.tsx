import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Labels lisibles pour les statuts de protocole
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  PAUSED: "En pause",
};

// Protocoles admin — server component, groupés par client
export default async function ProtocolsPage() {
  // Charger tous les protocoles avec les infos client
  const protocols = await prisma.protocol.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  // Type pour un groupe de protocoles par client
  type ProtocolGroup = {
    clientName: string;
    clientId: string;
    protocols: typeof protocols;
  };

  // Grouper les protocoles par client
  const grouped: Record<string, ProtocolGroup> = {};
  for (const protocol of protocols) {
    const key = protocol.clientId;
    if (!grouped[key]) {
      grouped[key] = {
        clientName: protocol.client.user.name,
        clientId: protocol.clientId,
        protocols: [],
      };
    }
    grouped[key].protocols.push(protocol);
  }

  const groups: ProtocolGroup[] = Object.values(grouped);

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-8">
        Protocoles
      </h1>

      {groups.length === 0 ? (
        <p className="text-sm text-brun-mid/60 font-ui">Aucun protocole</p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.clientId}>
              {/* Nom du client */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-display text-xl text-brun-chaud">
                  {group.clientName}
                </h2>
                <Link
                  href={`/admin/clients/${group.clientId}`}
                  className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors"
                >
                  Voir le profil
                </Link>
              </div>

              {/* Liste des protocoles du client */}
              <div className="space-y-3">
                {group.protocols.map((protocol) => (
                  <div
                    key={protocol.id}
                    className="bg-cire-chaude border border-or-pale rounded-sm p-5"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-ui text-sm font-medium text-brun-chaud">
                        {protocol.title}
                      </h3>
                      <span
                        className={`text-xs font-ui px-2 py-0.5 rounded-sharp ${
                          protocol.status === "ACTIVE"
                            ? "bg-foret/10 text-foret"
                            : protocol.status === "PAUSED"
                              ? "bg-or-sacre/10 text-or-sacre"
                              : "bg-brun-mid/10 text-brun-mid"
                        }`}
                      >
                        {STATUS_LABELS[protocol.status] || protocol.status}
                      </span>
                    </div>

                    {protocol.description && (
                      <p className="text-xs font-ui text-brun-mid/70 mb-2">
                        {protocol.description}
                      </p>
                    )}

                    <div className="flex gap-4 text-xs font-ui text-brun-mid/50">
                      {protocol.frequency && (
                        <span>Fréquence : {protocol.frequency}</span>
                      )}
                      {protocol.duration && (
                        <span>Durée : {protocol.duration}</span>
                      )}
                      <span>
                        Créé le{" "}
                        {new Date(protocol.createdAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
