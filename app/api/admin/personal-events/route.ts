import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/personal-events — blocs perso à venir (aujourd'hui + futur).
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const events = await prisma.personalEvent.findMany({
    where: { scheduledAt: { gte: since } },
    orderBy: { scheduledAt: "asc" },
    take: 100,
  });
  return NextResponse.json({ events });
}

// POST /api/admin/personal-events — créer un bloc perso.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title || !body.scheduledAt) {
    return NextResponse.json({ error: "title et scheduledAt requis" }, { status: 400 });
  }
  const event = await prisma.personalEvent.create({
    data: {
      title,
      scheduledAt: new Date(body.scheduledAt),
      durationMin: typeof body.durationMin === "number" ? body.durationMin : 60,
      notes: body.notes?.trim() || null,
    },
  });
  return NextResponse.json({ event }, { status: 201 });
}
