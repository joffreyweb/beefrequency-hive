import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — Détails d'un template
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { id } = await params;

    const template = await prisma.journeyMessageTemplate.findUnique({
      where: { id },
      include: {
        _count: { select: { logs: true } },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// PATCH — Modifier un template (title, dayTrigger, triggerType, hdVariants, isActive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { id } = await params;
    const body = await request.json();

    // Vérifier que le template existe
    const existing = await prisma.journeyMessageTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      );
    }

    // Construire les données de mise à jour
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.dayTrigger !== undefined) data.dayTrigger = body.dayTrigger;
    if (body.triggerType !== undefined) data.triggerType = body.triggerType;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.hdVariants !== undefined) {
      // Stringify si c'est un objet
      data.hdVariants =
        typeof body.hdVariants === "string"
          ? body.hdVariants
          : JSON.stringify(body.hdVariants);
    }

    const template = await prisma.journeyMessageTemplate.update({
      where: { id },
      data,
    });

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE — Supprimer un template
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { id } = await params;

    const existing = await prisma.journeyMessageTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Template introuvable" },
        { status: 404 }
      );
    }

    await prisma.journeyMessageTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
