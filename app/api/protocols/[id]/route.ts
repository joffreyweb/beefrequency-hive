import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Détails d'un protocole (admin : tout, client : le sien uniquement)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const { session } = auth;

    const protocol = await prisma.protocol.findUnique({
      where: { id },
      include: {
        client: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    if (!protocol) {
      return NextResponse.json(
        { error: "Protocole introuvable" },
        { status: 404 }
      );
    }

    // Un client ne peut voir que ses propres protocoles
    if (session.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { userId: session.userId },
      });
      if (!client || protocol.clientId !== client.id) {
        return NextResponse.json(
          { error: "Accès interdit" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ protocol });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH — Modifier un protocole (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const data = await request.json();

    // Vérifier que le protocole existe
    const existing = await prisma.protocol.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Protocole introuvable" },
        { status: 404 }
      );
    }

    const protocol = await prisma.protocol.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        client: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ protocol });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — Supprimer un protocole (admin uniquement)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

    const existing = await prisma.protocol.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Protocole introuvable" },
        { status: 404 }
      );
    }

    await prisma.protocol.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
