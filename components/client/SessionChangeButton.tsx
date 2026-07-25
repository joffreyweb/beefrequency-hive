"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

interface SessionChangeButtonProps {
  sessionId: string;
  changesUsed: number;
}

export default function SessionChangeButton({ sessionId, changesUsed }: SessionChangeButtonProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const T = (k: { EN: string; FR: string }) => k[lang];
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);

  const maxReached = changesUsed >= 1;

  async function handleSubmit() {
    if (!date) return;
    setLoading(true);
    try {
      const res = await fetch("/api/session-change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, requestedDate: date, reason }),
      });
      if (res.ok) {
        setResult("success");
        setTimeout(() => { setOpen(false); setResult(null); router.refresh(); }, 2000);
      } else {
        setResult("error");
      }
    } finally {
      setLoading(false);
    }
  }

  if (maxReached) {
    return (
      <p className="text-xs font-ui text-brun-mid/40 mt-2">
        {T({ EN: "Change already used", FR: "Changement deja utilise" })}
      </p>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-ui text-or-sacre hover:text-ambre-vif underline mt-2"
      >
        {T({ EN: "Request schedule change", FR: "Demander un changement de creneau" })}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-creme-sacree border border-or-pale rounded-[10px] p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-display text-lg text-brun-chaud mb-3">
              {T({ EN: "Change request", FR: "Demande de changement" })}
            </h3>
            <p className="text-xs font-ui text-brun-mid mb-4">
              {T({
                EN: "You have 1 change allowed over the 3 months. Joffrey will review your request.",
                FR: "Tu as droit a 1 changement sur les 3 mois. Joffrey validera ta demande.",
              })}
            </p>

            {result === "success" ? (
              <p className="text-sm font-ui text-foret text-center py-4">
                {T({ EN: "Request sent!", FR: "Demande envoyee !" })}
              </p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-ui text-brun-mid/60 mb-1">
                      {T({ EN: "Requested new date", FR: "Nouvelle date souhaitee" })}
                    </label>
                    <input
                      type="datetime-local"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud focus:outline-none focus:border-or-sacre"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-ui text-brun-mid/60 mb-1">
                      {T({ EN: "Reason (optional)", FR: "Raison (optionnel)" })}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-cire-chaude border border-or-pale rounded-sm text-sm font-ui text-brun-chaud focus:outline-none focus:border-or-sacre resize-none"
                    />
                  </div>
                </div>

                {result === "error" && (
                  <p className="text-xs font-ui text-red-600 mb-3">
                    {T({ EN: "Error — change already used or server issue", FR: "Erreur — changement deja utilise ou probleme serveur" })}
                  </p>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 border border-or-pale text-brun-mid text-xs font-ui uppercase rounded-sharp hover:bg-cire-chaude"
                  >
                    {T({ EN: "Cancel", FR: "Annuler" })}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !date}
                    className="px-4 py-2 bg-or-sacre text-white text-xs font-ui uppercase rounded-sharp hover:bg-ambre-vif disabled:opacity-50"
                  >
                    {loading ? "..." : T({ EN: "Send", FR: "Envoyer" })}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
