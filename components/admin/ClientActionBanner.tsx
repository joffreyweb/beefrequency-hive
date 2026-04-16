"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  clientId: string;
  charteSignee: boolean;
  questionnaireSubmitted: boolean;
  colisEnvoye: boolean;
  hasAppointment: boolean;
}

export default function ClientActionBanner({
  clientId,
  charteSignee,
  questionnaireSubmitted,
  colisEnvoye,
  hasAppointment,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  // Don't show if everything is done or not ready yet
  const needsAction = charteSignee && questionnaireSubmitted && (!colisEnvoye || !hasAppointment);
  if (!needsAction) return null;

  async function handleMarkColisEnvoye() {
    setLoading("colis");
    try {
      await fetch(`/api/admin/clients/${clientId}/parcours-stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colisEnvoye: true }),
      });
      router.refresh();
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-600 font-ui text-sm font-medium">
          🟠 Actions requises
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {!colisEnvoye && (
          <button
            onClick={handleMarkColisEnvoye}
            disabled={loading === "colis"}
            className="px-4 py-2 bg-or-sacre text-white font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-ambre-vif transition-colors disabled:opacity-50"
          >
            {loading === "colis" ? "..." : "📦 Marquer colis envoyé"}
          </button>
        )}
        {!hasAppointment && (
          <a
            href="/admin/agenda"
            className="px-4 py-2 border border-or-sacre text-or-sacre font-ui text-xs uppercase tracking-wider rounded-[2px] hover:bg-or-sacre hover:text-white transition-colors"
          >
            📅 Programmer un RDV
          </a>
        )}
      </div>
    </div>
  );
}
