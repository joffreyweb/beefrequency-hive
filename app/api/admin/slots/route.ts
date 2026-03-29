import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/slots — Liste des creneaux admin
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const slots = await prisma.adminSlot.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ slots });
}

// POST /api/admin/slots — Creer un creneau
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { dayOfWeek, startTime, endTime } = await req.json();

  if (dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "dayOfWeek, startTime, endTime requis" }, { status: 400 });
  }

  const slot = await prisma.adminSlot.create({
    data: { dayOfWeek, startTime, endTime },
  });

  return NextResponse.json({ slot });
}

// DELETE /api/admin/slots?id=xxx — Supprimer un creneau
export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  await prisma.adminSlot.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
