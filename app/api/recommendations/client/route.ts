import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Recommandations du client connecté ou d'un client spécifique (admin)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get("clientId");

    // Mode admin : récupérer les recommandations d'un client spécifique
    if (session.role === "ADMIN" && clientIdParam) {
      const clientRecommendations =
        await prisma.clientRecommendation.findMany({
          where: { clientId: clientIdParam },
          include: { recommendation: true },
          orderBy: { recommendation: { category: "asc" } },
        });

      return NextResponse.json({ clientRecommendations });
    }

    // Mode client : récupérer ses recommandations personnelles + globales
    if (session.role === "CLIENT") {
      // Trouver le client à partir du userId de la session
      const client = await prisma.client.findUnique({
        where: { userId: session.userId },
      });

      if (!client) {
        return NextResponse.json(
          { error: "Profil client introuvable" },
          { status: 404 }
        );
      }

      // Recommandations personnelles attribuées au client
      const personal = await prisma.clientRecommendation.findMany({
        where: { clientId: client.id },
        include: { recommendation: true },
        orderBy: { recommendation: { category: "asc" } },
      });

      // IDs des recommandations déjà attribuées au client
      const personalRecommendationIds = personal.map(
        (cr) => cr.recommendationId
      );

      // Recommandations globales non encore attribuées au client
      const global = await prisma.recommendation.findMany({
        where: {
          isGlobal: true,
          id: { notIn: personalRecommendationIds },
        },
        orderBy: [{ category: "asc" }, { title: "asc" }],
      });

      return NextResponse.json({ personal, global });
    }

    // Admin sans clientId — renvoie une erreur explicite
    return NextResponse.json(
      { error: "Paramètre clientId requis pour un admin" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Attribuer une recommandation à un client (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId, recommendationId, note } = await request.json();

    // Validation des champs obligatoires
    if (!clientId || !recommendationId) {
      return NextResponse.json(
        { error: "clientId et recommendationId sont requis" },
        { status: 400 }
      );
    }

    // Upsert pour éviter les doublons — met à jour la note si déjà existant
    const clientRecommendation = await prisma.clientRecommendation.upsert({
      where: {
        clientId_recommendationId: { clientId, recommendationId },
      },
      update: {
        note: note ?? null,
      },
      create: {
        clientId,
        recommendationId,
        note: note ?? null,
      },
      include: { recommendation: true },
    });

    return NextResponse.json({ clientRecommendation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
