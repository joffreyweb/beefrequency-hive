import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// PATCH — Modifier la note d'une attribution client (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const { note } = await request.json();

    // Vérifier que l'attribution existe
    const existing = await prisma.clientRecommendation.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Attribution introuvable" },
        { status: 404 }
      );
    }

    const clientRecommendation = await prisma.clientRecommendation.update({
      where: { id },
      data: { note: note ?? null },
      include: { recommendation: true },
    });

    return NextResponse.json({ clientRecommendation });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Retirer l'attribution d'une recommandation à un client (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Vérifier que l'attribution existe
    const existing = await prisma.clientRecommendation.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Attribution introuvable" },
        { status: 404 }
      );
    }

    await prisma.clientRecommendation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
