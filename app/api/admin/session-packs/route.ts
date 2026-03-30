import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/session-packs?clientId=xxx — Packs d'un client + decompte
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  const packs = await prisma.sessionPack.findMany({
    where: { clientId },
    orderBy: { paidAt: "desc" },
  });

  const usedCount = await prisma.appointment.count({
    where: {
      clientId,
      sessionPackId: { not: null },
      status: { not: "CANCELLED" },
    },
  });

  const totalSessions = packs.reduce((sum, p) => sum + p.totalSessions, 0);
  const remaining = totalSessions - usedCount;

  return NextResponse.json({ packs, totalSessions, usedCount, remaining });
}

// POST /api/admin/session-packs — Creer un pack
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId, totalSessions, paidAt, amount, notes } = await request.json();

  if (!clientId || !totalSessions || !paidAt) {
    return NextResponse.json({ error: "clientId, totalSessions et paidAt requis" }, { status: 400 });
  }

  const pack = await prisma.sessionPack.create({
    data: {
      clientId,
      totalSessions,
      paidAt: new Date(paidAt),
      amount: amount ?? null,
      notes: notes || null,
    },
  });

  return NextResponse.json({ pack }, { status: 201 });
}
