import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Protocoles (admin : tous avec filtre clientId, client : les siens)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;

    if (session.role === "ADMIN") {
      // Admin — tous les protocoles, filtrage optionnel par clientId
      const clientId = request.nextUrl.searchParams.get("clientId");

      const protocols = await prisma.protocol.findMany({
        where: clientId ? { clientId } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          client: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      return NextResponse.json({ protocols });
    }

    // Client — ses propres protocoles
    const client = await prisma.client.findUnique({
      where: { userId: session.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Profil client introuvable" },
        { status: 404 }
      );
    }

    const protocols = await prisma.protocol.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ protocols });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer un protocole (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId, title, description, frequency, duration } =
      await request.json();

    // Validation des champs obligatoires
    if (!clientId || !title) {
      return NextResponse.json(
        { error: "clientId et title sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    const protocol = await prisma.protocol.create({
      data: {
        clientId,
        title,
        description: description || null,
        frequency: frequency || null,
        duration: duration || null,
      },
      include: {
        client: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ protocol }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
