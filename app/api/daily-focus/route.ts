import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAuth, isErrorResponse } from "@/lib/api-utils";

// GET — Focus du jour
// Client : retourne le focus du jour courant (le plus spécifique)
// Admin : retourne tous les focus d'un client (?clientId=)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isErrorResponse(authResult)) return authResult;
    const { session } = authResult;

    const { searchParams } = new URL(request.url);

    // --- ADMIN ---
    if (session.role === "ADMIN") {
      const clientId = searchParams.get("clientId");
      if (!clientId) {
        return NextResponse.json(
          { error: "clientId requis" },
          { status: 400 }
        );
      }

      const focuses = await prisma.dailyFocus.findMany({
        where: { clientId },
        orderBy: { dayFrom: "asc" },
      });

      return NextResponse.json({ focuses });
    }

    // --- CLIENT ---
    const client = await prisma.client.findUnique({
      where: { userId: session.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    // Calcul du jour courant dans le parcours
    const dayNumber =
      Math.floor(
        (Date.now() - new Date(client.startDate).getTime()) / 86400000
      ) + 1;

    // Prend le focus le plus spécifique (plage la plus étroite)
    const focus = await prisma.dailyFocus.findFirst({
      where: {
        clientId: client.id,
        dayFrom: { lte: dayNumber },
        dayTo: { gte: dayNumber },
      },
      orderBy: { dayFrom: "desc" },
    });

    return NextResponse.json({ focus, dayNumber });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Crée un focus du jour (admin uniquement)
// Body: { clientId, dayFrom, dayTo, title, message }
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { clientId, dayFrom, dayTo, title, message } =
      await request.json();

    if (!clientId || !dayFrom || !dayTo || !title || !message) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const focus = await prisma.dailyFocus.create({
      data: { clientId, dayFrom, dayTo, title, message },
    });

    return NextResponse.json({ focus }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
