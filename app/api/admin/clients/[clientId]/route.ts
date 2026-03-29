import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// DELETE /api/admin/clients/[clientId] — Supprimer definitivement un client + log RGPD
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  // Lire le motif depuis le body (optionnel pour backwards compat)
  let motif = "Suppression demandee par l'admin";
  try {
    const body = await request.json();
    if (body.motif) motif = body.motif;
  } catch {
    // Pas de body JSON — utiliser le motif par defaut
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      userId: true,
      createdAt: true,
      user: { select: { email: true, name: true } },
    },
  });

  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  // Recuperer les infos admin
  const admin = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { name: true },
  });

  // Creer le log RGPD AVANT la suppression
  await prisma.gdprDeletionLog.create({
    data: {
      clientId,
      clientName: client.user.name,
      clientEmail: client.user.email,
      dateInscription: client.createdAt,
      adminId: auth.session.userId,
      adminName: admin?.name ?? "Admin",
      motif,
    },
  });

  // Supprimer le User en cascade (Client + toutes les relations avec onDelete: Cascade)
  await prisma.user.delete({
    where: { id: client.userId },
  });

  // Supprimer les InviteTokens lies a cet email
  await prisma.inviteToken.deleteMany({
    where: { email: client.user.email },
  });

  return NextResponse.json({ success: true });
}
