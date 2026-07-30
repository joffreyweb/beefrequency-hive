import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

const STATUSES = ["INBOX", "TODAY", "WEEK", "DONE", "SNOOZED"] as const;

// PATCH /api/admin/tasks/[id] — modifier une tâche (status pilote completed + doneAt).
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
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes).trim() : null;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.order !== undefined) data.order = body.order;
  if (body.projectId !== undefined) data.projectId = body.projectId || null;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.snoozedUntil !== undefined)
    data.snoozedUntil = body.snoozedUntil ? new Date(body.snoozedUntil) : null;

  // status pilote completed + doneAt (source de vérité de l'écran Ma Journée)
  if (body.status !== undefined && (STATUSES as readonly string[]).includes(body.status)) {
    data.status = body.status;
    if (body.status === "DONE") {
      data.completed = true;
      data.doneAt = new Date();
    } else {
      data.completed = false;
      data.doneAt = null;
    }
  } else if (body.completed !== undefined) {
    // Compat widget legacy (ne passe que { completed })
    data.completed = body.completed;
    data.status = body.completed ? "DONE" : "TODAY";
    data.doneAt = body.completed ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      client: { include: { user: { select: { name: true } } } },
      project: { select: { name: true, color: true } },
    },
  });

  return NextResponse.json({ task });
}

// DELETE /api/admin/tasks/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
