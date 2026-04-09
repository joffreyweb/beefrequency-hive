import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { isElixirDayMatch } from "@/lib/parcours";

// GET /api/client/current-phase — Phase active avec élixirs et pratiques du jour
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Trouver la phase active (startDate <= today <= endDate)
  const activePhase = await prisma.clientPhase.findFirst({
    where: {
      clientId: client.id,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      phaseElixirs: { include: { elixirLibrary: true } },
      phasePractices: true,
    },
  });

  // Si pas de phase active, prendre la première phase à venir
  const phase = activePhase ?? await prisma.clientPhase.findFirst({
    where: {
      clientId: client.id,
      startDate: { gt: now },
    },
    orderBy: { startDate: "asc" },
    include: {
      phaseElixirs: { include: { elixirLibrary: true } },
      phasePractices: true,
    },
  });

  if (!phase) {
    return NextResponse.json({ phase: null, elixirsToday: [], practices: [] });
  }

  // Filtrer les élixirs du jour selon la fréquence
  const today = new Date();
  const elixirsToday = phase.phaseElixirs.filter((pe) =>
    isElixirDayMatch(pe.frequency, today)
  ).map((pe) => ({
    id: pe.id,
    name: pe.elixirLibrary.name,
    description: pe.elixirLibrary.description,
    dose: pe.dose || pe.elixirLibrary.dosage,
    unit: pe.elixirLibrary.unit,
    timing: pe.timing,
    frequency: pe.frequency,
    notes: pe.notes,
  }));

  const practices = phase.phasePractices.map((pp) => ({
    id: pp.id,
    type: pp.type,
    title: pp.title,
    description: pp.description,
    duration: pp.duration,
    frequency: pp.frequency,
  }));

  return NextResponse.json({
    phase: {
      id: phase.id,
      phaseType: phase.phaseType,
      phaseNumber: phase.phaseNumber,
      customName: phase.customName,
      instructions: phase.instructions,
      startDate: phase.startDate,
      endDate: phase.endDate,
      status: phase.status,
    },
    elixirsToday,
    practices,
  });
}
