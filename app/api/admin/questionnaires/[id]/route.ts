import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/questionnaires/[id] — Detail d'un questionnaire
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  const questionnaire = await prisma.questionnaire.findUnique({
    where: { id },
    include: {
      responses: {
        include: {
          client: { include: { user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!questionnaire) {
    return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });
  }

  return NextResponse.json({ questionnaire });
}

// PATCH /api/admin/questionnaires/[id] — Modifier un questionnaire
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.questions !== undefined) data.questions = body.questions;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.type !== undefined) data.type = body.type;

  const questionnaire = await prisma.questionnaire.update({
    where: { id },
    data,
  });

  return NextResponse.json({ questionnaire });
}

// DELETE /api/admin/questionnaires/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;
  await prisma.questionnaire.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
