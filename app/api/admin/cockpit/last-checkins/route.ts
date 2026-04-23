import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/cockpit/last-checkins
// Retourne, pour chaque client ACTIVE, son dernier DailyCheckin (ou null).
// Sert au widget cockpit "Derniers check-ins" (alerte douce si > 48h).
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      user: { select: { name: true } },
      intake: { select: { firstName: true } },
      dailyCheckins: {
        orderBy: { date: "desc" },
        take: 1,
        select: {
          id: true,
          date: true,
          energyLevel: true,
          morningGratitude: true,
          morningPhotoPath: true,
          freeFeeling: true,
          gratitudeMoment: true,
          eveningPhotoPath: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  const items = clients.map((c) => {
    const last = c.dailyCheckins[0] ?? null;
    const hasMorning = last
      ? last.energyLevel !== null || last.morningGratitude !== null || last.morningPhotoPath !== null
      : false;
    const hasEvening = last
      ? last.freeFeeling !== null || last.gratitudeMoment !== null || last.eveningPhotoPath !== null
      : false;
    return {
      clientId: c.id,
      name: c.intake?.firstName || c.user.name || "Client",
      lastCheckin: last
        ? {
            id: last.id,
            date: last.date.toISOString(),
            updatedAt: last.updatedAt.toISOString(),
            hasMorning,
            hasEvening,
          }
        : null,
    };
  });

  return NextResponse.json({ items });
}
