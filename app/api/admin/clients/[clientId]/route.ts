import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// DELETE /api/admin/clients/[clientId] — Supprimer un client et toutes ses données
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true, user: { select: { email: true } } },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Supprimer le User en cascade (Client + toutes les relations avec onDelete: Cascade)
  await prisma.user.delete({
    where: { id: client.userId },
  });

  // Supprimer les InviteTokens liés à cet email
  await prisma.inviteToken.deleteMany({
    where: { email: client.user.email },
  });

  return NextResponse.json({ success: true });
}
