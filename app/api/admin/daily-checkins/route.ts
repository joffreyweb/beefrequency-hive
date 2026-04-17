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

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  const where: Record<string, unknown> = { clientId };
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }

  const checkins = await prisma.dailyCheckin.findMany({
    where,
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      energyLevel: true,
      gratitudeMoment: true,
      freeFeeling: true,
      elixirTaken: true,
    },
  });

  return NextResponse.json({ checkins });
}
