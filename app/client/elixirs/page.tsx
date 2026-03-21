"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  computeStockInfo,
  stockColor,
  stockTextColor,
  type StockInfo,
} from "@/lib/stock-utils";

interface Prescription {
  id: string;
  dosage: string | null;
  quantity: number | null;
  dailyDose: number | null;
  startDate: string;
  endDate: string | null;
  reorderUrl: string | null;
  stockAlertDays: number;
  notes: string | null;
  createdAt: string;
  elixir: {
    name: string;
    description: string;
    dosage: string;
    duration: string;
  };
}

// Mes élixirs — page client
export default function ClientElixirsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Charger les prescriptions du client
  const loadPrescriptions = useCallback(async () => {
    try {
      const res = await fetch("/api/prescriptions");
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  // Commander un élixir — envoie un message automatique à Joffrey
  async function handleOrder(prescription: Prescription) {
    setOrdering(prescription.id);
    setOrderSuccess(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `Bonjour Joffrey, je souhaite commander à nouveau l'élixir "${prescription.elixir.name}". Merci !`,
        }),
      });

      if (res.ok) {
        setOrderSuccess(prescription.id);
        // Effacer le message de succès après 3 secondes
        setTimeout(() => setOrderSuccess(null), 3000);
      }
    } catch {
      // Erreur silencieuse
    } finally {
      setOrdering(null);
    }
  }

  // Déterminer si une prescription est active
  function isActive(prescription: Prescription): boolean {
    if (!prescription.endDate) return true;
    return new Date(prescription.endDate) > new Date();
  }

  // Calcul du stock pour chaque prescription (mémorisé)
  const stockMap = useMemo(() => {
    const map = new Map<string, StockInfo>();
    for (const rx of prescriptions) {
      map.set(
        rx.id,
        computeStockInfo({
          quantity: rx.quantity,
          dailyDose: rx.dailyDose,
          startDate: rx.startDate,
          endDate: rx.endDate,
          stockAlertDays: rx.stockAlertDays,
        })
      );
    }
    return map;
  }, [prescriptions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm font-ui text-brun-mid/60">
          Chargement de vos élixirs...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-brun-chaud">
          Mes élixirs
        </h1>
        <p className="text-brun-mid font-ui text-sm mt-1">
          Vos prescriptions d&apos;élixirs en cours et passées
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-8 text-center">
          <p className="text-sm font-ui text-brun-mid/60">
            Aucun élixir prescrit pour le moment
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((prescription) => {
            const active = isActive(prescription);
            const stockInfo = stockMap.get(prescription.id)!;

            return (
              <div
                key={prescription.id}
                className={`bg-cire-chaude border border-or-pale rounded-sm p-5 ${
                  active ? "" : "opacity-70"
                }`}
              >
                {/* En-tête : nom + badge */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-lg text-brun-chaud">
                      {prescription.elixir.name}
                    </h3>
                    <p className="text-xs font-ui text-brun-mid/70 mt-0.5">
                      {prescription.elixir.description}
                    </p>
                  </div>

                  {/* Badge statut */}
                  <span
                    className={`text-xs font-ui px-2 py-0.5 rounded-sharp shrink-0 ${
                      active
                        ? "bg-foret/10 text-foret"
                        : "bg-brun-mid/10 text-brun-mid"
                    }`}
                  >
                    {active ? "Actif" : "Terminé"}
                  </span>
                </div>

                {/* Barre de progression du stock */}
                {stockInfo.percentRemaining !== null && (
                  <div className="mb-3">
                    <div className="h-3 bg-or-pale/30 rounded-full w-full">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${stockColor(stockInfo.percentRemaining)}`}
                        style={{
                          width: `${stockInfo.percentRemaining}%`,
                        }}
                      />
                    </div>
                    <p
                      className={`font-ui text-sm mt-1 ${stockTextColor(stockInfo.percentRemaining)}`}
                    >
                      {stockInfo.daysRemaining} jour
                      {stockInfo.daysRemaining !== 1 ? "s" : ""} restant
                      {stockInfo.daysRemaining !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}

                {/* Alerte stock bas */}
                {stockInfo.isLow && active && (
                  <div className="bg-red-50 border border-red-200 rounded-sharp p-3 mt-3 mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm text-red-600">
                      Il te reste {stockInfo.daysRemaining} jour
                      {stockInfo.daysRemaining !== 1 ? "s" : ""} — penser à
                      commander
                    </p>
                    {prescription.reorderUrl && (
                      <a
                        href={prescription.reorderUrl}
                        target="_blank"
                        rel="noopener"
                        className="shrink-0 px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
                      >
                        Commander
                      </a>
                    )}
                  </div>
                )}

                {/* Détails en grille */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div>
                    <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                      Dosage
                    </p>
                    <p className="text-sm font-ui text-brun-chaud mt-0.5">
                      {prescription.dosage || prescription.elixir.dosage}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                      Quantité
                    </p>
                    <p className="text-sm font-ui text-brun-chaud mt-0.5">
                      {prescription.quantity ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                      Dose / jour
                    </p>
                    <p className="text-sm font-ui text-brun-chaud mt-0.5">
                      {prescription.dailyDose ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                      Début
                    </p>
                    <p className="text-sm font-ui text-brun-chaud mt-0.5">
                      {new Date(prescription.startDate).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-caps text-brun-mid uppercase tracking-wider">
                      Fin estimée
                    </p>
                    <p className="text-sm font-ui text-brun-chaud mt-0.5">
                      {stockInfo.endDate
                        ? stockInfo.endDate.toLocaleDateString("fr-FR")
                        : "Non définie"}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {prescription.notes && (
                  <p className="text-xs font-ui text-brun-mid/60 italic mb-3">
                    {prescription.notes}
                  </p>
                )}

                {/* Bouton Commander */}
                <div className="flex items-center justify-end gap-2">
                  {orderSuccess === prescription.id && (
                    <span className="text-xs font-ui text-foret">
                      Message envoyé !
                    </span>
                  )}
                  {prescription.reorderUrl ? (
                    <a
                      href={prescription.reorderUrl}
                      target="_blank"
                      rel="noopener"
                      className="px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150"
                    >
                      Commander
                    </a>
                  ) : (
                    <button
                      onClick={() => handleOrder(prescription)}
                      disabled={ordering === prescription.id}
                      className="px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-or-sacre text-white rounded-sharp hover:bg-ambre-vif transition-colors duration-150 disabled:opacity-50"
                    >
                      {ordering === prescription.id
                        ? "Envoi..."
                        : "Commander"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
