"use client";

import { useState, useCallback } from "react";

interface ActionItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  urgency: string;
  clientId?: string | null;
  client?: { user: { name: string } } | null;
  createdAt: string;
}

const URGENCY_DOT: Record<string, string> = {
  red: "bg-red-500",
  amber: "bg-ambre-vif",
  green: "bg-foret",
};

export default function DashboardActions({
  initialActions,
}: {
  initialActions: ActionItem[];
}) {
  const [actions, setActions] = useState<ActionItem[]>(initialActions);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  const handleDone = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/actions/${id}`, { method: "PATCH" });
      if (!res.ok) return;

      // Lancer l'animation de sortie
      setDismissing((prev) => new Set(prev).add(id));

      // Retirer du state après l'animation
      setTimeout(() => {
        setActions((prev) => prev.filter((a) => a.id !== id));
        setDismissing((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 150);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <div className="bg-cire-chaude border border-or-pale rounded-[10px] h-full overflow-y-auto">
      <div className="p-5">
        <h2 className="font-caps text-sm text-brun-mid uppercase tracking-wider mb-4">
          À faire
        </h2>

        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-brun-mid/40">
            <span className="text-2xl mb-2">🐝</span>
            <p className="text-sm font-ui">Rien en attente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actions.map((action) => {
              const isDismissing = dismissing.has(action.id);
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-3 py-2 transition-all duration-150 ease-in-out"
                  style={{
                    opacity: isDismissing ? 0 : 1,
                    transform: isDismissing
                      ? "translateX(20px)"
                      : "translateX(0)",
                  }}
                >
                  {/* Dot urgence */}
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      URGENCY_DOT[action.urgency] ?? "bg-foret"
                    }`}
                  />

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-ui text-brun-chaud truncate">
                      {action.title}
                    </p>
                    {action.client?.user?.name && (
                      <p className="text-xs text-brun-mid">
                        {action.client.user.name}
                      </p>
                    )}
                  </div>

                  {/* Bouton Fait — animation slide RIGHT */}
                  <button
                    type="button"
                    onClick={() => handleDone(action.id)}
                    className="text-xs font-ui text-or-sacre hover:text-ambre-vif transition-colors duration-150 shrink-0"
                  >
                    Fait
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
