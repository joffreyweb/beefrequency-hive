import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/session-notes?sessionId=...&type=session
// GET /api/admin/session-notes?appointmentId=...&type=appointment
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") || "appointment";
  const id = searchParams.get("sessionId") || searchParams.get("appointmentId");

  if (!id) {
    return NextResponse.json({ error: "sessionId ou appointmentId requis" }, { status: 400 });
  }

  const where = type === "session" ? { sessionId: id } : { appointmentId: id };
  const note = await prisma.sessionNote.findFirst({ where, orderBy: { updatedAt: "desc" } });

  return NextResponse.json({ note });
}

// POST /api/admin/session-notes — Créer ou mettre à jour une note
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { sessionId, appointmentId, content } = await request.json();

  if (!sessionId && !appointmentId) {
    return NextResponse.json({ error: "sessionId ou appointmentId requis" }, { status: 400 });
  }

  if (content === undefined) {
    return NextResponse.json({ error: "content requis" }, { status: 400 });
  }

  // Upsert: chercher une note existante pour cette séance
  const where = sessionId ? { sessionId } : { appointmentId };
  const existing = await prisma.sessionNote.findFirst({ where });

  let note;
  if (existing) {
    note = await prisma.sessionNote.update({
      where: { id: existing.id },
      data: { content },
    });
  } else {
    note = await prisma.sessionNote.create({
      data: {
        sessionId: sessionId || null,
        appointmentId: appointmentId || null,
        content,
      },
    });
  }

  return NextResponse.json({ note }, { status: existing ? 200 : 201 });
}
