import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// PATCH /api/admin/session-packs/[id] — Lier un RDV a un pack
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const { appointmentId, sessionPackId } = await request.json();

  // Lier un appointment a un pack
  if (appointmentId !== undefined) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { sessionPackId: sessionPackId || null },
    });
    return NextResponse.json({ success: true });
  }

  // Modifier le pack
  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.totalSessions) data.totalSessions = body.totalSessions;
  if (body.notes !== undefined) data.notes = body.notes;

  const pack = await prisma.sessionPack.update({ where: { id }, data });
  return NextResponse.json({ pack });
}

// DELETE /api/admin/session-packs/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  // Unlnk appointments first
  await prisma.appointment.updateMany({
    where: { sessionPackId: id },
    data: { sessionPackId: null },
  });

  await prisma.sessionPack.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
