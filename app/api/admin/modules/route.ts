import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const modules = await prisma.module.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { days: true, programModules: true } } },
  });

  return NextResponse.json({ modules });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { name, nameFr, nameEn, duration, description, isStandalone } = await request.json();

  if (!name?.trim() || !nameFr?.trim() || !nameEn?.trim() || !duration) {
    return NextResponse.json({ error: "name, nameFr, nameEn, duration requis" }, { status: 400 });
  }

  const mod = await prisma.module.create({
    data: { name: name.trim(), nameFr: nameFr.trim(), nameEn: nameEn.trim(), duration, description: description || null, isStandalone: !!isStandalone },
  });

  return NextResponse.json({ module: mod }, { status: 201 });
}
