import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, isErrorResponse } from "@/lib/api-utils";

// POST — Marquer une pratique comme complétée (client uniquement)
// Incrémente completedCount et met à jour lastCompletedAt
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireClient();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const { session } = auth;

    // Récupérer le client connecté
    const client = await prisma.client.findUnique({
      where: { userId: session.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    // Récupérer l'assignation
    const clientPractice = await prisma.clientPractice.findUnique({
      where: { id },
    });

    if (!clientPractice) {
      return NextResponse.json(
        { error: "Assignation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que le client est bien le propriétaire de cette assignation
    if (clientPractice.clientId !== client.id) {
      return NextResponse.json(
        { error: "Accès interdit" },
        { status: 403 }
      );
    }

    // Incrémenter le compteur et mettre à jour la date de complétion
    const updated = await prisma.clientPractice.update({
      where: { id },
      data: {
        completedCount: { increment: 1 },
        lastCompletedAt: new Date(),
      },
      include: { practice: true },
    });

    return NextResponse.json({ clientPractice: updated });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
