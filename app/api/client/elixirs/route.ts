import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";
import { isElixirDayMatch } from "@/lib/parcours";

// GET /api/client/elixirs — Élixirs du jour assignés au client (phase active, filtrés par fréquence).
// Source unique : PhaseElixir de la phase active (l'id renvoyé est l'id du PhaseElixir,
// utilisé tel quel par /api/checkin-elixirs comme phaseElixirId).
export async function GET() {
  const result = await requireClient();
  if (isErrorResponse(result)) return result;

  const client = await prisma.client.findUnique({
    where: { userId: result.session.userId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Phase active = celle dont [startDate, endDate] contient aujourd'hui (calcul JS, robuste aux TZ)
  const allPhases = await prisma.clientPhase.findMany({
    where: { clientId: client.id },
    orderBy: { startDate: "asc" },
    include: { phaseElixirs: { include: { elixirLibrary: true } } },
  });

  const ref = new Date();
  ref.setHours(12, 0, 0, 0);
  const phase = allPhases.find((p) => {
    const start = new Date(p.startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(p.endDate); end.setHours(23, 59, 59, 999);
    return ref >= start && ref <= end;
  }) ?? null;

  const today = new Date();
  const elixirs = phase
    ? phase.phaseElixirs
        .filter((pe) => isElixirDayMatch(pe.frequency, today))
        .map((pe) => ({
          id: pe.id,
          name: pe.elixirLibrary.name,
          dosage: pe.dose || pe.elixirLibrary.dosage,
        }))
    : [];

  return NextResponse.json({ elixirs });
}
