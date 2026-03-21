import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, isErrorResponse } from "@/lib/api-utils";

// GET — Détails d'un élixir (authentifié)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    const elixir = await prisma.elixir.findUnique({
      where: { id },
      include: {
        prescriptions: {
          include: {
            client: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!elixir) {
      return NextResponse.json(
        { error: "Élixir introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ elixir });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Modifier un élixir (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const data = await request.json();

    // Vérifier que l'élixir existe
    const existing = await prisma.elixir.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Élixir introuvable" },
        { status: 404 }
      );
    }

    // Mise à jour partielle — ne met à jour que les champs fournis
    const elixir = await prisma.elixir.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.dosage !== undefined && { dosage: data.dosage }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.stock !== undefined && { stock: data.stock }),
      },
    });

    return NextResponse.json({ elixir });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer un élixir (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Vérifier que l'élixir existe
    const existing = await prisma.elixir.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Élixir introuvable" },
        { status: 404 }
      );
    }

    await prisma.elixir.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
