import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, isErrorResponse } from "@/lib/api-utils";

// GET — Détails d'une recommandation avec ses attributions clients (authentifié)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    const recommendation = await prisma.recommendation.findUnique({
      where: { id },
      include: {
        clientRecommendations: {
          include: {
            client: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: "Recommandation introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ recommendation });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Modifier une recommandation (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const data = await request.json();

    // Vérifier que la recommandation existe
    const existing = await prisma.recommendation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Recommandation introuvable" },
        { status: 404 }
      );
    }

    // Mise à jour partielle — ne met à jour que les champs fournis
    const recommendation = await prisma.recommendation.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.isGlobal !== undefined && { isGlobal: data.isGlobal }),
      },
    });

    return NextResponse.json({ recommendation });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer une recommandation (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Vérifier que la recommandation existe
    const existing = await prisma.recommendation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Recommandation introuvable" },
        { status: 404 }
      );
    }

    await prisma.recommendation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
