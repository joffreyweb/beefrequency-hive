import { prisma } from "@/lib/prisma";
import ElixirCatalog from "./ElixirCatalog";

// Catalogue élixirs admin — server component
export default async function ElixirsPage() {
  // Chargement initial des élixirs côté serveur
  const elixirs = await prisma.elixir.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { prescriptions: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-8">
        Catalogue des élixirs
      </h1>

      <ElixirCatalog initialElixirs={elixirs} />
    </div>
  );
}
