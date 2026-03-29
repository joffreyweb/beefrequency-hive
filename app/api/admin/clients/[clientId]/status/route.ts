import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// PATCH /api/admin/clients/[clientId]/status — Changer le statut du client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;
  const { status } = await request.json();

  const validStatuses = ["ACTIVE", "PAUSED", "COMPLETED", "DEACTIVATED", "ARCHIVED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Statut invalide. Valeurs possibles : ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true, status: true },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // ARCHIVED ne peut pas être réactivé sans action explicite
  if (client.status === "ARCHIVED" && status !== "ARCHIVED") {
    // Seulement l'admin peut réactiver un client archivé — on le permet via cette route
  }

  // Mettre à jour le statut client + bloquer/débloquer le User
  const shouldBlock = status === "DEACTIVATED" || status === "ARCHIVED";

  await prisma.$transaction([
    prisma.client.update({
      where: { id: clientId },
      data: { status },
    }),
    prisma.user.update({
      where: { id: client.userId },
      data: { blocked: shouldBlock },
    }),
  ]);

  return NextResponse.json({ success: true, status });
}
