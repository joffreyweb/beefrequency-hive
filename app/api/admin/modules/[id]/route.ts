import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const mod = await prisma.module.findUnique({
    where: { id },
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });

  if (!mod) return NextResponse.json({ error: "Module introuvable" }, { status: 404 });
  return NextResponse.json({ module: mod });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.nameFr !== undefined) data.nameFr = body.nameFr;
  if (body.nameEn !== undefined) data.nameEn = body.nameEn;
  if (body.duration !== undefined) data.duration = body.duration;
  if (body.description !== undefined) data.description = body.description;
  if (body.isStandalone !== undefined) data.isStandalone = body.isStandalone;

  // Upsert days if provided
  if (body.days) {
    for (const day of body.days) {
      await prisma.moduleDay.upsert({
        where: { moduleId_dayNumber: { moduleId: id, dayNumber: day.dayNumber } },
        update: { elixirs: day.elixirs, practices: day.practices, notification: day.notification },
        create: { moduleId: id, dayNumber: day.dayNumber, elixirs: day.elixirs, practices: day.practices, notification: day.notification },
      });
    }
  }

  const mod = await prisma.module.update({
    where: { id },
    data,
    include: { days: { orderBy: { dayNumber: "asc" } } },
  });

  return NextResponse.json({ module: mod });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  await prisma.module.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
