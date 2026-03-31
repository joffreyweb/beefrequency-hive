import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/detox-days?clientId=xxx — Récupère les 10 jours détox d'un client
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, detoxStartDate: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Si pas de detoxStartDate, retourner un tableau vide
  if (!client.detoxStartDate) {
    return NextResponse.json({ days: [], detoxStartDate: null });
  }

  // Récupérer ou initialiser les 10 jours
  let days = await prisma.detoxDay.findMany({
    where: { clientId },
    orderBy: { dayNumber: "asc" },
  });

  // Auto-initialiser les jours manquants
  if (days.length < 10) {
    const existingDayNumbers = new Set(days.map((d) => d.dayNumber));
    const detoxStart = new Date(client.detoxStartDate);
    detoxStart.setHours(0, 0, 0, 0);

    const toCreate = [];
    for (let i = 1; i <= 10; i++) {
      if (!existingDayNumbers.has(i)) {
        const dayDate = new Date(detoxStart);
        dayDate.setDate(dayDate.getDate() + i - 1);
        toCreate.push({
          clientId,
          dayNumber: i,
          date: dayDate,
        });
      }
    }

    if (toCreate.length > 0) {
      await prisma.detoxDay.createMany({ data: toCreate });
      days = await prisma.detoxDay.findMany({
        where: { clientId },
        orderBy: { dayNumber: "asc" },
      });
    }
  }

  return NextResponse.json({
    days,
    detoxStartDate: client.detoxStartDate,
  });
}

// PATCH /api/admin/detox-days — Met à jour un champ d'un DetoxDay
// Body: { dayId, field, value }
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { dayId, field, value } = await request.json();

  if (!dayId || !field) {
    return NextResponse.json({ error: "dayId et field requis" }, { status: 400 });
  }

  const allowedFields = ["elixirDone", "protocolDone", "pratiqueDone", "notes"];
  if (!allowedFields.includes(field)) {
    return NextResponse.json({ error: "Champ non autorisé" }, { status: 400 });
  }

  const day = await prisma.detoxDay.findUnique({ where: { id: dayId } });
  if (!day) {
    return NextResponse.json({ error: "Jour introuvable" }, { status: 404 });
  }

  const updated = await prisma.detoxDay.update({
    where: { id: dayId },
    data: { [field]: value },
  });

  return NextResponse.json({ day: updated });
}
