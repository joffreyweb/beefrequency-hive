import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — Récupère le récapitulatif de journée (admin only)
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  // Début et fin de la journée courante
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Sessions d'aujourd'hui (planifiées ou complétées)
  const sessions = await prisma.session.findMany({
    where: {
      OR: [
        { scheduledAt: { gte: todayStart, lte: todayEnd } },
        { status: "COMPLETED", scheduledAt: { gte: todayStart, lte: todayEnd } },
      ],
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      client: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  // Parser les checklistItems pour chaque session
  const sessionsWithParsedChecklist = sessions.map((session) => ({
    ...session,
    checklistItems: session.checklistItems
      ? JSON.parse(session.checklistItems as string)
      : [],
  }));

  // Récupérer le dailyRecapTime de l'admin
  const adminUser = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { dailyRecapTime: true },
  });

  // Compter les sessions non récapitulées
  const pendingCount = sessions.filter((s) => !s.recapDone).length;

  return NextResponse.json({
    sessions: sessionsWithParsedChecklist,
    dailyRecapTime: adminUser?.dailyRecapTime ?? "18:00",
    pendingCount,
  });
}

// POST — Marque toutes les sessions d'aujourd'hui comme récapitulées
export async function POST() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Marquer toutes les sessions du jour comme recapDone
  const result = await prisma.session.updateMany({
    where: {
      scheduledAt: { gte: todayStart, lte: todayEnd },
      recapDone: false,
    },
    data: { recapDone: true },
  });

  return NextResponse.json({ updated: result.count });
}
