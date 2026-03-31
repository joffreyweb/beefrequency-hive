"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";

const EXEMPT_PATHS = [
  "/client/prestart",
  "/client/onboarding",
  "/client/questionnaire",
  "/client/settings",
];

export default function PreStartGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();
  const [prestartCompleted, setPrestartCompleted] = useState<boolean | null>(null);
  const [pendingResponseId, setPendingResponseId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/client/prestart-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPrestartCompleted(data.prestartCompleted);
          setPendingResponseId(data.pendingResponseId);
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Pages exemptées — pas de blocage
  const isExempt = EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Pas encore chargé ou page exemptée → afficher normalement
  if (prestartCompleted === null || prestartCompleted || isExempt) {
    return <>{children}</>;
  }

  // Pre-Start non complété → afficher le blocage
  const T = (key: { EN: string; FR: string }) => key[lang];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-or-sacre/10 flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B8821E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>

      <p className="font-display text-xl text-brun-chaud mb-3 max-w-sm">
        {T({
          EN: "Complete your intake questionnaire to access this section",
          FR: "Complète ton questionnaire de démarrage pour accéder à cette section",
        })}
      </p>

      <p className="font-ui text-sm text-brun-mid/60 mb-6 max-w-xs">
        {T({
          EN: "This step is essential before starting your program.",
          FR: "Cette étape est indispensable avant de démarrer ton programme.",
        })}
      </p>

      <button
        onClick={() => {
          if (pendingResponseId) {
            router.push(`/client/questionnaire/${pendingResponseId}`);
          } else {
            router.push("/client/prestart");
          }
        }}
        className="px-6 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
      >
        {T({
          EN: "Complete the Pre-Start",
          FR: "Compléter le Pre-Start",
        })}
      </button>
    </div>
  );
}
