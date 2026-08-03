import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { computeCustomPhases, totalDaysOf, type CustomModuleInput, type PhaseType } from "@/lib/parcours";
import { getOrCreateActiveParcours } from "@/lib/parcours-instance";

const VALID_TYPES = ["DETOX", "CYCLE", "BREAK", "CUSTOM"];

// POST — (re)génère une timeline PERSONNALISÉE à partir d'une liste de modules à durées libres.
// Body : { clientId, startDate?, modules: [{ phaseType, label, days }] }
// Remplace la timeline du client (les anciennes phases sont supprimées).
// N'affecte JAMAIS le 103j (qui vit sur POST /api/client-phases).
export async function POST(req: Request) {
  const result = await requireAdmin();
  if (isErrorResponse(result)) return result;

  const body = await req.json();
  const { clientId, startDate, modules } = body;

  if (!clientId) {
    return NextResponse.json({ error: "clientId requis" }, { status: 400 });
  }
  if (!Array.isArray(modules) || modules.length === 0) {
    return NextResponse.json({ error: "modules requis (liste non vide)" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, detoxStartDate: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const clean: CustomModuleInput[] = [];
  for (const m of modules) {
    const type = String(m?.phaseType ?? m?.type ?? "").toUpperCase();
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Type de phase invalide : ${type}` }, { status: 400 });
    }
    const days = Number(m?.days);
    if (!Number.isFinite(days) || days < 1) {
      return NextResponse.json({ error: "Chaque module doit avoir days >= 1" }, { status: 400 });
    }
    clean.push({ phaseType: type as PhaseType, label: String(m?.label ?? type), days: Math.floor(days) });
  }

  const start = startDate
    ? new Date(startDate)
    : client.detoxStartDate
      ? new Date(client.detoxStartDate)
      : new Date();
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "startDate invalide" }, { status: 400 });
  }

  const computed = computeCustomPhases(clean, start);
  const total = totalDaysOf(clean);

  // Instance de parcours active (refonte — Étape 2A/2B) : rattachement + clé d'upsert.
  const parcours = await getOrCreateActiveParcours(clientId);
  if (!parcours) {
    return NextResponse.json({ error: "Parcours introuvable" }, { status: 404 });
  }

  const phases = await prisma.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: { detoxStartDate: start, programTotalDays: total, requiresProgramTimeline: true },
    });
    await tx.clientParcours.update({
      where: { id: parcours.id },
      data: { detoxStartDate: start, programTotalDays: total },
    });
    // NON DESTRUCTIF : upsert par (phaseType, phaseNumber). Les phases conservées gardent
    // leurs élixirs / check-ins. On ne supprime QUE les phases retirées de la structure.
    const keep = new Set<string>();
    const result = [];
    for (const p of computed) {
      keep.add(`${p.phaseType}-${p.phaseNumber}`);
      result.push(
        await tx.clientPhase.upsert({
          where: {
            clientParcoursId_phaseType_phaseNumber: {
              clientParcoursId: parcours.id,
              phaseType: p.phaseType as PhaseType,
              phaseNumber: p.phaseNumber,
            },
          },
          update: { startDate: p.startDate, endDate: p.endDate, status: p.status, customName: p.label },
          create: {
            clientId,
            clientParcoursId: parcours.id,
            phaseType: p.phaseType as PhaseType,
            phaseNumber: p.phaseNumber,
            startDate: p.startDate,
            endDate: p.endDate,
            status: p.status,
            customName: p.label,
          },
        }),
      );
    }
    // Scopé au parcours ACTIF : jamais toucher les phases d'un parcours passé.
    const existing = await tx.clientPhase.findMany({
      where: { clientParcoursId: parcours.id },
      select: { id: true, phaseType: true, phaseNumber: true },
    });
    const toDelete = existing
      .filter((e) => !keep.has(`${e.phaseType}-${e.phaseNumber}`))
      .map((e) => e.id);
    if (toDelete.length > 0) {
      await tx.clientPhase.deleteMany({ where: { id: { in: toDelete } } });
    }
    return result;
  });

  return NextResponse.json({ phases, programStart: start, totalDays: total }, { status: 201 });
}
