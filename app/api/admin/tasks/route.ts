import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

const STATUSES = ["INBOX", "TODAY", "WEEK", "DONE", "SNOOZED"] as const;
type TaskStatus = (typeof STATUSES)[number];

// GET /api/admin/tasks — liste. ?status=INBOX|TODAY|WEEK|DONE|SNOOZED, ou ?completed=true (legacy).
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const showCompleted = searchParams.get("completed") === "true";

  const where: { status?: TaskStatus; completed?: boolean } =
    status && (STATUSES as readonly string[]).includes(status)
      ? { status: status as TaskStatus }
      : showCompleted
        ? {}
        : { completed: false };

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ order: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      client: { include: { user: { select: { name: true } } } },
      project: { select: { name: true, color: true } },
    },
  });

  return NextResponse.json({ tasks });
}

// POST /api/admin/tasks — créer une tâche (capture rapide = status INBOX par défaut).
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const { title, clientId, sessionId, appointmentId, dueDate, notes, projectId, priority } = body;
  const status: string | undefined = body.status;
  const origin: string | undefined = body.origin;

  if (!title?.trim()) {
    return NextResponse.json({ error: "title requis" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      status: (status && (STATUSES as readonly string[]).includes(status)
        ? status
        : "INBOX") as TaskStatus,
      notes: notes?.trim() || null,
      priority: typeof priority === "number" ? priority : null,
      origin: origin || "capture",
      clientId: clientId || null,
      sessionId: sessionId || null,
      appointmentId: appointmentId || null,
      projectId: projectId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: {
      client: { include: { user: { select: { name: true } } } },
      project: { select: { name: true, color: true } },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
