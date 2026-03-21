"use client";

import { useState, useEffect } from "react";

// Labels lisibles pour les types HD
const HD_TYPE_LABELS: Record<string, string> = {
  GENERATOR: "Générateur",
  MANIFESTING_GENERATOR: "Gén. Manifestant",
  MANIFESTOR: "Manifesteur",
  PROJECTOR: "Projecteur",
  REFLECTOR: "Réflecteur",
};

interface JourneyLog {
  id: string;
  templateId: string;
  sentAt: string;
  dayNumber: number;
  hdType: string | null;
  variantUsed: string | null;
}

interface JourneyMessagesLogProps {
  clientId: string;
}

// Journal des messages de parcours envoyés à un client
export default function JourneyMessagesLog({ clientId }: JourneyMessagesLogProps) {
  const [logs, setLogs] = useState<JourneyLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/journey-messages/logs?clientId=${clientId}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch {
        // Erreur silencieuse
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [clientId]);

  if (loading) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <p className="text-sm text-brun-mid/60 font-ui">Chargement…</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <p className="text-sm text-brun-mid/60 font-ui">
          Aucun message de parcours envoyé
        </p>
      </div>
    );
  }

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-sm overflow-hidden overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-or-pale/50">
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Date d&apos;envoi
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Template
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Jour
            </th>
            <th className="text-left px-4 py-3 font-caps text-xs text-brun-mid uppercase tracking-wider">
              Variant HD
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-or-pale/20 last:border-b-0"
            >
              <td className="px-4 py-3 text-sm font-ui text-brun-chaud">
                {new Date(log.sentAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                {log.templateId}
              </td>
              <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                Jour {log.dayNumber}
              </td>
              <td className="px-4 py-3 text-sm font-ui text-brun-mid">
                {log.variantUsed
                  ? HD_TYPE_LABELS[log.variantUsed] || log.variantUsed
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
