import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { computePhases, getActivePhaseInfo, TOTAL_PROGRAM_DAYS } from "@/lib/parcours";

// GET /api/client/timeline — Données timeline du parcours client
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      detoxStartDate: true,
      programmeStartDate: true,
      startDate: true,
      produitsRecus: true,
      colisEnvoye: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Phase Détox initiale (10 jours avant le programme)
  let detox = null;
  if (client.detoxStartDate) {
    const detoxStart = new Date(client.detoxStartDate);
    detoxStart.setHours(0, 0, 0, 0);
    const detoxDay = Math.floor((now.getTime() - detoxStart.getTime()) / 86400000) + 1;
    detox = {
      label: "Détox",
      durationDays: 10,
      dayInPhase: Math.min(Math.max(detoxDay, 0), 10),
      status: detoxDay > 10 ? "COMPLETED" : detoxDay >= 1 ? "ACTIVE" : "UPCOMING",
    };
  }

  // Phases du programme (7 phases : detox + 3 cycles + 3 intégrations)
  let phases = null;
  let activeInfo = null;
  // Use programmeStartDate if set, otherwise fall back to detoxStartDate (legacy clients)
  const programmeStart = client.programmeStartDate || client.detoxStartDate || null;

  if (programmeStart) {
    const computed = computePhases(programmeStart);
    activeInfo = getActivePhaseInfo(programmeStart);

    phases = computed.map((p) => ({
      label: p.label,
      phaseType: p.phaseType,
      phaseNumber: p.phaseNumber,
      durationDays: p.durationDays,
      status: p.status,
      startDay: p.startDay,
    }));
  }

  // Calcul progression globale
  let globalProgress = 0;
  let globalDay = 0;
  const totalDaysWithDetox = TOTAL_PROGRAM_DAYS; // 103 jours (détox incluse)

  if (detox && detox.status !== "UPCOMING") {
    globalDay = detox.dayInPhase;
  }
  if (activeInfo) {
    globalDay = activeInfo.dayInProgram;
  } else if (detox && detox.status === "COMPLETED" && !programmeStart) {
    globalDay = 10;
  }

  globalProgress = Math.min(Math.round((globalDay / totalDaysWithDetox) * 100), 100);

  return NextResponse.json({
    detox,
    phases,
    activePhase: activeInfo
      ? {
          label: activeInfo.phase.label,
          dayInPhase: activeInfo.dayInPhase,
          durationDays: activeInfo.phase.durationDays,
          dayInProgram: activeInfo.dayInProgram,
        }
      : detox?.status === "ACTIVE"
        ? {
            label: "Détox",
            dayInPhase: detox.dayInPhase,
            durationDays: 10,
            dayInProgram: detox.dayInPhase,
          }
        : null,
    globalDay,
    globalProgress,
    totalDays: totalDaysWithDetox,
    hasStarted: !!client.detoxStartDate || !!programmeStart,
  });
}
