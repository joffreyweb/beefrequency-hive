import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// POST /api/admin/kdrive/incorporer — « piocher » un fichier kDrive et l'incorporer
// dans le pilotage : crée une tâche (Inbox) qui référence le document, liable à un projet.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await request.json();
  const fileName = String(body.fileName || "").trim();
  const fileId = String(body.fileId || "").trim();
  if (!fileName || !fileId) {
    return NextResponse.json({ error: "fileId et fileName requis" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: fileName,
      status: "INBOX",
      origin: "kdrive",
      notes: `📎 Document kDrive · ${fileName} (id ${fileId})`,
      projectId: body.projectId || null,
    },
  });

  return NextResponse.json({ ok: true, task: { id: task.id, title: task.title } }, { status: 201 });
}
