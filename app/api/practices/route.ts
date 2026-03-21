import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireClient,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Liste des pratiques
// Admin : toutes les pratiques ordonnées par catégorie + titre, avec compteur d'assignations
// Client : ses pratiques assignées (via ClientPractice actives)
export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;

    if (session.role === "ADMIN") {
      // Admin : toutes les pratiques avec compteur de ClientPractice
      const practices = await prisma.practice.findMany({
        orderBy: [{ category: "asc" }, { title: "asc" }],
        include: {
          _count: { select: { clientPractices: true } },
        },
      });

      return NextResponse.json({ practices });
    }

    // Client : pratiques assignées actives
    const clientAuth = await requireClient();
    if (isErrorResponse(clientAuth)) return clientAuth;

    const client = await prisma.client.findUnique({
      where: { userId: session.userId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    const clientPractices = await prisma.clientPractice.findMany({
      where: { clientId: client.id, isActive: true },
      include: { practice: true },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({ clientPractices });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Créer une pratique (admin uniquement)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { title, description, type, content, category, isGlobal, dayTrigger } =
      await request.json();

    // Validation des champs obligatoires
    if (!title || !description || !type || !category) {
      return NextResponse.json(
        { error: "Titre, description, type et catégorie sont requis" },
        { status: 400 }
      );
    }

    const practice = await prisma.practice.create({
      data: {
        title,
        description,
        type,
        content: content ? JSON.stringify(content) : "{}",
        category,
        isGlobal: isGlobal ?? false,
        dayTrigger: dayTrigger ?? null,
      },
    });

    return NextResponse.json({ practice }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
