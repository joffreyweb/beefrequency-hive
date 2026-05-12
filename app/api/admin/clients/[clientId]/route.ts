import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";
import { FLAG_KEYS, type ParcoursFlags } from "@/lib/parcours-defaults";
import type { ParcoursType } from "@prisma/client";

const VALID_PARCOURS_TYPES: readonly ParcoursType[] = [
  "LE_PASSAGE",
  "NECTAR_CYCLE",
  "SEANCE_UNIQUE",
  "RESET_6",
  "CUSTOM",
];

// PATCH /api/admin/clients/[clientId] — Mise à jour ciblée (parcoursType + 8 flags)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { clientId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const updateData: {
    parcoursType?: ParcoursType;
  } & Partial<ParcoursFlags> = {};

  if (body.parcoursType !== undefined) {
    if (!VALID_PARCOURS_TYPES.includes(body.parcoursType as ParcoursType)) {
      return NextResponse.json(
        { error: "parcoursType invalide" },
        { status: 400 }
      );
    }
    updateData.parcoursType = body.parcoursType as ParcoursType;
  }

  for (const key of FLAG_KEYS) {
    const provided = body[key];
    if (provided !== undefined) {
      if (typeof provided !== "boolean") {
        return NextResponse.json(
          { error: `Le champ ${key} doit être un booléen` },
          { status: 400 }
        );
      }
      updateData[key] = provided;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Aucun champ à mettre à jour" },
      { status: 400 }
    );
  }

  try {
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
      select: {
        id: true,
        parcoursType: true,
        ...Object.fromEntries(FLAG_KEYS.map((k) => [k, true])),
      },
    });
    return NextResponse.json({ client: updated });
  } catch {
    return NextResponse.json(
      { error: "Client introuvable ou mise à jour échouée" },
      { status: 404 }
    );
  }
}

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
