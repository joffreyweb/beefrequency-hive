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

// Pages accessibles quand le questionnaire est en cours (pas encore soumis)
const PARTIAL_ACCESS_PATHS = [
  "/client/home",
  "/client/messages",
  "/client/questionnaire-entry",
];

export default function PreStartGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();
  const [status, setStatus] = useState<{
    prestartCompleted: boolean;
    questionnaireStatus: string | null; // PENDING | IN_PROGRESS | SUBMITTED | null
  } | null>(null);

  useEffect(() => {
    fetch("/api/client/prestart-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStatus({
            prestartCompleted: data.prestartCompleted,
            questionnaireStatus: data.questionnaireStatus ?? null,
          });
        }
      })
      .catch(() => {});
  }, [pathname]);

  const T = (key: { EN: string; FR: string }) => key[lang];

  // Pages exemptées
  const isExempt = EXEMPT_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Pas encore chargé ou page exemptée
  if (!status || isExempt) return <>{children}</>;

  // 1. Questionnaire d'entrée non commencé → bloquer tout sauf le questionnaire
  if (status.questionnaireStatus === "PENDING") {
    const isQuestionnairePage = pathname === "/client/questionnaire-entry" || pathname.startsWith("/client/questionnaire-entry/");
    if (isQuestionnairePage) return <>{children}</>;

    return (
      <BlockScreen
        title={T({
          EN: "Complete your intake questionnaire to continue",
          FR: "Complète ton questionnaire d'entrée pour continuer",
        })}
        subtitle={T({
          EN: "This step is essential before accessing your space.",
          FR: "Cette étape est indispensable avant d'accéder à ton espace.",
        })}
        buttonText={T({
          EN: "Start my questionnaire",
          FR: "Commencer mon questionnaire",
        })}
        onAction={() => router.push("/client/questionnaire-entry")}
      />
    );
  }

  // 2. Questionnaire en cours → accès partiel
  if (status.questionnaireStatus === "IN_PROGRESS") {
    const isPartialAllowed = PARTIAL_ACCESS_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isPartialAllowed) return <>{children}</>;

    return (
      <BlockScreen
        title={T({
          EN: "Finish your questionnaire to access this section",
          FR: "Termine ton questionnaire pour accéder à cette section",
        })}
        subtitle={T({
          EN: "You can resume at any time.",
          FR: "Tu peux reprendre à tout moment.",
        })}
        buttonText={T({
          EN: "Continue my questionnaire",
          FR: "Continuer mon questionnaire",
        })}
        onAction={() => router.push("/client/questionnaire-entry")}
      />
    );
  }

  // 3. Questionnaire soumis → accès complet (ou pas de questionnaire = accès libre)
  return <>{children}</>;
}

function BlockScreen({
  title,
  subtitle,
  buttonText,
  onAction,
}: {
  title: string;
  subtitle: string;
  buttonText: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-or-sacre/10 flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B8821E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      </div>
      <p className="font-display text-xl text-brun-chaud mb-3 max-w-sm">{title}</p>
      <p className="font-ui text-sm text-brun-mid/60 mb-6 max-w-xs">{subtitle}</p>
      <button
        onClick={onAction}
        className="px-6 py-3 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
}
