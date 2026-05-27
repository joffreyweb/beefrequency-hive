import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { computePhases, getNextMonday } from "@/lib/parcours";

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

// DELETE — réinitialiser les phases d'un client (query: clientId)
export async function DELETE(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  await prisma.clientPhase.deleteMany({ where: { clientId } });

  return NextResponse.json({ ok: true });
}

// POST — générer les 7 phases (103j) pour un client
// Priorité date : body.startDate > client.detoxStartDate > lundi suivant now()
export async function POST(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const body = await req.json();
  const { clientId, startDate: overrideStart } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Date de départ : override > detoxStartDate > lundi suivant
  const programStart = overrideStart
    ? new Date(overrideStart)
    : client.detoxStartDate
      ? new Date(client.detoxStartDate)
      : getNextMonday(new Date());

  const computed = computePhases(programStart);

  // Sauvegarder detoxStartDate si pas encore définie
  if (!client.detoxStartDate) {
    await prisma.client.update({
      where: { id: clientId },
      data: { detoxStartDate: programStart },
    });
  }

  // Upsert par (clientId, phaseType, phaseNumber) : crée les phases manquantes,
  // met à jour les dates/statut des existantes. JAMAIS de DELETE → les PhaseElixir
  // déjà assignés (FK vers ClientPhase) sont préservés. Idempotent + ré-générable.
  const phases = await prisma.$transaction(
    computed.map((p) =>
      prisma.clientPhase.upsert({
        where: {
          clientId_phaseType_phaseNumber: {
            clientId,
            phaseType: p.phaseType,
            phaseNumber: p.phaseNumber,
          },
        },
        update: { startDate: p.startDate, endDate: p.endDate, status: p.status },
        create: {
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

  return NextResponse.json({ phases, programStart }, { status: 201 });
}

// PATCH — modifier la date de départ et recalculer toutes les phases
export async function PATCH(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const body = await req.json();
  const { clientId, startDate } = body;

  if (!clientId || !startDate) {
    return NextResponse.json({ error: "clientId et startDate requis" }, { status: 400 });
  }

  const newStart = new Date(startDate);
  const computed = computePhases(newStart);

  // Mettre à jour detoxStartDate sur le client
  await prisma.client.update({
    where: { id: clientId },
    data: { detoxStartDate: newStart },
  });

  // Upsert (pas de deleteMany) : recalcule les dates des 7 phases en conservant
  // les mêmes lignes ClientPhase → les PhaseElixir assignés NE SONT PAS effacés.
  const phases = await prisma.$transaction(
    computed.map((p) =>
      prisma.clientPhase.upsert({
        where: {
          clientId_phaseType_phaseNumber: {
            clientId,
            phaseType: p.phaseType,
            phaseNumber: p.phaseNumber,
          },
        },
        update: { startDate: p.startDate, endDate: p.endDate, status: p.status },
        create: {
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

  return NextResponse.json({ phases, programStart: newStart }, { status: 200 });
}
