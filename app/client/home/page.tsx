import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";
import Link from "next/link";
import DocumentUploadButton from "@/components/client/DocumentUploadButton";
import CheckinButtons from "@/components/client/CheckinButtons";
import ElixirReceivedBanner from "@/components/client/ElixirReceivedBanner";
import TimelineWidget from "@/components/client/TimelineWidget";
import type { Lang } from "@/lib/translations";
import { t } from "@/lib/translations";
import { isElixirDayMatch } from "@/lib/parcours";

export default async function ClientHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  await requireOnboarding();

  // Verifier questionnaire Pre-Start pending
  const clientForCheck = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  let pendingQuestionnaire: { id: string; title: string } | null = null;
  if (clientForCheck) {
    const pendingResp = await prisma.questionnaireResponse.findFirst({
      where: {
        clientId: clientForCheck.id,
        status: "PENDING",
        questionnaire: { type: "PRE_START" },
      },
      include: { questionnaire: { select: { title: true } } },
    });
    if (pendingResp) {
      pendingQuestionnaire = { id: pendingResp.id, title: pendingResp.questionnaire.title };
    }
  }

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    include: {
      user: { select: { name: true } },
      intake: { select: { firstName: true } },
      sessions: {
        where: { status: "SCHEDULED", scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
      },
      clientPractices: {
        where: { isActive: true },
        include: { practice: true },
        take: 1,
      },
      elixirPrescriptions: {
        where: { endDate: null },
        include: { elixir: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client) redirect("/login");

  // Élixirs de la phase actuelle (PhaseElixir)
  // Récupérer toutes les phases et trouver l'active côté JS (évite les problèmes de timezone)
  const allPhases = await prisma.clientPhase.findMany({
    where: { clientId: client.id },
    orderBy: { startDate: "asc" },
    include: {
      phaseElixirs: { include: { elixirLibrary: true } },
      phasePractices: true,
    },
  });

  const today = new Date();
  today.setHours(12, 0, 0, 0); // Midi pour éviter les problèmes de timezone
  const activePhase = allPhases.find((p) => {
    const start = new Date(p.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(p.endDate);
    end.setHours(23, 59, 59, 999);
    return today >= start && today <= end;
  }) ?? allPhases.find((p) => new Date(p.startDate) > today) ?? null;

  const lang = (client.language === "EN" ? "EN" : "FR") as Lang;
  const T = (key: { EN: string; FR: string }) => key[lang];

  const dayNumber =
    Math.floor(
      (Date.now() - new Date(client.startDate).getTime()) / 86400000
    ) + 1;

  const displayName = client.intake?.firstName || client.user.name || "You";

  // Wisdom message of the day
  const allMessages = await prisma.dayMessage.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const wisdomMessage =
    allMessages.length > 0
      ? allMessages[(dayNumber - 1) % allMessages.length]
      : null;

  const upcomingSessions = client.sessions;
  const todayPractice = client.clientPractices[0] ?? null;

  const sessionTypeLabels: Record<string, Record<Lang, string>> = {
    ONLINE: { EN: "Online", FR: "En ligne" },
    PRESENTIAL: { EN: "In-person", FR: "En pr\u00e9sentiel" },
    CEREMONY: { EN: "Ceremony", FR: "C\u00e9r\u00e9monie" },
  };

  return (
    <div className="space-y-8">
      {/* Pre-Start questionnaire blocker */}
      {pendingQuestionnaire && (
        <div className="bg-or-sacre/10 border-2 border-or-sacre rounded-sm p-5 text-center">
          <p className="font-display text-lg text-brun-chaud mb-2">
            {T({ EN: "Complete your intake form to access your program", FR: "Complete ton questionnaire d'evaluation pour acceder a ton programme" })}
          </p>
          <Link
            href={`/client/questionnaire/${pendingQuestionnaire.id}`}
            className="inline-block mt-2 px-6 py-2.5 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
          >
            {T({ EN: "Start questionnaire", FR: "Commencer le questionnaire" })}
          </Link>
        </div>
      )}

      {/* Élixirs reçus banner */}
      <ElixirReceivedBanner />

      {/* Wisdom message */}
      {wisdomMessage && (
        <div className="text-center py-6">
          <p className="font-display text-xl sm:text-2xl text-brun-chaud leading-relaxed italic max-w-md mx-auto">
            &ldquo;{wisdomMessage.text}&rdquo;
          </p>
        </div>
      )}

      {/* Check-in buttons */}
      <CheckinButtons lang={lang} />

      {/* Name + Day number */}
      <div className="text-center">
        <h1 className="font-display text-2xl text-brun-chaud">
          {displayName} &mdash; <span className="text-or-sacre">{T(t.home.day)} {dayNumber}</span>
        </h1>
      </div>

      {/* Timeline widget */}
      <TimelineWidget />

      {/* Élixirs du jour (phase actuelle) */}
      {activePhase && activePhase.phaseElixirs.length > 0 && (
        <div>
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            {T({ EN: "Today's Elixirs", FR: "Élixirs du jour" })}
          </h2>
          <div className="space-y-3">
            {activePhase.phaseElixirs
              .filter((pe) => isElixirDayMatch(pe.frequency, new Date()))
              .map((pe) => {
                const timingLabel: Record<string, Record<Lang, string>> = {
                  MATIN: { EN: "Morning", FR: "Matin" },
                  SOIR: { EN: "Evening", FR: "Soir" },
                  JOURNEE: { EN: "During the day", FR: "Journée" },
                  FLEXIBLE: { EN: "Flexible", FR: "Flexible" },
                };
                return (
                  <div key={pe.id} className="bg-cire-chaude border-2 border-or-sacre/30 rounded-sm p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-base text-brun-chaud">{pe.elixirLibrary.name}</p>
                      <span className="font-caps text-[10px] text-or-sacre uppercase tracking-wider">
                        {timingLabel[pe.timing]?.[lang] ?? pe.timing}
                      </span>
                    </div>
                    <p className="font-ui text-sm text-brun-mid mt-1">
                      {pe.dose || pe.elixirLibrary.dosage}
                    </p>
                    {pe.notes && (
                      <p className="font-ui text-xs text-brun-mid/60 italic mt-1">{pe.notes}</p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Instructions de la phase */}
      {activePhase?.instructions && (
        <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-2">
            {T({ EN: "Instructions", FR: "Instructions" })}
          </h2>
          <p className="font-ui text-sm text-brun-mid whitespace-pre-line">{activePhase.instructions}</p>
        </div>
      )}

      {/* Elixirs prescribed (ancien système — fallback) */}
      {(!activePhase || activePhase.phaseElixirs.length === 0) && client.elixirPrescriptions.length > 0 && (
        <div>
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
            {T(t.home.yourElixirs)}
          </h2>
          <div className="space-y-3">
            {client.elixirPrescriptions.map((rx: any) => (
              <div key={rx.id} className="bg-cire-chaude border border-or-pale rounded-sm p-4">
                <p className="font-display text-base text-brun-chaud">{rx.elixir.name}</p>
                <p className="font-ui text-sm text-brun-mid mt-1">
                  {rx.dosage || rx.elixir.dosage}
                </p>
                {rx.notes && (
                  <p className="font-ui text-xs text-brun-mid/60 italic mt-1">{rx.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's practice (phase ou individuel) */}
      {(activePhase?.phasePractices?.length ?? 0) > 0 ? (
        <Link
          href="/client/pratiques"
          className="block bg-cire-chaude border border-or-pale rounded-sm p-5 hover:border-or-sacre transition-colors"
        >
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-2">
            {T(t.home.todaysPractice)}
          </h2>
          <p className="font-display text-lg text-brun-chaud">
            {activePhase!.phasePractices[0].title}
          </p>
          {activePhase!.phasePractices.length > 1 && (
            <p className="font-ui text-xs text-brun-mid/60 mt-1">
              +{activePhase!.phasePractices.length - 1} {T({ EN: "other practice(s)", FR: "autre(s) pratique(s)" })}
            </p>
          )}
          <p className="font-ui text-sm text-or-sacre mt-1">
            {T(t.home.start)} &rarr;
          </p>
        </Link>
      ) : todayPractice ? (
        <Link
          href="/client/pratiques"
          className="block bg-cire-chaude border border-or-pale rounded-sm p-5 hover:border-or-sacre transition-colors"
        >
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-2">
            {T(t.home.todaysPractice)}
          </h2>
          <p className="font-display text-lg text-brun-chaud">
            {todayPractice.practice.title}
          </p>
          <p className="font-ui text-sm text-or-sacre mt-1">
            {T(t.home.start)} &rarr;
          </p>
        </Link>
      ) : null}

      {/* Upcoming sessions */}
      <div className="bg-cire-chaude border border-or-pale rounded-sm p-5">
        <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid mb-3">
          {T({ EN: "MY UPCOMING SESSIONS", FR: "MES PROCHAINES S\u00c9ANCES" })}
        </h2>
        {upcomingSessions.length > 0 ? (
          <div className="space-y-4">
            {upcomingSessions.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 border-b border-or-pale/30 pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-display text-lg text-brun-chaud">
                    {new Date(s.scheduledAt).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-sm text-brun-mid mt-1">
                    {new Date(s.scheduledAt).toLocaleTimeString(lang === "FR" ? "fr-FR" : "en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" "}&mdash; {sessionTypeLabels[s.type]?.[lang] ?? s.type}
                  </p>
                </div>
                {s.zoomLink && (
                  <a
                    href={s.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 mt-1 bg-or-sacre text-white rounded-sharp px-4 py-2 text-xs font-ui hover:bg-ambre-vif transition-colors"
                  >
                    {T(t.home.joinZoom)}
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-brun-mid text-sm font-ui">{T(t.home.noSession)}</p>
        )}
      </div>

      {/* Share a document */}
      <DocumentUploadButton />
    </div>
  );
}
