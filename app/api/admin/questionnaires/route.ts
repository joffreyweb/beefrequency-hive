import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/questionnaires — Liste tous les questionnaires
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const questionnaires = await prisma.questionnaire.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { responses: true } } },
  });

  return NextResponse.json({ questionnaires });
}

// POST /api/admin/questionnaires — Creer un questionnaire
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { type, title, questions } = await request.json();

  if (!type || !title) {
    return NextResponse.json({ error: "type et title requis" }, { status: 400 });
  }

  if (!["PRE_START", "FOLLOW_UP"].includes(type)) {
    return NextResponse.json({ error: "type doit etre PRE_START ou FOLLOW_UP" }, { status: 400 });
  }

  const questionnaire = await prisma.questionnaire.create({
    data: {
      type,
      title,
      questions: questions || [],
    },
  });

  return NextResponse.json({ questionnaire }, { status: 201 });
}
