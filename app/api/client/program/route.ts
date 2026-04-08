import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const clientProgram = await prisma.clientProgram.findFirst({
    where: { clientId: client.id, status: "active" },
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

  const totalDays = activeModules.reduce((acc, m) => acc + m.duration, 0);

  // Compute current day from startDate
  const now = new Date();
  const start = new Date(clientProgram.startDate);
  const currentDay = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000) + 1);

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

  // End date
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + totalDays - 1);

  return NextResponse.json({
    clientProgram: {
      id: clientProgram.id,
      programName: clientProgram.program.nameFr,
      startDate: clientProgram.startDate,
      endDate,
      totalDays,
      currentDay: Math.min(currentDay, totalDays),
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
      status: currentDay > totalDays ? "completed" : "active",
    },
  });
}
