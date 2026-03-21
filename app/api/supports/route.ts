import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Supports (admin : par clientId, client : les siens)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;

    if (session.role === "ADMIN") {
      // Admin — clientId requis en query param
      const clientId = request.nextUrl.searchParams.get("clientId");

      if (!clientId) {
        return NextResponse.json(
          { error: "Le paramètre clientId est requis" },
          { status: 400 }
        );
      }

      const supports = await prisma.support.findMany({
        where: { clientId },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ supports });
    }

    // Client — ses propres supports
    const client = await prisma.client.findUnique({
      where: { userId: session.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Profil client introuvable" },
        { status: 404 }
      );
    }

    const supports = await prisma.support.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ supports });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer un support (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId, title, type, url, description } = await request.json();

    // Validation des champs obligatoires
    if (!clientId || !title || !type || !url) {
      return NextResponse.json(
        { error: "clientId, title, type et url sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le type est valide
    const validTypes = ["MUSIC", "VIDEO", "PDF", "LINK"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type de support invalide" },
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

    const support = await prisma.support.create({
      data: {
        clientId,
        title,
        type,
        url,
        description: description || null,
      },
    });

    return NextResponse.json({ support }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
