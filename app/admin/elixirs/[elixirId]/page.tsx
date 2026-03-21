import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

// Fiche détaillée d'un élixir — server component
export default async function ElixirDetailPage({
  params,
}: {
  params: Promise<{ elixirId: string }>;
}) {
  const { elixirId } = await params;

  // Charger l'élixir avec ses prescriptions en cours
  const elixir = await prisma.elixir.findUnique({
    where: { id: elixirId },
    include: {
      prescriptions: {
        where: {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!elixir) {
    notFound();
  }

  return (
    <div>
      {/* Retour au catalogue */}
      <Link
        href="/admin/elixirs"
        className="text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors duration-150 mb-6 inline-block"
      >
        &larr; Retour au catalogue
      </Link>

      {/* En-tête élixir */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6 mb-8">
        <h1 className="font-display text-3xl font-light text-brun-chaud mb-2">
          {elixir.name}
        </h1>
        <p className="text-sm font-ui text-brun-mid/70 mb-4">
          {elixir.description}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
              Dosage
            </p>
            <p className="text-sm font-ui text-brun-chaud">{elixir.dosage}</p>
          </div>
          <div>
            <p className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
              Durée
            </p>
            <p className="text-sm font-ui text-brun-chaud">
              {elixir.duration}
            </p>
          </div>
          <div>
            <p className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
              Stock
            </p>
            <p
              className={`text-sm font-ui ${elixir.stock > 0 ? "text-foret" : "text-red-600"}`}
            >
              {elixir.stock} unité{elixir.stock > 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p className="text-xs font-caps text-brun-mid uppercase tracking-wider mb-1">
              Créé le
            </p>
            <p className="text-sm font-ui text-brun-chaud">
              {new Date(elixir.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* Prescriptions en cours pour cet élixir */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-6">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
          Prescriptions en cours ({elixir.prescriptions.length})
        </h2>

        {elixir.prescriptions.length === 0 ? (
          <p className="text-sm text-brun-mid/60 font-ui">
            Aucune prescription active pour cet élixir
          </p>
        ) : (
          <div className="space-y-3">
            {elixir.prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="flex items-center justify-between px-4 py-3 bg-creme-sacree rounded-sharp"
              >
                <div>
                  <p className="text-sm font-ui text-brun-chaud">
                    {prescription.client.user.name}
                  </p>
                  <p className="text-xs font-ui text-brun-mid/60">
                    {prescription.dosage || elixir.dosage}
                    {prescription.notes && ` · ${prescription.notes}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-ui text-brun-mid/60">
                    Depuis le{" "}
                    {new Date(prescription.startDate).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                  {prescription.endDate && (
                    <p className="text-xs font-ui text-or-sacre">
                      Jusqu&apos;au{" "}
                      {new Date(prescription.endDate).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
