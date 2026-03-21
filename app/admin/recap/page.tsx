"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// Types pour les données du récapitulatif
interface ChecklistItem {
  text: string;
  done: boolean;
}

interface RecapSession {
  id: string;
  scheduledAt: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
  checklistItems: ChecklistItem[];
  recapDone: boolean;
  client: {
    id: string;
    offerType: string;
    user: { name: string; email: string };
  };
}

interface RecapData {
  sessions: RecapSession[];
  dailyRecapTime: string;
  pendingCount: number;
}

// Labels lisibles pour les types de session
const TYPE_LABELS: Record<string, string> = {
  DISCOVERY: "Découverte",
  FOLLOW_UP: "Suivi",
  DEEP_DIVE: "Approfondissement",
  CLOSING: "Clôture",
};

export default function RecapPage() {
  const [data, setData] = useState<RecapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  // Chargement des données via l'API
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/recap");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Marquer toutes les sessions comme récapitulées
  async function handleMarkAllDone() {
    setMarking(true);
    try {
      await fetch("/api/recap", { method: "POST" });
      await fetchData();
    } finally {
      setMarking(false);
    }
  }

  // Date du jour formatée en français
  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm font-ui text-brun-mid/60">
          Chargement du récapitulatif...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm font-ui text-brun-mid/60">
          Impossible de charger le récapitulatif.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Bouton retour */}
      <Link
        href="/admin/dashboard"
        className="inline-block text-sm font-ui text-or-sacre hover:text-ambre-vif transition-colors duration-150 mb-6"
      >
        &larr; Retour au dashboard
      </Link>

      {/* Titre */}
      <h1 className="font-display text-3xl font-light text-brun-chaud mb-2">
        Récapitulatif de journée
      </h1>
      <p className="text-sm font-ui text-brun-mid/70 mb-8 capitalize">
        {todayLabel}
      </p>

      {/* Liste des sessions */}
      {data.sessions.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-6">
          <p className="text-sm font-ui text-brun-mid/60">
            Aucune session aujourd&apos;hui.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.sessions.map((session) => {
            // Séparer les items cochés et non cochés
            const uncheckedItems = session.checklistItems.filter(
              (item) => !item.done
            );
            const checkedItems = session.checklistItems.filter(
              (item) => item.done
            );

            return (
              <div
                key={session.id}
                className={`bg-cire-chaude border border-or-pale rounded-sm p-6 transition-opacity duration-200 ${
                  session.recapDone ? "opacity-60" : ""
                }`}
              >
                {/* En-tête : nom du client, type, durée, heure */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-xl text-brun-chaud">
                      {session.client.user.name}
                    </h2>
                    <span className="text-xs font-caps uppercase tracking-wider bg-or-sacre/15 text-or-sacre px-2 py-0.5 rounded-sharp">
                      {TYPE_LABELS[session.type] || session.type}
                    </span>
                    {session.recapDone && (
                      <span className="text-xs font-caps uppercase tracking-wider bg-foret/10 text-foret px-2 py-0.5 rounded-sharp">
                        Fait
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-ui text-brun-mid">
                      {session.duration} min
                    </p>
                    <p className="text-xs font-ui text-or-sacre">
                      {new Date(session.scheduledAt).toLocaleTimeString(
                        "fr-FR",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-2">
                    Notes
                  </h3>
                  {session.notes ? (
                    <p className="text-sm font-ui text-brun-chaud whitespace-pre-wrap">
                      {session.notes}
                    </p>
                  ) : (
                    <p className="text-sm font-ui text-brun-mid/50 italic">
                      Aucune note
                    </p>
                  )}
                </div>

                {/* Checklist */}
                {session.checklistItems.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-2">
                      Checklist
                    </h3>
                    <ul className="space-y-1">
                      {uncheckedItems.map((item, i) => (
                        <li
                          key={`unchecked-${i}`}
                          className="flex items-center gap-2 text-sm font-ui text-or-sacre"
                        >
                          <span className="w-4 h-4 border border-or-sacre rounded-sharp flex-shrink-0" />
                          {item.text}
                        </li>
                      ))}
                      {checkedItems.map((item, i) => (
                        <li
                          key={`checked-${i}`}
                          className="flex items-center gap-2 text-sm font-ui text-foret"
                        >
                          <span className="w-4 h-4 bg-foret/20 border border-foret rounded-sharp flex-shrink-0 flex items-center justify-center text-xs">
                            &#10003;
                          </span>
                          <span className="line-through opacity-70">
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions en attente */}
                <div>
                  <h3 className="font-caps text-xs text-brun-mid uppercase tracking-wider mb-2">
                    Actions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/clients/${session.client.id}#elixirs`}
                      className="text-xs font-ui bg-creme-sacree text-brun-chaud hover:text-or-sacre px-3 py-1.5 rounded-sharp border border-or-pale transition-colors duration-150"
                    >
                      Mettre à jour les élixirs
                    </Link>
                    <Link
                      href={`/admin/clients/${session.client.id}`}
                      className="text-xs font-ui bg-creme-sacree text-brun-chaud hover:text-or-sacre px-3 py-1.5 rounded-sharp border border-or-pale transition-colors duration-150"
                    >
                      Envoyer des ressources
                    </Link>
                    <Link
                      href="/admin/sessions"
                      className="text-xs font-ui bg-creme-sacree text-brun-chaud hover:text-or-sacre px-3 py-1.5 rounded-sharp border border-or-pale transition-colors duration-150"
                    >
                      Planifier prochaine session
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Boutons bas de page */}
      <div className="flex items-center gap-4 mt-8">
        {data.pendingCount > 0 && (
          <button
            onClick={handleMarkAllDone}
            disabled={marking}
            className="bg-or-sacre text-white rounded-sharp uppercase font-caps text-sm tracking-wider px-6 py-3 hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
          >
            {marking ? "En cours..." : "Tout marquer comme fait"}
          </button>
        )}
        <Link
          href="/admin/dashboard"
          className="text-sm font-ui text-brun-mid hover:text-brun-chaud transition-colors duration-150"
        >
          Retour au dashboard
        </Link>
      </div>
    </div>
  );
}
