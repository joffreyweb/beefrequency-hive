import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClient, requireAdmin, isErrorResponse } from "@/lib/api-utils";

// GET — Retourne les entrees de journal du client connecte
// Pour l'admin : ne retourne JAMAIS les entrees privees (isPrivate=true)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const isPrivateParam = searchParams.get("private");
    const adminView = searchParams.get("admin") === "true";

    // Si vue admin : retourne uniquement les entrees NON privees d'un client donne
    if (adminView) {
      const adminResult = await requireAdmin();
      if (isErrorResponse(adminResult)) return adminResult;

      const clientId = searchParams.get("clientId");
      if (!clientId) {
        return NextResponse.json(
          { error: "clientId requis pour la vue admin" },
          { status: 400 }
        );
      }

      // SECURITE : ne JAMAIS retourner les entrees privees pour l'admin
      const entries = await prisma.journalEntry.findMany({
        where: {
          clientId,
          isPrivate: false,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ entries });
    }

    // Vue client : retourne ses propres entrees
    const clientResult = await requireClient();
    if (isErrorResponse(clientResult)) return clientResult;

    const client = await prisma.client.findUnique({
      where: { userId: clientResult.session.userId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Profil client introuvable" },
        { status: 404 }
      );
    }

    // Filtre par type (prive ou partage)
    const isPrivate = isPrivateParam === "true";

    const entries = await prisma.journalEntry.findMany({
      where: {
        clientId: client.id,
        isPrivate,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST — Cree une nouvelle entree de journal
export async function POST(request: NextRequest) {
  try {
    const clientResult = await requireClient();
    if (isErrorResponse(clientResult)) return clientResult;

    const client = await prisma.client.findUnique({
      where: { userId: clientResult.session.userId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Profil client introuvable" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content, isPrivate, mood, entryType } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Le contenu est requis" },
        { status: 400 }
      );
    }

    const entry = await prisma.journalEntry.create({
      data: {
        clientId: client.id,
        content: content.trim(),
        isPrivate: Boolean(isPrivate),
        mood: mood?.trim() || null,
        entryType: entryType || "text",
      },
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
