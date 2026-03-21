import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE — Supprimer un support (admin uniquement)
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Vérifier que le support existe
    const existing = await prisma.support.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Support introuvable" },
        { status: 404 }
      );
    }

    await prisma.support.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Modifier un support (admin uniquement)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();

    // Vérifier que le support existe
    const existing = await prisma.support.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Support introuvable" },
        { status: 404 }
      );
    }

    // Construire les données à mettre à jour
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.url !== undefined) data.url = body.url;
    if (body.description !== undefined) data.description = body.description;
    if (body.type !== undefined) {
      const validTypes = ["MUSIC", "VIDEO", "PDF", "LINK"];
      if (!validTypes.includes(body.type)) {
        return NextResponse.json(
          { error: "Type de support invalide" },
          { status: 400 }
        );
      }
      data.type = body.type;
    }

    const support = await prisma.support.update({
      where: { id },
      data,
    });

    return NextResponse.json({ support });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
