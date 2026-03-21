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
    include: {
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

  const phases = computePhases(client.startDate);
  const activeInfo = getActivePhaseInfo(client.startDate);

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
  });
}
