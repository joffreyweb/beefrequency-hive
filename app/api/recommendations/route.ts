import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireClient,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Recommandations quotidiennes
// Client : retourne les recommandations du jour courant
// Admin : retourne toutes les recommandations d'un client (?clientId=)
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

      const recommendations = await prisma.dailyRecommendation.findMany({
        where: { clientId },
        orderBy: { dayFrom: "asc" },
      });

      return NextResponse.json({ recommendations });
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

    const recommendations = await prisma.dailyRecommendation.findMany({
      where: {
        clientId: client.id,
        dayFrom: { lte: dayNumber },
        dayTo: { gte: dayNumber },
      },
      orderBy: { dayFrom: "asc" },
    });

    return NextResponse.json({ recommendations, dayNumber });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Crée une recommandation (admin uniquement)
// Body: { clientId, dayFrom, dayTo, slot, title, content }
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (isErrorResponse(authResult)) return authResult;

    const { clientId, dayFrom, dayTo, slot, title, content } =
      await request.json();

    if (!clientId || !dayFrom || !dayTo || !slot || !title || !content) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const recommendation = await prisma.dailyRecommendation.create({
      data: { clientId, dayFrom, dayTo, slot, title, content },
    });

    return NextResponse.json({ recommendation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
