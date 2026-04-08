import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.status !== undefined) data.status = body.status;
  if (body.currentDay !== undefined) data.currentDay = body.currentDay;
  if (body.skippedModules !== undefined) data.skippedModules = body.skippedModules;
  if (body.customNotes !== undefined) data.customNotes = body.customNotes;

  const clientProgram = await prisma.clientProgram.update({
    where: { id },
    data,
  });

  return NextResponse.json({ clientProgram });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  await prisma.clientProgram.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
