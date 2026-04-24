import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// POST /api/client/modules/[moduleId]/start
// Idempotent :
//   - Si ClientModule n'existe pas : CREATE (module LIBRE auto-débloqué par le client)
//     avec unlockedBy="SELF", unlockedAt=now, startedAt=now
//   - Si ClientModule existe mais startedAt null : UPDATE startedAt=now
//   - Si ClientModule existe avec startedAt : no-op (retourne tel quel)
// Refus :
//   - Module ACHETE → 404
//   - Module DEBLOQUE sans ClientModule existant → 403 (seul l'admin peut débloquer)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> },
) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;
  const { session } = auth;

  const { moduleId } = await params;

  const client = await prisma.client.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, accessMode: true },
  });
  if (!mod) {
    return NextResponse.json({ error: "Module introuvable" }, { status: 404 });
  }
  if (mod.accessMode === "ACHETE") {
    return NextResponse.json({ error: "Module introuvable" }, { status: 404 });
  }

  const existing = await prisma.clientModule.findUnique({
    where: { clientId_moduleId: { clientId: client.id, moduleId: mod.id } },
  });

  if (!existing) {
    // Interdit de créer un ClientModule pour un DEBLOQUE — seul l'admin déverrouille.
    if (mod.accessMode === "DEBLOQUE") {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }
    // LIBRE : auto-débloque par le client
    const cm = await prisma.clientModule.create({
      data: {
        clientId: client.id,
        moduleId: mod.id,
        unlockedBy: "SELF",
        startedAt: new Date(),
      },
    });
    return NextResponse.json({ clientModule: cm }, { status: 201 });
  }

  if (existing.startedAt) {
    return NextResponse.json({ clientModule: existing });
  }

  const cm = await prisma.clientModule.update({
    where: { id: existing.id },
    data: { startedAt: new Date() },
  });
  return NextResponse.json({ clientModule: cm });
}
