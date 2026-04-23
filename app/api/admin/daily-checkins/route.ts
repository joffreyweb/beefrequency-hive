import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const url = request.nextUrl;
  const clientId = url.searchParams.get("clientId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limitRaw = url.searchParams.get("limit");
  const offsetRaw = url.searchParams.get("offset");
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  const where: Record<string, unknown> = { clientId };
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const limit = Math.min(Math.max(parseInt(limitRaw || "30", 10) || 30, 1), 100);
  const offset = Math.max(parseInt(offsetRaw || "0", 10) || 0, 0);

  const [checkins, total] = await Promise.all([
    prisma.dailyCheckin.findMany({
      where,
      orderBy: { date: order },
      skip: offset,
      take: limit,
      select: {
        id: true,
        date: true,
        // Matin
        energyLevel: true,
        sleepQuality: true,
        sleepType: true,
        dreamed: true,
        dreamNotes: true,
        morningGratitude: true,
        morningPhotoPath: true,
        // Soir
        freeFeeling: true,
        pride1: true,
        pride2: true,
        pride3: true,
        gratitudeMoment: true,
        gratitudeSensation: true,
        gratitudeRecu: true,
        gratitudeSoi: true,
        selfQuality: true,
        closingSentence: true,
        elixirTaken: true,
        eveningPhotoPath: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.dailyCheckin.count({ where }),
  ]);

  return NextResponse.json({ checkins, total, limit, offset });
}
