import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// PATCH — Modifier une assignation de pratique (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const data = await request.json();

    // Vérifier que l'assignation existe
    const existing = await prisma.clientPractice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Assignation introuvable" },
        { status: 404 }
      );
    }

    const clientPractice = await prisma.clientPractice.update({
      where: { id },
      data: {
        ...(data.note !== undefined && { note: data.note }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { practice: true },
    });

    return NextResponse.json({ clientPractice });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer une assignation de pratique (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Vérifier que l'assignation existe
    const existing = await prisma.clientPractice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Assignation introuvable" },
        { status: 404 }
      );
    }

    await prisma.clientPractice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
