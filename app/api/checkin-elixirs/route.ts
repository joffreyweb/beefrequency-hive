import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// POST /api/checkin-elixirs — Sauvegarder le detail des elixirs pris pour un check-in
export async function POST(req: Request) {
  const result = await requireClient();
  if (isErrorResponse(result)) return result;

  const { dailyCheckinId, elixirs } = await req.json();

  if (!dailyCheckinId || !Array.isArray(elixirs)) {
    return NextResponse.json({ error: "dailyCheckinId et elixirs requis" }, { status: 400 });
  }

  // Verifier que le check-in appartient bien au client
  const client = await prisma.client.findUnique({
    where: { userId: result.session.userId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const checkin = await prisma.dailyCheckin.findUnique({
    where: { id: dailyCheckinId },
    select: { clientId: true },
  });

  if (!checkin || checkin.clientId !== client.id) {
    return NextResponse.json({ error: "Check-in non autorise" }, { status: 403 });
  }

  // Upsert chaque elixir
  for (const { elixirPrescriptionId, taken } of elixirs) {
    await prisma.checkinElixir.upsert({
      where: {
        dailyCheckinId_elixirPrescriptionId: {
          dailyCheckinId,
          elixirPrescriptionId,
        },
      },
      update: { taken },
      create: {
        dailyCheckinId,
        elixirPrescriptionId,
        taken,
      },
    });
  }

  return NextResponse.json({ success: true });
}
