import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/questionnaire-entry?clientId=xxx — Récupère les réponses du questionnaire
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clientId = new URL(request.url).searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  const entry = await prisma.questionnaireEntry.findUnique({
    where: { clientId },
  });

  return NextResponse.json({ entry: entry ?? null });
}
