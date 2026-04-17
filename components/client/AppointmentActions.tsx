"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

interface Props {
  appointmentId: string;
  scheduledAt: string;
  sessionPackId: string | null;
  rescheduleUsed: boolean;
}

export default function AppointmentActions({ appointmentId, scheduledAt, sessionPackId, rescheduleUsed }: Props) {
  const router = useRouter();
  const { lang } = useLanguage();
  const T = (key: { EN: string; FR: string }) => key[lang];

  const [modal, setModal] = useState<"reschedule" | "cancel" | null>(null);
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [loading, setLoading] = useState(false);

  const isProgram = !!sessionPackId;
  const hoursUntil = (new Date(scheduledAt).getTime() - Date.now()) / 3600000;
  const isLate = hoursUntil < 48;
  const penaltyApplies = isLate || (isProgram && rescheduleUsed);

  async function handleReschedule() {
    setLoading(true);
    try {
      await fetch(`/api/client/appointments/${appointmentId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, reason }),
      });
      setModal(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      await fetch(`/api/client/appointments/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      setModal(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex gap-3 mt-3 pt-3 border-t border-or-pale/30">
        <button onClick={() => setModal("reschedule")} className="font-ui text-xs text-or-sacre hover:text-ambre-vif transition-colors">
          🔄 {T({ EN: "Request change", FR: "Demander un changement" })}
        </button>
        <button onClick={() => setModal("cancel")} className="font-ui text-xs text-red-400 hover:text-red-600 transition-colors">
          ✕ {T({ EN: "Cancel", FR: "Annuler" })}
        </button>
      </div>

      {/* Reschedule modal */}
      {modal === "reschedule" && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => setModal(null)} />
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
            <div className="bg-creme-sacree border border-or-pale rounded-sm max-w-md w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
              <h2 className="font-display text-lg text-brun-chaud mb-3">
                {T({ EN: "Request a schedule change", FR: "Demander un changement" })}
              </h2>

              {/* Program + first change */}
              {isProgram && !rescheduleUsed && !isLate && (
                <div className="bg-blue-50 border border-blue-200 rounded-sm p-3 mb-4">
                  <p className="font-ui text-xs text-blue-800">
                    {T({
                      EN: "This is your only free reschedule during the program. After this, any change will deduct a session.",
                      FR: "C'est ton unique changement gratuit pendant le programme. Après, tout changement entraînera la déduction d'une séance.",
                    })}
                  </p>
                </div>
              )}

              {/* Penalty warning */}
              {penaltyApplies && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-3 mb-4">
                  <p className="font-ui text-xs text-red-800 font-medium mb-1">
                    ⚠️ {T({ EN: "Session will be deducted", FR: "Séance déduite du forfait" })}
                  </p>
                  <p className="font-ui text-xs text-red-700">
                    {isLate
                      ? T({ EN: "Less than 48h before appointment.", FR: "Moins de 48h avant le RDV." })
                      : T({ EN: "Reschedule already used.", FR: "Changement déjà utilisé." })}
                  </p>
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={T({ EN: "Your availability...", FR: "Tes disponibilités..." })}
                rows={3}
                className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre mb-3"
              />

              <select value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre mb-4">
                <option value="">{T({ EN: "Reason...", FR: "Raison..." })}</option>
                <option value="conflict">{T({ EN: "Schedule conflict", FR: "Conflit d'agenda" })}</option>
                <option value="travel">{T({ EN: "Travel", FR: "Déplacement" })}</option>
                <option value="health">{T({ EN: "Health", FR: "Raison de santé" })}</option>
                <option value="other">{T({ EN: "Other", FR: "Autre" })}</option>
              </select>

              {penaltyApplies && (
                <label className="flex items-start gap-2 mb-4 cursor-pointer">
                  <input type="checkbox" checked={acceptPolicy} onChange={(e) => setAcceptPolicy(e.target.checked)} className="mt-0.5 accent-or-sacre" />
                  <span className="font-ui text-xs text-brun-mid">
                    {T({ EN: "I understand a session will be deducted.", FR: "Je comprends qu'une séance sera déduite." })}
                  </span>
                </label>
              )}

              <div className="flex gap-2 justify-end">
                <button onClick={() => setModal(null)} className="px-3 py-2 border border-brun-mid text-brun-mid font-ui text-xs rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors">
                  {T({ EN: "Cancel", FR: "Retour" })}
                </button>
                <button onClick={handleReschedule} disabled={loading || (penaltyApplies && !acceptPolicy)}
                  className="px-3 py-2 bg-or-sacre text-white font-ui text-xs rounded-[2px] hover:bg-ambre-vif disabled:opacity-50 transition-colors">
                  {loading ? "..." : T({ EN: "Send request", FR: "Envoyer" })}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cancel modal */}
      {modal === "cancel" && (
        <>
          <div className="fixed inset-0 z-[80] bg-black/40" onClick={() => setModal(null)} />
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
            <div className="bg-creme-sacree border border-or-pale rounded-sm max-w-sm w-full p-5 shadow-xl">
              <h2 className="font-display text-lg text-brun-chaud mb-3">
                {T({ EN: "Cancel appointment", FR: "Annuler le RDV" })}
              </h2>

              {(isLate || (isProgram && rescheduleUsed)) && (
                <div className="bg-red-50 border border-red-200 rounded-sm p-3 mb-4">
                  <p className="font-ui text-xs text-red-800">
                    ⚠️ {T({ EN: "A session will be deducted.", FR: "Une séance sera déduite du forfait." })}
                  </p>
                </div>
              )}

              <select value={reason} onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-or-pale rounded-sharp bg-white text-brun-chaud font-ui text-sm focus:outline-none focus:border-or-sacre mb-4">
                <option value="">{T({ EN: "Reason...", FR: "Raison..." })}</option>
                <option value="conflict">{T({ EN: "Schedule conflict", FR: "Conflit d'agenda" })}</option>
                <option value="health">{T({ EN: "Health", FR: "Raison de santé" })}</option>
                <option value="other">{T({ EN: "Other", FR: "Autre" })}</option>
              </select>

              <div className="flex gap-2 justify-end">
                <button onClick={() => setModal(null)} className="px-3 py-2 border border-brun-mid text-brun-mid font-ui text-xs rounded-[2px] hover:bg-brun-mid hover:text-creme-sacree transition-colors">
                  {T({ EN: "Back", FR: "Retour" })}
                </button>
                <button onClick={handleCancel} disabled={loading}
                  className="px-3 py-2 bg-red-500 text-white font-ui text-xs rounded-[2px] hover:bg-red-600 disabled:opacity-50 transition-colors">
                  {loading ? "..." : T({ EN: "Confirm cancel", FR: "Confirmer l'annulation" })}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
