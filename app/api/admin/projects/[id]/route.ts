import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

const STATUSES = ["ACTIVE", "PAUSED", "DONE", "ARCHIVED"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.color !== undefined) data.color = String(body.color).trim();
  if (body.type !== undefined) data.type = body.type ? String(body.type).trim() : null;
  if (body.order !== undefined) data.order = body.order;
  if (body.status !== undefined && (STATUSES as readonly string[]).includes(body.status))
    data.status = body.status;

  const project = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ project });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  // Tâches liées : projectId passe à null (onDelete SetNull) — aucune perte de tâche.
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
