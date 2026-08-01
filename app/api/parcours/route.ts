import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { computePhases, getActivePhaseInfo, isElixirDayMatch } from "@/lib/parcours";

// GET — données parcours complètes pour le client connecté
export async function GET() {
  const result = await requireClient();
  if (isErrorResponse(result)) return result;

  const { session } = result;
  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      detoxStartDate: true,
      programTotalDays: true,
      requiresElixirs: true,
      clientPhases: {
        orderBy: [{ startDate: "asc" }],
        include: {
          phaseElixirs: { include: { elixirLibrary: true } },
          phasePractices: true,
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Source de date canonique : detoxStartDate. Si non défini, le programme n'a pas démarré.
  const programStart = client.detoxStartDate;
  let phases: any[] = [];
  let activeInfo: any = null;

  if (client.programTotalDays != null && client.clientPhases.length > 0) {
    // Parcours PERSONNALISÉ : la timeline vit dans les phases stockées (pas le 103j figé).
    const now0 = new Date(); now0.setHours(0, 0, 0, 0);
    const first = new Date(client.clientPhases[0].startDate); first.setHours(0, 0, 0, 0);
    phases = client.clientPhases.map((p) => {
      const s = new Date(p.startDate); s.setHours(0, 0, 0, 0);
      const e = new Date(p.endDate); e.setHours(0, 0, 0, 0);
      let status: "UPCOMING" | "ACTIVE" | "COMPLETED" = "UPCOMING";
      if (now0 > e) status = "COMPLETED";
      else if (now0 >= s) status = "ACTIVE";
      return {
        phaseType: p.phaseType,
        phaseNumber: p.phaseNumber,
        durationDays: Math.round((e.getTime() - s.getTime()) / 86400000) + 1,
        startDay: Math.round((s.getTime() - first.getTime()) / 86400000),
        label: p.customName || p.phaseType,
        startDate: p.startDate,
        endDate: p.endDate,
        status,
      };
    });
    const active = phases.find((p) => p.status === "ACTIVE");
    if (active) {
      const as = new Date(active.startDate); as.setHours(0, 0, 0, 0);
      activeInfo = {
        phase: active,
        dayInPhase: Math.round((now0.getTime() - as.getTime()) / 86400000) + 1,
        dayInProgram: Math.round((now0.getTime() - first.getTime()) / 86400000) + 1,
        totalDays: client.programTotalDays,
      };
    }
  } else {
    phases = programStart ? computePhases(programStart) : [];
    activeInfo = programStart ? getActivePhaseInfo(programStart) : null;
  }

  // Trouver la phase active en base pour récupérer les élixirs/pratiques assignés
  let todayElixirs: any[] = [];
  let todayPractices: any[] = [];
  const today = new Date();

  if (activeInfo) {
    const activeDbPhase = client.clientPhases.find(
      (p) =>
        p.phaseType === activeInfo.phase.phaseType &&
        p.phaseNumber === activeInfo.phase.phaseNumber
    );

    if (activeDbPhase) {
      todayElixirs = activeDbPhase.phaseElixirs
        .filter((pe) => isElixirDayMatch(pe.frequency, today))
        .map((pe) => ({
          id: pe.id,
          name: pe.elixirLibrary.name,
          description: pe.elixirLibrary.description,
          dose: pe.dose || pe.elixirLibrary.dosage,
          unit: pe.elixirLibrary.unit,
          timing: pe.timing,
          notes: pe.notes,
        }));

      todayPractices = activeDbPhase.phasePractices.map((pp) => ({
        id: pp.id,
        type: pp.type,
        title: pp.title,
        description: pp.description,
        duration: pp.duration,
      }));
    }
  }

  // Check-in du jour
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayCheckin = await prisma.dailyCheckin.findUnique({
    where: { clientId_date: { clientId: client.id, date: todayDate } },
  });

  return NextResponse.json({
    phases,
    activeInfo,
    todayElixirs,
    todayPractices,
    todayCheckin,
    clientPhases: client.clientPhases,
    requiresElixirs: client.requiresElixirs,
  });
}
