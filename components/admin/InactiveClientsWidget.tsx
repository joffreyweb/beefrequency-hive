"use client";

import { useState, useEffect } from "react";

interface InactiveClient {
  clientId: string;
  name: string;
  email: string;
  daysSinceActivity: number;
  lastActivityDate: string | null;
  alertLevel: "yellow" | "orange" | "red";
}

const ALERT_COLORS = {
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function InactiveClientsWidget() {
  const [clients, setClients] = useState<InactiveClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/inactive-clients")
      .then((r) => r.json())
      .then((data) => setClients(data.clients || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSendRelance(clientId: string) {
    setSending(clientId);
    try {
      const res = await fetch("/api/admin/send-reactivation-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (res.ok) {
        setSent((prev) => new Set(prev).add(clientId));
      }
    } finally {
      setSending(null);
    }
  }

  if (loading) return null;
  if (clients.length === 0) return null;

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider">
          Clients &agrave; relancer
        </h2>
        <span className="px-2 py-0.5 bg-red-500/10 text-red-600 text-xs font-ui font-medium rounded-full">
          {clients.length}
        </span>
      </div>

      <div className="space-y-2">
        {clients.map((client) => (
          <div
            key={client.clientId}
            className="flex items-center justify-between p-3 border border-or-pale/40 rounded-lg hover:border-or-sacre transition-colors"
          >
            <a
              href={`/admin/clients/${client.clientId}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-or-sacre/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-ui font-medium text-or-sacre">
                  {getInitials(client.name)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-ui text-brun-chaud truncate">{client.name}</p>
                <p className="text-xs font-ui text-brun-mid/50">
                  {client.daysSinceActivity} jour{client.daysSinceActivity > 1 ? "s" : ""} sans activit&eacute;
                </p>
              </div>
            </a>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`w-2.5 h-2.5 rounded-full ${ALERT_COLORS[client.alertLevel]}`}
                title={`${client.alertLevel} — ${client.daysSinceActivity}j`}
              />
              {sent.has(client.clientId) ? (
                <span className="text-xs font-ui text-foret">Envoy&eacute;</span>
              ) : (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSendRelance(client.clientId);
                  }}
                  disabled={sending === client.clientId}
                  className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors disabled:opacity-50"
                >
                  {sending === client.clientId ? "..." : "Relancer"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
