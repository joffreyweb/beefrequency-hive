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
  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { module: true },
      },
    },
  });

  if (!program) return NextResponse.json({ error: "Programme introuvable" }, { status: 404 });
  return NextResponse.json({ program });
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
  if (body.description !== undefined) data.description = body.description;

  // Replace module sequence if provided
  if (body.moduleSequence) {
    await prisma.programModule.deleteMany({ where: { programId: id } });
    for (let i = 0; i < body.moduleSequence.length; i++) {
      await prisma.programModule.create({
        data: { programId: id, moduleId: body.moduleSequence[i], order: i + 1 },
      });
    }
  }

  const program = await prisma.program.update({
    where: { id },
    data,
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { module: { select: { name: true, nameFr: true, duration: true } } },
      },
    },
  });

  return NextResponse.json({ program });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  await prisma.program.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
