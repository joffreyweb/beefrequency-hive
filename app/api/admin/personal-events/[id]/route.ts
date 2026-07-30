import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.scheduledAt !== undefined) data.scheduledAt = new Date(body.scheduledAt);
  if (body.durationMin !== undefined) data.durationMin = body.durationMin;
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
  const event = await prisma.personalEvent.update({ where: { id }, data });
  return NextResponse.json({ event });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const { id } = await params;
  await prisma.personalEvent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
