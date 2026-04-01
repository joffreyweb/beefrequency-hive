import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET /api/client/prestart-status — Vérifie le statut Pre-Start + questionnaire d'entrée + parcours
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      colisEnvoye: true,
      produitsRecus: true,
      programmeStartDate: true,
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Cherche un questionnaire Pre-Start PENDING (ancien système)
  const pendingPreStart = await prisma.questionnaireResponse.findFirst({
    where: {
      clientId: client.id,
      status: "PENDING",
      questionnaire: { type: "PRE_START" },
    },
    select: { id: true },
  });

  // Questionnaire d'entrée (nouveau système 8 sections)
  const questionnaireEntry = await prisma.questionnaireEntry.findUnique({
    where: { clientId: client.id },
    select: { status: true, sectionsDone: true },
  });

  return NextResponse.json({
    prestartCompleted: !pendingPreStart,
    pendingResponseId: pendingPreStart?.id ?? null,
    colisEnvoye: client.colisEnvoye,
    produitsRecus: client.produitsRecus,
    programmeStarted: !!client.programmeStartDate,
    questionnaireStatus: questionnaireEntry?.status ?? null,
    questionnaireSectionsDone: questionnaireEntry?.sectionsDone ?? 0,
  });
}
