import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { computePhases, getNextMonday } from "@/lib/parcours";
import { getOrCreateActiveParcours, syncActiveParcours } from "@/lib/parcours-instance";

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

  // Statut recalculé EN DIRECT : les lignes ClientPhase stockent un statut figé à la
  // génération (jamais rafraîchi ensuite). On le recompute à la date du jour pour
  // l'affichage admin (le côté client calcule déjà en direct depuis detoxStartDate).
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const phasesLive = phases.map((p) => {
    const s = new Date(p.startDate); s.setHours(0, 0, 0, 0);
    const e = new Date(p.endDate); e.setHours(0, 0, 0, 0);
    let status: "UPCOMING" | "ACTIVE" | "COMPLETED" = "UPCOMING";
    if (now > e) status = "COMPLETED";
    else if (now >= s) status = "ACTIVE";
    return { ...p, status };
  });

  return NextResponse.json({ phases: phasesLive });
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

  // Garde-fou serveur : pas de parcours à phases (103j) pour un client sans timeline
  // (parcours non-Passage / CUSTOM). La case « Timeline programme jour-par-jour » pilote ça.
  // Filet de sécurité même si l'UI est contournée ou périmée.
  if (!client.requiresProgramTimeline) {
    return NextResponse.json(
      {
        error:
          "Ce client n'a pas de parcours à phases (timeline désactivée). Active « Timeline programme jour-par-jour » avant de générer un parcours 103 jours.",
      },
      { status: 409 }
    );
  }

  // Date de départ : override > detoxStartDate > lundi suivant
  const programStart = overrideStart
    ? new Date(overrideStart)
    : client.detoxStartDate
      ? new Date(client.detoxStartDate)
      : getNextMonday(new Date());

  const computed = computePhases(programStart);

  // Instance de parcours active (refonte — Étape 2A/2B) : rattachement + clé d'upsert.
  const parcours = await getOrCreateActiveParcours(clientId);
  if (!parcours) {
    return NextResponse.json({ error: "Parcours introuvable" }, { status: 404 });
  }

  // Sauvegarder detoxStartDate si pas encore définie (Client + instance active).
  if (!client.detoxStartDate) {
    await prisma.client.update({
      where: { id: clientId },
      data: { detoxStartDate: programStart },
    });
    await syncActiveParcours(clientId, { detoxStartDate: programStart });
  }

  // Upsert par (clientId, phaseType, phaseNumber) : crée les phases manquantes,
  // met à jour les dates/statut des existantes. JAMAIS de DELETE → les PhaseElixir
  // déjà assignés (FK vers ClientPhase) sont préservés. Idempotent + ré-générable.
  const phases = await prisma.$transaction(
    computed.map((p) =>
      prisma.clientPhase.upsert({
        where: {
          clientParcoursId_phaseType_phaseNumber: {
            clientParcoursId: parcours.id,
            phaseType: p.phaseType,
            phaseNumber: p.phaseNumber,
          },
        },
        update: { startDate: p.startDate, endDate: p.endDate, status: p.status },
        create: {
          clientId,
          clientParcoursId: parcours.id,
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

  // Instance de parcours active (refonte — Étape 2A/2B).
  const parcours = await getOrCreateActiveParcours(clientId);
  if (!parcours) {
    return NextResponse.json({ error: "Parcours introuvable" }, { status: 404 });
  }

  // Mettre à jour detoxStartDate sur le client + miroir sur l'instance active.
  await prisma.client.update({
    where: { id: clientId },
    data: { detoxStartDate: newStart },
  });
  await syncActiveParcours(clientId, { detoxStartDate: newStart });

  // Upsert (pas de deleteMany) : recalcule les dates des 7 phases en conservant
  // les mêmes lignes ClientPhase → les PhaseElixir assignés NE SONT PAS effacés.
  const phases = await prisma.$transaction(
    computed.map((p) =>
      prisma.clientPhase.upsert({
        where: {
          clientParcoursId_phaseType_phaseNumber: {
            clientParcoursId: parcours.id,
            phaseType: p.phaseType,
            phaseNumber: p.phaseNumber,
          },
        },
        update: { startDate: p.startDate, endDate: p.endDate, status: p.status },
        create: {
          clientId,
          clientParcoursId: parcours.id,
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
