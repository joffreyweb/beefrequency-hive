import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/tasks — Liste des tâches non complétées
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = request.nextUrl;
  const showCompleted = searchParams.get("completed") === "true";

  const tasks = await prisma.task.findMany({
    where: showCompleted ? {} : { completed: false },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      client: { include: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ tasks });
}

// POST /api/admin/tasks — Créer une tâche
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { title, clientId, sessionId, appointmentId, dueDate } = await request.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "title requis" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      clientId: clientId || null,
      sessionId: sessionId || null,
      appointmentId: appointmentId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      client: { include: { user: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
