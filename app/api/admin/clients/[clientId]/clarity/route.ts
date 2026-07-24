import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// POST /api/admin/clients/[clientId]/clarity
// Active Clarity pour le client : upsert d'une ClaritySubmission en DRAFT (idempotent).
// Ré-appeler ne touche PAS une submission existante (réponses/rapport préservés — L104 upsert).
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const submission = await prisma.claritySubmission.upsert({
    where: { clientId },
    create: { clientId, status: "DRAFT" },
    update: {}, // no-op : ne jamais écraser une submission déjà en place
    select: { id: true, status: true, sectionsDone: true, createdAt: true },
  });

  return NextResponse.json({ submission });
}

// DELETE /api/admin/clients/[clientId]/clarity
// Désactive Clarity — UNIQUEMENT si le client n'a encore rien rempli (garde-fou anti-perte).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  const existing = await prisma.claritySubmission.findUnique({
    where: { clientId },
    select: { id: true, status: true, sectionsDone: true, answers: true },
  });

  if (!existing) {
    // Déjà inactif → succès idempotent
    return NextResponse.json({ ok: true, alreadyInactive: true });
  }

  const answersObj = existing.answers as Record<string, unknown> | null;
  const hasAnswers =
    existing.sectionsDone > 0 ||
    (answersObj != null &&
      typeof answersObj === "object" &&
      Object.keys(answersObj).length > 0);

  if (existing.status !== "DRAFT" || hasAnswers) {
    return NextResponse.json(
      { error: "Impossible de désactiver : le client a déjà commencé son Clarity. Les réponses sont protégées." },
      { status: 409 }
    );
  }

  await prisma.claritySubmission.delete({ where: { clientId } });
  return NextResponse.json({ ok: true });
}
