import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProgramState } from "@/lib/program-state";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Programme principal du client — on NE filtre PAS sur status:"active" :
  // l'état (actif/terminé/à venir) est calculé, pas lu depuis la base.
  const clientProgram = await prisma.clientProgram.findFirst({
    where: { clientId: client.id },
    orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
    include: {
      program: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: { module: { select: { id: true, name: true, nameFr: true, nameEn: true, duration: true } } },
          },
        },
      },
    },
  });

  if (!clientProgram) return NextResponse.json({ clientProgram: null });

  const skipped = (clientProgram.skippedModules as string[] | null) || [];

  // Build active modules (excluding skipped)
  const activeModules = clientProgram.program.modules
    .filter((pm) => !skipped.includes(pm.module.id))
    .map((pm) => pm.module);

  // Programme sans module actif (vide ou tout skippé) → rien à afficher, évite un 500.
  if (activeModules.length === 0) {
    return NextResponse.json({ clientProgram: null });
  }

  // Cycle de vie calculé (jour-calendrier Bruxelles, jamais d'instant brut).
  const { startDate: start, endDate, totalDays, currentDay, state } = getProgramState(
    clientProgram,
    clientProgram.program,
  );

  // Find current phase
  let dayCounter = 0;
  let currentPhase = activeModules[activeModules.length - 1];
  let dayInPhase = 1;
  let phaseIndex = 0;

  for (let i = 0; i < activeModules.length; i++) {
    if (currentDay <= dayCounter + activeModules[i].duration) {
      currentPhase = activeModules[i];
      dayInPhase = currentDay - dayCounter;
      phaseIndex = i;
      break;
    }
    dayCounter += activeModules[i].duration;
  }

  // Next phase
  const nextPhase = phaseIndex + 1 < activeModules.length ? activeModules[phaseIndex + 1] : null;
  const daysUntilNext = currentPhase.duration - dayInPhase + 1;

  return NextResponse.json({
    clientProgram: {
      id: clientProgram.id,
      programName: clientProgram.program.nameFr,
      startDate: start,
      endDate,
      totalDays,
      currentDay,
      progress: Math.round(Math.min(currentDay / totalDays, 1) * 100),
      currentPhase: {
        name: currentPhase.nameFr,
        moduleName: currentPhase.name,
        dayInPhase,
        totalDaysInPhase: currentPhase.duration,
        daysRemaining: currentPhase.duration - dayInPhase,
      },
      nextPhase: nextPhase ? {
        name: nextPhase.nameFr,
        duration: nextPhase.duration,
        startsIn: daysUntilNext,
      } : null,
      modules: activeModules.map((m) => ({ name: m.name, nameFr: m.nameFr, duration: m.duration })),
      state, // pending | active | completed | paused — calculé
    },
  });
}
