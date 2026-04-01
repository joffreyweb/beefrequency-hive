import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// GET /api/checkin/status — Vérifie si le check-in matin/soir a été fait aujourd'hui
export async function GET() {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ morningDone: false, eveningDone: false });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkin = await prisma.dailyCheckin.findUnique({
    where: { clientId_date: { clientId: client.id, date: today } },
    select: { energyLevel: true, freeFeeling: true },
  });

  return NextResponse.json({
    morningDone: checkin?.energyLevel != null,
    eveningDone: checkin?.freeFeeling != null,
  });
}
