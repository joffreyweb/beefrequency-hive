import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET /api/admin/clients/[clientId]/programs
// Retourne tous les ClientProgram (empilés) + ClientModule (débloqués) du client.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  const [clientPrograms, clientModules] = await Promise.all([
    prisma.clientProgram.findMany({
      where: { clientId },
      orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
      include: {
        program: {
          select: {
            id: true,
            name: true,
            nameFr: true,
            modules: {
              orderBy: { order: "asc" },
              include: { module: { select: { id: true, name: true, nameFr: true, duration: true } } },
            },
          },
        },
        startAfterProgram: { select: { id: true, program: { select: { nameFr: true } } } },
      },
    }),
    prisma.clientModule.findMany({
      where: { clientId },
      orderBy: { unlockedAt: "desc" },
      include: {
        module: { select: { id: true, name: true, nameFr: true, duration: true, accessMode: true } },
      },
    }),
  ]);

  return NextResponse.json({ clientPrograms, clientModules });
}

// POST /api/admin/clients/[clientId]/programs
// Body : { type: "program" | "module" | "custom", ... }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const { clientId } = await params;
  const body = await request.json();
  const type = body.type as "program" | "module" | "custom" | undefined;

  if (!type || !["program", "module", "custom"].includes(type)) {
    return NextResponse.json({ error: "type invalide (program | module | custom)" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // ─────────────────────────────
  // type=module → ClientModule
  // ─────────────────────────────
  if (type === "module") {
    const moduleId = body.moduleId as string | undefined;
    if (!moduleId) {
      return NextResponse.json({ error: "moduleId requis" }, { status: 400 });
    }
    try {
      const clientModule = await prisma.clientModule.create({
        data: {
          clientId,
          moduleId,
          unlockedBy: session.userId,
        },
      });
      return NextResponse.json({ clientModule }, { status: 201 });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        return NextResponse.json({ error: "Ce module est déjà débloqué pour ce client" }, { status: 409 });
      }
      throw e;
    }
  }

  // ─────────────────────────────
  // type=program | type=custom → ClientProgram
  // ─────────────────────────────
  const programId = body.programId as string | undefined;
  if (!programId) {
    return NextResponse.json({ error: "programId requis" }, { status: 400 });
  }

  const mode = body.mode === "SEQUENTIEL" ? "SEQUENTIEL" : "SIMULTANE";

  let startDate: Date;
  if (mode === "SIMULTANE") {
    if (!body.startDate) {
      return NextResponse.json({ error: "startDate requis (mode SIMULTANE)" }, { status: 400 });
    }
    startDate = new Date(body.startDate);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "startDate invalide" }, { status: 400 });
    }
  } else {
    // SEQUENTIEL : placeholder, recalculé au démarrage effectif post-C1.
    // Pour V2 on pose startDate = maintenant (signal : "ne pas démarrer immédiatement, attendre startAfterProgram").
    startDate = new Date();
  }

  const startAfterProgramId =
    mode === "SEQUENTIEL" ? (body.startAfterProgramId as string | null) ?? null : null;

  if (mode === "SEQUENTIEL" && !startAfterProgramId) {
    return NextResponse.json({ error: "startAfterProgramId requis (mode SEQUENTIEL)" }, { status: 400 });
  }

  // Calcul isMain : true si le client n'a AUCUN ClientProgram existant, sinon false.
  const existingCount = await prisma.clientProgram.count({ where: { clientId } });
  const isMain = existingCount === 0;

  const isCustom = type === "custom";
  const skippedModules = Array.isArray(body.skippedModules) ? body.skippedModules : null;
  const customName = typeof body.customName === "string" ? body.customName.trim() : null;

  try {
    const clientProgram = await prisma.clientProgram.create({
      data: {
        clientId,
        programId,
        startDate,
        status: "active",
        currentDay: 1,
        skippedModules: skippedModules && skippedModules.length > 0 ? skippedModules : Prisma.DbNull,
        customNotes: isCustom && customName ? `Parcours sur mesure : ${customName}` : null,
        isMain,
        mode,
        startAfterProgramId,
        isCustom,
      },
      include: {
        program: { select: { id: true, nameFr: true } },
      },
    });
    return NextResponse.json({ clientProgram }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Ce programme est déjà assigné à ce client" },
        { status: 409 },
      );
    }
    throw e;
  }
}
