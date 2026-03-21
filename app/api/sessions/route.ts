import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Sessions (admin : toutes triées par date, client : les siennes SANS notes)
export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;

    if (session.role === "ADMIN") {
      // Admin — toutes les sessions triées par date
      const sessions = await prisma.session.findMany({
        orderBy: { scheduledAt: "asc" },
        include: {
          client: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      return NextResponse.json({ sessions });
    }

    // Client — ses propres sessions SANS les notes privées
    const client = await prisma.client.findUnique({
      where: { userId: session.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Profil client introuvable" },
        { status: 404 }
      );
    }

    const sessions = await prisma.session.findMany({
      where: { clientId: client.id },
      orderBy: { scheduledAt: "asc" },
      select: {
        id: true,
        clientId: true,
        scheduledAt: true,
        duration: true,
        type: true,
        status: true,
        zoomLink: true,
        createdAt: true,
        updatedAt: true,
        // notes, checklistItems, recapDone exclues — privées Joffrey
      },
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer une session (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId, scheduledAt, duration, type, zoomLink } = await request.json();

    // Validation des champs obligatoires
    if (!clientId || !scheduledAt || !duration || !type) {
      return NextResponse.json(
        { error: "clientId, scheduledAt, duration et type sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le type est valide
    const validTypes = ["ONLINE", "PRESENTIAL", "CEREMONY"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Type de session invalide" },
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

    const newSession = await prisma.session.create({
      data: {
        clientId,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(duration, 10),
        type,
        ...(zoomLink !== undefined && { zoomLink }),
      },
      include: {
        client: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
