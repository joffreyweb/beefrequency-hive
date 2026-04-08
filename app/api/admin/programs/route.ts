import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const programs = await prisma.program.findMany({
    orderBy: { name: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { module: { select: { name: true, nameFr: true, duration: true } } },
      },
      _count: { select: { clientPrograms: true } },
    },
  });

  return NextResponse.json({ programs });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { name, nameFr, nameEn, description, moduleSequence } = await request.json();

  if (!name?.trim() || !nameFr?.trim() || !nameEn?.trim()) {
    return NextResponse.json({ error: "name, nameFr, nameEn requis" }, { status: 400 });
  }

  const program = await prisma.program.create({
    data: { name: name.trim(), nameFr: nameFr.trim(), nameEn: nameEn.trim(), description: description || null },
  });

  if (moduleSequence?.length) {
    for (let i = 0; i < moduleSequence.length; i++) {
      await prisma.programModule.create({
        data: { programId: program.id, moduleId: moduleSequence[i], order: i + 1 },
      });
    }
  }

  return NextResponse.json({ program }, { status: 201 });
}
