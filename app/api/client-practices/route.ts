import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAdmin,
  requireAuth,
  isErrorResponse,
} from "@/lib/api-utils";

// GET — Pratiques assignées
// Client : ses propres pratiques avec détails et stats
// Admin : pratiques d'un client via ?clientId=xxx
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { session } = auth;

    if (session.role === "ADMIN") {
      // Admin : doit fournir un clientId en query param
      const { searchParams } = new URL(request.url);
      const clientId = searchParams.get("clientId");

      if (!clientId) {
        return NextResponse.json(
          { error: "Le paramètre clientId est requis" },
          { status: 400 }
        );
      }

      const clientPractices = await prisma.clientPractice.findMany({
        where: { clientId },
        include: { practice: true },
        orderBy: { assignedAt: "desc" },
      });

      return NextResponse.json({ clientPractices });
    }

    // Client : ses propres pratiques
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
      where: { clientId: client.id },
      include: { practice: true },
      orderBy: { assignedAt: "desc" },
    });

    return NextResponse.json({ clientPractices });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — Assigner une pratique à un client (admin uniquement)
// Upsert sur la contrainte unique [clientId, practiceId]
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId, practiceId, note } = await request.json();

    // Validation des champs obligatoires
    if (!clientId || !practiceId) {
      return NextResponse.json(
        { error: "clientId et practiceId sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le client et la pratique existent
    const [client, practice] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.practice.findUnique({ where: { id: practiceId } }),
    ]);

    if (!client) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    if (!practice) {
      return NextResponse.json(
        { error: "Pratique introuvable" },
        { status: 404 }
      );
    }

    // Upsert : crée ou réactive l'assignation
    const clientPractice = await prisma.clientPractice.upsert({
      where: {
        clientId_practiceId: { clientId, practiceId },
      },
      create: {
        clientId,
        practiceId,
        assignedByAdmin: true,
        note: note ?? null,
      },
      update: {
        isActive: true,
        assignedByAdmin: true,
        note: note ?? null,
      },
      include: { practice: true },
    });

    return NextResponse.json({ clientPractice }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
