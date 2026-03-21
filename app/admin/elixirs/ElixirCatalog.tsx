"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ElixirForm from "@/components/admin/ElixirForm";

interface Elixir {
  id: string;
  name: string;
  description: string;
  dosage: string;
  duration: string;
  stock: number;
  createdAt: string | Date;
  _count: { prescriptions: number };
}

interface ElixirCatalogProps {
  initialElixirs: Elixir[];
}

// Client component pour gérer l'interactivité du catalogue élixirs
export default function ElixirCatalog({ initialElixirs }: ElixirCatalogProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  function handleSuccess() {
    setShowForm(false);
    // Rafraîchir les données serveur
    router.refresh();
  }

  return (
    <>
      {/* Bouton ajouter + formulaire dépliable */}
      <div className="mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 text-sm font-caps uppercase tracking-wider bg-or-sacre text-brun-chaud rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
        >
          {showForm ? "Annuler" : "Ajouter un élixir"}
        </button>

        {showForm && (
          <div className="mt-4 bg-cire-chaude border border-or-pale rounded-sm p-6 max-w-lg">
            <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
              Nouvel élixir
            </h2>
            <ElixirForm onSuccess={handleSuccess} />
          </div>
        )}
      </div>

      {/* Liste des élixirs */}
      {initialElixirs.length === 0 ? (
        <p className="text-sm text-brun-mid/60 font-ui">
          Aucun élixir dans le catalogue
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialElixirs.map((elixir) => (
            <Link
              key={elixir.id}
              href={`/admin/elixirs/${elixir.id}`}
              className="block bg-cire-chaude border border-or-pale rounded-sm p-6 hover:border-or-sacre transition-colors duration-150"
            >
              <h3 className="font-display text-lg text-brun-chaud mb-1">
                {elixir.name}
              </h3>
              <p className="text-xs font-ui text-brun-mid/70 line-clamp-2 mb-3">
                {elixir.description}
              </p>

              <div className="flex items-center justify-between text-xs font-ui">
                {/* Stock */}
                <span
                  className={`px-2 py-0.5 rounded-sharp ${
                    elixir.stock > 0
                      ? "bg-foret/10 text-foret"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  Stock : {elixir.stock}
                </span>

                {/* Prescriptions en cours */}
                <span className="text-brun-mid/60">
                  {elixir._count.prescriptions} prescription
                  {elixir._count.prescriptions > 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-2 text-xs font-ui text-brun-mid/50">
                {elixir.dosage} · {elixir.duration}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
