"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EndSessionModal from "@/components/admin/EndSessionModal";

// Labels lisibles pour les types de session
const TYPE_LABELS: Record<string, string> = {
  ONLINE: "En ligne",
  PRESENTIAL: "Présentiel",
  CEREMONY: "Cérémonie",
};

interface SessionData {
  id: string;
  scheduledAt: string;
  duration: number;
  type: string;
  status: string;
  zoomLink: string | null;
  client: {
    user: { name: string; email: string };
  };
}

interface UpcomingSessionsProps {
  sessions: SessionData[];
}

// Liste des sessions à venir avec actions admin (lien Zoom, terminer)
export default function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  const router = useRouter();
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null);

  // Callback après fin de session
  function handleDone() {
    setEndingSessionId(null);
    router.refresh();
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-brun-mid/60 font-ui">
        Aucune session planifiée
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="bg-cire-chaude border border-or-pale rounded-sm p-5 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-ui text-brun-chaud">
                {session.client.user.name}
              </p>
              <p className="text-xs font-ui text-brun-mid/60 mt-0.5">
                {TYPE_LABELS[session.type] || session.type} ·{" "}
                {session.duration} min
              </p>
              {/* Lien Zoom si disponible */}
              {session.zoomLink && (
                <a
                  href={session.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-ui text-or-sacre underline mt-1 inline-block hover:text-ambre-vif transition-colors"
                >
                  Lien Zoom
                </a>
              )}
            </div>
            <div className="text-right flex items-center gap-3">
              {/* Bouton pour terminer la session */}
              <button
                onClick={() => setEndingSessionId(session.id)}
                className="px-3 py-1.5 text-xs font-caps uppercase tracking-wider bg-foret/10 text-foret rounded-sharp hover:bg-foret/20 transition-colors duration-150"
              >
                Terminer la session
              </button>
              <div>
                <p className="text-sm font-ui text-or-sacre">
                  {new Date(session.scheduledAt).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-xs font-ui text-brun-mid/60">
                  {new Date(session.scheduledAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de fin de session */}
      {endingSessionId && (
        <EndSessionModal
          sessionId={endingSessionId}
          onClose={() => setEndingSessionId(null)}
          onDone={handleDone}
        />
      )}
    </>
  );
}
