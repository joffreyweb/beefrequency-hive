"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface SerializedClient {
  id: string;
  name: string;
  email: string;
  offerType: string;
  offerLabel: string;
  status: string;
  startDate: string;
  analysisStatus: string | null;
  pendingCount: number;
}

/** Extrait les initiales (2 premières lettres) d'un nom */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Calcule le numéro du jour depuis la date de début */
function computeDayNumber(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000) + 1;
}

export default function ClientsGrid({
  clients,
}: {
  clients: SerializedClient[];
}) {
  const [search, setSearch] = useState("");

  // Filtrage côté client par nom
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  return (
    <div>
      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 bg-cire-chaude border border-or-pale rounded-[10px] text-sm font-ui text-brun-chaud placeholder:text-brun-mid/40 outline-none focus:border-or-sacre transition-colors duration-150"
        />
      </div>

      {/* Grille 3 colonnes */}
      {filteredClients.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-8 text-center">
          <p className="text-sm text-brun-mid/60 font-ui">
            Aucun client trouvé.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const initials = getInitials(client.name);
            const dayNumber = computeDayNumber(client.startDate);

            return (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="bg-cire-chaude border border-or-pale rounded-[10px] p-5 hover:border-or-sacre transition-all duration-150"
              >
                {/* Avatar initiales */}
                <div className="w-10 h-10 rounded-full bg-or-sacre/10 flex items-center justify-center mb-3">
                  <span className="text-sm font-ui font-medium text-or-sacre">
                    {initials}
                  </span>
                </div>
                <p className="font-ui text-sm text-brun-chaud">{client.name}</p>
                <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
                  {client.offerLabel}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-ui text-brun-mid/50">
                    Jour {dayNumber}
                  </span>
                  {client.pendingCount > 0 && (
                    <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {client.pendingCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
