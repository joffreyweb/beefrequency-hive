import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET /api/client/prestart-status — Vérifie si le Pre-Start est complété + statut parcours
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

  // Cherche un questionnaire Pre-Start PENDING
  const pendingPreStart = await prisma.questionnaireResponse.findFirst({
    where: {
      clientId: client.id,
      status: "PENDING",
      questionnaire: { type: "PRE_START" },
    },
    select: { id: true },
  });

  return NextResponse.json({
    prestartCompleted: !pendingPreStart,
    pendingResponseId: pendingPreStart?.id ?? null,
    colisEnvoye: client.colisEnvoye,
    produitsRecus: client.produitsRecus,
    programmeStarted: !!client.programmeStartDate,
  });
}
