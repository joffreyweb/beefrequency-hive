import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, isErrorResponse } from "@/lib/api-utils";

// GET — Détails d'une pratique (authentifié)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    const practice = await prisma.practice.findUnique({
      where: { id },
      include: {
        _count: { select: { clientPractices: true } },
      },
    });

    if (!practice) {
      return NextResponse.json(
        { error: "Pratique introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ practice });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Modifier une pratique (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const data = await request.json();

    // Vérifier que la pratique existe
    const existing = await prisma.practice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pratique introuvable" },
        { status: 404 }
      );
    }

    // Si content est un objet, le stringify
    const contentValue =
      data.content !== undefined
        ? typeof data.content === "object"
          ? JSON.stringify(data.content)
          : data.content
        : undefined;

    const practice = await prisma.practice.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(contentValue !== undefined && { content: contentValue }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isGlobal !== undefined && { isGlobal: data.isGlobal }),
        ...(data.dayTrigger !== undefined && { dayTrigger: data.dayTrigger }),
      },
    });

    return NextResponse.json({ practice });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer une pratique (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    // Vérifier que la pratique existe
    const existing = await prisma.practice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pratique introuvable" },
        { status: 404 }
      );
    }

    await prisma.practice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
