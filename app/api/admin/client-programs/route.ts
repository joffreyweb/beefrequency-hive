import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/client-programs?clientId=xxx
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId requis" }, { status: 400 });

  const clientProgram = await prisma.clientProgram.findFirst({
    where: { clientId },
    include: {
      program: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: { module: { select: { id: true, name: true, nameFr: true, duration: true } } },
          },
        },
      },
    },
  });

  return NextResponse.json({ clientProgram });
}

// POST /api/admin/client-programs
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId, programId, startDate, skippedModules } = await request.json();

  if (!clientId || !programId || !startDate) {
    return NextResponse.json({ error: "clientId, programId, startDate requis" }, { status: 400 });
  }

  const clientProgram = await prisma.clientProgram.upsert({
    where: { clientId_programId: { clientId, programId } },
    update: {
      startDate: new Date(startDate),
      skippedModules: skippedModules || null,
      status: "active",
      currentDay: 1,
    },
    create: {
      clientId,
      programId,
      startDate: new Date(startDate),
      skippedModules: skippedModules || null,
    },
    include: {
      program: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: { module: { select: { id: true, name: true, nameFr: true, duration: true } } },
          },
        },
      },
    },
  });

  return NextResponse.json({ clientProgram }, { status: 201 });
}
