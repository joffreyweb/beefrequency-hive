import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOnboarding } from "@/lib/onboarding-guard";
import Link from "next/link";
import DocumentUploadButton from "@/components/client/DocumentUploadButton";
import CheckinButtons from "@/components/client/CheckinButtons";
import ElixirReceivedBanner from "@/components/client/ElixirReceivedBanner";
import ElixirInstructions from "@/components/client/ElixirInstructions";
import TimelineWidget from "@/components/client/TimelineWidget";
import ProgramProgress from "@/components/client/ProgramProgress";
import ProgressMirror from "@/components/client/ProgressMirror";
import AppointmentActions from "@/components/client/AppointmentActions";
import type { Lang } from "@/lib/translations";
import { t } from "@/lib/translations";
import { isElixirDayMatch } from "@/lib/parcours";
import { getCurrentParcours } from "@/lib/parcours-instance";

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

  // Clarity by Beefrequency : activé (DRAFT/IN_PROGRESS) et pas encore soumis ?
  let clarityToFill = false;
  let clarityReportToken: string | null = null;
  if (clientForCheck) {
    const cs = await prisma.claritySubmission.findUnique({
      where: { clientId: clientForCheck.id },
      select: { status: true, reportToken: true },
    });
    clarityToFill = !!cs && (cs.status === "DRAFT" || cs.status === "IN_PROGRESS");
    if (cs && cs.status === "PUBLISHED") clarityReportToken = cs.reportToken;
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
      appointments: {
        where: { status: { not: "CANCELLED" }, scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        select: { id: true, scheduledAt: true, durationMin: true, meetingType: true, zoomJoinUrl: true, sessionPackId: true },
      },
      clientPractices: {
        where: { isActive: true },
        include: { practice: true },
        take: 1,
      },
      questionnaireEntry: { select: { status: true } },
    },
  });

  if (!client) redirect("/login");

  // Refonte Parcours (Étape 2B) : phases du parcours COURANT uniquement (jamais un mélange),
  // + détection « parcours terminé » pour figer le compteur et afficher l'état final.
  const currentParcours = await getCurrentParcours(client.id);
  const parcoursCompleted = currentParcours?.status === "COMPLETED";
  const allPhases = currentParcours
    ? await prisma.clientPhase.findMany({
        where: { clientParcoursId: currentParcours.id },
        orderBy: { startDate: "asc" },
        include: {
          phaseElixirs: { include: { elixirLibrary: true } },
          phasePractices: true,
        },
      })
    : [];

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

  // Élixirs : a-t-il au moins un élixir assigné (toute phase) ? + ceux du jour (phase active)
  const hasAnyElixir = allPhases.some((p) => p.phaseElixirs.length > 0);
  const todaysElixirs = activePhase
    ? activePhase.phaseElixirs.filter((pe) => isElixirDayMatch(pe.frequency, new Date()))
    : [];

  // Date de référence pour le programme — source canonique detoxStartDate, si produits reçus ET date passée
  const programStart = client.detoxStartDate;
  const programHasStarted =
    client.produitsRecus &&
    !!programStart &&
    new Date(programStart).getTime() <= Date.now();

  const dayNumber = programHasStarted
    ? Math.floor(
        (Date.now() - new Date(programStart!).getTime()) / 86400000
      ) + 1
    : 0;

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

  // Merge Sessions + Appointments into a unified list
  const upcomingSessions = [
    ...client.sessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      duration: s.duration,
      type: s.type,
      zoomLink: s.zoomLink,
    })),
    ...client.appointments.map((a) => ({
      id: a.id,
      scheduledAt: a.scheduledAt,
      duration: a.durationMin,
      type: a.meetingType === "zoom" ? "ONLINE" : "PRESENTIAL",
      zoomLink: a.zoomJoinUrl,
      sessionPackId: a.sessionPackId || null,
      isAppointment: true as const,
    })),
  ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const todayPractice = client.clientPractices[0] ?? null;

  const sessionTypeLabels: Record<string, Record<Lang, string>> = {
    ONLINE: { EN: "Online", FR: "En ligne" },
    PRESENTIAL: { EN: "In-person", FR: "En pr\u00e9sentiel" },
    CEREMONY: { EN: "Ceremony", FR: "C\u00e9r\u00e9monie" },
  };

  // Bandeau Clarity — rendu identique quel que soit l'écran (attente ou principal)
  const clarityBanner = clarityToFill ? (
    <div className="bg-or-sacre/10 border-2 border-or-sacre rounded-sm p-5 text-center">
      <p className="font-display text-lg text-brun-chaud mb-2">Ton espace Clarity t'attend</p>
      <Link
        href="/client/clarity"
        className="inline-block mt-2 px-6 py-2.5 bg-or-sacre text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:bg-ambre-vif transition-colors"
      >
        Ouvrir Clarity
      </Link>
    </div>
  ) : null;

  // Bandeau "rapport prêt" — visible UNIQUEMENT après publication par l'admin (statut PUBLISHED)
  const clarityReportBanner = clarityReportToken ? (
    <div className="bg-foret/10 border-2 border-foret rounded-sm p-5 text-center">
      <p className="font-display text-lg text-brun-chaud mb-2">Ton rapport Clarity est prêt 🐝</p>
      <a
        href={`/r/${clarityReportToken}`}
        className="inline-block mt-2 px-6 py-2.5 bg-foret text-white rounded-sharp font-caps text-sm uppercase tracking-wider hover:opacity-90 transition-opacity"
      >
        Voir mon rapport
      </a>
    </div>
  ) : null;

  // Un client CUSTOM n'utilise JAMAIS la machinerie Passage (colis/élixir/timeline),
  // quels que soient ses flags — il a sa propre section « Mon parcours ».
  const isCustom = client.parcoursType === "CUSTOM";

  // ── PAGE "EN ATTENTE" — affichée tant que le programme n'a pas démarré ──
  if (!pendingQuestionnaire && !programHasStarted && client.requiresProgramTimeline && !isCustom) {
    // Élixir déjà chez le client → aucun envoi : on saute les états colis (préparation/route).
    const elixirNeedsShipping = client.elixirAEnvoyer !== false;

    // 3 sous-états :
    //   A. Colis pas envoyé          → "En préparation"
    //   B. Colis envoyé, pas reçu    → "En route" + bouton (via ElixirReceivedBanner)
    //   C. Reçu, démarrage à venir   → "Démarrage le {date}"
    const stage: "preparing" | "shipped" | "starting" =
      client.produitsRecus ? "starting"
      : elixirNeedsShipping && client.colisEnvoye ? "shipped"
      : elixirNeedsShipping ? "preparing"
      : "starting";

    const startsAtFormatted = client.detoxStartDate
      ? new Date(client.detoxStartDate).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : null;

    const STAGES = [
      { key: "registered", label: T({ EN: "Registration", FR: "Inscription" }) },
      { key: "preparing",  label: T({ EN: "Preparation",  FR: "Préparation" }) },
      { key: "shipped",    label: T({ EN: "Shipped",       FR: "Envoyé" }) },
      { key: "starting",   label: T({ EN: "Starting",     FR: "Démarrage" }) },
    ];
    const stageIdx = stage === "preparing" ? 1 : stage === "shipped" ? 2 : 3;

    return (
      // Centrage vertical dans le main flex-1 du layout client
      <div className="min-h-[calc(100vh-10rem)] flex flex-col justify-center items-center gap-8 py-8">
        {clarityBanner}
      {clarityReportBanner}
        {/* Indicateur de progression */}
        <div className="flex items-center justify-center gap-1">
          {STAGES.map((s, i) => {
            const isPast = i < stageIdx;
            const isCurrent = i === stageIdx;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-3 h-3 rounded-full transition-colors ${
                      isCurrent
                        ? "bg-or-sacre ring-4 ring-or-sacre/20"
                        : isPast
                        ? "bg-foret"
                        : "bg-or-pale"
                    }`}
                  />
                  <span
                    className={`font-caps text-[9px] uppercase tracking-wider ${
                      isCurrent ? "text-or-sacre" : isPast ? "text-foret" : "text-brun-mid/40"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`w-10 h-px mx-1 mb-4 ${i < stageIdx ? "bg-foret" : "bg-or-pale"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Élixirs reçus banner — affiche le bouton si colis envoyé (jamais si pas d'envoi) */}
        {elixirNeedsShipping && (
          <div className="w-full">
            <ElixirReceivedBanner />
          </div>
        )}

        {/* Contenu — varie selon le sous-état */}
        <div className="text-center max-w-md mx-auto">
          <div className="text-5xl mb-6">🐝</div>

          {stage === "preparing" && (
            <>
              <h1 className="font-display text-2xl text-brun-chaud mb-6">
                {T({
                  EN: "Your elixirs are being prepared.",
                  FR: "Tes élixirs sont en préparation.",
                })}
              </h1>
              <div className="font-ui text-sm text-brun-mid leading-relaxed space-y-3">
                <p>
                  {T({
                    EN: "I am preparing your personalized protocol.",
                    FR: "Je prépare ton protocole personnalisé.",
                  })}
                </p>
                <p>
                  {T({
                    EN: "You will receive an email when your package is sent.",
                    FR: "Tu recevras un email dès que ton colis sera envoyé.",
                  })}
                </p>
              </div>
            </>
          )}

          {stage === "shipped" && (
            <>
              <h1 className="font-display text-2xl text-brun-chaud mb-6">
                {T({
                  EN: "Your elixirs are on their way.",
                  FR: "Tes élixirs sont en route.",
                })}
              </h1>
              <div className="font-ui text-sm text-brun-mid leading-relaxed space-y-3">
                <p>
                  {T({
                    EN: "When you receive them, confirm above to start your program.",
                    FR: "Quand tu les reçois, confirme ci-dessus pour démarrer ton programme.",
                  })}
                </p>
              </div>
            </>
          )}

          {stage === "starting" && (
            <>
              <h1 className="font-display text-2xl text-brun-chaud mb-6">
                {T({
                  EN: "Your journey begins soon.",
                  FR: "Ton voyage commence bientôt.",
                })}
              </h1>
              <div className="font-ui text-sm text-brun-mid leading-relaxed space-y-3">
                {startsAtFormatted && (
                  <p className="font-display text-lg text-or-sacre">
                    {T({ EN: "Starts ", FR: "Démarrage le " })}
                    {startsAtFormatted}
                  </p>
                )}
                <p>
                  {T({
                    EN: "Take this time to settle in. Your program will activate automatically.",
                    FR: "Prends ce temps pour t'installer. Ton programme s'activera automatiquement.",
                  })}
                </p>
              </div>
            </>
          )}

          {/* Prochain RDV — visible même en phase d'attente */}
          {upcomingSessions.length > 0 && (
            <div className="mt-6 w-full bg-cire-chaude border border-or-pale rounded-lg p-4 text-center">
              <p className="text-xs text-brun-mid mb-1">
                📅 {T({ EN: "Your next appointment", FR: "Ton prochain rendez-vous" })}
              </p>
              <p className="font-display text-lg text-brun-chaud">
                {new Date(upcomingSessions[0].scheduledAt).toLocaleDateString(lang === "FR" ? "fr-FR" : "en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                {" "}
                {T({ EN: "at", FR: "à" })}
                {" "}
                {new Date(upcomingSessions[0].scheduledAt).toLocaleTimeString(lang === "FR" ? "fr-FR" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {upcomingSessions[0].zoomLink && (
                <a
                  href={upcomingSessions[0].zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-ui text-or-sacre hover:text-ambre-vif"
                >
                  {T(t.home.joinZoom)} →
                </a>
              )}
            </div>
          )}

          <p className="font-ui text-xs text-brun-mid/60 italic pt-6">
            {T({
              EN: "Your space remains accessible : Journal, Messages, Practices.",
              FR: "Ton espace reste accessible : Journal, Messages, Pratiques.",
            })}
          </p>
          <p className="font-display text-base text-brun-chaud pt-4">— Joffrey</p>
        </div>
      </div>
    );
  }

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

      {clarityBanner}
      {clarityReportBanner}

      {/* Parcours terminé — état final (refonte Étape 2B-β-1b) : le compteur est figé,
          l'espace reste pleinement accessible. */}
      {parcoursCompleted && (
        <div className="bg-foret/10 border-2 border-foret rounded-sm p-6 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-display text-xl text-brun-chaud">
            {T({ EN: "Your journey is complete", FR: "Ton parcours est terminé" })}
          </p>
          <p className="font-ui text-sm text-brun-mid mt-2 max-w-md mx-auto">
            {T({
              EN: "Your space stays open — journal, messages, practices, and everything you've accomplished remain here.",
              FR: "Ton espace reste ouvert — journal, messages, pratiques, et tout ce que tu as accompli restent ici.",
            })}
          </p>
        </div>
      )}

      {/* Élixirs reçus banner — jamais pour un CUSTOM */}
      {!isCustom && <ElixirReceivedBanner />}

      {/* Legacy onboarding banner — persistent until completed */}
      {client.isLegacy && (!client.charteSignee || client.questionnaireEntry?.status !== "SUBMITTED") && (
        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">📋</span>
            <div className="flex-1">
              <p className="font-display text-base text-amber-900">
                {T({ EN: "Complete your file", FR: "Complète ton dossier" })}
              </p>
              <p className="font-ui text-sm text-amber-700 mt-1">
                {T({
                  EN: "To personalize your accompaniment, take a few minutes to complete these steps.",
                  FR: "Pour personnaliser ton accompagnement, prends quelques minutes pour remplir ces éléments.",
                })}
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {!client.charteSignee && (
                  <Link
                    href="/client/onboarding"
                    className="inline-flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-[2px] font-ui text-xs uppercase tracking-wider hover:bg-amber-700 transition-colors"
                  >
                    ✍️ {T({ EN: "Sign convention", FR: "Signer la convention" })}
                  </Link>
                )}
                {client.questionnaireEntry?.status !== "SUBMITTED" && (
                  <Link
                    href="/client/questionnaire-entry"
                    className="inline-flex items-center gap-1.5 bg-amber-600 text-white px-4 py-2 rounded-[2px] font-ui text-xs uppercase tracking-wider hover:bg-amber-700 transition-colors"
                  >
                    📝 {T({ EN: "Fill questionnaire", FR: "Remplir le questionnaire" })}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wisdom message */}
      {wisdomMessage && (
        <div className="text-center py-6">
          <p className="font-display text-xl sm:text-2xl text-brun-chaud leading-relaxed italic max-w-md mx-auto">
            &ldquo;{wisdomMessage.text}&rdquo;
          </p>
        </div>
      )}

      {/* Check-in buttons — masqués si parcours sans check-in */}
      {(client.requiresMorningCheckin || client.requiresEveningCheckin) && (
        <CheckinButtons lang={lang} />
      )}

      {/* Name + Day number */}
      <div className="text-center">
        <h1 className="font-display text-2xl text-brun-chaud">
          {displayName}
          {parcoursCompleted ? (
            <> · <span className="text-foret">{T({ EN: "Completed", FR: "Terminé" })}</span></>
          ) : dayNumber > 0 ? (
            <> · <span className="text-or-sacre">{T(t.home.day)} {dayNumber}</span></>
          ) : null}
        </h1>
      </div>

      {/* Timeline widget — masqué si parcours sans timeline */}
      {client.requiresProgramTimeline && !isCustom && <TimelineWidget />}

      {/* Parcours sur-mesure (CUSTOM) — timeline indépendante, jamais pour Le Passage.
          ProgramProgress rend null si aucun ClientProgram n'est assigné. */}
      {client.parcoursType === "CUSTOM" && (
        <section className="space-y-3">
          <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid text-center">
            {T({ EN: "My program", FR: "Mon parcours" })}
          </h2>
          <ProgramProgress />
        </section>
      )}

      {/* Miroir de progression — courbe d'énergie + assiduité (self-hiding si aucun check-in) */}
      <ProgressMirror />

      {/* Élixirs du jour (phase actuelle) + lien vers tous les élixirs assignés */}
      {client.requiresElixirs && hasAnyElixir && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-caps text-xs uppercase tracking-widest text-brun-mid">
              {T({ EN: "Today's Elixirs", FR: "Élixirs du jour" })}
            </h2>
            <Link
              href="/client/elixirs"
              className="font-caps text-[10px] uppercase tracking-wider text-or-sacre hover:text-ambre-vif transition-colors"
            >
              {T({ EN: "See all →", FR: "Voir tous →" })}
            </Link>
          </div>
          {todaysElixirs.length === 0 ? (
            <p className="font-ui text-sm text-brun-mid/60">
              {T({ EN: "No elixir scheduled today — see all your elixirs.", FR: "Aucun élixir prévu aujourd'hui — vois tous tes élixirs." })}
            </p>
          ) : (
            <div className="space-y-3">
              {todaysElixirs.map((pe) => {
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
                    <ElixirInstructions description={pe.elixirLibrary.description} />
                  </div>
                );
              })}
            </div>
          )}
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

      {/* Today's practice (phase ou individuel) */}
      {(activePhase?.phasePractices?.length ?? 0) > 0 ? (
        <Link
          href="/client/mes-modules"
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
          href="/client/mes-modules"
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
              <div key={s.id} className="border-b border-or-pale/30 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
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
                      {" · "}{sessionTypeLabels[s.type]?.[lang] ?? s.type}
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
                {"isAppointment" in s && (
                  <AppointmentActions
                    appointmentId={s.id}
                    scheduledAt={new Date(s.scheduledAt).toISOString()}
                    sessionPackId={(s as { sessionPackId?: string | null }).sessionPackId || null}
                    rescheduleUsed={client.rescheduleUsed}
                  />
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
