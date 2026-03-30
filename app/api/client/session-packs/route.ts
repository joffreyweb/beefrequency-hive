import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET /api/client/session-packs — Decompte seances (sans montants ni notes)
export async function GET() {
  const result = await requireClient();
  if (isErrorResponse(result)) return result;

  const client = await prisma.client.findUnique({
    where: { userId: result.session.userId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const packs = await prisma.sessionPack.findMany({
    where: { clientId: client.id },
    select: { totalSessions: true }, // Pas amount ni notes
  });

  const totalSessions = packs.reduce((sum, p) => sum + p.totalSessions, 0);

  const usedCount = await prisma.appointment.count({
    where: {
      clientId: client.id,
      sessionPackId: { not: null },
      status: { not: "CANCELLED" },
    },
  });

  // Historique seances passees (sans notes admin)
  const sessions = await prisma.appointment.findMany({
    where: {
      clientId: client.id,
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      scheduledAt: true,
      durationMin: true,
      sessionPackId: true,
    },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json({
    totalSessions,
    usedCount,
    remaining: totalSessions - usedCount,
    sessions: sessions.map((s) => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      durationMin: s.durationMin,
      fromPack: !!s.sessionPackId,
    })),
  });
}
