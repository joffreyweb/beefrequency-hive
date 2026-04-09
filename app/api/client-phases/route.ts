import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { computePhases } from "@/lib/parcours";

// GET — phases d'un client (query: clientId)
export async function GET(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  const phases = await prisma.clientPhase.findMany({
    where: { clientId },
    orderBy: { startDate: "asc" },
    include: {
      phaseElixirs: { include: { elixirLibrary: true } },
      phasePractices: true,
    },
  });

  return NextResponse.json({ phases });
}

// POST — générer les 7 phases (103j) pour un client à partir de sa startDate
export async function POST(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const body = await req.json();
  const { clientId } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Vérifier si les phases existent déjà
  const existing = await prisma.clientPhase.count({ where: { clientId } });
  if (existing > 0) {
    return NextResponse.json({ error: "Les phases existent déjà pour ce client" }, { status: 409 });
  }

  const computed = computePhases(client.startDate);

  const phases = await prisma.$transaction(
    computed.map((p) =>
      prisma.clientPhase.create({
        data: {
          clientId,
          phaseType: p.phaseType,
          phaseNumber: p.phaseNumber,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
        },
      })
    )
  );

  return NextResponse.json({ phases }, { status: 201 });
}
