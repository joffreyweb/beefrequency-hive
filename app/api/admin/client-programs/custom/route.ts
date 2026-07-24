import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { getProgramState } from "@/lib/program-state";

// Parcours sur-mesure : un Program dédié au client (name = `custom-{clientId}`),
// composé librement de modules ordonnés. Totalement indépendant des templates
// (Le Passage, Souveraineté, SOS) et du système à phases de Laura (ClientPhase).

function customProgramName(clientId: string) {
  return `custom-${clientId}`;
}

// GET /api/admin/client-programs/custom?clientId=xxx
// Renvoie le parcours sur-mesure du client (s'il existe) + l'état calculé.
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId requis" }, { status: 400 });

  const program = await prisma.program.findUnique({
    where: { name: customProgramName(clientId) },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { module: { select: { id: true, name: true, nameFr: true, duration: true } } },
      },
    },
  });
  if (!program) return NextResponse.json({ clientProgram: null });

  const clientProgram = await prisma.clientProgram.findUnique({
    where: { clientId_programId: { clientId, programId: program.id } },
    include: {
      program: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: { module: { select: { id: true, name: true, nameFr: true, duration: true } } },
          },
        },
      },
    },
  });
  if (!clientProgram) return NextResponse.json({ clientProgram: null });

  const { startDate, endDate, totalDays, currentDay, state } = getProgramState(
    clientProgram,
    clientProgram.program,
  );

  return NextResponse.json({
    clientProgram: { ...clientProgram, startDate, endDate, totalDays, currentDay, state },
  });
}

// POST /api/admin/client-programs/custom
// Body : { clientId, startDate, moduleIds: string[] (dans l'ordre) }
// Crée/met à jour le Program sur-mesure du client + son ClientProgram.
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId, startDate, moduleIds } = await request.json();

  if (!clientId || !startDate || !Array.isArray(moduleIds) || moduleIds.length === 0) {
    return NextResponse.json(
      { error: "clientId, startDate et au moins un module requis" },
      { status: 400 },
    );
  }

  // Garde-fou : ne composer un sur-mesure que pour un client CUSTOM.
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, parcoursType: true },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (client.parcoursType !== "CUSTOM") {
    return NextResponse.json(
      { error: "Parcours sur-mesure réservé aux clients CUSTOM" },
      { status: 409 },
    );
  }

  // Vérifier que tous les modules existent.
  const modules = await prisma.module.findMany({
    where: { id: { in: moduleIds } },
    select: { id: true },
  });
  const foundIds = new Set(modules.map((m) => m.id));
  const missing = moduleIds.filter((id: string) => !foundIds.has(id));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Modules introuvables : ${missing.join(", ")}` }, { status: 400 });
  }

  const name = customProgramName(clientId);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Program dédié (upsert par name unique).
    const program = await tx.program.upsert({
      where: { name },
      update: { nameFr: "Parcours sur-mesure", nameEn: "Custom program" },
      create: {
        name,
        nameFr: "Parcours sur-mesure",
        nameEn: "Custom program",
        description: "Parcours composé sur-mesure pour ce client",
      },
    });

    // 2. Reconstruire la liste ordonnée des modules (pas d'enfants -> delete/create OK).
    await tx.programModule.deleteMany({ where: { programId: program.id } });
    for (let i = 0; i < moduleIds.length; i++) {
      await tx.programModule.create({
        data: { programId: program.id, moduleId: moduleIds[i], order: i + 1 },
      });
    }

    // 3. ClientProgram (upsert). isCustom + isMain, on repart au jour 1.
    const clientProgram = await tx.clientProgram.upsert({
      where: { clientId_programId: { clientId, programId: program.id } },
      update: {
        startDate: new Date(startDate),
        status: "active",
        currentDay: 1,
        isCustom: true,
        isMain: true,
        skippedModules: Prisma.JsonNull,
      },
      create: {
        clientId,
        programId: program.id,
        startDate: new Date(startDate),
        isCustom: true,
        isMain: true,
      },
      include: {
        program: {
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: { module: { select: { id: true, name: true, nameFr: true, duration: true } } },
            },
          },
        },
      },
    });

    return clientProgram;
  });

  return NextResponse.json({ clientProgram: result }, { status: 201 });
}

// DELETE /api/admin/client-programs/custom?clientId=xxx
// Retire le parcours sur-mesure du client (supprime le ClientProgram et son Program dédié).
export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId requis" }, { status: 400 });

  const program = await prisma.program.findUnique({
    where: { name: customProgramName(clientId) },
    select: { id: true },
  });
  if (!program) return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.clientProgram.deleteMany({ where: { clientId, programId: program.id } }),
    prisma.programModule.deleteMany({ where: { programId: program.id } }),
    prisma.program.delete({ where: { id: program.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
